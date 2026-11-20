import React from 'react';
import { View } from 'react-native';
import { getGetBuyerAnalyticsQueryKey, useGetBuyerAnalytics } from '@workspace/api-client-react';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { Card, EmptyState, ErrorState, LoadingCard, Screen } from '@/components/InvestorUI';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { amount, first, list, record } from '@/lib/data';

function money(value: number | null) {
  return value === null ? '—' : `USD ${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export default function BuyerAnalytics() {
  const colors = useColors();
  const { token } = useAuth();
  const query = useGetBuyerAnalytics({
    query: { queryKey: getGetBuyerAnalyticsQueryKey(), enabled: !!token, staleTime: 60_000 },
  });
  const analytics = record(record(query.data).data);
  const monthly = list(analytics.spend_by_month).slice(-12);
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
              {monthly.map((month, index) => (
                <View key={first(month, ['month'], String(index))} style={{ minHeight: 49, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: index === monthly.length - 1 ? 0 : 1, borderBottomColor: colors.border }}>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{first(month, ['month'], 'Month')}</Text>
                  <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '700' }}>{money(amount(month, ['total']))}</Text>
                </View>
              ))}
            </Card>
          ) : (
            <EmptyState title="No trade value recorded" body="Completed order values will be summarized here." icon="bar-chart-2" />
          )}
          <Text style={{ color: colors.mutedForeground, fontSize: 10, lineHeight: 16, marginTop: 12 }}>
            Values reflect orders recorded in your account; quotations are not counted as completed trade.
          </Text>
        </>
      ) : null}
    </Screen>
  );
}
