import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { Action, Card, EmptyState, ErrorState, Field, LoadingCard, Screen } from '@/components/InvestorUI';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import {
  getGetBuyerBankAccountsQueryKey,
  getGetBuyerCartQueryKey,
  getGetBuyerOrdersQueryKey,
  getGetBuyerRfqsQueryKey,
  getGetCountriesQueryKey,
  getGetCountryPortsQueryKey,
  getGetIncotermsQueryKey,
  getGetPaymentMethodsQueryKey,
  useCheckoutBuyerCart,
  useGetBuyerBankAccounts,
  useGetBuyerCart,
  useGetCountries,
  useGetCountryPorts,
  useGetIncoterms,
  useGetPaymentMethods,
  useRequestBuyerCartQuotation,
} from '@workspace/api-client-react';
import { amount, first, list, messageOf, record } from '@/lib/data';
import { rowsFromResponse } from '@/lib/buyer-data';
import {
  buildBuyerOrderNotes,
  formatBuyerDeliveryDateInput,
  isFutureBuyerDeliveryDate,
} from '@/lib/buyer-cart-flow';

type CheckoutStep = 1 | 2 | 3;
type CheckoutComplete =
  | { kind: 'order'; reference: string; orderId?: string }
  | { kind: 'quotation'; references: string[] };

function money(value: number, currency = 'USD') {
  const code = /^[A-Z]{3}$/.test(currency) ? currency : 'USD';
  return `${code} ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function strings(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && !!item.trim())
    : [];
}

function isDefaultAccount(value: unknown) {
  return value === true || value === 1 || value === '1';
}

function SelectableCard({
  selected,
  onPress,
  testID,
  children,
}: {
  selected: boolean;
  onPress: () => void;
  testID: string;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        borderWidth: 1,
        borderColor: selected ? colors.accent : colors.border,
        backgroundColor: selected ? colors.lightGreen : colors.card,
        borderRadius: 15,
        padding: 14,
        marginBottom: 9,
        opacity: pressed ? 0.88 : 1,
      })}
    >
      {children}
    </Pressable>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 9 }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{label}</Text>
      <Text style={{ color: colors.foreground, flex: 1, fontSize: 11, fontWeight: '700', textAlign: 'right' }}>{value || '—'}</Text>
    </View>
  );
}

export default function BuyerCheckout() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const cartQuery = useGetBuyerCart({ query: { queryKey: getGetBuyerCartQueryKey(), enabled: Boolean(token), staleTime: 10_000 } });
  const countriesQuery = useGetCountries({ query: { queryKey: getGetCountriesQueryKey(), enabled: Boolean(token), staleTime: 300_000 } });
  const incotermsQuery = useGetIncoterms({ query: { queryKey: getGetIncotermsQueryKey(), enabled: Boolean(token), staleTime: 300_000 } });
  const paymentMethodsQuery = useGetPaymentMethods({ query: { queryKey: getGetPaymentMethodsQueryKey(), enabled: Boolean(token), staleTime: 300_000 } });
  const bankAccountsQuery = useGetBuyerBankAccounts({ query: { queryKey: getGetBuyerBankAccountsQueryKey(), enabled: Boolean(token), staleTime: 300_000 } });
  const [step, setStep] = useState<CheckoutStep>(1);
  const [countryId, setCountryId] = useState<number | null>(null);
  const [countrySearch, setCountrySearch] = useState('');
  const [portId, setPortId] = useState<number | null>(null);
  const [portSearch, setPortSearch] = useState('');
  const [incoterm, setIncoterm] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethodCode, setPaymentMethodCode] = useState('');
  const [paymentFieldValues, setPaymentFieldValues] = useState<Record<string, string>>({});
  const [selectedBankId, setSelectedBankId] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [completion, setCompletion] = useState<CheckoutComplete | null>(null);
  const placeOrder = useCheckoutBuyerCart();
  const requestQuote = useRequestBuyerCartQuotation();

  const portsQuery = useGetCountryPorts(countryId ?? 0, {
    query: {
      queryKey: getGetCountryPortsQueryKey(countryId ?? 0),
      enabled: Boolean(token) && countryId !== null,
      staleTime: 300_000,
    },
  });

  const cart = record(record(cartQuery.data).data);
  const cartItems = list(cart.items);
  const cartCurrency = first(cart, ['currency', 'currency_code'], 'USD').toUpperCase();
  const countries = rowsFromResponse(countriesQuery.data).filter(country => (amount(country, ['ports_count']) ?? 0) > 0);
  const ports = rowsFromResponse(portsQuery.data);
  const visibleCountries = countries.filter(country => first(country, ['name']).toLowerCase().includes(countrySearch.trim().toLowerCase())).slice(0, 8);
  const visiblePorts = ports.filter(port => `${first(port, ['name'])} ${first(port, ['unlocode'])}`.toLowerCase().includes(portSearch.trim().toLowerCase())).slice(0, 8);
  const incoterms = rowsFromResponse(incotermsQuery.data);
  const paymentMethods = rowsFromResponse(paymentMethodsQuery.data);
  const bankAccounts = rowsFromResponse(bankAccountsQuery.data);
  const selectedCountry = countries.find(country => amount(country, ['id']) === countryId);
  const selectedPort = ports.find(port => amount(port, ['id']) === portId);
  const selectedMethod = paymentMethods.find(method => first(method, ['code']) === paymentMethodCode);
  const methodFields = strings(selectedMethod?.fields);
  const selectedBank = bankAccounts.find(account => first(account, ['id']) === selectedBankId)
    ?? bankAccounts.find(account => isDefaultAccount(account.is_default))
    ?? bankAccounts[0];
  const isFob = incoterm.trim().toUpperCase() === 'FOB';
  const isBusy = placeOrder.isPending || requestQuote.isPending;
  const hasUnpricedItems = cartItems.some(item => (amount(item, ['unit_price']) ?? 0) <= 0);
  const subtotal = cartItems.reduce((sum, item) => {
    return sum + (amount(item, ['qty']) ?? 0) * (amount(item, ['unit_price']) ?? 0);
  }, 0);

  if (!token) {
    return (
      <BuyerAuthGate
        title="Checkout"
        body="Sign in to confirm delivery details and place an order or request a quotation."
        returnTo="/buyer-checkout"
      />
    );
  }

  function selectCountry(country: ReturnType<typeof record>) {
    const id = amount(country, ['id']);
    if (id === null) return;
    setCountryId(id);
    setCountrySearch(first(country, ['name']));
    setPortId(null);
    setPortSearch('');
    setError('');
  }

  function updateCountrySearch(value: string) {
    setCountrySearch(value);
    if (selectedCountry && value.trim().toLowerCase() !== first(selectedCountry, ['name']).toLowerCase()) {
      setCountryId(null);
      setPortId(null);
      setPortSearch('');
    }
    setError('');
  }

  function updatePortSearch(value: string) {
    setPortSearch(value);
    if (selectedPort && value.trim().toLowerCase() !== first(selectedPort, ['name']).toLowerCase()) setPortId(null);
    setError('');
  }

  function validateDelivery() {
    if (!cartItems.length) { setError('Your cart is empty. Add a product before continuing.'); return false; }
    if (countryId === null || !selectedCountry) { setError('Select a destination country.'); return false; }
    if (portId === null || !selectedPort) { setError('Select a destination port.'); return false; }
    if (!incoterm || !incoterms.some(term => first(term, ['code', 'name']) === incoterm)) {
      setError('Select a valid delivery term.');
      return false;
    }
    if (!isFutureBuyerDeliveryDate(deliveryDate)) {
      setError('Enter a real delivery date after today in YYYY-MM-DD format.');
      return false;
    }
    return true;
  }

  function continueFromDelivery() {
    setError('');
    if (countriesQuery.isError || incotermsQuery.isError || portsQuery.isError) {
      setError('Destination details could not be loaded. Refresh the failed list and try again.');
      return;
    }
    if (validateDelivery()) setStep(2);
  }

  function validatePayment() {
    if (!isFob) return true;
    if (!selectedMethod || !paymentMethodCode) { setError('Select a payment method.'); return false; }
    if (!selectedBank) { setError('Select an active OG Exports bank account.'); return false; }
    if (hasUnpricedItems) {
      setError('One or more products need a confirmed price. Go back and choose a non-FOB term to request a quotation.');
      return false;
    }
    const requiredField = methodFields[0];
    if (requiredField && !paymentFieldValues[requiredField]?.trim()) {
      setError(`Enter ${requiredField}.`);
      return false;
    }
    return true;
  }

  function continueFromPayment() {
    setError('');
    if (paymentMethodsQuery.isError || bankAccountsQuery.isError) {
      setError('Payment details could not be loaded. Refresh the failed list before continuing.');
      return;
    }
    if (paymentMethodsQuery.isLoading || bankAccountsQuery.isLoading) return;
    if (validatePayment()) setStep(3);
  }

  function invalidateAfterCheckout() {
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: getGetBuyerOrdersQueryKey({ per_page: 50 }) }),
      queryClient.invalidateQueries({ queryKey: getGetBuyerOrdersQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetBuyerRfqsQueryKey({ per_page: 50 }) }),
      queryClient.invalidateQueries({ queryKey: getGetBuyerRfqsQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetBuyerCartQueryKey() }),
    ]);
  }

  async function submitQuotationRequest() {
    setError('');
    if (!validateDelivery() || countryId === null || portId === null) return;
    try {
      const response = await requestQuote.mutateAsync({
        data: {
          destination_country_id: countryId,
          destination_port_id: portId,
          incoterm,
          required_delivery_date: deliveryDate,
          notes: notes.trim(),
        },
      });
      const payload = record(record(response).data);
      const rfqs = list(payload.rfqs);
      const references = rfqs.map(rfq => first(rfq, ['reference'], first(rfq, ['id'], 'Quote request')));
      invalidateAfterCheckout();
      setCompletion({ kind: 'quotation', references: references.length ? references : ['Quote request submitted'] });
    } catch (err) {
      setError(messageOf(err));
    }
  }

  async function submitOrder() {
    setError('');
    if (!validateDelivery()) { setStep(1); return; }
    if (!validatePayment()) { setStep(2); return; }
    if (!termsAccepted) { setError('Confirm the order details before placing the order.'); return; }
    if (countryId === null || portId === null || !selectedMethod || !selectedBank) return;

    const accountName = first(selectedBank, ['bank_name', 'bankName'], 'OG Exports');
    const accountTitle = first(selectedBank, ['account_title', 'account_name', 'accountTitle']);
    const accountNumber = first(selectedBank, ['iban', 'account_number', 'accountNumber']);
    const swift = first(selectedBank, ['swift_code', 'swift']);
    const bankDetails = [
      `Pay to: ${accountName}`,
      accountTitle ? `Account title: ${accountTitle}` : '',
      accountNumber ? `IBAN / account: ${accountNumber}` : '',
      swift ? `SWIFT: ${swift}` : '',
    ].filter(Boolean).join(' · ');
    const paymentDetails = methodFields
      .map(field => paymentFieldValues[field]?.trim() ? `${field}: ${paymentFieldValues[field].trim()}` : '')
      .filter(Boolean);
    const orderNotes = buildBuyerOrderNotes(notes, bankDetails, paymentDetails);

    try {
      const response = await placeOrder.mutateAsync({
        data: {
          payment_method: paymentMethodCode,
          destination_country_id: countryId,
          destination_port_id: portId,
          incoterm,
          required_delivery_date: deliveryDate,
          notes: orderNotes,
        },
      });
      const order = record(record(response).data);
      const rawId = first(order, ['id']);
      const orderId = /^\d+$/.test(rawId) ? rawId : undefined;
      const reference = first(order, ['order_number', 'reference'], orderId ? `Order ${orderId}` : 'Order placed');
      invalidateAfterCheckout();
      setCompletion({ kind: 'order', reference, orderId });
    } catch (err) {
      setError(messageOf(err));
    }
  }

  if (completion) {
    const isOrder = completion.kind === 'order';
    return (
      <Screen title={isOrder ? 'Order confirmed' : 'Quotation requested'} subtitle="Your cart has been submitted to OG Exports">
        <Card style={{ padding: 22, marginTop: 12, marginBottom: 14, alignItems: 'center' }}>
          <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: colors.statusSuccessBackground, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Feather name="check" size={26} color={colors.statusSuccess} />
          </View>
          <Text style={{ color: colors.foreground, fontSize: 19, fontWeight: '800', textAlign: 'center' }}>
            {isOrder ? 'Order placed successfully' : 'Request sent successfully'}
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 8 }}>
            {isOrder
              ? 'Your order is recorded. No payment was taken in the app; OG Exports will confirm the next steps.'
              : 'The trade desk will review your requirements and respond with pricing and delivery details.'}
          </Text>
          <View style={{ width: '100%', borderTopWidth: 1, borderTopColor: colors.border, marginTop: 17, paddingTop: 14 }}>
            {isOrder ? (
              <SummaryRow label="Order reference" value={completion.reference} />
            ) : (
              <>
                <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>Quote request references</Text>
                {completion.references.map(reference => <SummaryRow key={reference} label="Request" value={reference} />)}
              </>
            )}
          </View>
        </Card>
        <Action
          title={isOrder ? 'View order' : 'View quote requests'}
          icon="arrow-right"
          onPress={() => {
            if (completion.kind === 'order' && completion.orderId) router.replace(`/buyer-order/${completion.orderId}`);
            else router.replace({ pathname: '/(buyer-tabs)/buyer-orders', params: { view: isOrder ? 'orders' : 'rfqs' } });
          }}
          testID="buyer-checkout-view-result"
        />
        <View style={{ height: 9 }} />
        <Action title="Continue browsing" icon="grid" secondary onPress={() => router.replace('/(buyer-tabs)/buyer-products')} testID="buyer-checkout-continue-browsing" />
      </Screen>
    );
  }

  const steps = isFob
    ? [{ number: 1, label: 'Delivery' }, { number: 2, label: 'Payment' }, { number: 3, label: 'Review' }]
    : [{ number: 1, label: 'Delivery' }, { number: 2, label: 'Review request' }];
  const pageSubtitle = step === 1
    ? 'Confirm where and when your products are needed'
    : step === 2 && isFob
      ? 'Choose a payment method and OG Exports account'
      : step === 2
        ? 'Check your quotation request before sending'
        : 'Review everything before placing your order';

  return (
    <Screen title="Checkout" subtitle={pageSubtitle} refreshable>
      {cartQuery.isLoading ? <LoadingCard label="Loading your cart…" /> : null}
      {cartQuery.isError ? <ErrorState message="Your cart could not be loaded." error={cartQuery.error} onRetry={() => void cartQuery.refetch()} /> : null}

      {!cartQuery.isLoading && !cartQuery.isError && cartItems.length === 0 ? (
        <>
          <EmptyState title="Your cart is empty" body="Add products before starting checkout." icon="shopping-cart" />
          <Action title="Browse products" icon="grid" onPress={() => router.replace('/(buyer-tabs)/buyer-products')} testID="buyer-checkout-browse" />
        </>
      ) : null}

      {!cartQuery.isLoading && !cartQuery.isError && cartItems.length > 0 ? (
        <>
          <Card style={{ padding: 13, marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {steps.map((item, index) => {
                const active = step === item.number;
                const complete = step > item.number;
                return (
                  <React.Fragment key={item.number}>
                    <View style={{ alignItems: 'center', minWidth: 66 }}>
                      <View style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: complete ? colors.statusSuccessBackground : active ? colors.primary : colors.secondary,
                      }}>
                        {complete
                          ? <Feather name="check" size={14} color={colors.statusSuccess} />
                          : <Text style={{ color: active ? colors.primaryForeground : colors.mutedForeground, fontSize: 11, fontWeight: '800' }}>{item.number}</Text>}
                      </View>
                      <Text style={{ color: active ? colors.foreground : colors.mutedForeground, fontSize: 9, fontWeight: active ? '800' : '600', marginTop: 5, textAlign: 'center' }}>{item.label}</Text>
                    </View>
                    {index < steps.length - 1 ? <View style={{ height: 1, flex: 1, backgroundColor: complete ? colors.statusSuccess : colors.border, marginHorizontal: 3, marginBottom: 15 }} /> : null}
                  </React.Fragment>
                );
              })}
            </View>
          </Card>

          {error ? <Text accessibilityRole="alert" style={{ color: colors.destructive, fontSize: 12, lineHeight: 18, marginBottom: 12 }}>{error}</Text> : null}

          {step === 1 ? (
            <>
              <Card style={{ padding: 16, marginBottom: 15 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 5 }}>
                  <Feather name="map-pin" size={16} color={colors.accent} />
                  <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800' }}>Delivery details</Text>
                </View>
                <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 16 }}>Choose a destination and a future delivery date for these products.</Text>

                <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '700', marginTop: 16, marginBottom: 8 }}>Destination country</Text>
                {countriesQuery.isLoading ? <LoadingCard label="Loading countries…" lines={2} /> : null}
                {countriesQuery.isError ? <ErrorState message="Destination countries could not be loaded." error={countriesQuery.error} onRetry={() => void countriesQuery.refetch()} /> : null}
                {!countriesQuery.isLoading && !countriesQuery.isError && countries.length === 0 ? <EmptyState title="No destinations available" body="There are no countries with listed ports right now." icon="map-pin" /> : null}
                {!countriesQuery.isLoading && !countriesQuery.isError && countries.length > 0 ? (
                  <>
                  <Field label="Search country" value={countrySearch} onChangeText={updateCountrySearch} placeholder="Type a country name" autoCapitalize="words" />
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                    {visibleCountries.map(country => {
                      const id = amount(country, ['id']);
                      const selected = id !== null && id === countryId;
                      return (
                        <Pressable
                          key={String(id)}
                          testID={`buyer-checkout-country-${id}`}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          onPress={() => selectCountry(country)}
                          style={{ minHeight: 38, paddingHorizontal: 12, borderRadius: 19, borderWidth: 1, borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? colors.lightGreen : colors.secondary, alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Text style={{ color: selected ? colors.foreground : colors.mutedForeground, fontSize: 11, fontWeight: selected ? '800' : '600' }}>{first(country, ['name'], 'Country')}</Text>
                        </Pressable>
                      );
                    })}
                    {countrySearch.trim() && visibleCountries.length === 0 ? <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>No matching destination. Check the spelling or try another name.</Text> : null}
                  </View>
                  {!countrySearch.trim() ? <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 6 }}>Search to find another destination.</Text> : null}
                  </>
                ) : null}

                {countryId !== null ? (
                  <>
                    <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '700', marginTop: 16, marginBottom: 8 }}>Destination port</Text>
                    {portsQuery.isLoading ? <LoadingCard label="Loading ports…" lines={2} /> : null}
                    {portsQuery.isError ? <ErrorState message="Ports for this country could not be loaded." error={portsQuery.error} onRetry={() => void portsQuery.refetch()} /> : null}
                    {!portsQuery.isLoading && !portsQuery.isError && ports.length === 0 ? <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>No ports are listed for this country.</Text> : null}
                    {!portsQuery.isLoading && !portsQuery.isError && ports.length > 0 ? (
                      <>
                      <Field label="Search port" value={portSearch} onChangeText={updatePortSearch} placeholder="Type a port name or code" autoCapitalize="words" />
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                        {visiblePorts.map(port => {
                          const id = amount(port, ['id']);
                          const selected = id !== null && id === portId;
                          return (
                            <Pressable
                              key={String(id)}
                              testID={`buyer-checkout-port-${id}`}
                              accessibilityRole="button"
                              accessibilityState={{ selected }}
                              onPress={() => { setPortId(id); setPortSearch(first(port, ['name'])); setError(''); }}
                              style={{ minHeight: 38, paddingHorizontal: 12, borderRadius: 19, borderWidth: 1, borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? colors.lightGreen : colors.secondary, alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Text style={{ color: selected ? colors.foreground : colors.mutedForeground, fontSize: 11, fontWeight: selected ? '800' : '600' }}>{first(port, ['name'], 'Port')}</Text>
                            </Pressable>
                          );
                        })}
                        {portSearch.trim() && visiblePorts.length === 0 ? <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>No matching port. Search by name or UN/LOCODE.</Text> : null}
                      </View>
                      {!portSearch.trim() ? <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 6 }}>Search by port name or code if it is not shown.</Text> : null}
                      </>
                    ) : null}
                  </>
                ) : null}

                <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '700', marginTop: 16, marginBottom: 8 }}>Delivery term</Text>
                {incotermsQuery.isLoading ? <LoadingCard label="Loading delivery terms…" lines={2} /> : null}
                {incotermsQuery.isError ? <ErrorState message="Delivery terms could not be loaded." error={incotermsQuery.error} onRetry={() => void incotermsQuery.refetch()} /> : null}
                {!incotermsQuery.isLoading && !incotermsQuery.isError ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                    {incoterms.map(term => {
                      const code = first(term, ['code', 'name']);
                      const selected = incoterm === code;
                      return (
                        <Pressable
                          key={code}
                          testID={`buyer-checkout-incoterm-${code.toLowerCase()}`}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          onPress={() => { setIncoterm(code); setError(''); }}
                          style={{ minHeight: 38, paddingHorizontal: 13, borderRadius: 19, borderWidth: 1, borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? colors.lightGreen : colors.secondary, justifyContent: 'center' }}
                        >
                          <Text style={{ color: selected ? colors.foreground : colors.mutedForeground, fontSize: 11, fontWeight: '800' }}>
                            {code}{first(term, ['label']) ? ` · ${first(term, ['label'])}` : ''}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}

                <Field
                  label="Required delivery date"
                  value={deliveryDate}
                  onChangeText={value => { setDeliveryDate(formatBuyerDeliveryDateInput(value)); setError(''); }}
                  placeholder="YYYY-MM-DD"
                  keyboardType="numeric"
                  autoCapitalize="none"
                  maxLength={10}
                />
                <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: -8, marginBottom: 12 }}>Enter a date after today. The date is checked before submission.</Text>
                <Field
                  label="Notes for OG Exports (optional)"
                  value={notes}
                  onChangeText={value => { setNotes(value); setError(''); }}
                  placeholder="Packaging, labelling, certification, or delivery instructions"
                  multiline
                  maxLength={5000}
                />
              </Card>

              <Card style={{ padding: 15, marginBottom: 13 }}>
                <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '800' }}>Cart summary</Text>
                {cartItems.map((item, index) => {
                  const product = record(item.product);
                  const quantity = amount(item, ['qty']) ?? 0;
                  const unitPrice = amount(item, ['unit_price']) ?? 0;
                  return (
                    <View key={first(item, ['id'], String(index))} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 10 }}>
                      <Text style={{ color: colors.mutedForeground, flex: 1, fontSize: 11 }}>
                        {first(product, ['name'], first(item, ['product_name'], 'Export product'))} × {quantity}
                      </Text>
                      <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: '700' }}>{unitPrice > 0 ? money(quantity * unitPrice, cartCurrency) : 'Quote'}</Text>
                    </View>
                  );
                })}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, marginTop: 13, paddingTop: 11 }}>
                  <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '800' }}>Estimated subtotal</Text>
                  <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '800' }}>{subtotal > 0 ? money(subtotal, cartCurrency) : 'Price by quotation'}</Text>
                </View>
                {hasUnpricedItems ? <Text style={{ color: colors.accent, fontSize: 10, lineHeight: 15, marginTop: 8 }}>Some products need a confirmed price. Use a non-FOB term to send a quotation request.</Text> : null}
              </Card>

              <Action
                title={isFob ? 'Continue to payment' : 'Review quotation request'}
                icon="arrow-right"
                disabled={isBusy || cartQuery.isLoading || countriesQuery.isLoading || incotermsQuery.isLoading || (countryId !== null && portsQuery.isLoading)}
                onPress={continueFromDelivery}
                testID="buyer-checkout-continue-delivery"
              />
            </>
          ) : null}

          {step === 2 && isFob ? (
            <>
              <Card style={{ padding: 16, marginBottom: 13 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                  <Feather name="credit-card" size={16} color={colors.accent} />
                  <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800' }}>Payment method</Text>
                </View>
                <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 16, marginTop: 5, marginBottom: 12 }}>Choose the method you intend to use for this trade. No payment is taken in this app.</Text>
                {paymentMethodsQuery.isLoading ? <LoadingCard label="Loading available payment methods…" lines={2} /> : null}
                {paymentMethodsQuery.isError ? <ErrorState message="Payment methods could not be loaded." error={paymentMethodsQuery.error} onRetry={() => void paymentMethodsQuery.refetch()} /> : null}
                {paymentMethodsQuery.isSuccess && paymentMethods.length === 0 ? <EmptyState title="No payment methods available" body="Contact OG Exports before placing an order." icon="credit-card" /> : null}
                {paymentMethods.map(method => {
                  const code = first(method, ['code']);
                  const selected = paymentMethodCode === code;
                  return (
                    <SelectableCard
                      key={code}
                      testID={`buyer-checkout-payment-method-${code}`}
                      selected={selected}
                      onPress={() => { setPaymentMethodCode(code); setPaymentFieldValues({}); setError(''); }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                        <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: selected ? colors.accent : colors.mutedForeground, alignItems: 'center', justifyContent: 'center' }}>
                          {selected ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} /> : null}
                        </View>
                        <Text style={{ color: colors.foreground, flex: 1, fontSize: 12, fontWeight: '800' }}>{first(method, ['label'], code)}</Text>
                        {first(method, ['badge']) ? <Text style={{ color: colors.accent, fontSize: 9, fontWeight: '800' }}>{first(method, ['badge'])}</Text> : null}
                      </View>
                      {first(method, ['description']) ? <Text style={{ color: colors.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: 7, marginLeft: 27 }}>{first(method, ['description'])}</Text> : null}
                    </SelectableCard>
                  );
                })}
                {selectedMethod && methodFields.length ? (
                  <View style={{ marginTop: 3 }}>
                    <Text style={{ color: colors.accent, fontSize: 10, fontWeight: '800', marginBottom: 8 }}>Payment details for this method</Text>
                    {methodFields.map((field, index) => (
                      <Field
                        key={`${paymentMethodCode}-${field}`}
                        label={`${field}${index === 0 ? ' *' : ' (optional)'}`}
                        value={paymentFieldValues[field] ?? ''}
                        onChangeText={value => {
                          setPaymentFieldValues(current => ({ ...current, [field]: value }));
                          setError('');
                        }}
                        placeholder={field}
                        maxLength={255}
                      />
                    ))}
                    <Text style={{ color: colors.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: -5 }}>Never enter a bank password, PIN, one-time code, or account login.</Text>
                  </View>
                ) : null}
              </Card>

              <Card style={{ padding: 16, marginBottom: 13 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                  <Feather name="home" size={16} color={colors.accent} />
                  <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800' }}>OG Exports receiving account</Text>
                </View>
                <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 16, marginTop: 5, marginBottom: 12 }}>Choose the active company account for your order. You can copy its details from Trade Finance later.</Text>
                {bankAccountsQuery.isLoading ? <LoadingCard label="Loading verified company accounts…" lines={3} /> : null}
                {bankAccountsQuery.isError ? <ErrorState message="Company bank accounts could not be loaded." error={bankAccountsQuery.error} onRetry={() => void bankAccountsQuery.refetch()} /> : null}
                {bankAccountsQuery.isSuccess && bankAccounts.length === 0 ? <EmptyState title="No receiving account available" body="Contact OG Exports before placing this order." icon="credit-card" /> : null}
                {bankAccounts.map((account, index) => {
                  const id = first(account, ['id'], String(index));
                  const selected = first(selectedBank ?? {}, ['id']) === id;
                  const accountNumber = first(account, ['iban', 'account_number']);
                  return (
                    <SelectableCard
                      key={id}
                      testID={`buyer-checkout-bank-account-${id}`}
                      selected={selected}
                      onPress={() => { setSelectedBankId(id); setError(''); }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                        <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: selected ? colors.accent : colors.mutedForeground, alignItems: 'center', justifyContent: 'center' }}>
                          {selected ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} /> : null}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '800' }}>{first(account, ['bank_name', 'bankName'], 'OG Exports')}</Text>
                          <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 3 }}>{first(account, ['account_title', 'account_name', 'accountTitle'], 'Company account')} · {first(account, ['currency'], 'USD')}</Text>
                        </View>
                        {isDefaultAccount(account.is_default) ? <Text style={{ color: colors.accent, fontSize: 9, fontWeight: '800' }}>RECOMMENDED</Text> : null}
                      </View>
                      {accountNumber ? <Text selectable style={{ color: colors.foreground, fontSize: 10, fontWeight: '600', marginTop: 9, marginLeft: 27 }}>IBAN / account: {accountNumber}</Text> : null}
                      {first(account, ['swift_code', 'swift']) ? <Text selectable style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 4, marginLeft: 27 }}>SWIFT: {first(account, ['swift_code', 'swift'])}</Text> : null}
                    </SelectableCard>
                  );
                })}
              </Card>

              {hasUnpricedItems ? (
                <Card style={{ padding: 13, marginBottom: 12, borderColor: colors.accent }}>
                  <Text style={{ color: colors.foreground, fontSize: 11, lineHeight: 17 }}>An FOB order cannot be placed until every product has a confirmed price. Go back and select another delivery term to request a quotation.</Text>
                </Card>
              ) : null}
              <View style={{ flexDirection: 'row', gap: 9 }}>
                <View style={{ flex: 1 }}><Action title="Back" icon="arrow-left" secondary onPress={() => { setError(''); setStep(1); }} testID="buyer-checkout-back-delivery" /></View>
                <View style={{ flex: 1 }}><Action title="Review order" icon="arrow-right" disabled={isBusy || paymentMethodsQuery.isLoading || bankAccountsQuery.isLoading || paymentMethods.length === 0 || bankAccounts.length === 0 || hasUnpricedItems} onPress={continueFromPayment} testID="buyer-checkout-review-order" /></View>
              </View>
            </>
          ) : null}

          {step === 2 && !isFob ? (
            <>
              <Card style={{ padding: 17, marginBottom: 13 }}>
                <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800' }}>Review quotation request</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 17, marginTop: 5 }}>This sends one quote request for each product. Final pricing, availability, freight, and payment terms will be confirmed by OG Exports.</Text>
                {cartItems.map((item, index) => {
                  const product = record(item.product);
                  return (
                    <View key={first(item, ['id'], String(index))} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 12 }}>
                      <Text style={{ color: colors.foreground, flex: 1, fontSize: 11, fontWeight: '700' }}>{first(product, ['name'], first(item, ['product_name'], 'Export product'))}</Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Qty {amount(item, ['qty']) ?? 0}</Text>
                    </View>
                  );
                })}
                <View style={{ borderTopWidth: 1, borderTopColor: colors.border, marginTop: 14, paddingTop: 12 }}>
                  <SummaryRow label="Destination" value={first(selectedCountry ?? {}, ['name'])} />
                  <SummaryRow label="Port" value={first(selectedPort ?? {}, ['name'])} />
                  <SummaryRow label="Delivery term" value={incoterm} />
                  <SummaryRow label="Required by" value={deliveryDate} />
                </View>
                {notes.trim() ? <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 17, marginTop: 12 }}>Your notes: {notes.trim()}</Text> : null}
              </Card>
              <View style={{ flexDirection: 'row', gap: 9 }}>
                <View style={{ flex: 1 }}><Action title="Back" icon="arrow-left" secondary onPress={() => { setError(''); setStep(1); }} testID="buyer-checkout-back-delivery" /></View>
                <View style={{ flex: 1 }}><Action title="Send quote request" icon="send" loading={requestQuote.isPending} disabled={isBusy} onPress={() => void submitQuotationRequest()} testID="buyer-checkout-submit-quotation" /></View>
              </View>
            </>
          ) : null}

          {step === 3 && isFob ? (
            <>
              <Card style={{ padding: 16, marginBottom: 12 }}>
                <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800' }}>Products</Text>
                {cartItems.map((item, index) => {
                  const product = record(item.product);
                  const quantity = amount(item, ['qty']) ?? 0;
                  const unitPrice = amount(item, ['unit_price']) ?? 0;
                  return (
                    <View key={first(item, ['id'], String(index))} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 11 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: '700' }}>{first(product, ['name'], first(item, ['product_name'], 'Export product'))}</Text>
                        <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 3 }}>Quantity: {quantity}</Text>
                      </View>
                      <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: '700' }}>{unitPrice > 0 ? money(quantity * unitPrice, cartCurrency) : 'Quote'}</Text>
                    </View>
                  );
                })}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, marginTop: 13, paddingTop: 11 }}>
                  <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '800' }}>Estimated subtotal</Text>
                  <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '800' }}>{money(subtotal, cartCurrency)}</Text>
                </View>
                <Text style={{ color: colors.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: 7 }}>Freight and any final adjustments are confirmed separately. No money is transferred by placing this order.</Text>
              </Card>

              <Card style={{ padding: 16, marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Feather name="map-pin" size={15} color={colors.accent} />
                  <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '800' }}>Delivery</Text>
                </View>
                <SummaryRow label="Country" value={first(selectedCountry ?? {}, ['name'])} />
                <SummaryRow label="Port" value={first(selectedPort ?? {}, ['name'])} />
                <SummaryRow label="Delivery term" value={incoterm} />
                <SummaryRow label="Required by" value={deliveryDate} />
              </Card>

              <Card style={{ padding: 16, marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Feather name="credit-card" size={15} color={colors.accent} />
                  <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '800' }}>Payment plan</Text>
                </View>
                <SummaryRow label="Method" value={first(selectedMethod ?? {}, ['label'])} />
                <SummaryRow label="OG Exports bank" value={first(selectedBank ?? {}, ['bank_name', 'bankName'])} />
                <SummaryRow label="IBAN / account" value={first(selectedBank ?? {}, ['iban', 'account_number'])} />
                {methodFields.map(field => paymentFieldValues[field]?.trim() ? <SummaryRow key={field} label={field} value={paymentFieldValues[field].trim()} /> : null)}
              </Card>

              {notes.trim() ? (
                <Card style={{ padding: 14, marginBottom: 12 }}>
                  <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '800' }}>Instructions</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 17, marginTop: 6 }}>{notes.trim()}</Text>
                </Card>
              ) : null}

              <Pressable
                testID="buyer-checkout-terms"
                accessibilityRole="checkbox"
                accessibilityState={{ checked: termsAccepted }}
                onPress={() => { setTermsAccepted(value => !value); setError(''); }}
                style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 3, paddingVertical: 9, marginBottom: 8 }}
              >
                <View style={{ width: 20, height: 20, borderRadius: 5, borderWidth: 1, borderColor: termsAccepted ? colors.primary : colors.border, backgroundColor: termsAccepted ? colors.primary : colors.card, alignItems: 'center', justifyContent: 'center' }}>
                  {termsAccepted ? <Feather name="check" size={13} color={colors.primaryForeground} /> : null}
                </View>
                <Text style={{ color: colors.mutedForeground, flex: 1, fontSize: 11, lineHeight: 17 }}>I confirm these order, delivery, and payment details are correct. I understand OG Exports will confirm payment and export arrangements separately.</Text>
              </Pressable>

              <View style={{ flexDirection: 'row', gap: 9 }}>
                <View style={{ flex: 1 }}><Action title="Back" icon="arrow-left" secondary disabled={isBusy} onPress={() => { setError(''); setStep(2); }} testID="buyer-checkout-back-payment" /></View>
                <View style={{ flex: 1 }}><Action title="Place order" icon="check" loading={placeOrder.isPending} disabled={isBusy || !termsAccepted} onPress={() => void submitOrder()} testID="buyer-checkout-submit-order" /></View>
              </View>
            </>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}
