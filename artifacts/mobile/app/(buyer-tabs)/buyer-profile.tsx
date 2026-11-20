import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { Action, Card, Screen } from '@/components/InvestorUI';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { useInvestorMobileLogout } from '@workspace/api-client-react';
import { first, messageOf, record } from '@/lib/data';

export default function BuyerProfile() {
  const colors = useColors();
  const { token, user, signOut } = useAuth();
  const logout = useInvestorMobileLogout();
  const [error, setError] = useState('');
  const profile = record(record(user).profile);
  const displayName = first(record(user), ['name', 'fullName'], 'Buyer account');
  const company = first(profile, ['companyName', 'company_name']);
  const email = first(record(user), ['email']);

  async function handleSignOut() {
    setError('');
    try {
      await logout.mutateAsync(undefined);
      await signOut();
      router.replace('/(buyer-tabs)/buyer-home');
    } catch (err) {
      setError(`${messageOf(err)} Your session is still active; try signing out again when you are online.`);
    }
  }

  if (!token) {
    return <BuyerAuthGate
      title="My account"
      body="Sign in to manage your buyer profile, orders, messages, and account notifications."
      returnTo="/buyer-profile"
    />;
  }

  return (
    <Screen title="My account" subtitle="Your OG Exports buyer account">
      <Card style={{ padding: 19, marginBottom: 18 }}>
        <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: colors.lightGreen, alignItems: 'center', justifyContent: 'center', marginBottom: 13 }}>
          <Feather name="user" size={24} color={colors.primary} />
        </View>
        <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '700' }}>{displayName}</Text>
        {company ? <Text style={{ color: colors.mutedForeground, marginTop: 5 }}>{company}</Text> : null}
        {email ? <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 6 }}>{email}</Text> : null}
      </Card>

      <Card style={{ padding: 5, marginBottom: 18 }}>
        <Pressable
          testID="buyer-profile-orders"
          accessibilityRole="button"
          onPress={() => router.push('/(buyer-tabs)/buyer-orders')}
          style={{ minHeight: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '600' }}>My orders and quote requests</Text>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </Pressable>
        <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 13 }} />
        <Pressable
          testID="buyer-profile-support"
          accessibilityRole="button"
          onPress={() => router.push('/(buyer-tabs)/buyer-messages')}
          style={{ minHeight: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '600' }}>Contact support</Text>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </Pressable>
        <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 13 }} />
        <Pressable
          testID="buyer-profile-notifications"
          accessibilityRole="button"
          onPress={() => router.push('/account/notifications')}
          style={{ minHeight: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '600' }}>Notifications</Text>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </Pressable>
      </Card>

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
