import React from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, router, useSegments } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import {
  getGetBuyerDashboardQueryKey,
  getGetSharedNotificationsQueryKey,
  useGetBuyerDashboard,
  useGetSharedNotifications,
} from '@workspace/api-client-react';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { BuyerOrdersByStatusCard, BuyerSpendTrendCard } from '@/components/BuyerDashboardCharts';
import { Action, Card, EmptyState, ErrorState, LoadingCard, Screen, Status } from '@/components/InvestorUI';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { amount, first, list, money, record } from '@/lib/data';
import {
  buyerDashboardAlertTime,
  buyerDashboardErrorMessage,
  recentBuyerApprovalNotifications,
  unwrapBuyerDashboardResponse,
} from '@/lib/buyer-dashboard-data';

const quickActions = [
  { label: 'New RFQ', detail: 'Request a trade quote', route: '/buyer-rfq?mode=new', icon: 'file-plus' as const },
  { label: 'Track shipment', detail: 'Follow active cargo', route: '/buyer-shipments', icon: 'truck' as const },
  { label: 'View documents', detail: 'Review trade files', route: '/buyer-documents', icon: 'file-text' as const },
  { label: 'Request quote', detail: 'Browse export products', route: '/(buyer-tabs)/buyer-products', icon: 'search' as const },
  { label: 'Orders', detail: 'Track order progress', route: '/buyer-orders', icon: 'shopping-bag' as const },
  { label: 'Quotations', detail: 'Review supplier quotes', route: '/buyer-orders?view=quotations', icon: 'clipboard' as const },
  { label: 'Trade Finance', detail: 'Review payment terms', route: '/buyer-trade-finance', icon: 'credit-card' as const },
] as const;
const primaryQuickActions = [
  quickActions[0],
  quickActions[1],
  quickActions[3],
  quickActions[4],
] as const;
const supportingQuickActions = [
  quickActions[2],
  quickActions[5],
  quickActions[6],
] as const;

const alertRoutes: Record<string, string> = {
  shipment: '/buyer-shipments',
  rfq: '/buyer-rfq',
  quotation: '/buyer-orders?view=quotations',
  order: '/buyer-orders',
};

const activityRoutes: Record<string, string> = {
  rfq: '/buyer-rfq',
  quotation: '/buyer-orders?view=quotations',
  quotation_accepted: '/buyer-orders?view=quotations',
  order: '/buyer-orders',
  order_delivered: '/buyer-orders',
  shipment: '/buyer-shipments',
  document: '/buyer-documents',
};

function navigateTo(route: string) {
  router.push(route as never);
}

export default function BuyerOverview() {
  const segments = useSegments();
  const isDashboardTab = segments[0] === '(buyer-tabs)' && segments[1] === 'dashboard';
  if (!isDashboardTab) return <Redirect href="/(buyer-tabs)/dashboard" />;
  return <BuyerOverviewContent />;
}

function BuyerOverviewContent() {
  const colors = useColors();
  const { token } = useAuth();
  const query = useGetBuyerDashboard({
    query: {
      queryKey: getGetBuyerDashboardQueryKey(),
      enabled: !!token,
      staleTime: 30_000,
      retry: 1,
      retryDelay: 1_000,
      refetchOnReconnect: true,
    },
  });
  const notificationsQuery = useGetSharedNotifications({
    query: {
      queryKey: getGetSharedNotificationsQueryKey(),
      enabled: !!token,
      staleTime: 30_000,
      retry: 1,
      retryDelay: 1_000,
      refetchOnReconnect: true,
    },
  });
  const dashboard = record(unwrapBuyerDashboardResponse(query.data));
  const kpis = record(dashboard.kpis);
  const tradeValueSummary = record(dashboard.trade_value_summary);
  const currencyCode = first(dashboard, ['display_currency'], 'USD');
  const tradeCurrency = first(tradeValueSummary, ['currency'], 'USD');
  const totalPurchaseValue = amount(tradeValueSummary, ['total_purchase_value_usd']);
  const completedTradeValue = amount(tradeValueSummary, ['completed_trade_value_usd']);
  const processingTradeValue = amount(tradeValueSummary, ['processing_trade_value_usd']);
  const discountSavings = amount(tradeValueSummary, ['discount_savings_usd']);
  const discountSavingsPercentage = amount(tradeValueSummary, ['discount_savings_percentage']);
  const displayDiscountPercentage = discountSavingsPercentage ?? (discountSavings === 0 ? 0 : null);
  const orderStatuses = list(dashboard.orders_by_status);
  const upcoming = list(dashboard.upcoming_shipments);
  const activity = list(dashboard.recent_activity);
  const checklist = list(dashboard.profile_checklist);
  const alerts = list(dashboard.alerts);
  const favourites = list(dashboard.favourites);
  const unreadNotifications = recentBuyerApprovalNotifications(notificationsQuery.data);
  const completion = amount(dashboard, ['profile_completion']);
  const trustScore = amount(dashboard, ['trust_score']);
  const trustTier = first(dashboard, ['trust_tier']);
  const spendYoY = amount(dashboard, ['spend_yoy_pct']);
  const spendYearOverYear = spendYoY === null ? '—' : `${spendYoY > 0 ? '+' : ''}${spendYoY}% YoY`;
  const activityMetricCards = [
    {
      label: 'Total orders',
      value: first(kpis, ['orders'], first(dashboard, ['orders'], '—')),
      detail: first(kpis, ['orders_change']),
      trend: first(kpis, ['orders_trend']),
      up: kpis.orders_trend_up !== false,
      icon: 'shopping-bag' as const,
      tone: colors.primary,
      route: '/buyer-orders',
    },
    {
      label: 'Active shipments',
      value: first(kpis, ['shipments_active'], '—'),
      detail: first(kpis, ['shipments_change']),
      trend: first(kpis, ['shipments_trend']),
      up: kpis.shipments_trend_up !== false,
      icon: 'truck' as const,
      tone: colors.primary,
      route: '/buyer-shipments',
    },
    {
      label: 'Pending RFQs',
      value: first(kpis, ['rfqs_pending'], '—'),
      detail: first(kpis, ['rfqs_change']),
      trend: first(kpis, ['rfqs_trend']),
      up: kpis.rfqs_trend_up !== false,
      icon: 'file-text' as const,
      tone: colors.accentSurface,
      route: '/buyer-orders?view=rfqs',
    },
  ];

  if (!token) {
    return <BuyerAuthGate title="Trade overview" body="Sign in to view your live orders, quotations, shipments, and trade activity." returnTo="/(buyer-tabs)/dashboard" />;
  }

  return (
    <Screen title="Trade overview" subtitle="Orders, shipments and quotes at a glance" refreshable>
      {query.isLoading ? <LoadingCard label="Loading your trade overview…" lines={3} /> : null}
      {query.isError ? <ErrorState message={buyerDashboardErrorMessage(query.error)} error={query.error} onRetry={() => void query.refetch()} /> : null}
      {query.isSuccess ? (
        <>
          <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800', marginBottom: 9, marginTop: 4 }}>Purchase overview</Text>
          <Card testID="buyer-dashboard-purchase-overview" style={{ padding: 15, marginBottom: 7, backgroundColor: colors.primary, borderColor: colors.primary }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'rgba(255,255,255,0.74)', fontSize: 9, fontWeight: '800', letterSpacing: 0.7 }}>TOTAL PURCHASE VALUE</Text>
                <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.primaryForeground, fontSize: 24, fontWeight: '800', marginTop: 5 }}>
                  {totalPurchaseValue === null ? '—' : money(totalPurchaseValue, tradeCurrency, { preserveSource: true })}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 9, marginTop: 3 }}>Across non-cancelled orders</Text>
              </View>
              <View style={{ width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' }}>
                <Feather name="briefcase" size={17} color={colors.accentSurface} />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              <View style={{ flex: 1, minWidth: 0, padding: 10, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Feather name="check-circle" size={12} color={colors.accentSurface} />
                  <Text style={{ color: 'rgba(255,255,255,0.76)', fontSize: 9, fontWeight: '700' }}>Completed</Text>
                </View>
                <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.primaryForeground, fontSize: 13, fontWeight: '800', marginTop: 5 }}>
                  {completedTradeValue === null ? '—' : money(completedTradeValue, tradeCurrency, { preserveSource: true })}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 0, padding: 10, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Feather name="clock" size={12} color={colors.accentSurface} />
                  <Text style={{ color: 'rgba(255,255,255,0.76)', fontSize: 9, fontWeight: '700' }}>In processing</Text>
                </View>
                <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.primaryForeground, fontSize: 13, fontWeight: '800', marginTop: 5 }}>
                  {processingTradeValue === null ? '—' : money(processingTradeValue, tradeCurrency, { preserveSource: true })}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.16)', marginTop: 12, paddingTop: 11 }}>
              <Feather name="tag" size={14} color={colors.accentSurface} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.primaryForeground, fontSize: 10, fontWeight: '800' }}>Discount saved</Text>
                <Text style={{ color: 'rgba(255,255,255,0.68)', fontSize: 9, marginTop: 1 }}>Compared with product-card FOB price</Text>
              </View>
              <View style={{ alignItems: 'flex-end', flexShrink: 0, maxWidth: 132 }}>
                <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.accentSurface, fontSize: 13, fontWeight: '800' }}>
                  {displayDiscountPercentage === null ? '—' : `${displayDiscountPercentage.toFixed(2)}%`}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.76)', fontSize: 9, fontWeight: '700', marginTop: 2 }}>
                  {discountSavings === null ? '—' : money(discountSavings, tradeCurrency, { preserveSource: true })}
                </Text>
              </View>
            </View>
          </Card>
          <Text style={{ color: colors.mutedForeground, fontSize: 9, lineHeight: 14, marginBottom: 12 }}>
            Discounts compare confirmed order prices with saved product-card FOB prices; cancelled orders are excluded.
          </Text>

          <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800', marginBottom: 9 }}>Order snapshot</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 7, marginBottom: 12 }}>
            {activityMetricCards.map(metric => (
              <Pressable
                key={metric.label}
                testID={`buyer-dashboard-snapshot-${metric.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                accessibilityRole="button"
                accessibilityLabel={`${metric.label}, ${metric.value}`}
                onPress={() => navigateTo(metric.route)}
                style={({ pressed }) => ({ flex: 1, minWidth: 0, opacity: pressed ? 0.84 : 1 })}
              >
                <Card style={{ minHeight: 103, padding: 9, marginBottom: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 3 }}>
                    <View style={{ width: 27, height: 27, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: metric.tone === colors.accentSurface ? colors.accentSurface : colors.lightGreen }}>
                      <Feather name={metric.icon} size={13} color={metric.tone === colors.accentSurface ? colors.accentForeground : metric.tone} />
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                      {metric.trend ? <Feather name={metric.up ? 'trending-up' : 'trending-down'} size={11} color={metric.up ? colors.primary : colors.destructive} /> : null}
                      <Feather name="chevron-right" size={13} color={colors.mutedForeground} />
                    </View>
                  </View>
                  <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.foreground, fontSize: 17, fontWeight: '800', marginTop: 9 }}>{metric.value}</Text>
                  <Text numberOfLines={2} style={{ color: colors.mutedForeground, fontSize: 9, lineHeight: 12, marginTop: 2 }}>{metric.label}</Text>
                  {metric.detail ? <Text numberOfLines={1} style={{ color: colors.mutedForeground, fontSize: 8, marginTop: 3 }}>{metric.detail}</Text> : null}
                </Card>
              </Pressable>
            ))}
          </View>

          <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800', marginBottom: 9, marginTop: 2 }}>Quick actions</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 2 }}>
            {primaryQuickActions.map(action => (
              <Pressable
                key={action.label}
                testID={`buyer-dashboard-action-${action.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                accessibilityRole="button"
                accessibilityLabel={`${action.label}. ${action.detail}`}
                onPress={() => navigateTo(action.route)}
                style={({ pressed }) => ({ width: '48%', marginBottom: 8, opacity: pressed ? 0.86 : 1 })}
              >
                <Card style={{ minHeight: 76, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lightGreen }}>
                    <Feather name={action.icon} size={15} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ color: colors.foreground, fontSize: 10, fontWeight: '800' }}>{action.label}</Text>
                    <Text numberOfLines={2} style={{ color: colors.mutedForeground, fontSize: 8, lineHeight: 11, marginTop: 3 }}>{action.detail}</Text>
                  </View>
                  <Feather name="chevron-right" size={13} color={colors.mutedForeground} />
                </Card>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 7, marginBottom: 13 }}>
            {supportingQuickActions.map(action => (
              <Pressable
                key={action.label}
                testID={`buyer-dashboard-support-action-${action.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                accessibilityRole="button"
                accessibilityLabel={`${action.label}. ${action.detail}`}
                onPress={() => navigateTo(action.route)}
                style={({ pressed }) => ({ flex: 1, minWidth: 0, opacity: pressed ? 0.82 : 1 })}
              >
                <Card style={{ minHeight: 46, paddingHorizontal: 5, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <Feather name={action.icon} size={12} color={colors.primary} />
                  <Text numberOfLines={1} style={{ color: colors.foreground, fontSize: 8, fontWeight: '700' }}>{action.label}</Text>
                </Card>
              </Pressable>
            ))}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9, marginTop: 2 }}>
            <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800' }}>Trade activity</Text>
            <Pressable testID="buyer-dashboard-activity-view-all" accessibilityRole="button" accessibilityLabel="View all trade activity" onPress={() => router.push('/buyer-activity')} hitSlop={8}>
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>View all</Text>
            </Pressable>
          </View>
          {activity.length ? activity.slice(0, 4).map((item, index) => {
            const type = first(item, ['type'], 'order');
            const icon = type === 'rfq' ? 'file-plus' : type.includes('quotation') ? 'file-text' : type === 'shipment' ? 'truck' : type === 'document' ? 'folder' : 'shopping-bag';
            return (
              <Pressable
                key={`${type}-${first(item, ['at'], String(index))}`}
                testID={`buyer-dashboard-activity-${type}-${index}`}
                accessibilityRole="button"
                accessibilityLabel={`${first(item, ['title'], 'Trade update')}. ${first(item, ['desc'], '')}. ${first(item, ['time'], '')}`}
                onPress={() => navigateTo(activityRoutes[type] || '/buyer-orders')}
                style={({ pressed }) => ({ opacity: pressed ? 0.84 : 1 })}
              >
                <Card style={{ padding: 11, marginBottom: 7, flexDirection: 'row', alignItems: 'flex-start', gap: 9 }}>
                  <View style={{ width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lightGreen }}>
                    <Feather name={icon} size={14} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontSize: 10, fontWeight: '800' }}>{first(item, ['title'], 'Trade update')}</Text>
                    <Text numberOfLines={2} style={{ color: colors.mutedForeground, fontSize: 9, lineHeight: 13, marginTop: 2 }}>{first(item, ['desc'], '')}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 8, marginTop: 4 }}>{first(item, ['time'], '')}</Text>
                  </View>
                  <Feather name="chevron-right" size={13} color={colors.mutedForeground} />
                </Card>
              </Pressable>
            );
          }) : <EmptyState title="No recent trade activity" body="RFQs, quotations, orders and shipments will appear here." icon="activity" />}

          <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800', marginBottom: 9, marginTop: 5 }}>Market alerts</Text>
          {alerts.length ? alerts.slice(0, 3).map((alert, index) => {
            const type = first(alert, ['type'], 'order');
            return (
              <Pressable key={`${type}-${index}`} accessibilityRole="button" onPress={() => navigateTo(alertRoutes[type] || '/buyer-notifications')}>
                <Card style={{ padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10, borderColor: colors.accent }}>
                  <View style={{ width: 33, height: 33, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary }}>
                    <Feather name={type === 'shipment' ? 'truck' : type === 'rfq' ? 'file-plus' : 'bell'} size={15} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    {first(alert, ['badge']) ? <Text style={{ color: colors.accentText, fontSize: 9, fontWeight: '800', marginBottom: 2 }}>{first(alert, ['badge'])}</Text> : null}
                    <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: '700' }}>{first(alert, ['title'], 'Trade update')}</Text>
                  </View>
                  <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
                </Card>
              </Pressable>
            );
          }) : (
            <Card style={{ padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 33, height: 33, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary }}>
                <Feather name="bell" size={15} color={colors.mutedForeground} />
              </View>
              <Text style={{ flex: 1, color: colors.mutedForeground, fontSize: 11, lineHeight: 16 }}>No active alerts — your buyer account is up to date.</Text>
            </Card>
          )}

          <BuyerSpendTrendCard points={dashboard.spend_by_month} currency={currencyCode} yearOverYear={spendYearOverYear} />
          <BuyerOrdersByStatusCard statuses={orderStatuses} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9, marginTop: 3 }}>
            <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800' }}>Upcoming deliveries</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push('/buyer-shipments')}>
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>View all</Text>
            </Pressable>
          </View>
          {upcoming.length ? upcoming.slice(0, 3).map((shipment, index) => {
            const progress = amount(shipment, ['pct']);
            return (
              <Pressable key={first(shipment, ['ref'], String(index))} accessibilityRole="button" onPress={() => router.push('/buyer-shipments')}>
                <Card style={{ padding: 13, marginBottom: 9 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={{ color: colors.foreground, fontSize: 12, fontWeight: '800' }}>{first(shipment, ['product'], 'Shipment')}</Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 3 }}>{first(shipment, ['ref'], 'Shipment reference')}</Text>
                    </View>
                    <Status value={first(shipment, ['status'], 'In progress')} />
                  </View>
                  <Text style={{ color: colors.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: 8 }}>
                    {first(shipment, ['origin'], '—')}  →  {first(shipment, ['destination'], '—')}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, marginTop: 7 }}>
                    <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>Qty: {first(shipment, ['qty'], '—')}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>ETA: {first(shipment, ['eta'], '—')}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>Vessel: {first(shipment, ['vessel'], '—')}</Text>
                  </View>
                  {progress === null ? (
                    <Text style={{ color: colors.mutedForeground, fontSize: 9, marginTop: 9 }}>Shipment progress unavailable.</Text>
                  ) : (
                    <View style={{ height: 5, borderRadius: 4, overflow: 'hidden', backgroundColor: colors.secondary, marginTop: 10 }}>
                      <View style={{ height: '100%', width: `${Math.min(100, Math.max(0, progress))}%`, borderRadius: 4, backgroundColor: colors.primary }} />
                    </View>
                  )}
                </Card>
              </Pressable>
            );
          }) : <EmptyState title="No upcoming deliveries" body="Shipment updates will appear here when an order is dispatched." icon="truck" />}

          {(notificationsQuery.isLoading || notificationsQuery.isError || unreadNotifications.length > 0) ? <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9, marginTop: 5 }}>
              <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800' }}>Recent alerts</Text>
              <Pressable accessibilityRole="button" onPress={() => router.push('/buyer-notifications')}>
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>View all</Text>
              </Pressable>
            </View>
            {notificationsQuery.isLoading ? <LoadingCard label="Checking recent alerts…" lines={2} /> : null}
            {notificationsQuery.isError ? (
              <Card style={{ padding: 12, marginBottom: 10 }}>
                <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Recent alerts are unavailable right now.</Text>
                <View style={{ marginTop: 10 }}>
                  <Action title="Retry recent alerts" icon="refresh-cw" secondary testID="buyer-dashboard-alerts-retry" onPress={() => void notificationsQuery.refetch()} />
                </View>
              </Card>
            ) : null}
            {unreadNotifications.map((item, index) => (
              <Pressable key={first(item, ['id'], String(index))} accessibilityRole="button" onPress={() => router.push('/buyer-notifications')}>
                <Card style={{ padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary }}>
                    <Feather name="bell" size={14} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ color: colors.foreground, fontSize: 11, fontWeight: '800' }}>{first(item, ['title', 'subject'], 'Account update')}</Text>
                    <Text numberOfLines={1} style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 3 }}>{first(item, ['message', 'body', 'description'], 'Open notifications to review this update.')}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 9, marginTop: 4 }}>{buyerDashboardAlertTime(first(item, ['created_at', 'sent_at']))}</Text>
                  </View>
                  <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
                </Card>
              </Pressable>
            ))}
          </> : null}

          <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800', marginBottom: 9, marginTop: 5 }}>Company profile completion</Text>
          <Card style={{ padding: 15, marginBottom: 12, borderColor: colors.accent }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '800' }}>Verification checklist</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 3 }}>Complete your company details for smoother trade processing.</Text>
              </View>
              <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '900' }}>{completion === null ? '—' : `${completion}%`}</Text>
            </View>
            {completion === null ? (
              <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 12 }}>Profile completion is not available yet.</Text>
            ) : (
              <View style={{ height: 7, borderRadius: 5, overflow: 'hidden', backgroundColor: colors.secondary, marginTop: 12 }}>
                <View style={{ height: '100%', width: `${Math.min(100, Math.max(0, completion))}%`, backgroundColor: colors.primary }} />
              </View>
            )}
            {checklist.map((item, index) => {
              const done = item.done === true;
              return (
                <View key={`${first(item, ['label'], 'Checklist item')}-${index}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10 }}>
                  <Feather name={done ? 'check-circle' : 'clock'} size={14} color={done ? colors.primary : colors.accent} />
                  <Text style={{ flex: 1, color: done ? colors.foreground : colors.mutedForeground, fontSize: 11 }}>{first(item, ['label'], 'Company detail')}</Text>
                  <Text style={{ color: done ? colors.primary : colors.mutedForeground, fontSize: 9, fontWeight: '800' }}>{done ? 'Complete' : 'To do'}</Text>
                </View>
              );
            })}
            <View style={{ marginTop: 13 }}>
              <Action title="Complete company profile" icon="arrow-up-right" secondary onPress={() => router.push('/buyer-company')} />
            </View>
          </Card>

          <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800', marginBottom: 9 }}>Trust score</Text>
          <Card style={{ padding: 15, marginBottom: 12, borderColor: colors.accent }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary }}>
                  <Feather name="shield" size={16} color={colors.primary} />
                </View>
                <View>
                  <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '800' }}>OG Exports buyer rating</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 2 }}>{trustTier || 'Tier not assigned'}</Text>
                </View>
              </View>
              <Text style={{ color: colors.foreground, fontSize: 19, fontWeight: '900' }}>{trustScore === null ? '—' : trustScore}<Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: '600' }}> / 1000</Text></Text>
            </View>
            {trustScore === null ? (
              <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 12 }}>Trust score is not available yet.</Text>
            ) : (
              <>
                <View style={{ height: 7, borderRadius: 5, overflow: 'hidden', backgroundColor: colors.secondary, marginTop: 13 }}>
                  <View style={{ height: '100%', width: `${Math.min(100, Math.max(0, trustScore) / 10)}%`, backgroundColor: colors.accentSurface }} />
                </View>
                <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 7 }}>Based on the trust score provided for your buyer account.</Text>
              </>
            )}
          </Card>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9, marginTop: 4 }}>
            <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800' }}>Favourites</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push('/(buyer-tabs)/buyer-products')}>
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>Browse products</Text>
            </Pressable>
          </View>
          {favourites.length ? favourites.slice(0, 5).map((product, index) => (
            <Card key={`${first(product, ['name'], String(index))}-${index}`} style={{ padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lightGreen }}>
                <Text style={{ fontSize: 17 }}>{first(product, ['icon'], '✦')}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ color: colors.foreground, fontSize: 11, fontWeight: '800' }}>{first(product, ['name'], 'Saved product')}</Text>
                <Text numberOfLines={1} style={{ color: colors.mutedForeground, fontSize: 9, marginTop: 3 }}>{[first(product, ['grade']), first(product, ['origin'])].filter(Boolean).join(' · ') || 'Product details available in catalogue'}</Text>
              </View>
              <Pressable accessibilityRole="button" onPress={() => {
                const productId = first(product, ['id']);
                router.push({ pathname: '/buyer-rfq', params: { mode: 'new', ...(productId ? { product_id: productId } : {}) } });
              }}>
                <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '800' }}>RFQ</Text>
              </Pressable>
            </Card>
          )) : (
            <Card style={{ padding: 14, marginBottom: 10 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 16 }}>No favourites have been added yet. Browse the product catalogue to explore available products.</Text>
            </Card>
          )}

        </>
      ) : null}
    </Screen>
  );
}
