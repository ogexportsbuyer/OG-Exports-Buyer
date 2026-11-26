import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { getGetBuyerRfqsQueryKey, useGetBuyerRfqs } from '@workspace/api-client-react';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { Action, Card, EmptyState, ErrorState, Field, LoadingCard, Screen, Status } from '@/components/InvestorUI';
import { BuyerRfqForm } from '@/components/BuyerRfqForm';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { amount, first, list, record } from '@/lib/data';
import { rowsFromResponse } from '@/lib/buyer-data';
import { useBuyerGuestFlow } from '@/context/BuyerGuestFlowContext';
import {
  buyerRfqDestination,
  buyerRfqDraftFromRecord,
  buyerRfqStatus,
  filterBuyerRfqs,
  formatBuyerRfqReference,
  type BuyerRfqDraft,
  type BuyerRfqStatus,
} from '@/lib/buyer-rfq';
import { formatAppDate } from '@/lib/strings';

type Mode = 'history' | 'new' | 'success';
const statusOptions: ('All' | BuyerRfqStatus)[] = ['All', 'Pending', 'Quoted', 'Accepted', 'Expired'];

function dateLabel(value: string) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value.slice(0, 10)
    : formatAppDate(date, { month: 'short', day: '2-digit', year: 'numeric' });
}

export default function BuyerRfq() {
  const colors = useColors();
  const { token } = useAuth();
  const params = useLocalSearchParams<{ mode?: string | string[]; product_id?: string | string[]; resumeAfterAuth?: string | string[] }>();
  const requestedMode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const productParam = Array.isArray(params.product_id) ? params.product_id[0] : params.product_id;
  const resumeParam = Array.isArray(params.resumeAfterAuth) ? params.resumeAfterAuth[0] : params.resumeAfterAuth;
  const resumeAfterAuth = resumeParam === '1';
  const guestFlow = useBuyerGuestFlow();
  const [mode, setMode] = useState<Mode>(requestedMode === 'new' || productParam ? 'new' : 'history');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | BuyerRfqStatus>('All');
  const [draft, setDraft] = useState<BuyerRfqDraft | undefined>(undefined);
  const [formRevision, setFormRevision] = useState(0);
  const [submittedReference, setSubmittedReference] = useState('');
  const rfqsQuery = useGetBuyerRfqs({ per_page: 100 }, {
    query: {
      queryKey: getGetBuyerRfqsQueryKey({ per_page: 100 }),
      enabled: Boolean(token),
      staleTime: 20_000,
      retry: false,
    },
  });
  const rfqs = rowsFromResponse(rfqsQuery.data);
  const filtered = useMemo(() => filterBuyerRfqs(rfqs, search, statusFilter), [rfqs, search, statusFilter]);
  const stats = useMemo(() => ({
    total: rfqs.length,
    pending: rfqs.filter(row => buyerRfqStatus(row) === 'Pending').length,
    quoted: rfqs.filter(row => buyerRfqStatus(row) === 'Quoted').length,
    accepted: rfqs.filter(row => buyerRfqStatus(row) === 'Accepted').length,
  }), [rfqs]);

  useEffect(() => {
    if (requestedMode === 'new' || productParam) setMode('new');
  }, [requestedMode, productParam]);

  if (!token && mode === 'history') {
    return <BuyerAuthGate
      title="Request for quotation"
      body="Sign in to create a request and review your RFQ history."
      returnTo={requestedMode === 'new' || productParam ? '/buyer-rfq?mode=new' : '/buyer-rfq'}
    />;
  }

  function startNew(nextDraft?: BuyerRfqDraft) {
    setDraft(nextDraft);
    setFormRevision(value => value + 1);
    setSubmittedReference('');
    setMode('new');
  }

  function openHistory() {
    void guestFlow.clearRfqDraft().catch(() => undefined);
    setDraft(undefined);
    setSubmittedReference('');
    setMode('history');
  }

  if (mode === 'new') {
    const initialDraft = draft
      || (resumeAfterAuth && guestFlow.rfqDraft ? guestFlow.rfqDraft : undefined)
      || (productParam ? {
      productId: productParam,
      quantity: '',
      packaging: '25 kg PP Bag',
      countryId: '',
      portId: '',
      incoterm: '',
      paymentTerms: '',
      deliveryDate: '',
      notes: '',
      attachments: [],
      } : undefined);
    return <BuyerRfqForm
      key={formRevision}
      initialDraft={initialDraft}
      resumeAfterAuth={resumeAfterAuth}
      onCancel={openHistory}
      onSubmitted={reference => {
        void guestFlow.clearRfqDraft().catch(() => undefined);
        setSubmittedReference(reference);
        setDraft(undefined);
        setMode('success');
      }}
    />;
  }

  if (mode === 'success') {
    return (
      <Screen title="RFQ submitted" subtitle="Your request has been sent to the OG Exports trade desk">
        <Card style={{ padding: 22, alignItems: 'center', marginTop: 10 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.lightGreen, alignItems: 'center', justifyContent: 'center', marginBottom: 15 }}>
            <Feather name="check" size={29} color={colors.primary} />
          </View>
          <Text style={{ color: colors.foreground, fontSize: 19, fontWeight: '800', textAlign: 'center' }}>RFQ submitted successfully</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 9 }}>Your reference number</Text>
          <Text testID="buyer-rfq-success-reference" style={{ color: colors.primary, fontSize: 18, fontWeight: '800', marginTop: 4 }}>{submittedReference}</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 13 }}>
            Your request is saved. The trade desk will review it, and any quotation will appear in your RFQ history.
          </Text>
        </Card>
        <View style={{ height: 15 }} />
        <Action title="View RFQ history" icon="file-text" onPress={openHistory} testID="buyer-rfq-success-history" />
        <View style={{ height: 9 }} />
        <Action title="Create another RFQ" icon="plus" secondary onPress={() => startNew()} testID="buyer-rfq-success-new" />
      </Screen>
    );
  }

  return (
    <Screen
      title="Request for quotation"
      subtitle="Create, track, and manage your RFQs"
      refreshable
      action={<Pressable testID="buyer-rfq-new-top" accessibilityRole="button" onPress={() => startNew()} style={{ minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, borderRadius: 12, backgroundColor: colors.primary }}>
        <Feather name="plus" size={15} color={colors.primaryForeground} />
        <Text style={{ color: colors.primaryForeground, fontSize: 11, fontWeight: '800' }}>New RFQ</Text>
      </Pressable>}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {([
          ['Total RFQs', stats.total, 'file-text', colors.primary],
          ['Pending', stats.pending, 'clock', colors.statusPending],
          ['Quoted', stats.quoted, 'message-square', colors.accent],
          ['Accepted', stats.accepted, 'check-circle', colors.statusSuccess],
        ] as const).map(([label, value, icon, tone]) => (
          <Card key={label} style={{ flexGrow: 1, flexBasis: '46%', minWidth: 145, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name={icon} size={15} color={tone} />
            </View>
            <View>
              <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: '800' }}>{value}</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>{label}</Text>
            </View>
          </Card>
        ))}
      </View>

      <View style={{ flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: colors.secondary, marginBottom: 14 }}>
        <Pressable
          testID="buyer-rfq-mode-history"
          accessibilityRole="button"
          accessibilityState={{ selected: true }}
          style={{ flex: 1, minHeight: 40, borderRadius: 11, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
        >
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>RFQ history</Text>
        </Pressable>
        <Pressable
          testID="buyer-rfq-mode-new"
          accessibilityRole="button"
          onPress={() => startNew()}
          style={{ flex: 1, minHeight: 40, borderRadius: 11, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '700' }}>New RFQ</Text>
        </Pressable>
      </View>

      <Field label="Search RFQs" value={search} onChangeText={setSearch} placeholder="Reference, product, or destination" autoCapitalize="none" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 11 }}>
        {statusOptions.map(status => {
          const selected = statusFilter === status;
          return <Pressable
            key={status}
            testID={`buyer-rfq-filter-${status.toLowerCase()}`}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => setStatusFilter(status)}
            style={{ minHeight: 34, borderRadius: 18, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: selected ? colors.primary : colors.secondary }}
          >
            <Text style={{ color: selected ? colors.primaryForeground : colors.foreground, fontSize: 10, fontWeight: '700' }}>{status}</Text>
          </Pressable>;
        })}
      </View>

      {rfqsQuery.isLoading ? <LoadingCard label="Loading RFQ history…" lines={3} /> : null}
      {rfqsQuery.isError ? <ErrorState message="Your RFQ history could not be loaded." error={rfqsQuery.error} onRetry={() => void rfqsQuery.refetch()} /> : null}
      {!rfqsQuery.isLoading && !rfqsQuery.isError && filtered.length === 0 ? (
        <EmptyState
          title={search || statusFilter !== 'All' ? 'No matching RFQs' : 'No RFQs yet'}
          body={search || statusFilter !== 'All' ? 'Try a different search or status filter.' : 'Create your first request and our trade desk will prepare a quotation.'}
          icon="file-text"
        />
      ) : null}

      {!rfqsQuery.isLoading && !rfqsQuery.isError ? filtered.map((row, index) => {
        const id = first(row, ['id']);
        const reference = first(row, ['reference', 'rfq_number'], formatBuyerRfqReference(id));
        const product = first(row, ['product_name'], first(record(row.product), ['name'], 'Export product'));
        const status = buyerRfqStatus(row);
        const quoteCount = list(row.quotations).length;
        const quantity = first(row, ['qty'], '—');
        const destination = buyerRfqDestination(row);
        const submittedDate = first(row, ['submitted_at', 'created_at']);
        const validId = /^\d+$/.test(id);
        return <Card key={id || `rfq-${index}`} testID={`buyer-rfq-history-${id}`} style={{ padding: 15, marginBottom: 10 }}>
          <Pressable
            testID={`buyer-rfq-open-${id}`}
            accessibilityRole="button"
            accessibilityLabel={`View ${reference} for ${product}`}
            disabled={!validId}
            onPress={() => router.push({ pathname: '/buyer-rfq/[id]', params: { id } })}
            style={{ gap: 8 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: '700' }}>{reference}</Text>
              <Status value={status} />
            </View>
            <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800' }}>{product}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>Qty: {quantity}</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>{destination}</Text>
              {first(row, ['incoterm']) ? <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>{first(row, ['incoterm'])}</Text> : null}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 9, marginTop: 2 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>Submitted {dateLabel(submittedDate)}</Text>
              {quoteCount > 0 ? <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700' }}>{quoteCount} quote{quoteCount === 1 ? '' : 's'} received</Text> : null}
            </View>
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 11 }}>
            {status === 'Quoted' ? <Pressable
              testID={`buyer-rfq-quotes-${id}`}
              accessibilityRole="button"
              onPress={() => validId && router.push({ pathname: '/buyer-rfq/[id]', params: { id } })}
              style={{ flex: 1, minHeight: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }}
            >
              <Text style={{ color: colors.primaryForeground, fontSize: 10, fontWeight: '800' }}>View quotes</Text>
            </Pressable> : null}
            {status === 'Expired' ? <Pressable
              testID={`buyer-rfq-resubmit-${id}`}
              accessibilityRole="button"
              onPress={() => startNew(buyerRfqDraftFromRecord(row))}
              style={{ flex: 1, minHeight: 38, flexDirection: 'row', gap: 6, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary }}
            >
              <Feather name="rotate-ccw" size={13} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '800' }}>Resubmit</Text>
            </Pressable> : null}
            <Pressable
              testID={`buyer-rfq-detail-${id}`}
              accessibilityRole="button"
              disabled={!validId}
              onPress={() => validId && router.push({ pathname: '/buyer-rfq/[id]', params: { id } })}
              style={{ flex: 1, minHeight: 38, flexDirection: 'row', gap: 6, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}
            >
              <Feather name="eye" size={13} color={colors.primary} />
              <Text style={{ color: colors.foreground, fontSize: 10, fontWeight: '700' }}>Details</Text>
            </Pressable>
          </View>
        </Card>;
      }) : null}
    </Screen>
  );
}
