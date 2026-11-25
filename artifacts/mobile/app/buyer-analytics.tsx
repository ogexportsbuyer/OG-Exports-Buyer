import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import {
  getGetBuyerAnalyticsQueryKey,
  getGetBuyerOrdersQueryKey,
  useGetBuyerAnalytics,
  useGetBuyerOrders,
} from '@workspace/api-client-react';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { Card, EmptyState, ErrorState, LoadingCard, Screen, Status } from '@/components/InvestorUI';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { amount, first, list, record } from '@/lib/data';
import { rowsFromResponse } from '@/lib/buyer-data';
import { analyticsMonthLabel, orderProductSummary, ordersForAnalyticsMonth } from '@/lib/buyer-analytics-data';

function money(value: number | null) {
  return value === null ? '—' : `USD ${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export default function BuyerAnalytics() {
  const colors = useColors();
  const { token } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState('');
  const query = useGetBuyerAnalytics({
    query: { queryKey: getGetBuyerAnalyticsQueryKey(), enabled: !!token, staleTime: 60_000 },
  });
  const ordersParams = { per_page: 100 };
  const ordersQuery = useGetBuyerOrders(ordersParams, {
    query: {
      queryKey: getGetBuyerOrdersQueryKey(ordersParams),
      enabled: !!token && !!selectedMonth,
      staleTime: 20_000,
    },
  });
  const analytics = record(record(query.data).data);
  const monthly = list(analytics.spend_by_month).slice(-12);
  const monthOrders = useMemo(
    () => ordersForAnalyticsMonth(rowsFromResponse(ordersQuery.data), selectedMonth),
    [ordersQuery.data, selectedMonth],
  );
  const stats = [
    ['Total orders', first(analytics, ['orders_total'], '0')],
    ['Total trade value', money(amount(analytics, ['spend_total']))],
    ['Quotation requests', first(analytics, ['rfqs_total'], '0')],
    ['Accepted quotations', first(analytics, ['quotations_accepted'], '0')],
  ];

  if (!token) {
    return <BuyerAuthGate title="Buyer analytics" body="Sign in to view your order, quotation, and trade-value history." returnTo="/buyer-analytics" />;
  }

  return (
    <Screen title="Analytics" subtitle="Trade activity from your buyer account" refreshable>
      {query.isLoading ? <LoadingCard label="Loading buyer analytics…" lines={3} /> : null}
      {query.isError ? <ErrorState message="Your analytics could not be loaded." error={query.error} onRetry={() => void query.refetch()} /> : null}
      {query.isSuccess ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
            {stats.map(([label, value]) => (
              <Card key={label} style={{ width: '48%', minHeight: 86, padding: 13, justifyContent: 'space-between' }}>
                <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: '700' }}>{label}</Text>
                <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '800', marginTop: 10 }}>{value}</Text>
              </Card>
            ))}
          </View>

          <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800', marginBottom: 9 }}>Monthly trade value</Text>
          {monthly.length ? (
            <Card style={{ paddingHorizontal: 14, paddingVertical: 4 }}>
              {monthly.map((month, index) => {
                const monthKey = first(month, ['month'], '');
                const selected = selectedMonth === monthKey;
                return (
                  <Pressable
                    key={monthKey || String(index)}
                    testID={`buyer-analytics-month-${monthKey}`}
                    accessibilityRole="button"
                    accessibilityLabel={`View orders for ${analyticsMonthLabel(monthKey)}, ${money(amount(month, ['total']))}`}
                    accessibilityState={{ expanded: selected }}
                    onPress={() => setSelectedMonth(selected ? '' : monthKey)}
                    style={({ pressed }) => ({
                      minHeight: 52,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      borderBottomWidth: index === monthly.length - 1 ? 0 : 1,
                      borderBottomColor: colors.border,
                      opacity: pressed ? 0.72 : 1,
                    })}
                  >
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                      <View style={{ width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? colors.primary : colors.secondary }}>
                        <Feather name="calendar" size={14} color={selected ? colors.primaryForeground : colors.primary} />
                      </View>
                      <Text style={{ color: selected ? colors.primary : colors.mutedForeground, fontSize: 12, fontWeight: selected ? '700' : '500' }}>{analyticsMonthLabel(monthKey)}</Text>
                    </View>
                    <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '700' }}>{money(amount(month, ['total']))}</Text>
                    <Feather name={selected ? 'chevron-up' : 'chevron-right'} size={16} color={colors.mutedForeground} />
                  </Pressable>
                );
              })}
            </Card>
          ) : (
            <EmptyState title="No trade value recorded" body="Completed order values will be summarized here." icon="bar-chart-2" />
          )}
          {selectedMonth ? (
            <>
              <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800', marginTop: 18, marginBottom: 9 }}>
                Orders in {analyticsMonthLabel(selectedMonth)}
              </Text>
              {ordersQuery.isLoading ? <LoadingCard label="Loading monthly transactions…" lines={2} /> : null}
              {ordersQuery.isError ? (
                <ErrorState message="Monthly order details could not be loaded." error={ordersQuery.error} onRetry={() => void ordersQuery.refetch()} />
              ) : null}
              {ordersQuery.isSuccess && monthOrders.length === 0 ? (
                <EmptyState title="No order details for this month" body="The monthly total is based on recorded orders. Order details will appear here when available." icon="package" />
              ) : null}
              {ordersQuery.isSuccess && monthOrders.length > 0 ? (
                <Card style={{ padding: 5 }}>
                  {monthOrders.map((order, index) => {
                    const orderId = first(order, ['id']);
                    const orderNumber = first(order, ['order_number', 'reference', 'id'], 'Order');
                    const destination = first(order, ['destination_port', 'destination'], 'Destination not recorded');
                    const orderDate = first(order, ['created_at', 'placed_at'], 'Date not recorded').slice(0, 10);
                    const total = amount(order, ['total_value_usd', 'total_value']);
                    return (
                      <Pressable
                        key={orderId || `${selectedMonth}-${index}`}
                        testID={`buyer-analytics-order-${orderId || index}`}
                        accessibilityRole="button"
                        accessibilityLabel={`Open order ${orderNumber}, ${orderProductSummary(order)}, ${money(total)}`}
                        disabled={!/^\d+$/.test(orderId)}
                        onPress={() => router.push(`/buyer-order/${orderId}`)}
                        style={({ pressed }) => ({
                          padding: 11,
                          borderBottomWidth: index === monthOrders.length - 1 ? 0 : 1,
                          borderBottomColor: colors.border,
                          opacity: pressed ? 0.72 : 1,
                        })}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '800' }}>{orderNumber}</Text>
                            <Text numberOfLines={2} style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 4 }}>{orderProductSummary(order)}</Text>
                          </View>
                          <Status value={first(order, ['status'], 'Pending')} />
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 9 }}>
                          <Text numberOfLines={1} style={{ flex: 1, color: colors.mutedForeground, fontSize: 9 }}>{destination} · {orderDate}</Text>
                          <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>{money(total)}</Text>
                          <Feather name="arrow-up-right" size={14} color={colors.primary} />
                        </View>
                      </Pressable>
                    );
                  })}
                </Card>
              ) : null}
            </>
          ) : null}
          <Text style={{ color: colors.mutedForeground, fontSize: 10, lineHeight: 16, marginTop: 12 }}>
            Tap a month to see its orders. Open an order for products, quantities, shipment, documents and full status history. Quotations are not counted as completed trade.
          </Text>
        </>
      ) : null}
    </Screen>
  );
}
