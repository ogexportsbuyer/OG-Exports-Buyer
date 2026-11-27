import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { BrandMark } from '@/components/BrandMark';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { Action, Card, Screen } from '@/components/InvestorUI';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { useInvestorMobileLogout, useRevokeBuyerPushToken } from '@workspace/api-client-react';
import { first, messageOf, record } from '@/lib/data';
import { buyerPushEnabledStorageKey } from '@/lib/buyer-push-settings';
import { buyerPushTokenSecureStoreKey } from '@/lib/push-token-key';

const accountSections = [
  {
    title: 'Overview',
    links: [
      ['Executive dashboard', '/(buyer-tabs)/dashboard', 'bar-chart-2'],
      ['Analytics', '/buyer-analytics', 'bar-chart-2'],
    ],
  },
  {
    title: 'Account',
    links: [
      ['My profile', '/buyer-profile-details', 'user'],
      ['Company profile & verification', '/buyer-company', 'briefcase'],
      ['System settings', '/buyer-system-settings', 'settings'],
      ['Security & devices', '/buyer-security', 'shield'],
      ['Notifications', '/buyer-notifications', 'bell'],
      ['Messages', '/(buyer-tabs)/buyer-messages', 'message-circle'],
    ],
  },
  {
    title: 'Trade operations',
    links: [
      ['Product catalogue', '/(buyer-tabs)/buyer-products', 'grid'],
      ['My cart', '/buyer-cart', 'shopping-cart'],
      ['Request a quotation', '/buyer-rfq', 'file-plus'],
      ['Orders & quotations', '/buyer-orders', 'package'],
      ['Repeat orders', '/buyer-repeat-orders', 'rotate-ccw'],
    ],
  },
  {
    title: 'Logistics & finance',
    links: [
      ['Shipment tracking', '/buyer-shipments', 'truck'],
      ['Trade documents', '/buyer-documents', 'file-text'],
      ['Trade finance', '/buyer-trade-finance', 'credit-card'],
    ],
  },
] as const;

const profileCardStyles = StyleSheet.create({
  surfaceGlow: {
    position: 'absolute',
    top: -78,
    right: -58,
    width: 190,
    height: 190,
    borderRadius: 95,
    opacity: 0.22,
  },
  accent: {
    height: 3,
    width: '100%',
  },
  content: {
    padding: 18,
  },
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandName: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  brandCaption: {
    marginTop: 3,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 16,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarFrame: {
    width: 68,
    height: 68,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
    minWidth: 0,
  },
  overline: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.15,
    marginBottom: 4,
  },
  name: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 7,
  },
  metaText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
});

export default function BuyerProfile() {
  const colors = useColors();
  const { token, user, signOut } = useAuth();
  const logout = useInvestorMobileLogout();
  const revokePushToken = useRevokeBuyerPushToken();
  const [error, setError] = useState('');
  const userId = first(record(user), ['id']);
  const profile = record(record(user).profile);
  const displayName = first(record(user), ['name', 'fullName'], 'Buyer account');
  const company = first(profile, ['companyName', 'company_name']);
  const email = first(record(user), ['email']);

  async function handleSignOut() {
    setError('');
    try {
      if (userId) {
        const secureKey = buyerPushTokenSecureStoreKey(userId);
        const deviceToken = await SecureStore.getItemAsync(secureKey);
        const pushWasEnabled = await AsyncStorage.getItem(buyerPushEnabledStorageKey(userId));
        if (!deviceToken && pushWasEnabled === 'enabled') {
          throw new Error('This device push token is missing from secure storage. Restore it in System settings before signing out.');
        }
        if (deviceToken) {
          await revokePushToken.mutateAsync({ data: { expo_push_token: deviceToken } });
          await Promise.all([
            SecureStore.deleteItemAsync(secureKey),
            AsyncStorage.removeItem(buyerPushEnabledStorageKey(userId)),
          ]);
        }
      }
      await logout.mutateAsync(undefined);
      await signOut();
      router.replace('/(buyer-tabs)/buyer-home');
    } catch (err) {
      setError(`Could not safely finish sign out: ${messageOf(err)} Your session is still active; try again when you are online.`);
    }
  }

  if (!token) {
    return <BuyerAuthGate
      title="Profile"
      body="Sign in to manage your buyer profile, orders, messages, and account notifications."
      returnTo="/buyer-profile"
    />;
  }

  return (
    <Screen title="Profile" subtitle="Your OG Exports buyer account">
      <Card testID="buyer-profile-identity-card" style={{ padding: 0, marginBottom: 18, backgroundColor: colors.balanceCardStart }}>
        <View pointerEvents="none" style={[profileCardStyles.surfaceGlow, { backgroundColor: colors.balanceCardEnd }]} />
        <View style={[profileCardStyles.accent, { backgroundColor: colors.accentSurface }]} />
        <View style={profileCardStyles.content}>
          <View style={profileCardStyles.brandLockup}>
            <BrandMark width={42} onBackground="dark" />
            <View>
              <Text style={[profileCardStyles.brandName, { color: colors.balanceCardText }]}>OG EXPORTS</Text>
              <Text style={[profileCardStyles.brandCaption, { color: colors.splashMuted }]}>BUYER ACCOUNT</Text>
            </View>
          </View>
          <View style={[profileCardStyles.divider, { backgroundColor: colors.splashTrack }]} />
          <View style={profileCardStyles.identity}>
            <View style={[profileCardStyles.avatarFrame, { backgroundColor: colors.glassTintTeal, borderColor: colors.glassBorder }]}>
              <View style={[profileCardStyles.avatar, { backgroundColor: colors.balanceCardEnd }]}>
                <Feather name="user" size={25} color={colors.balanceCardText} />
              </View>
            </View>
            <View style={profileCardStyles.details}>
              <Text style={[profileCardStyles.overline, { color: colors.splashMuted }]}>ACCOUNT HOLDER</Text>
              <Text numberOfLines={2} style={[profileCardStyles.name, { color: colors.balanceCardText }]}>{displayName}</Text>
              {company ? (
                <View style={profileCardStyles.metaRow}>
                  <Feather name="briefcase" size={13} color={colors.splashMuted} />
                  <Text numberOfLines={1} style={[profileCardStyles.metaText, { color: colors.splashMuted }]}>{company}</Text>
                </View>
              ) : null}
              {email ? (
                <View style={profileCardStyles.metaRow}>
                  <Feather name="mail" size={13} color={colors.splashMuted} />
                  <Text numberOfLines={1} style={[profileCardStyles.metaText, { color: colors.splashMuted }]}>{email}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </Card>

      {accountSections.map(section => (
        <View key={section.title} style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8, marginLeft: 3 }}>
            {section.title}
          </Text>
          <Card style={{ padding: 4 }}>
            {section.links.map(([title, href, icon], index) => (
              <React.Fragment key={title}>
                {index > 0 ? <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 11 }} /> : null}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push(href)}
                  style={{ minHeight: 54, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                >
                  <View style={{ width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary }}>
                    <Feather name={icon} size={16} color={colors.primary} />
                  </View>
                  <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600', flex: 1 }}>{title}</Text>
                  <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
                </Pressable>
              </React.Fragment>
            ))}
          </Card>
        </View>
      ))}

      {error ? <Text accessibilityRole="alert" style={{ color: colors.destructive, fontSize: 12, lineHeight: 18, marginBottom: 12 }}>{error}</Text> : null}
      <Action
        title="Sign out"
        icon="log-out"
        secondary
        loading={logout.isPending}
        disabled={logout.isPending}
        onPress={() => void handleSignOut()}
        testID="buyer-profile-signout"
      />
    </Screen>
  );
}
