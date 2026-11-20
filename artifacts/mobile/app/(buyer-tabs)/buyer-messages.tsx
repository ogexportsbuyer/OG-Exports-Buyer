import React from 'react';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { useAuth } from '@/context/AuthContext';
import { SupportMessages } from '../account/messages';

export default function BuyerMessages() {
  const { token } = useAuth();

  if (!token) {
    return <BuyerAuthGate
      title="Messages"
      body="Sign in to contact OG Exports support and follow replies to your trade enquiries."
      returnTo="/buyer-messages"
    />;
  }

  return <SupportMessages buyerMode />;
}
