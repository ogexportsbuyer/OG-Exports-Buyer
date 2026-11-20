import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import {
  getGetBuyerDashboardQueryKey,
  useGetBuyerDashboard,
} from '@workspace/api-client-react';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { Card, EmptyState, ErrorState, LoadingCard, Screen, Status } from '@/components/InvestorUI';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { amount, first, list, record } from '@/lib/data';

function currency(value: number | null) {
  if (value === null) return '—';
  return `USD ${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

const quickLinks = [
  ['New quotation request', '/buyer-rfq', 'file-plus'],
  ['Orders & quotations', '/(buyer-tabs)/buyer-orders', 'package'],
  ['Shipment tracking', '/buyer-shipments', 'truck'],
  ['Trade finance', '/buyer-trade-finance', 'credit-card'],
] as const;

export default function BuyerOverview() {
  const colors = useColors();
  const { token } = useAuth();
  const query = useGetBuyerDashboard({
    query: { queryKey: getGetBuyerDashboardQueryKey(), enabled: !!token, staleTime: 30_000 },
  });
  const dashboard = record(record(query.data).data);
  const kpis = record(dashboard.kpis);
  const summary = [
    { label: 'Open orders', value: first(kpis, ['orders'], first(dashboard, ['orders_open'], '0')), icon: 'package' as const },
    { label: 'Open RFQs', value: first(kpis, ['rfqs_pending'], '0'), icon: 'file-text' as const },
    { label: 'Active shipments', value: first(kpis, ['shipments_active'], '0'), icon: 'truck' as const },
    { label: 'Total trade value', value: currency(amount(kpis, ['spend_total'])), icon: 'globe' as const },
  ];
  const orderStatuses = list(dashboard.orders_by_status);
  const upcoming = list(dashboard.upcoming_shipments);
  const activity = list(dashboard.recent_activity);
  const checklist = list(dashboard.profile_checklist);

  if (!token) {
    return <BuyerAuthGate title="Executive dashboard" body="Sign in to view your live orders, quotations, shipments, and trade activity." returnTo="/buyer-overview" />;
  }

  return (
    <Screen title="Executive dashboard" subtitle="Your buyer account at a glance" refreshable>
      {query.isLoading ? <LoadingCard label="Loading your trade overview…" lines={3} /> : null}
      {query.isError ? <ErrorState message="Your buyer overview could not be loaded." error={query.error} onRetry={() => void query.refetch()} /> : null}
      {query.isSuccess ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            {summary.map(item => (
              <Card key={item.label} style={{ width: '48%', minHeight: 96, padding: 13, justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: '700' }}>{item.label}</Text>
                  <Feather name={item.icon} size={15} color={colors.primary} />
                </View>
                <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '800', marginTop: 12 }}>{item.value}</Text>
              </Card>
            ))}
          </View>

          <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800', marginBottom: 9 }}>Quick access</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
            {quickLinks.map(([title, href, icon]) => (
              <Pressable key={title} accessibilityRole="button" onPress={() => router.push(href)} style={{ width: '48%' }}>
                <Card style={{ minHeight: 66, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                  <Feather name={icon} size={16} color={colors.primary} />
                  <Text style={{ flex: 1, color: colors.foreground, fontSize: 11, fontWeight: '700' }}>{title}</Text>
                  <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
                </Card>
              </Pressable>
            ))}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
            <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800' }}>Order pipeline</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push('/(buyer-tabs)/buyer-orders')}>
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>View orders</Text>
            </Pressable>
          </View>
          {orderStatuses.length ? (
            <Card style={{ padding: 14, marginBottom: 16 }}>
              {orderStatuses.map((item, index) => (
                <View key={`${first(item, ['status', 'label'], 'status')}-${index}`} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 7 }}>
                  <Text style={{ color: colors.foreground, fontSize: 12 }}>{first(item, ['status', 'label'], 'Order status')}</Text>
                  <Status value={first(item, ['count'], '0')} />
                </View>
              ))}
            </Card>
          ) : <EmptyState title="No order activity yet" body="Accepted quotations and orders will appear here." icon="package" />}

          {upcoming.length ? (
            <>
              <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800', marginBottom: 9, marginTop: 12 }}>Upcoming shipments</Text>
              {upcoming.slice(0, 4).map((shipment, index) => {
                const id = first(shipment, ['id']);
                return (
                  <Pressable key={id || String(index)} accessibilityRole="button" onPress={() => id && router.push(`/buyer-shipment/${id}`)}>
                    <Card style={{ padding: 13, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 12 }}>{first(shipment, ['container_number', 'reference'], 'Shipment')}</Text>
                        <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 4 }}>{first(shipment, ['destination', 'destination_port', 'estimated_delivery'], 'Tracking updates available')}</Text>
                      </View>
                      <Status value={first(shipment, ['status'], 'In progress')} />
                    </Card>
                  </Pressable>
                );
              })}
            </>
          ) : null}

          {checklist.length ? (
            <Pressable accessibilityRole="button" onPress={() => router.push('/buyer-company')} style={{ marginTop: 10 }}>
              <Card style={{ padding: 15, borderColor: colors.accent }}>
                <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '800' }}>Company profile: {first(dashboard, ['profile_completion'], '0')}% complete</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 17, marginTop: 5 }}>
                  Finish your company and verification details to help the trade desk process requests.
                </Text>
              </Card>
            </Pressable>
          ) : null}

          {activity.length ? (
            <>
              <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800', marginBottom: 9, marginTop: 18 }}>Recent activity</Text>
              {activity.slice(0, 5).map((item, index) => (
                <Card key={first(item, ['id'], String(index))} style={{ padding: 12, marginBottom: 7 }}>
                  <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '700' }}>{first(item, ['title', 'label', 'description'], 'Account update')}</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 5 }}>{first(item, ['created_at', 'date'], '')}</Text>
                </Card>
              ))}
            </>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}
