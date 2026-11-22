import React, { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { Redirect, router, useSegments } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetBuyerDashboardQueryKey,
  getGetSharedNotificationsQueryKey,
  getGetInvestorMeQueryKey,
  useGetBuyerDashboard,
  useGetSharedNotifications,
  useUpdateInvestorMe,
} from '@workspace/api-client-react';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { BuyerOrdersByStatusCard, BuyerSpendTrendCard } from '@/components/BuyerDashboardCharts';
import { Action, Card, EmptyState, ErrorState, LoadingCard, Screen, Status } from '@/components/InvestorUI';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { amount, first, list, messageOf, money, record, type Json } from '@/lib/data';
import { uploadInvestorFile } from '@/lib/file-upload';

const quickActions = [
  { label: 'New RFQ', detail: 'Request a trade quote', route: '/buyer-rfq?mode=new', icon: 'file-plus' as const },
  { label: 'Track shipment', detail: 'Follow active cargo', route: '/buyer-shipments', icon: 'truck' as const },
  { label: 'View documents', detail: 'Review trade files', route: '/buyer-documents', icon: 'file-text' as const },
  { label: 'Request quote', detail: 'Browse export products', route: '/(buyer-tabs)/buyer-products', icon: 'search' as const },
] as const;
const heroActions = [
  quickActions[0],
  { label: 'Pay invoice', detail: 'Review payment terms', route: '/buyer-trade-finance', icon: 'credit-card' as const },
] as const;

const alertRoutes: Record<string, string> = {
  shipment: '/buyer-shipments',
  rfq: '/buyer-rfq',
  quotation: '/(buyer-tabs)/buyer-orders',
  order: '/(buyer-tabs)/buyer-orders',
};

const activityRoutes: Record<string, string> = {
  rfq: '/buyer-rfq',
  quotation: '/(buyer-tabs)/buyer-orders',
  quotation_accepted: '/(buyer-tabs)/buyer-orders',
  order: '/(buyer-tabs)/buyer-orders',
  order_delivered: '/(buyer-tabs)/buyer-orders',
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
  const { token, user, apiOrigin, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const query = useGetBuyerDashboard({
    query: { queryKey: getGetBuyerDashboardQueryKey(), enabled: !!token, staleTime: 30_000 },
  });
  const notificationsQuery = useGetSharedNotifications({
    query: { queryKey: getGetSharedNotificationsQueryKey(), enabled: !!token, staleTime: 30_000 },
  });
  const updateProfile = useUpdateInvestorMe();
  const dashboard = record(record(query.data).data);
  const kpis = record(dashboard.kpis);
  const currencyCode = first(dashboard, ['display_currency'], 'USD');
  const displayName = first(record(user), ['name', 'display_name'], 'Valued Buyer');
  const userProfile = record(record(user).profile);
  const avatarPath = first(record(user), ['avatar_url'], first(userProfile, ['avatar_url']));
  const avatarUri = avatarPath
    ? /^https?:\/\//i.test(avatarPath)
      ? avatarPath
      : `${apiOrigin.replace(/\/+$/, '')}/${avatarPath.replace(/^\/+/, '')}`
    : '';
  const spendTotal = amount(kpis, ['spend_total']);
  const orderStatuses = list(dashboard.orders_by_status);
  const upcoming = list(dashboard.upcoming_shipments);
  const activity = list(dashboard.recent_activity);
  const checklist = list(dashboard.profile_checklist);
  const alerts = list(dashboard.alerts);
  const favourites = list(dashboard.favourites);
  const notifications = list(record(notificationsQuery.data).data);
  const unreadNotifications = notifications.filter(item => !item.read_at && !item.is_read && !item.read).slice(0, 3);
  const completion = amount(dashboard, ['profile_completion']);
  const trustScore = amount(dashboard, ['trust_score']);
  const trustTier = first(dashboard, ['trust_tier']);
  const memberSince = first(dashboard, ['member_since']);
  const spendYoY = amount(dashboard, ['spend_yoy_pct']);
  const spendYearOverYear = spendYoY === null ? '—' : `${spendYoY > 0 ? '+' : ''}${spendYoY}% YoY`;
  const metricCards = [
    {
      label: 'Total orders',
      value: first(kpis, ['orders'], first(dashboard, ['orders'], '—')),
      detail: first(kpis, ['orders_change']),
      trend: first(kpis, ['orders_trend']),
      up: kpis.orders_trend_up !== false,
      icon: 'shopping-bag' as const,
      tone: colors.primary,
    },
    {
      label: 'Purchase value',
      value: spendTotal === null ? '—' : money(spendTotal, currencyCode, { preserveSource: true }),
      detail: first(kpis, ['spend_change']),
      trend: first(kpis, ['spend_trend']),
      up: kpis.spend_trend_up !== false,
      icon: 'dollar-sign' as const,
      tone: colors.accent,
    },
    {
      label: 'Active shipments',
      value: first(kpis, ['shipments_active'], '—'),
      detail: first(kpis, ['shipments_change']),
      trend: first(kpis, ['shipments_trend']),
      up: kpis.shipments_trend_up !== false,
      icon: 'truck' as const,
      tone: colors.primary,
    },
    {
      label: 'Pending RFQs',
      value: first(kpis, ['rfqs_pending'], '—'),
      detail: first(kpis, ['rfqs_change']),
      trend: first(kpis, ['rfqs_trend']),
      up: kpis.rfqs_trend_up !== false,
      icon: 'file-text' as const,
      tone: colors.accent,
    },
  ];

  async function chooseAvatar() {
    setAvatarError('');
    setAvatarMessage('');
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setAvatarError('Allow photo library access to choose a profile image.');
        return;
      }
      const selection = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.82,
      });
      if (selection.canceled || !selection.assets[0]) return;
      const asset = selection.assets[0];
      if (!apiOrigin) throw new Error('The buyer service is not configured for this app.');
      setAvatarBusy(true);
      const mimeType = asset.mimeType || 'image/jpeg';
      const extension = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
      const fileName = asset.fileName || `buyer-avatar-${Date.now()}.${extension}`;
      const path = await uploadInvestorFile(asset.uri, fileName, mimeType, 'avatars', apiOrigin);
      const response = record(await updateProfile.mutateAsync({
        data: { avatar_url: path } as unknown as Parameters<typeof updateProfile.mutateAsync>[0]['data'],
      }));
      const savedUser = record(response.user ?? response.data);
      const currentUser = record(user);
      const nextUser = {
        ...currentUser,
        ...savedUser,
        avatar_url: path,
        profile: { ...record(currentUser.profile), ...record(savedUser.profile), avatar_url: path },
      };
      await updateUser(nextUser as Json);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetBuyerDashboardQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetInvestorMeQueryKey() }),
      ]);
      setAvatarMessage('Profile photo updated.');
    } catch (error) {
      setAvatarError(messageOf(error));
    } finally {
      setAvatarBusy(false);
    }
  }

  if (!token) {
    return <BuyerAuthGate title="Executive dashboard" body="Sign in to view your live orders, quotations, shipments, and trade activity." returnTo="/(buyer-tabs)/dashboard" />;
  }

  return (
    <Screen title="Executive dashboard" subtitle="Your buyer account at a glance" refreshable>
      {query.isLoading ? <LoadingCard label="Loading your trade overview…" lines={3} /> : null}
      {query.isError ? <ErrorState message="Your buyer overview could not be loaded." error={query.error} onRetry={() => void query.refetch()} /> : null}
      {query.isSuccess ? (
        <>
          <Card style={{ padding: 16, marginBottom: 14, backgroundColor: colors.primary, borderColor: colors.primary }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable accessibilityRole="button" accessibilityLabel={avatarBusy ? 'Uploading profile photo' : 'Change profile photo'} onPress={() => void chooseAvatar()} disabled={avatarBusy}>
                <View style={{ width: 54, height: 54, borderRadius: 27, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderWidth: 2, borderColor: colors.accent }}>
                  {avatarUri ? <Image source={{ uri: avatarUri }} style={{ width: '100%', height: '100%' }} /> : <Text style={{ color: colors.primary, fontSize: 20, fontWeight: '800' }}>{displayName.slice(0, 1).toUpperCase()}</Text>}
                  <View style={{ position: 'absolute', right: 0, bottom: 0, width: 19, height: 19, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }}>
                    <Feather name={avatarBusy ? 'loader' : 'camera'} size={10} color={colors.primaryForeground} />
                  </View>
                </View>
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '700' }}>Good day,</Text>
                <Text numberOfLines={1} style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginTop: 3 }}>{displayName}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7, marginTop: 8 }}>
                  <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.14)' }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '800' }}>{first(dashboard, ['kyc_status'], 'KYC unverified')}</Text>
                  </View>
                  {trustTier ? <Text style={{ color: colors.accent, fontSize: 9, fontWeight: '800' }}>{trustTier} buyer</Text> : null}
                  {memberSince ? <Text style={{ color: 'rgba(255,255,255,0.68)', fontSize: 9 }}>Member since {memberSince}</Text> : null}
                </View>
              </View>
            </View>
            {avatarError ? <Text accessibilityRole="alert" style={{ color: '#FFE1DC', fontSize: 11, lineHeight: 16, marginTop: 10 }}>{avatarError}</Text> : null}
            {avatarMessage ? <Text accessibilityLiveRegion="polite" style={{ color: '#FFFFFF', fontSize: 11, marginTop: 9 }}>{avatarMessage}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 15 }}>
              {heroActions.map(action => (
                <Pressable key={action.label} accessibilityRole="button" onPress={() => navigateTo(action.route)} style={{ flex: 1, minHeight: 44, borderRadius: 12, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: action.label === 'New RFQ' ? colors.accent : 'rgba(255,255,255,0.14)' }}>
                  <Feather name={action.icon} size={14} color={action.label === 'New RFQ' ? colors.primaryForeground : '#FFFFFF'} />
                  <Text numberOfLines={1} style={{ color: action.label === 'New RFQ' ? colors.primaryForeground : '#FFFFFF', fontSize: 10, fontWeight: '800' }}>{action.label}</Text>
                </Pressable>
              ))}
            </View>
          </Card>

          <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800', marginBottom: 9 }}>Quick actions</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 15 }}>
            {quickActions.map(action => (
              <Pressable key={action.label} accessibilityRole="button" onPress={() => navigateTo(action.route)} style={{ width: '48%', marginBottom: 9 }}>
                <Card style={{ minHeight: 86, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lightGreen }}>
                    <Feather name={action.icon} size={15} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: '800' }}>{action.label}</Text>
                    <Text numberOfLines={2} style={{ color: colors.mutedForeground, fontSize: 9, lineHeight: 13, marginTop: 3 }}>{action.detail}</Text>
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>

          <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800', marginBottom: 9 }}>Trade summary</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 6 }}>
            {metricCards.map(metric => (
              <Card key={metric.label} style={{ width: '48%', minHeight: 116, padding: 12, marginBottom: 9 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5 }}>
                  <View style={{ width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: metric.tone === colors.accent ? colors.secondary : colors.lightGreen }}>
                    <Feather name={metric.icon} size={14} color={metric.tone} />
                  </View>
                  {metric.trend ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Feather name={metric.up ? 'trending-up' : 'trending-down'} size={11} color={metric.up ? colors.primary : colors.destructive} />
                    <Text style={{ color: metric.up ? colors.primary : colors.destructive, fontSize: 9, fontWeight: '800' }}>{metric.trend}</Text>
                  </View> : null}
                </View>
                <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.foreground, fontSize: 16, fontWeight: '800', marginTop: 10 }}>{metric.value}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 2 }}>{metric.label}</Text>
                {metric.detail ? <Text numberOfLines={1} style={{ color: colors.mutedForeground, fontSize: 9, marginTop: 3 }}>{metric.detail}</Text> : null}
              </Card>
            ))}
          </View>

          {alerts.length ? (
            <>
              <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800', marginBottom: 9, marginTop: 5 }}>Trade alerts</Text>
              {alerts.slice(0, 3).map((alert, index) => {
                const type = first(alert, ['type'], 'order');
                return (
                  <Pressable key={`${type}-${index}`} accessibilityRole="button" onPress={() => navigateTo(alertRoutes[type] || '/buyer-notifications')}>
                    <Card style={{ padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10, borderColor: colors.accent }}>
                      <View style={{ width: 33, height: 33, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary }}>
                        <Feather name={type === 'shipment' ? 'truck' : type === 'rfq' ? 'file-plus' : 'bell'} size={15} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        {first(alert, ['badge']) ? <Text style={{ color: colors.accent, fontSize: 9, fontWeight: '800', marginBottom: 2 }}>{first(alert, ['badge'])}</Text> : null}
                        <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: '700' }}>{first(alert, ['title'], 'Trade update')}</Text>
                      </View>
                      <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
                    </Card>
                  </Pressable>
                );
              })}
            </>
          ) : null}

          <BuyerSpendTrendCard points={dashboard.spend_by_month} currency={currencyCode} yearOverYear={spendYearOverYear} />
          <BuyerOrdersByStatusCard statuses={orderStatuses} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9, marginTop: 3 }}>
            <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800' }}>Upcoming deliveries</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push('/buyer-shipments')}>
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>View all</Text>
            </Pressable>
          </View>
          {upcoming.length ? upcoming.slice(0, 3).map((shipment, index) => {
            const progress = Math.min(100, Math.max(0, amount(shipment, ['pct']) ?? 0));
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
                  <View style={{ height: 5, borderRadius: 4, overflow: 'hidden', backgroundColor: colors.secondary, marginTop: 10 }}>
                    <View style={{ height: '100%', width: `${progress}%`, borderRadius: 4, backgroundColor: colors.primary }} />
                  </View>
                </Card>
              </Pressable>
            );
          }) : <EmptyState title="No upcoming deliveries" body="Shipment updates will appear here when an order is dispatched." icon="truck" />}

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
            </Card>
          ) : null}
          {notificationsQuery.isSuccess && unreadNotifications.length === 0 ? (
            <Card style={{ padding: 14, marginBottom: 10, alignItems: 'center' }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>No new approval alerts.</Text>
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
                </View>
                <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
              </Card>
            </Pressable>
          ))}

          <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800', marginBottom: 9, marginTop: 5 }}>Company profile completion</Text>
          <Card style={{ padding: 15, marginBottom: 12, borderColor: colors.accent }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '800' }}>Verification checklist</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 3 }}>Complete your company details for smoother trade processing.</Text>
              </View>
              <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '900' }}>{completion === null ? '—' : `${completion}%`}</Text>
            </View>
            <View style={{ height: 7, borderRadius: 5, overflow: 'hidden', backgroundColor: colors.secondary, marginTop: 12 }}>
              <View style={{ height: '100%', width: `${Math.min(100, Math.max(0, completion ?? 0))}%`, backgroundColor: colors.primary }} />
            </View>
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
            <View style={{ height: 7, borderRadius: 5, overflow: 'hidden', backgroundColor: colors.secondary, marginTop: 13 }}>
              <View style={{ height: '100%', width: `${Math.min(100, Math.max(0, trustScore ?? 0) / 10)}%`, backgroundColor: colors.accent }} />
            </View>
            {trustScore !== null ? <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 7 }}>Based on the trust score provided for your buyer account.</Text> : null}
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

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9, marginTop: 6 }}>
            <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800' }}>Trade activity</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push('/(buyer-tabs)/buyer-orders')}>
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>View orders</Text>
            </Pressable>
          </View>
          {activity.length ? activity.slice(0, 8).map((item, index) => {
            const type = first(item, ['type'], 'order');
            const icon = type === 'rfq' ? 'file-plus' : type.includes('quotation') ? 'file-text' : type === 'shipment' ? 'truck' : type === 'document' ? 'folder' : 'shopping-bag';
            return (
              <Pressable key={`${type}-${first(item, ['at'], String(index))}`} accessibilityRole="button" onPress={() => navigateTo(activityRoutes[type] || '/(buyer-tabs)/buyer-orders')}>
                <Card style={{ padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                  <View style={{ width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lightGreen }}>
                    <Feather name={icon} size={14} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: '800' }}>{first(item, ['title'], 'Trade update')}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: 3 }}>{first(item, ['desc'], '')}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 9, marginTop: 5 }}>{first(item, ['time'], '')}</Text>
                  </View>
                  <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
                </Card>
              </Pressable>
            );
          }) : <EmptyState title="No recent trade activity" body="RFQs, quotations, orders and shipments will appear here." icon="activity" />}
        </>
      ) : null}
    </Screen>
  );
}
