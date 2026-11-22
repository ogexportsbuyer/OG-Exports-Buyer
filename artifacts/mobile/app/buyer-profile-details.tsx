import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import {
  getGetInvestorMeQueryKey,
  useGetInvestorMe,
  useUpdateInvestorMe,
} from '@workspace/api-client-react';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { Action, Card, ErrorState, Field, LoadingCard, Screen } from '@/components/InvestorUI';
import { CountryPicker } from '@/components/CountryPicker';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { countryForApi, profileUserCountry } from '@/lib/countries';
import { first, messageOf, record, type Json } from '@/lib/data';

export default function BuyerProfileDetails() {
  const colors = useColors();
  const { token, user, updateUser } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const profileQuery = useGetInvestorMe({
    query: { queryKey: getGetInvestorMeQueryKey(), enabled: !!token, staleTime: 30_000 },
  });
  const updateProfile = useUpdateInvestorMe();
  const response = record(profileQuery.data);
  const account = record(response.user ?? response.data ?? user);
  const email = first(account, ['email']);

  useEffect(() => {
    if (!Object.keys(account).length) return;
    setName(first(account, ['name']));
    setPhone(first(account, ['mobile', 'phone']));
    setCountry(profileUserCountry(account));
  }, [profileQuery.data, user]);

  async function save() {
    setError('');
    setNotice('');
    if (!name.trim()) {
      setError('Enter your name.');
      return;
    }
    try {
      const result = record(await updateProfile.mutateAsync({
        data: { name: name.trim(), mobile: phone.trim(), country: countryForApi(country) },
      }));
      const savedUser = record(result.user ?? result.data);
      if (!first(savedUser, ['id'])) throw new Error('The server did not return the updated profile.');
      await updateUser(savedUser as Json);
      await profileQuery.refetch();
      setNotice('Your buyer profile has been updated.');
    } catch (err) {
      setError(messageOf(err));
    }
  }

  if (!token) return <BuyerAuthGate title="My profile" body="Sign in to update your buyer contact information." returnTo="/buyer-profile-details" />;

  return (
    <Screen title="My profile" subtitle="Your buyer account contact details">
      {profileQuery.isLoading ? <LoadingCard label="Loading your profile…" lines={2} /> : null}
      {profileQuery.isError ? <ErrorState message="Your profile could not be loaded." error={profileQuery.error} onRetry={() => void profileQuery.refetch()} /> : null}
      {error ? <Text accessibilityRole="alert" style={{ color: colors.destructive, fontSize: 12, lineHeight: 18, marginBottom: 9 }}>{error}</Text> : null}
      {notice ? <Text accessibilityLiveRegion="polite" style={{ color: colors.primary, fontSize: 12, marginBottom: 9 }}>{notice}</Text> : null}
      <Card style={{ padding: 15 }}>
        <View style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary, marginBottom: 11 }}>
          <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '800' }}>{name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'OG'}</Text>
        </View>
        <Field label="Full name" value={name} onChangeText={setName} />
        <Field label="Email address" value={email} onChangeText={() => undefined} editable={false} />
        <Text style={{ color: colors.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: -5, marginBottom: 8 }}>Email is your sign-in identity. Contact support if it needs to be changed.</Text>
        <Field label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <CountryPicker label="Country" value={country} onChange={setCountry} placeholder="Select country" testID="buyer-profile-country" />
        <Action title="Save profile" icon="save" loading={updateProfile.isPending} disabled={updateProfile.isPending} onPress={() => void save()} testID="buyer-profile-details-save" />
      </Card>
    </Screen>
  );
}
