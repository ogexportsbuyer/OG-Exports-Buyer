import React from 'react';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View } from 'react-native';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { Action, Card, Screen } from '@/components/InvestorUI';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { useInvestorMobileLogout } from '@workspace/api-client-react';

export function BuyerAccountRequired() {
  const colors = useColors();
  const { signOut } = useAuth();
  const logout = useInvestorMobileLogout({ request: { timeoutMs: 8000, responseType: 'json' } });

  async function signOutCurrentAccount() {
    try {
      await logout.mutateAsync(undefined);
    } catch {
      // Always clear the local session so an investor account cannot enter this app.
    }
    await signOut();
    router.replace({ pathname: '/(auth)/login', params: { reason: 'buyer-only' } });
  }

  return (
    <Screen title="Buyer account required" subtitle="This app is for OG Exports buyers">
      <Card style={{ padding: 22, marginTop: 12 }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.lightGreen, alignItems: 'center', justifyContent: 'center', marginBottom: 15 }}>
          <Feather name="shopping-bag" size={24} color={colors.primary} />
        </View>
        <Text style={{ color: colors.foreground, fontSize: 18, lineHeight: 24, fontWeight: '700' }}>
          This account does not have buyer access.
        </Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 18 }}>
          Sign out to continue to buyer sign-in or create a buyer account. Your current account and its data will not be deleted.
        </Text>
        <Action
          title="Sign out and continue"
          icon="log-out"
          loading={logout.isPending}
          disabled={logout.isPending}
          onPress={() => void signOutCurrentAccount()}
          testID="buyer-only-signout"
        />
      </Card>
    </Screen>
  );
}
