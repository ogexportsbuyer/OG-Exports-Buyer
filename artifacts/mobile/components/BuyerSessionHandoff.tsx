import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { useInvestorMobileLogout } from '@workspace/api-client-react';
import { buyerEntryDestination } from '@/lib/post-auth-route';

export function BuyerSessionHandoff() {
  const colors = useColors();
  const { signOut, onboardingComplete } = useAuth();
  const logout = useInvestorMobileLogout({ request: { timeoutMs: 8000, responseType: 'json' } });
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    // A saved investor session is not valid in this buyer-only app. Revoke it
    // best-effort, clear only this device's session, then continue as a guest.
    void logout.mutateAsync(undefined).catch(() => undefined);
    void (async () => {
      try {
        await signOut();
      } finally {
        router.replace(buyerEntryDestination(onboardingComplete));
      }
    })();
  }, [logout.mutateAsync, onboardingComplete, signOut]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}
