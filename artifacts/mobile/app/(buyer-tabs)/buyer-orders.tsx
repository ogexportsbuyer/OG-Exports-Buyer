import React from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { Card, EmptyState, ErrorState, LoadingCard, Screen, Status } from '@/components/InvestorUI';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useGetBuyerOrders, useGetBuyerRfqs, getGetBuyerOrdersQueryKey, getGetBuyerRfqsQueryKey } from '@workspace/api-client-react';
import { amount, first, record } from '@/lib/data';
import { displayOrderNumber, rowsFromResponse } from '@/lib/buyer-data';

function money(value: number): string {
  return `USD ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BuyerOrders() {
  const colors = useColors();
  const { token } = useAuth();
  const { view } = useLocalSearchParams<{ view?: string | string[] }>();
  const activeView = (Array.isArray(view) ? view[0] : view) === 'rfqs' ? 'rfqs' : 'orders';
  const ordersQuery = useGetBuyerOrders({ per_page: 50 }, { query: { queryKey: getGetBuyerOrdersQueryKey({ per_page: 50 }), enabled: !!token, staleTime: 20_000 } });
  const rfqsQuery = useGetBuyerRfqs({ per_page: 50 }, { query: { queryKey: getGetBuyerRfqsQueryKey({ per_page: 50 }), enabled: !!token, staleTime: 20_000 } });
  const orders = rowsFromResponse(ordersQuery.data);
  const rfqs = rowsFromResponse(rfqsQuery.data);
  const query = activeView === 'orders' ? ordersQuery : rfqsQuery;
  const rows = activeView === 'orders' ? orders : rfqs;

  if (!token) {
    return <BuyerAuthGate
      title="Orders and quote requests"
      body="Sign in to view order progress, shipment details, and quotations from OG Exports."
      returnTo="/buyer-orders"
    />;
  }

  return (
    <Screen title="Orders" subtitle="Track orders and quotation requests" refreshable>
      <View style={{ flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: colors.secondary, marginBottom: 16 }}>
        {([
          ['orders', 'Orders'],
          ['rfqs', 'Quote requests'],
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

      {query.isLoading ? <LoadingCard label={activeView === 'orders' ? 'Loading orders…' : 'Loading quote requests…'} /> : null}
      {query.isError ? (
        <ErrorState
          message={activeView === 'orders' ? 'Your orders could not be loaded.' : 'Your quote requests could not be loaded.'}
          error={query.error}
          onRetry={() => void query.refetch()}
        />
      ) : null}
      {!query.isLoading && !query.isError && rows.length === 0 ? (
        <EmptyState
          title={activeView === 'orders' ? 'No orders yet' : 'No quote requests yet'}
          body={activeView === 'orders' ? 'Orders placed from your cart will appear here.' : 'Requests for non-FOB terms will appear here.'}
          icon={activeView === 'orders' ? 'package' : 'file-text'}
        />
      ) : null}

      {!query.isLoading && !query.isError && rows.map((row, index) => {
        const id = first(row, ['id'], `${activeView}-${index}`);
        if (activeView === 'rfqs') {
          const reference = first(row, ['reference', 'rfq_number', 'id'], 'Quote request');
          const product = first(row, ['product_name'], first(record(row.product), ['name'], 'Product quotation'));
          return (
            <Card key={id} testID={`buyer-rfq-${id}`} style={{ padding: 16, marginBottom: 11 }}>
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
