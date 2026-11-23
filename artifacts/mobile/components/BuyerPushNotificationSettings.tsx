import React, { useCallback, useState } from 'react';
import { Alert, Linking, Platform, Pressable, Switch, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { isRunningInExpoGo } from 'expo';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useRegisterBuyerPushToken, useRevokeBuyerPushToken } from '@workspace/api-client-react';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { Card } from '@/components/InvestorUI';
import { useColors } from '@/hooks/useColors';
import { buyerPushEnabledStorageKey } from '@/lib/buyer-push-settings';
import { buyerPushTokenSecureStoreKey } from '@/lib/push-token-key';
import { messageOf } from '@/lib/data';

export function BuyerPushNotificationSettings({
  userId,
  onStatus,
}: {
  userId: string;
  onStatus: (message: string) => void;
}) {
  const colors = useColors();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const registerPushToken = useRegisterBuyerPushToken({ request: { timeoutMs: 10_000 } });
  const revokePushToken = useRevokeBuyerPushToken({ request: { timeoutMs: 10_000 } });
  const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId ?? '';

  const refreshStatus = useCallback(async () => {
    if (!userId) {
      setEnabled(false);
      return;
    }
    const [savedFlag, savedToken] = await Promise.all([
      AsyncStorage.getItem(buyerPushEnabledStorageKey(userId)).catch(() => null),
      SecureStore.getItemAsync(buyerPushTokenSecureStoreKey(userId)).catch(() => null),
    ]);
    let permitted = false;
    if (savedToken && Platform.OS !== 'web') {
      try {
        const notifications = await import('expo-notifications');
        permitted = (await notifications.getPermissionsAsync()).granted;
      } catch {
        permitted = false;
      }
    }
    setEnabled(savedFlag === 'enabled' && Boolean(savedToken) && permitted);
  }, [userId]);

  useFocusEffect(useCallback(() => {
    void refreshStatus();
    return undefined;
  }, [refreshStatus]));

  async function enable() {
    setError('');
    onStatus('');
    if (Platform.OS === 'web') {
      setError('Push notifications can only be enabled on an iPhone or Android device.');
      return;
    }
    if (Platform.OS === 'android' && isRunningInExpoGo()) {
      setError('Android Expo Go does not support remote push. Install a development or published app build first.');
      return;
    }
    if (!projectId) {
      setError('Push notifications are not configured for this app build. Device permission was not requested.');
      return;
    }
    if (!userId) {
      setError('Sign in again before enabling push notifications.');
      return;
    }

    setBusy(true);
    try {
      const notifications = await import('expo-notifications');
      if (Platform.OS === 'android') {
        await notifications.setNotificationChannelAsync('buyer-updates', {
          name: 'Buyer updates',
          importance: notifications.AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
          lockscreenVisibility: notifications.AndroidNotificationVisibility.PUBLIC,
        });
      }

      let permission = await notifications.getPermissionsAsync();
      if (!permission.granted) permission = await notifications.requestPermissionsAsync();
      if (!permission.granted) {
        if (permission.status === 'denied' && !permission.canAskAgain) {
          Alert.alert('Notifications are blocked', 'Allow notifications in your device settings to receive buyer updates.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => void Linking.openSettings().catch(() => setError('Device settings could not be opened.')) },
          ]);
        }
        return;
      }

      const token = (await notifications.getExpoPushTokenAsync({ projectId })).data;
      const secureKey = buyerPushTokenSecureStoreKey(userId);
      await SecureStore.setItemAsync(secureKey, token);
      try {
        await registerPushToken.mutateAsync({
          data: { expo_push_token: token, platform: Platform.OS === 'ios' ? 'ios' : 'android' },
        });
        await AsyncStorage.setItem(buyerPushEnabledStorageKey(userId), 'enabled');
      } catch (registrationError) {
        try {
          await revokePushToken.mutateAsync({ data: { expo_push_token: token } });
        } catch {
          // Registration may have completed even if the response was interrupted.
        }
        await SecureStore.deleteItemAsync(secureKey).catch(() => undefined);
        throw registrationError;
      }
      setEnabled(true);
      onStatus('Push notifications are enabled on this device.');
    } catch (pushError) {
      const message = messageOf(pushError);
      setError(/404|not found|route/i.test(message)
        ? 'Buyer push registration is not active on the server yet. Try again after the backend update is live.'
        : message);
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setError('');
    onStatus('');
    if (!userId) {
      setError('Sign in again before changing push notification settings.');
      return;
    }
    setBusy(true);
    try {
      const secureKey = buyerPushTokenSecureStoreKey(userId);
      const token = await SecureStore.getItemAsync(secureKey);
      const savedFlag = await AsyncStorage.getItem(buyerPushEnabledStorageKey(userId));
      if (!token && savedFlag === 'enabled') {
        throw new Error('This device token is missing from secure storage, so the server could not be safely disabled. Enable push again to restore it, then turn it off.');
      }
      if (token) await revokePushToken.mutateAsync({ data: { expo_push_token: token } });
      await Promise.all([
        SecureStore.deleteItemAsync(secureKey),
        AsyncStorage.removeItem(buyerPushEnabledStorageKey(userId)),
      ]);
      setEnabled(false);
      onStatus('Push notifications are disabled for this device.');
    } catch (pushError) {
      const message = messageOf(pushError);
      setError(/404|not found|route/i.test(message)
        ? 'Buyer push registration is not active on the server yet. Try again after the backend update is live.'
        : message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {error ? <Text accessibilityRole="alert" style={{ color: colors.destructive, fontSize: 12, lineHeight: 18, marginBottom: 9 }}>{error}</Text> : null}
      <Card style={{ padding: 14, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 13 }}>
          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="smartphone" size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700' }}>Device push notifications</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 16, marginTop: 3 }}>
              RFQ, quotation, account, order, payment, shipment and support updates.
            </Text>
          </View>
          <Switch
            testID="buyer-settings-push"
            accessibilityLabel="Device push notifications"
            value={enabled === true}
            disabled={enabled === null || busy}
            onValueChange={value => void (value ? enable() : disable())}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.card}
          />
        </View>
        <Pressable
          testID="buyer-settings-open-device-settings"
          accessibilityRole="button"
          onPress={() => void Linking.openSettings().catch(() => setError('Device settings could not be opened.'))}
          style={{ flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderColor: colors.border, minHeight: 43, gap: 8 }}
        >
          <Feather name="external-link" size={14} color={colors.mutedForeground} />
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700', flex: 1 }}>Open device notification settings</Text>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </Pressable>
      </Card>
    </>
  );
}
