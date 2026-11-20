import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { LoadingCard, Screen } from '@/components/InvestorUI';
import { useAuth } from '@/context/AuthContext';

export default function BuyerMessages() {
  const { token } = useAuth();
  useEffect(() => {
    if (token) router.replace('/account/messages');
  }, [token]);

  if (!token) {
    return <BuyerAuthGate
      title="Messages"
      body="Sign in to contact OG Exports support and follow replies to your trade enquiries."
      returnTo="/buyer-messages"
    />;
  }

  return <Screen title="Messages" subtitle="Opening your OG Exports support inbox"><LoadingCard label="Loading messages…" /></Screen>;
}
