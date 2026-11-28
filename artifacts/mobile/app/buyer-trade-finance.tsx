import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetBuyerOrdersQueryKey,
  getGetBuyerPaymentHistoryQueryKey,
  getGetBuyerBankAccountsQueryKey,
  getGetBuyerCompanyQueryKey,
  getGetPaymentMethodsQueryKey,
  useGetBuyerBankAccounts,
  useGetBuyerCompany,
  useGetBuyerOrders,
  useGetBuyerPaymentHistory,
  useGetPaymentMethods,
  useMarkBuyerOrderPaid,
} from '@workspace/api-client-react';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { Action, Card, EmptyState, ErrorState, Field, LoadingCard, Screen, Status } from '@/components/InvestorUI';
import { LocalizedPressable, LocalizedText as Text } from '@/components/LocalizedText';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { amount, first, list, messageOf, record } from '@/lib/data';
import { displayOrderNumber, rowsFromResponse } from '@/lib/buyer-data';
import { buyerKycStatusLabel, isBuyerKycApproved } from '@/lib/buyer-kyc-approval';
import { formatAppNumber } from '@/lib/strings';

type FinanceTab = 'accounts' | 'history' | 'submit';

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && !!item.trim()) : [];
}

function normalized(value: string) {
  return value.toLowerCase().replace(/[\s-]+/g, '_');
}

function money(value: number | null) {
  return value === null ? 'Price confirmed separately' : `USD ${formatAppNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function CopyableTradeBankDetail({ label, value, copied, copyLabel, copiedLabel, testID, onCopy }: {
  label: string;
  value: string;
  copied: boolean;
  copyLabel: string;
  copiedLabel: string;
  testID: string;
  onCopy: () => void;
}) {
  const colors = useColors();
  return (
    <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: colors.mutedForeground, fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>{label}</Text>
        <Text selectable numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}
          style={{ color: colors.foreground, fontSize: 12, lineHeight: 17, fontWeight: '600', marginTop: 3, writingDirection: 'ltr', textAlign: 'left' }}>
          {value}
        </Text>
      </View>
      <LocalizedPressable
        accessibilityRole="button"
        accessibilityLabel={copied ? copiedLabel : copyLabel}
        accessibilityHint="Copies value to clipboard"
        testID={testID}
        onPress={onCopy}
        style={({ pressed }) => ({
          width: 44,
          height: 44,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: copied ? colors.primary : colors.border,
          borderRadius: 13,
          backgroundColor: copied || pressed ? colors.lightGreen : colors.secondary,
          opacity: pressed ? 0.78 : 1,
        })}
      >
        <Feather name={copied ? 'check' : 'copy'} size={17} color={colors.primary} />
      </LocalizedPressable>
    </View>
  );
}

export default function BuyerTradeFinance() {
  const colors = useColors();
  const { token } = useAuth();
  const client = useQueryClient();
  const { orderId: rawOrderId } = useLocalSearchParams<{ orderId?: string | string[] }>();
  const requestedOrderId = Number(Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId);
  const [tab, setTab] = useState<FinanceTab>(Number.isInteger(requestedOrderId) && requestedOrderId > 0 ? 'submit' : 'accounts');
  const [orderId, setOrderId] = useState<number | null>(Number.isInteger(requestedOrderId) && requestedOrderId > 0 ? requestedOrderId : null);
  const [methodCode, setMethodCode] = useState('');
  const [field1, setField1] = useState('');
  const [field2, setField2] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [copiedBankField, setCopiedBankField] = useState<string | null>(null);
  const [bankDetailCopyError, setBankDetailCopyError] = useState<{ accountId: string; message: string } | null>(null);
  const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accountsQuery = useGetBuyerBankAccounts({
    query: { queryKey: getGetBuyerBankAccountsQueryKey(), enabled: !!token, staleTime: 300_000 },
  });
  const companyQuery = useGetBuyerCompany({
    query: { queryKey: getGetBuyerCompanyQueryKey(), enabled: !!token, staleTime: 0, refetchOnMount: 'always' },
  });
  const methodsQuery = useGetPaymentMethods({
    query: { queryKey: getGetPaymentMethodsQueryKey(), enabled: !!token, staleTime: 300_000 },
  });
  const ordersQuery = useGetBuyerOrders({ per_page: 100 }, {
    query: { queryKey: getGetBuyerOrdersQueryKey({ per_page: 100 }), enabled: !!token, staleTime: 30_000 },
  });
  const historyQuery = useGetBuyerPaymentHistory({ per_page: 50 }, {
    query: { queryKey: getGetBuyerPaymentHistoryQueryKey({ per_page: 50 }), enabled: !!token, staleTime: 20_000 },
  });
  const submitPayment = useMarkBuyerOrderPaid();
  const accounts = rowsFromResponse(accountsQuery.data);
  const kycApproved = companyQuery.isSuccess
    && !companyQuery.isError
    && !companyQuery.isFetching
    && isBuyerKycApproved(companyQuery.data);
  const kycStatusLabel = buyerKycStatusLabel(companyQuery.data);
  const methods = rowsFromResponse(methodsQuery.data);
  const orders = rowsFromResponse(ordersQuery.data);
  const history = rowsFromResponse(historyQuery.data);
  const selectedMethod = methods.find(method => first(method, ['code']) === methodCode) ?? methods[0];
  const methodFields = strings(selectedMethod?.fields);
  const eligibleOrders = orders.filter(order => !['pending', 'pending_verification', 'approved', 'paid', 'partial'].includes(normalized(first(order, ['payment_status']))));

  useEffect(() => {
    if (!methodCode && methods.length) setMethodCode(first(methods[0], ['code']));
  }, [methodCode, methods]);

  useEffect(() => () => {
    if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
  }, []);

  async function copyBankDetail(accountId: string, field: string, value: string) {
    setBankDetailCopyError(null);
    setCopiedBankField(null);
    if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
    try {
      const didCopy = await Clipboard.setStringAsync(value);
      if (!didCopy) throw new Error('Clipboard did not confirm the copy.');
      setCopiedBankField(`${accountId}:${field}`);
      copyResetTimer.current = setTimeout(() => setCopiedBankField(null), 1600);
    } catch {
      setBankDetailCopyError({ accountId, message: 'Could not copy the bank detail. Select and copy the value instead.' });
    }
  }

  async function submitDetails() {
    setError('');
    setNotice('');
    if (!orderId) return setError('Select an order first.');
    if (!methodCode) return setError('Choose a payment method.');
    if (methodFields[0] && !field1.trim()) return setError(`Enter ${methodFields[0]}.`);
    try {
      await submitPayment.mutateAsync({
        order: orderId,
        data: {
          payment_method: methodCode,
          payment_field1: field1.trim(),
          payment_field2: field2.trim(),
          reference: reference.trim(),
          notes: notes.trim(),
        },
      });
      await Promise.all([
        client.invalidateQueries({ queryKey: getGetBuyerPaymentHistoryQueryKey({ per_page: 50 }) }),
        client.invalidateQueries({ queryKey: getGetBuyerPaymentHistoryQueryKey() }),
        client.invalidateQueries({ queryKey: getGetBuyerOrdersQueryKey({ per_page: 100 }) }),
        client.invalidateQueries({ queryKey: getGetBuyerOrdersQueryKey({ per_page: 50 }) }),
      ]);
      setNotice('Payment details submitted for OG Exports verification. This is not a payment confirmation.');
      setField1('');
      setField2('');
      setReference('');
      setNotes('');
      setTab('history');
    } catch (err) {
      setError(messageOf(err));
    }
  }

  if (!token) return <BuyerAuthGate title="Trade finance" body="Sign in to view OG Exports bank details and submit payment references for review." returnTo="/buyer-trade-finance" />;

  const tabs: [FinanceTab, string][] = [
    ['accounts', 'Bank details'],
    ['history', 'Payment history'],
    ['submit', 'Submit details'],
  ];

  return (
    <Screen title="Trade finance" subtitle="Bank details and payment review" refreshable>
      <Card style={{ padding: 13, marginBottom: 12, borderColor: colors.accent }}>
        <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '800' }}>Payments are made through your bank</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 10, lineHeight: 16, marginTop: 5 }}>
          This app does not transfer money. After paying through your bank, you can submit the reference for OG Exports to verify. Never enter a bank password, PIN, or login code.
        </Text>
      </Card>

      <View style={{ flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: colors.secondary, marginBottom: 14 }}>
        {tabs.map(([value, label]) => (
          <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: tab === value }} onPress={() => setTab(value)} style={{ flex: 1, minHeight: 39, borderRadius: 11, justifyContent: 'center', alignItems: 'center', backgroundColor: tab === value ? colors.card : 'transparent', borderWidth: tab === value ? 1 : 0, borderColor: colors.border }}>
            <Text style={{ color: tab === value ? colors.primary : colors.mutedForeground, fontSize: 10, fontWeight: '800' }}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {error ? <Text accessibilityRole="alert" style={{ color: colors.destructive, fontSize: 12, lineHeight: 18, marginBottom: 9 }}>{error}</Text> : null}
      {notice ? <Text accessibilityLiveRegion="polite" style={{ color: colors.primary, fontSize: 12, lineHeight: 18, marginBottom: 9 }}>{notice}</Text> : null}

      {tab === 'accounts' ? (
        <>
          {accountsQuery.isLoading ? <LoadingCard label="Loading OG Exports bank details…" lines={3} /> : null}
          {accountsQuery.isError ? <ErrorState message="Bank details could not be loaded." error={accountsQuery.error} onRetry={() => void accountsQuery.refetch()} /> : null}
          {companyQuery.isLoading || companyQuery.isFetching ? <LoadingCard label="Checking company verification…" lines={1} /> : null}
          {companyQuery.isError ? <ErrorState message="Company verification could not be confirmed. Transfer IBANs remain hidden until approval is confirmed." error={companyQuery.error} onRetry={() => void companyQuery.refetch()} /> : null}
          {companyQuery.isSuccess && !companyQuery.isError && !companyQuery.isFetching && !kycApproved ? (
            <Card testID="transfer-iban-kyc-gate" style={{ padding: 14, marginBottom: 11, borderColor: colors.accent }}>
              <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '800' }}>Transfer details unlock after verification</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 17, marginTop: 5 }}>
                OG Exports will show the bank IBAN after an administrator approves your company KYC. Current status: {kycStatusLabel}.
              </Text>
            </Card>
          ) : null}
          {accounts.length === 0 && accountsQuery.isSuccess ? <EmptyState title="No bank accounts listed" body="Contact OG Exports support to confirm the correct transfer details." icon="credit-card" /> : null}
          {accounts.map((account, index) => {
            const accountId = first(account, ['id'], String(index));
            const accountTitle = first(account, ['account_title', 'account_name']);
            const transferAccount = first(account, ['iban', 'account_number']);
            const hasIban = !!first(account, ['iban']);
            const swift = first(account, ['swift_code', 'swift']);
            return (
              <Card key={accountId} style={{ padding: 15, marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <Text style={{ flex: 1, color: colors.foreground, fontSize: 13, fontWeight: '800' }}>{first(account, ['bank_name'], 'OG Exports Bank Account')}</Text>
                  {account.is_default ? <Status value="Default" /> : null}
                </View>
                {accountTitle ? (
                  <CopyableTradeBankDetail
                    label="Account title"
                    value={accountTitle}
                    copied={copiedBankField === `${accountId}:account-title`}
                    copyLabel="Copy account title"
                    copiedLabel="Account title copied"
                    testID={`copy-trade-bank-${index}-account-title`}
                    onCopy={() => void copyBankDetail(accountId, 'account-title', accountTitle)}
                  />
                ) : null}
                {kycApproved && transferAccount ? (
                  <CopyableTradeBankDetail
                    label="IBAN / account"
                    value={transferAccount}
                    copied={copiedBankField === `${accountId}:transfer-account`}
                    copyLabel={hasIban ? 'Copy IBAN' : 'Copy account number'}
                    copiedLabel={hasIban ? 'IBAN copied' : 'Account number copied'}
                    testID={`copy-trade-bank-${index}-transfer-account`}
                    onCopy={() => void copyBankDetail(accountId, 'transfer-account', transferAccount)}
                  />
                ) : null}
                {swift ? (
                  <CopyableTradeBankDetail
                    label="SWIFT code"
                    value={swift}
                    copied={copiedBankField === `${accountId}:swift`}
                    copyLabel="Copy SWIFT / BIC"
                    copiedLabel="SWIFT / BIC copied"
                    testID={`copy-trade-bank-${index}-swift`}
                    onCopy={() => void copyBankDetail(accountId, 'swift', swift)}
                  />
                ) : null}
                {bankDetailCopyError?.accountId === accountId ? (
                  <Text accessibilityRole="alert" style={{ color: colors.destructive, fontSize: 11, lineHeight: 16, marginTop: 7 }}>
                    {bankDetailCopyError.message}
                  </Text>
                ) : null}
              </Card>
            );
          })}
        </>
      ) : null}

      {tab === 'history' ? (
        <>
          {historyQuery.isLoading ? <LoadingCard label="Loading payment history…" lines={2} /> : null}
          {historyQuery.isError ? <ErrorState message="Payment history could not be loaded." error={historyQuery.error} onRetry={() => void historyQuery.refetch()} /> : null}
          {history.length === 0 && historyQuery.isSuccess ? <EmptyState title="No payment submissions" body="Payment references you submit for review will appear here." icon="file-text" /> : null}
          {history.map((payment, index) => (
            <Card key={first(payment, ['id'], String(index))} style={{ padding: 14, marginBottom: 9 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '800' }}>{first(payment, ['order_number'], `Order ${first(payment, ['id'], '')}`)}</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 4 }}>{first(payment, ['payment_method'], 'Payment')}</Text>
                </View>
                <Status value={first(payment, ['review_status', 'payment_status'], 'Pending')} />
              </View>
              {first(payment, ['payment_reference']) ? <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 8 }}>Reference: {first(payment, ['payment_reference'])}</Text> : null}
              {first(payment, ['payment_submitted_at']) ? <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 4 }}>Submitted: {first(payment, ['payment_submitted_at'])}</Text> : null}
            </Card>
          ))}
        </>
      ) : null}

      {tab === 'submit' ? (
        <>
          <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800', marginBottom: 8 }}>Select an order</Text>
          {ordersQuery.isLoading ? <LoadingCard label="Loading orders…" lines={2} /> : null}
          {ordersQuery.isError ? <ErrorState message="Orders could not be loaded." error={ordersQuery.error} onRetry={() => void ordersQuery.refetch()} /> : null}
          {eligibleOrders.length === 0 && ordersQuery.isSuccess ? <EmptyState title="No order ready for payment details" body="Orders already submitted for review or marked paid cannot be submitted again." icon="check-circle" /> : null}
          {eligibleOrders.map(order => {
            const id = Number(first(order, ['id']));
            const selected = orderId === id;
            return (
              <Pressable key={String(id)} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => { setOrderId(id); setError(''); }} style={{ marginBottom: 8 }}>
                <Card style={{ padding: 12, borderColor: selected ? colors.accent : colors.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '800' }}>{displayOrderNumber(order)}</Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 4 }}>{money(amount(order, ['total_value_usd', 'total_value']))}</Text>
                    </View>
                    <Status value={first(order, ['payment_status'], 'Unsubmitted')} />
                  </View>
                </Card>
              </Pressable>
            );
          })}

          {orderId ? (
            <Card style={{ padding: 14, marginTop: 7 }}>
              <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800', marginBottom: 8 }}>Payment method</Text>
              {methodsQuery.isLoading ? <LoadingCard label="Loading payment methods…" lines={1} /> : null}
              {methodsQuery.isError ? <ErrorState message="Payment methods could not be loaded." error={methodsQuery.error} onRetry={() => void methodsQuery.refetch()} /> : null}
              {methods.map(method => {
                const code = first(method, ['code']);
                const selected = methodCode === code;
                return (
                  <Pressable key={code} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => { setMethodCode(code); setField1(''); setField2(''); }} style={{ minHeight: 44, borderRadius: 11, borderWidth: 1, borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? colors.secondary : colors.card, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                    <Text style={{ flex: 1, color: colors.foreground, fontSize: 11, fontWeight: '700' }}>{first(method, ['label'], code)}</Text>
                    {selected ? <Feather name="check-circle" size={15} color={colors.primary} /> : null}
                  </Pressable>
                );
              })}
              {selectedMethod ? (
                <>
                  {methodFields[0] ? <Field label={methodFields[0]} value={field1} onChangeText={setField1} /> : null}
                  {methodFields[1] ? <Field label={methodFields[1]} value={field2} onChangeText={setField2} /> : null}
                  {!methodFields.length ? <Field label="Payment reference" value={reference} onChangeText={setReference} /> : null}
                  <Field label="Notes for finance team" value={notes} onChangeText={setNotes} multiline placeholder="Optional details about the transfer" />
                </>
              ) : null}
              <Action title="Submit for verification" icon="send" loading={submitPayment.isPending} disabled={submitPayment.isPending} onPress={() => void submitDetails()} />
            </Card>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}
