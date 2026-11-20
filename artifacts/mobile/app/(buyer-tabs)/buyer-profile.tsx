import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
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
      ['Executive dashboard', '/buyer-overview', 'pie-chart'],
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
      ['My cart', '/(buyer-tabs)/buyer-cart', 'shopping-cart'],
      ['Request a quotation', '/buyer-rfq', 'file-plus'],
      ['Orders & quotations', '/(buyer-tabs)/buyer-orders', 'package'],
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
      <Card style={{ padding: 19, marginBottom: 18 }}>
        <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: colors.lightGreen, alignItems: 'center', justifyContent: 'center', marginBottom: 13 }}>
          <Feather name="user" size={24} color={colors.primary} />
        </View>
        <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '700' }}>{displayName}</Text>
        {company ? <Text style={{ color: colors.mutedForeground, marginTop: 5 }}>{company}</Text> : null}
        {email ? <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 6 }}>{email}</Text> : null}
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
