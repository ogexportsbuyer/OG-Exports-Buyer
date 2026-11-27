import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useGetBuyerRewards, getGetBuyerRewardsQueryKey } from '@workspace/api-client-react';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { Action, Card, EmptyState, ErrorState, LoadingCard, Screen } from '@/components/InvestorUI';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { first, record } from '@/lib/data';
import { saveHtmlAsPdf } from '@/lib/pdf-export';

function money(value: unknown, currency = 'USD') {
  const amount = typeof value === 'number' ? value : Number(value ?? 0);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number.isFinite(amount) ? amount : 0);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character);
}

export default function BuyerRewards() {
  const colors = useColors();
  const [certificateError, setCertificateError] = useState('');
  const { token, user } = useAuth();
  const buyerId = first(record(user), ['id', 'user_id']);
  const rewardsQuery = useGetBuyerRewards({
    query: {
      queryKey: [...getGetBuyerRewardsQueryKey(), buyerId],
      enabled: !!token && !!buyerId,
      retry: false,
    },
  });
  const summary = record(record(rewardsQuery.data).data);
  const current = record(summary.current_tier);
  const next = record(summary.next_tier);
  const activeRewards = Array.isArray(summary.active_rewards) ? summary.active_rewards.map(record) : [];
  const tiers = Array.isArray(summary.tiers) ? summary.tiers.map(record).sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)) : [];
  const certificate = activeRewards.find(item => /certificate/i.test(`${first(item, ['type'])} ${first(item, ['title'])}`));
  const currency = first(summary, ['currency'], 'USD');

  async function downloadCertificate() {
    if (!certificate) return;
    setCertificateError('');
    const title = first(certificate, ['title'], 'VIP certificate');
    const description = first(certificate, ['description']);
    const html = `<main style="font-family:Arial,sans-serif;color:#283833;padding:48px;border:2px solid #c5b487;text-align:center"><p style="letter-spacing:3px;color:#0a3335">OG EXPORTS · BUYER VIP REWARDS</p><h1 style="font-size:32px">${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p><hr/><p>Issued to OG Exports buyer account ${escapeHtml(buyerId)}</p><p>VIP tier: ${escapeHtml(first(current, ['name'], 'Buyer rewards member'))}</p><p>This certificate confirms an active reward recorded on your OG Exports buyer account.</p></main>`;
    try { await saveHtmlAsPdf(html, 'og-exports-vip-certificate', title); }
    catch { setCertificateError('The certificate could not be prepared. Please try again when print or sharing is available.'); }
  }

  if (!token) return <BuyerAuthGate title="VIP rewards" body="Sign in to review your VIP status, qualifying trade value and approved benefits." returnTo="/buyer-rewards" />;

  return (
    <Screen title="VIP rewards" subtitle="Long-term trade value and approved benefits" refreshable>
      {rewardsQuery.isLoading ? <LoadingCard label="Loading your buyer rewards…" lines={3} /> : null}
      {rewardsQuery.isError ? <ErrorState message="VIP rewards could not be loaded." error={rewardsQuery.error} onRetry={() => void rewardsQuery.refetch()} /> : null}
      {!rewardsQuery.isLoading && !rewardsQuery.isError && !Object.keys(summary).length ? <EmptyState title="Rewards are not available" body="Your VIP status will appear here when the rewards programme is available for your account." icon="award" /> : null}
      {!rewardsQuery.isLoading && !rewardsQuery.isError && Object.keys(summary).length > 0 ? (
        <>
          <Card testID="buyer-vip-status-card" style={{ padding: 19, marginBottom: 13, overflow: 'hidden', backgroundColor: colors.balanceCardStart }}>
            <View style={{ position: 'absolute', top: -52, right: -34, width: 170, height: 170, borderRadius: 85, borderWidth: 1, borderColor: colors.splashTrack }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="award" size={16} color={colors.accent} />
              <Text style={{ color: colors.splashMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 }}>CURRENT REWARDS TIER</Text>
            </View>
            <Text style={{ color: colors.balanceCardText, fontSize: 28, lineHeight: 34, fontWeight: '800', marginTop: 8 }}>{first(current, ['name'], 'Building your trade history')}</Text>
            <Text style={{ color: colors.splashMuted, fontSize: 11, lineHeight: 17, marginTop: 7 }}>
              {summary.is_manually_assigned ? 'Your tier is assigned by the OG Exports team.' : 'Qualification follows your qualifying order value.'}
            </Text>
            <View style={{ height: 1, backgroundColor: colors.splashTrack, marginVertical: 15 }} />
            <Text style={{ color: colors.splashMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>QUALIFYING SPEND</Text>
            <Text style={{ color: colors.balanceCardText, fontSize: 25, fontWeight: '800', marginTop: 3 }}>{money(summary.qualifying_spend_usd, currency)}</Text>
            <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '700', marginTop: 5 }}>
              {Number(current.discount_percentage ?? 0)}% VIP price component
            </Text>
          </Card>

          {Object.keys(next).length ? (
            <Card style={{ padding: 15, marginBottom: 13 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Feather name="trending-up" size={16} color={colors.primary} />
                <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800' }}>Progress to {first(next, ['name'], 'next tier')}</Text>
              </View>
              <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 6 }}>{money(summary.spend_to_next_tier_usd, currency)} in qualifying spend remaining</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 13, marginBottom: 6 }}>
                <Text style={{ color: colors.mutedForeground, fontSize: 9, fontWeight: '700' }}>TIER PROGRESS</Text>
                <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '800' }}>{Math.round(Number(summary.progress_percentage ?? 0))}%</Text>
              </View>
              <View style={{ height: 7, borderRadius: 5, backgroundColor: colors.secondary, overflow: 'hidden' }}><View style={{ height: '100%', width: `${Math.max(0, Math.min(100, Number(summary.progress_percentage ?? 0)))}%`, backgroundColor: colors.accent, borderRadius: 5 }} /></View>
            </Card>
          ) : null}

          <Card style={{ padding: 15, marginBottom: 13 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
              <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800' }}>Active rewards</Text>
              <Feather name="check-circle" size={17} color={colors.primary} />
            </View>
            {activeRewards.length ? activeRewards.map((reward, index) => (
              <View key={String(reward.id ?? index)} style={{ flexDirection: 'row', gap: 10, paddingVertical: 12, borderTopWidth: index ? 1 : 0, borderTopColor: colors.border }}>
                <View style={{ width: 32, height: 32, borderRadius: 11, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}><Feather name="award" size={15} color={colors.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '800' }}>{first(reward, ['title'], 'Buyer benefit')}</Text>
                  {first(reward, ['description']) ? <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 17, marginTop: 4 }}>{first(reward, ['description'])}</Text> : null}
                  {reward.requires_admin_approval ? <Text style={{ color: colors.statusPending, fontSize: 10, fontWeight: '700', marginTop: 5 }}>Team approval required before use</Text> : null}
                </View>
              </View>
            )) : <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18 }}>No active rewards are attached to your account yet. Your qualifying spend and tier progress remain visible here.</Text>}
            {certificate ? <View style={{ marginTop: 10 }}><Action title="Download VIP certificate" icon="download" onPress={() => void downloadCertificate()} testID="buyer-vip-certificate" /></View> : null}
            {certificateError ? <Text accessibilityRole="alert" style={{ color: colors.destructive, fontSize: 11, lineHeight: 16, marginTop: 8 }}>{certificateError}</Text> : null}
          </Card>

          <Card style={{ padding: 15, marginBottom: 13 }}>
            <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800', marginBottom: 8 }}>Programme tiers</Text>
            {tiers.map((tier, index) => {
              const benefitTitles = Array.isArray(tier.rewards)
                ? tier.rewards.map(record)
                  .filter(reward => reward.is_active !== false)
                  .map(reward => first(reward, ['title']))
                  .filter(Boolean)
                : [];
              return (
                <View key={String(tier.id ?? index)} style={{ minHeight: 55, flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: index ? 1 : 0, borderTopColor: colors.border }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: tier.id === current.id ? colors.primary : colors.secondary, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: tier.id === current.id ? colors.primaryForeground : colors.mutedForeground, fontSize: 9, fontWeight: '800' }}>{String(index + 1).padStart(2, '0')}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '700' }}>{first(tier, ['name'], 'Tier')}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 3 }}>{money(tier.minimum_spend_usd, currency)} qualifying spend</Text>
                    {benefitTitles.length ? <Text style={{ color: colors.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: 4 }}>{benefitTitles.join(' · ')}</Text> : null}
                  </View>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>{Number(tier.discount_percentage ?? 0)}%</Text>
                </View>
              );
            })}
          </Card>
          <Card style={{ padding: 14, marginBottom: 12, backgroundColor: colors.glassTintGold }}>
            <Text style={{ color: colors.foreground, fontSize: 11, lineHeight: 17 }}>VIP rewards are separate from your buyer trust score. Discounts are applied by the server. Payment-term benefits and any fulfilment remain subject to staff confirmation.</Text>
          </Card>
          <Pressable accessibilityRole="button" onPress={() => router.push('/(buyer-tabs)/buyer-products')} style={{ minHeight: 48, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderRadius: 14, backgroundColor: colors.primary, marginBottom: 14 }}>
            <Text style={{ color: colors.primaryForeground, fontSize: 12, fontWeight: '800' }}>View buyer catalogue</Text><Feather name="arrow-right" size={15} color={colors.primaryForeground} />
          </Pressable>
        </>
      ) : null}
    </Screen>
  );
}
