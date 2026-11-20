import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { Action, Card, Screen } from '@/components/InvestorUI';
import { useColors } from '@/hooks/useColors';

export function BuyerAuthGate({
  title,
  body,
  returnTo,
}: {
  title: string;
  body: string;
  returnTo: string;
}) {
  const colors = useColors();
  return (
    <Screen title={title} subtitle="Sign in or create a buyer account to continue">
      <Card style={{ padding: 22, marginTop: 10 }}>
        <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: colors.lightGreen, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
          <Feather name="lock" size={22} color={colors.primary} />
        </View>
        <Text style={{ color: colors.foreground, fontSize: 19, lineHeight: 25, fontWeight: '700' }}>{title}</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 19, marginTop: 8, marginBottom: 18 }}>{body}</Text>
        <Action
          title="Sign in"
          icon="log-in"
          onPress={() => router.push({ pathname: '/(auth)/login', params: { returnTo } })}
          testID="buyer-auth-sign-in"
        />
        <View style={{ height: 9 }} />
        <Action
          title="Create buyer account"
          icon="user-plus"
          secondary
          onPress={() => router.push({ pathname: '/(auth)/register', params: { returnTo } })}
          testID="buyer-auth-register"
        />
      </Card>
    </Screen>
  );
}
