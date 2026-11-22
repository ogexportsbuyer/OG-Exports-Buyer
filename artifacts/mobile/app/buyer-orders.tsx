import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { Card, EmptyState, ErrorState, Field, LoadingCard, Screen, Status } from '@/components/InvestorUI';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import {
  useGetBuyerOrders,
  useGetBuyerRfqs,
  useGetBuyerQuotations,
  getGetBuyerOrdersQueryKey,
  getGetBuyerRfqsQueryKey,
  getGetBuyerQuotationsQueryKey,
} from '@workspace/api-client-react';
import { amount, first, record } from '@/lib/data';
import { displayOrderNumber, rowsFromResponse } from '@/lib/buyer-data';

function money(value: number): string {
  return `USD ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BuyerOrders() {
  const colors = useColors();
  const { token } = useAuth();
  const [search, setSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState('all');
  const { view } = useLocalSearchParams<{ view?: string | string[] }>();
  const requestedView = Array.isArray(view) ? view[0] : view;
  const activeView = requestedView === 'rfqs' || requestedView === 'quotations' ? requestedView : 'orders';
  const ordersQuery = useGetBuyerOrders({ per_page: 50 }, { query: { queryKey: getGetBuyerOrdersQueryKey({ per_page: 50 }), enabled: !!token, staleTime: 20_000 } });
  const rfqsQuery = useGetBuyerRfqs({ per_page: 50 }, { query: { queryKey: getGetBuyerRfqsQueryKey({ per_page: 50 }), enabled: !!token, staleTime: 20_000 } });
  const quotationsQuery = useGetBuyerQuotations({ per_page: 50 }, { query: { queryKey: getGetBuyerQuotationsQueryKey({ per_page: 50 }), enabled: !!token && activeView === 'quotations', staleTime: 20_000 } });
  const orders = rowsFromResponse(ordersQuery.data);
  const rfqs = rowsFromResponse(rfqsQuery.data);
  const quotations = rowsFromResponse(quotationsQuery.data);
  const query = activeView === 'orders' ? ordersQuery : activeView === 'rfqs' ? rfqsQuery : quotationsQuery;
  const rows = activeView === 'orders' ? orders : activeView === 'rfqs' ? rfqs : quotations;
  const filteredRows = rows.filter(row => {
    const text = `${first(row, ['id', 'reference', 'rfq_number', 'order_number'])} ${first(row, ['product_name'])} ${first(row, ['destination', 'destination_port'])} ${first(row, ['status'])}`.toLowerCase();
    if (search.trim() && !text.includes(search.trim().toLowerCase())) return false;
    if (activeView !== 'orders' || orderFilter === 'all') return true;
    const status = first(row, ['status']).toLowerCase().replace(/[\s_]+/g, '-');
    if (orderFilter === 'payment') return ['payment', 'unpaid', 'pending'].includes(status) || ['unpaid', 'pending'].includes(first(row, ['payment_status']).toLowerCase());
    if (orderFilter === 'processing') return ['order-confirmed', 'production', 'quality-inspection'].includes(status);
    if (orderFilter === 'transit') return ['loaded-at-port', 'in-transit', 'transit'].includes(status);
    if (orderFilter === 'delivered') return status === 'delivered';
    return true;
  });

  if (!token) {
    return <BuyerAuthGate
      title="Orders and quote requests"
      body="Sign in to view order progress, shipment details, and quotations from OG Exports."
      returnTo="/buyer-orders"
    />;
  }

  return (
    <Screen
      title="Orders"
      subtitle="Track orders, requests, and quotations"
      refreshable
      action={<Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/buyer-rfq', params: { mode: 'new' } })} style={{ minHeight: 38, paddingHorizontal: 11, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.primaryForeground, fontSize: 10, fontWeight: '800' }}>New RFQ</Text></Pressable>}
    >
      <View style={{ flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: colors.secondary, marginBottom: 16 }}>
        {([
          ['orders', 'Orders'],
          ['rfqs', 'Quote requests'],
          ['quotations', 'Quotations'],
        ] as const).map(([value, label]) => {
          const selected = activeView === value;
          return (
            <Pressable
              key={value}
              testID={`buyer-orders-view-${value}`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => router.setParams({ view: value })}
              style={{ flex: 1, minHeight: 40, borderRadius: 11, justifyContent: 'center', alignItems: 'center', backgroundColor: selected ? colors.card : 'transparent', borderWidth: selected ? 1 : 0, borderColor: colors.border }}
            >
              <Text style={{ color: selected ? colors.primary : colors.mutedForeground, fontSize: 12, fontWeight: '700' }}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Field label={`Search ${activeView === 'orders' ? 'orders' : activeView === 'rfqs' ? 'quote requests' : 'quotations'}`} value={search} onChangeText={setSearch} placeholder="Reference, product, destination…" />
      {activeView === 'orders' ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 11 }}>
          {([
            ['all', 'All'],
            ['payment', 'Payment'],
            ['processing', 'Processing'],
            ['transit', 'In transit'],
            ['delivered', 'Delivered'],
          ] as const).map(([value, label]) => {
            const selected = orderFilter === value;
            return (
              <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setOrderFilter(value)} style={{ minHeight: 33, borderRadius: 17, paddingHorizontal: 10, justifyContent: 'center', backgroundColor: selected ? colors.primary : colors.secondary }}>
                <Text style={{ color: selected ? colors.primaryForeground : colors.foreground, fontSize: 10, fontWeight: '700' }}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {query.isLoading ? <LoadingCard label={activeView === 'orders' ? 'Loading orders…' : activeView === 'rfqs' ? 'Loading quote requests…' : 'Loading quotations…'} /> : null}
      {query.isError ? (
        <ErrorState
          message={activeView === 'orders' ? 'Your orders could not be loaded.' : activeView === 'rfqs' ? 'Your quote requests could not be loaded.' : 'Your quotations could not be loaded.'}
          error={query.error}
          onRetry={() => void query.refetch()}
        />
      ) : null}
      {!query.isLoading && !query.isError && filteredRows.length === 0 ? (
        <EmptyState
          title={search || orderFilter !== 'all' ? 'No matching records' : activeView === 'orders' ? 'No orders yet' : activeView === 'rfqs' ? 'No quote requests yet' : 'No quotations yet'}
          body={search || orderFilter !== 'all' ? 'Try changing the search or filter.' : activeView === 'orders' ? 'Orders placed from your cart will appear here.' : activeView === 'rfqs' ? 'Your requests for quotation will appear here.' : 'Quotations from OG Exports will appear here.'}
          icon={activeView === 'orders' ? 'package' : 'file-text'}
        />
      ) : null}

      {!query.isLoading && !query.isError && filteredRows.map((row, index) => {
        const id = first(row, ['id'], `${activeView}-${index}`);
        if (activeView === 'quotations') {
          const reference = `QT-${id.padStart(6, '0')}`;
          const product = first(row, ['product_name'], first(record(row.rfq), ['product_name'], 'Export product'));
          return (
            <Pressable
              key={id}
              testID={`buyer-quotation-${id}`}
              accessibilityRole="button"
              accessibilityLabel={`Open quotation ${reference} for ${product}`}
              onPress={() => /^\d+$/.test(id) && router.push({ pathname: '/buyer-quotation/[id]', params: { id } })}
            >
              <Card style={{ padding: 16, marginBottom: 11 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '700' }}>{reference}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>{product}</Text>
                  </View>
                  <Status value={first(row, ['status'], 'Pending')} />
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 12 }}>
                  {first(row, ['qty_mt']) ? <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Quantity: {first(row, ['qty_mt'])} MT</Text> : null}
                  {first(row, ['incoterm']) ? <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Term: {first(row, ['incoterm'])}</Text> : null}
                  {first(row, ['destination']) ? <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Destination: {first(row, ['destination'])}</Text> : null}
                </View>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700', marginTop: 12 }}>Open quotation and messages</Text>
              </Card>
            </Pressable>
          );
        }
        if (activeView === 'rfqs') {
          const reference = first(row, ['reference', 'rfq_number', 'id'], 'Quote request');
          const product = first(row, ['product_name'], first(record(row.product), ['name'], 'Product quotation'));
          return (
            <Pressable key={id} testID={`buyer-rfq-${id}`} accessibilityRole="button" onPress={() => /^\d+$/.test(id) && router.push(`/buyer-rfq/${id}`)}>
              <Card style={{ padding: 16, marginBottom: 11 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '700' }}>{reference}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>{product}</Text>
                  </View>
                  <Status value={first(row, ['status'], 'Pending')} />
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  {first(row, ['qty']) ? <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Quantity: {first(row, ['qty'])}</Text> : null}
                  {first(row, ['incoterm']) ? <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Term: {first(row, ['incoterm'])}</Text> : null}
                  {first(row, ['destination']) ? <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Destination: {first(row, ['destination'])}</Text> : null}
                </View>
              </Card>
            </Pressable>
          );
        }

        const total = amount(row, ['total_value_usd', 'total_value']);
        return (
          <Pressable
            key={id}
            testID={`buyer-order-${id}`}
            accessibilityRole="button"
            accessibilityLabel={`View order ${displayOrderNumber(row)}`}
            onPress={() => /^\d+$/.test(id) && router.push(`/buyer-order/${id}`)}
          >
            <Card style={{ padding: 16, marginBottom: 11 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '700' }}>{displayOrderNumber(row)}</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>
                    {first(row, ['destination_port', 'destination'], 'Destination pending')}
                  </Text>
                </View>
                <Status value={first(row, ['status'], 'Pending')} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
                <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
                  {first(row, ['placed_at', 'created_at'], 'Order date pending').slice(0, 10)}
                </Text>
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>
                  {total === null ? 'Price confirmed separately' : money(total)}
                </Text>
              </View>
            </Card>
          </Pressable>
        );
      })}
    </Screen>
  );
}
