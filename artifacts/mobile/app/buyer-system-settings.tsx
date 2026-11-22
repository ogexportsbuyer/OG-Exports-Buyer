import React, { useEffect, useState } from 'react';
import { Pressable, Switch, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetInvestorMeQueryKey,
  useGetInvestorMe,
  useUpdateInvestorMe,
} from '@workspace/api-client-react';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { BuyerPushNotificationSettings } from '@/components/BuyerPushNotificationSettings';
import { Card, ErrorState, LoadingCard, Screen } from '@/components/InvestorUI';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useAuth } from '@/context/AuthContext';
import { useAppPreferences, type AppearancePreference, type DisplayCurrency } from '@/context/AppPreferencesContext';
import { useColors } from '@/hooks/useColors';
import { useMotion } from '@/lib/motion';
import { BUYER_NOTIFICATION_CATEGORIES, isNotificationPreferenceEnabled } from '@/lib/notification-categories';
import { first, messageOf, record, unwrap } from '@/lib/data';

const appearanceOptions: { value: AppearancePreference; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'system', label: 'System', icon: 'smartphone' },
];

const languageOptions = [
  { value: 'en' as const, label: 'English' },
  { value: 'ur' as const, label: 'اردو' },
  { value: 'ar' as const, label: 'العربية' },
];

const currencyOptions: DisplayCurrency[] = ['USD', 'PKR', 'EUR', 'GBP'];

function ChoiceRow<T extends string>({
  title,
  detail,
  value,
  options,
  onSelect,
  disabled,
  testID,
}: {
  title: string;
  detail?: string;
  value: T;
  options: { value: T; label: string; icon?: keyof typeof Feather.glyphMap }[];
  onSelect: (value: T) => void;
  disabled?: boolean;
  testID: string;
}) {
  const colors = useColors();
  return (
    <View style={{ paddingVertical: 13 }}>
      <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700' }}>{title}</Text>
      {detail ? <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 16, marginTop: 3 }}>{detail}</Text> : null}
      <View style={{ flexDirection: 'row', gap: 7, marginTop: 10 }}>
        {options.map(option => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              testID={`${testID}-${option.value}`}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled: Boolean(disabled) }}
              disabled={disabled}
              onPress={() => onSelect(option.value)}
              style={{
                flex: 1,
                minHeight: 40,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? colors.primary : colors.secondary,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 6,
                paddingHorizontal: 6,
                opacity: disabled ? 0.6 : 1,
              }}
            >
              {option.icon ? <Feather name={option.icon} size={13} color={selected ? colors.primaryForeground : colors.mutedForeground} /> : null}
              <Text style={{ color: selected ? colors.primaryForeground : colors.foreground, fontSize: 11, fontWeight: selected ? '800' : '600' }}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function SectionTitle({ title, detail }: { title: string; detail?: string }) {
  const colors = useColors();
  return (
    <View style={{ marginHorizontal: 3, marginBottom: 8 }}>
      <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800' }}>{title}</Text>
      {detail ? <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 16, marginTop: 3 }}>{detail}</Text> : null}
    </View>
  );
}

export default function BuyerSystemSettings() {
  const colors = useColors();
  const { token, user } = useAuth();
  const userId = first(record(user), ['id']);
  const queryClient = useQueryClient();
  const preferences = useAppPreferences();
  const { reduceMotionPreference, setReduceMotionPreference, motionSettingsReady } = useMotion();
  const [notificationPrefs, setNotificationPrefs] = useState<Record<string, unknown>>({});
  const [notificationError, setNotificationError] = useState('');
  const [savingCategory, setSavingCategory] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState('');
  const [notice, setNotice] = useState('');

  const profileQuery = useGetInvestorMe({
    query: { queryKey: getGetInvestorMeQueryKey(), enabled: Boolean(token), staleTime: 30_000 },
  });
  const updateMe = useUpdateInvestorMe({ request: { timeoutMs: 10_000 } });
  const profileResponse = unwrap(profileQuery.data);
  const account = record(profileResponse.user ?? profileResponse);
  const profileMeta = record(record(account.profile).meta);

  useEffect(() => {
    if (profileQuery.data) setNotificationPrefs(record(profileMeta.notification_prefs));
  }, [profileQuery.data]);

  async function saveAppPreference(patch: { language?: 'en' | 'ur' | 'ar'; currency?: DisplayCurrency; appearance?: AppearancePreference }) {
    setSettingsError('');
    setNotice('');
    try {
      await preferences.savePreferences(patch);
      setNotice('Your app preference has been saved to your account.');
    } catch (error) {
      setSettingsError(messageOf(error));
    }
  }

  async function saveNotificationPreference(key: string, enabled: boolean) {
    if (!token) return;
    setNotificationError('');
    setSavingCategory(key);
    const next = { ...notificationPrefs, [key]: enabled };
    try {
      const response = await updateMe.mutateAsync({ data: { meta: { notification_prefs: next } } });
      const saved = unwrap(response);
      const savedUser = record(saved.user ?? saved);
      const savedPrefs = record(record(record(savedUser.profile).meta).notification_prefs);
      if (savedPrefs[key] !== enabled) throw new Error('The server did not confirm this notification setting.');
      setNotificationPrefs(savedPrefs);
      queryClient.setQueryData(getGetInvestorMeQueryKey(), response);
    } catch (error) {
      setNotificationError(messageOf(error));
    } finally {
      setSavingCategory(null);
    }
  }

  if (!token) {
    return <BuyerAuthGate title="System settings" body="Sign in to manage your buyer app preferences and notifications." returnTo="/buyer-system-settings" />;
  }

  return (
    <Screen title="System settings" subtitle="Personalize your OG Exports buyer app">
      {preferences.isLoading || profileQuery.isLoading ? <LoadingCard label="Loading your settings…" lines={2} /> : null}
      {profileQuery.isError ? <ErrorState message="Notification preferences could not be loaded." error={profileQuery.error} onRetry={() => void profileQuery.refetch()} /> : null}
      {settingsError || preferences.error ? (
        <View style={{ marginBottom: 9 }}>
          <Text accessibilityRole="alert" style={{ color: colors.destructive, fontSize: 12, lineHeight: 18 }}>
            {settingsError || preferences.error}
          </Text>
          {preferences.hasPendingSync ? (
            <Pressable
              testID="buyer-settings-retry-sync"
              accessibilityRole="button"
              onPress={() => void preferences.savePreferences({}).catch(() => undefined)}
              style={{ minHeight: 38, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 4 }}
            >
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>Retry account sync</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {notificationError ? <Text accessibilityRole="alert" style={{ color: colors.destructive, fontSize: 12, lineHeight: 18, marginBottom: 9 }}>{notificationError}</Text> : null}
      {notice ? <Text accessibilityLiveRegion="polite" style={{ color: colors.primary, fontSize: 12, lineHeight: 18, marginBottom: 9 }}>{notice}</Text> : null}

      <SectionTitle title="Appearance" detail="Choose Light, Dark, or follow your device. Your choice is saved to your buyer account." />
      <Card style={{ paddingHorizontal: 14, marginBottom: 16 }}>
        <ChoiceRow
          title="App theme"
          value={preferences.preferences.appearance}
          options={appearanceOptions}
          onSelect={value => void saveAppPreference({ appearance: value })}
          disabled={preferences.isSaving || preferences.isSyncing}
          testID="buyer-settings-appearance"
        />
      </Card>

      <SectionTitle title="Language & display" detail="These preferences are saved to your buyer account." />
      <Card style={{ paddingHorizontal: 14, marginBottom: 16 }}>
        <ChoiceRow
          title="App language"
          detail="Urdu and Arabic use right-to-left layout where supported."
          value={preferences.preferences.language}
          options={languageOptions}
          onSelect={value => void saveAppPreference({ language: value })}
          disabled={preferences.isSaving || preferences.isSyncing}
          testID="buyer-settings-language"
        />
        <View style={{ height: 1, backgroundColor: colors.border }} />
        <ChoiceRow
          title="Display currency"
          detail={preferences.ratesError ? 'Live conversion rates are unavailable right now.' : 'Prices and totals use this display currency where supported.'}
          value={preferences.preferences.currency}
          options={currencyOptions.map(value => ({ value, label: value }))}
          onSelect={value => void saveAppPreference({ currency: value })}
          disabled={preferences.isSaving || preferences.isSyncing || preferences.ratesLoading}
          testID="buyer-settings-currency"
        />
      </Card>

      <SectionTitle title="Accessibility" detail="Reduce decorative movement while keeping essential feedback." />
      <Card style={{ padding: 14, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="wind" size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700' }}>Reduce motion</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 16, marginTop: 3 }}>
              {motionSettingsReady ? 'Use shorter, quieter transitions in the app.' : 'Checking your device accessibility setting…'}
            </Text>
          </View>
          <Switch
            testID="buyer-settings-reduce-motion"
            accessibilityLabel="Reduce motion"
            value={reduceMotionPreference}
            onValueChange={value => {
              void setReduceMotionPreference(value).then(() => setNotice('Motion preference applied on this device.'));
            }}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.card}
          />
        </View>
      </Card>

      <SectionTitle title="Notifications" detail="In-app category choices control new feed alerts. Push is enabled separately for this device." />
      <BuyerPushNotificationSettings userId={userId} onStatus={setNotice} />

      <SectionTitle title="In-app notification categories" detail="These settings do not change email preferences or device push delivery." />
      <Card style={{ paddingHorizontal: 14, marginBottom: 16 }}>
        {BUYER_NOTIFICATION_CATEGORIES.map((category, index) => {
          const enabled = isNotificationPreferenceEnabled(notificationPrefs, category.key);
          return (
            <React.Fragment key={category.key}>
              {index > 0 ? <View style={{ height: 1, backgroundColor: colors.border }} /> : null}
              <View style={{ minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 8 }}>
                <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name={category.icon as keyof typeof Feather.glyphMap} size={15} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '700' }}>{category.label}</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 10, lineHeight: 14, marginTop: 2 }}>{category.description}</Text>
                </View>
                <Switch
                  testID={`buyer-settings-notification-${category.key}`}
                  accessibilityLabel={`${category.label} in-app notifications`}
                  value={enabled}
                  disabled={savingCategory === category.key || profileQuery.isLoading}
                  onValueChange={value => void saveNotificationPreference(category.key, value)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.card}
                />
              </View>
            </React.Fragment>
          );
        })}
      </Card>

      <Text style={{ color: colors.mutedForeground, fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 1 }}>
        {preferences.isSyncing ? 'Syncing your app preferences…' : preferences.hasPendingSync ? 'Some preferences are saved on this device and will sync when available.' : 'Your account preferences stay with your buyer account.'}
      </Text>
    </Screen>
  );
}
