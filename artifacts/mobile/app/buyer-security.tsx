import React, { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  useConfirmInvestorTwoFactor,
  useDisableInvestorTwoFactor,
  useEnableInvestorTwoFactor,
  useGetInvestorSecurityActivity,
  useGetInvestorSessions,
  useGetInvestorTwoFactorStatus,
  useRevokeInvestorSession,
  useRevokeOtherInvestorSessions,
  useUpdateInvestorPassword,
} from '@workspace/api-client-react';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { Action, Card, EmptyState, Field, LoadingCard, Screen, Status } from '@/components/InvestorUI';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { first, list, messageOf, record, unwrap } from '@/lib/data';

type SecurityTab = 'account' | 'devices' | 'activity';

function displayDate(value: string) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function activityLabel(action: string) {
  const labels: Record<string, string> = {
    'login.success': 'Successful sign-in',
    'login.mobile_success': 'Mobile sign-in',
    'login.2fa_success': 'Sign-in verified with 2FA',
    'password.changed': 'Sign-in password changed',
    'password.reset': 'Sign-in password reset',
    'email.verified': 'Email address verified',
    '2fa.enable_requested': 'Two-factor setup requested',
    '2fa.enabled': 'Two-factor authentication enabled',
    '2fa.disabled': 'Two-factor authentication disabled',
    'session.revoked': 'Device session revoked',
    'session.revoked_others': 'Other device sessions revoked',
  };
  const normalized = action.split(/[._]+/).filter(Boolean).map(part => part[0].toUpperCase() + part.slice(1)).join(' ');
  return labels[action] ?? (normalized || 'Security activity');
}

export default function BuyerSecurity() {
  const colors = useColors();
  const { token } = useAuth();
  const client = useQueryClient();
  const [tab, setTab] = useState<SecurityTab>('account');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorPassword, setTwoFactorPassword] = useState('');
  const [code, setCode] = useState('');
  const [setupRequested, setSetupRequested] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const sessionsQuery = useGetInvestorSessions({ query: { queryKey: ['buyer-security-sessions'], enabled: !!token, refetchOnMount: 'always' } });
  const activityQuery = useGetInvestorSecurityActivity({ query: { queryKey: ['buyer-security-activity'], enabled: !!token, staleTime: 30_000 } });
  const twoFactorQuery = useGetInvestorTwoFactorStatus({ query: { queryKey: ['buyer-two-factor-status'], enabled: !!token } });
  const changePassword = useUpdateInvestorPassword();
  const requestTwoFactor = useEnableInvestorTwoFactor();
  const confirmTwoFactor = useConfirmInvestorTwoFactor();
  const disableTwoFactor = useDisableInvestorTwoFactor();
  const revokeSession = useRevokeInvestorSession();
  const revokeOthers = useRevokeOtherInvestorSessions();
  const sessions = list(sessionsQuery.data);
  const activity = list(activityQuery.data).filter(item => first(item, ['module']).toLowerCase() === 'security');
  const twoFactor = unwrap(twoFactorQuery.data);
  const enabled = twoFactor.enabled === true;

  async function refreshSecurity() {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['buyer-security-sessions'] }),
      client.invalidateQueries({ queryKey: ['buyer-security-activity'] }),
      client.invalidateQueries({ queryKey: ['buyer-two-factor-status'] }),
    ]);
  }

  async function savePassword() {
    setError('');
    setNotice('');
    if (newPassword.length < 8) return setError('Use at least eight characters for the new password.');
    if (newPassword !== confirmPassword) return setError('The new password and confirmation do not match.');
    try {
      await changePassword.mutateAsync({
        data: { current_password: currentPassword, password: newPassword, password_confirmation: confirmPassword },
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setNotice('Your sign-in password has been changed.');
    } catch (err) {
      setError(messageOf(err));
    }
  }

  async function startTwoFactor() {
    setError('');
    setNotice('');
    try {
      const result = record(await requestTwoFactor.mutateAsync({ data: { password: twoFactorPassword } }));
      setSetupRequested(true);
      setCode('');
      setNotice(first(record(result.data), ['email']) ? `A verification code was sent to ${first(record(result.data), ['email'])}.` : first(result, ['message'], 'Check your email for the verification code.'));
    } catch (err) {
      setError(messageOf(err));
    }
  }

  async function confirmTwoFactorSetup() {
    setError('');
    setNotice('');
    try {
      const result = record(await confirmTwoFactor.mutateAsync({ data: { code: code.trim() } }));
      setSetupRequested(false);
      setTwoFactorPassword('');
      setCode('');
      setNotice(first(result, ['message'], 'Two-factor authentication is enabled.'));
      await refreshSecurity();
    } catch (err) {
      setError(messageOf(err));
    }
  }

  async function turnOffTwoFactor() {
    setError('');
    setNotice('');
    try {
      const result = record(await disableTwoFactor.mutateAsync({ data: { password: twoFactorPassword } }));
      setTwoFactorPassword('');
      setNotice(first(result, ['message'], 'Two-factor authentication is disabled.'));
      await refreshSecurity();
    } catch (err) {
      setError(messageOf(err));
    }
  }

  function removeSession(id: string, current: boolean) {
    if (current) {
      setError('To end the current app session, sign out from Profile.');
      return;
    }
    Alert.alert('Remove this device?', 'This device will need to sign in again before it can access the account.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove device', style: 'destructive', onPress: () => void revokeSession.mutateAsync({ id }).then(refreshSecurity).catch(err => setError(messageOf(err))) },
    ]);
  }

  function removeOtherSessions() {
    Alert.alert('Sign out other devices?', 'All other browser and app sessions will be revoked. This device stays signed in.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out others', style: 'destructive', onPress: () => void revokeOthers.mutateAsync().then(refreshSecurity).catch(err => setError(messageOf(err))) },
    ]);
  }

  if (!token) return <BuyerAuthGate title="Security & settings" body="Sign in to manage your password, two-factor authentication, active devices, and account activity." returnTo="/buyer-security" />;

  const tabs: [SecurityTab, string][] = [
    ['account', 'Password & 2FA'],
    ['devices', 'Devices'],
    ['activity', 'Audit log'],
  ];

  return (
    <Screen title="Security & settings" subtitle="Protect your buyer account" refreshable>
      <View style={{ flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: colors.secondary, marginBottom: 14 }}>
        {tabs.map(([value, label]) => (
          <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: tab === value }} onPress={() => setTab(value)} style={{ flex: 1, minHeight: 39, borderRadius: 11, justifyContent: 'center', alignItems: 'center', backgroundColor: tab === value ? colors.card : 'transparent', borderWidth: tab === value ? 1 : 0, borderColor: colors.border }}>
            <Text style={{ color: tab === value ? colors.primary : colors.mutedForeground, fontSize: 10, fontWeight: '800' }}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {error ? <Text accessibilityRole="alert" style={{ color: colors.destructive, fontSize: 12, lineHeight: 18, marginBottom: 9 }}>{error}</Text> : null}
      {notice ? <Text accessibilityLiveRegion="polite" style={{ color: colors.primary, fontSize: 12, lineHeight: 18, marginBottom: 9 }}>{notice}</Text> : null}

      {tab === 'account' ? (
        <>
          <Card style={{ padding: 14, marginBottom: 12 }}>
            <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800', marginBottom: 8 }}>Change sign-in password</Text>
            <Field label="Current password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry autoCapitalize="none" />
            <Field label="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry autoCapitalize="none" />
            <Field label="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoCapitalize="none" />
            <Action title="Update password" icon="key" loading={changePassword.isPending} onPress={() => void savePassword()} />
          </Card>

          <Card style={{ padding: 14, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800' }}>Two-factor authentication</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 17, marginTop: 4 }}>Use a verification code sent to the email address on your account when signing in.</Text>
              </View>
              <Status value={twoFactorQuery.isLoading ? 'Loading' : enabled ? 'Enabled' : 'Disabled'} />
            </View>
            {twoFactorQuery.isError ? <Text style={{ color: colors.destructive, fontSize: 11, marginTop: 8 }}>Two-factor status could not be loaded.</Text> : null}
            {!enabled && !setupRequested ? (
              <>
                <Field label="Confirm account password" value={twoFactorPassword} onChangeText={setTwoFactorPassword} secureTextEntry autoCapitalize="none" />
                <Action title="Set up email verification" icon="shield" loading={requestTwoFactor.isPending} disabled={!twoFactorPassword} onPress={() => void startTwoFactor()} />
              </>
            ) : null}
            {setupRequested ? (
              <>
                <Field label="Six-digit email code" value={code} onChangeText={value => setCode(value.replace(/\D/g, '').slice(0, 6))} keyboardType="numeric" />
                <Action title="Confirm and enable" icon="check" loading={confirmTwoFactor.isPending} disabled={code.length !== 6} onPress={() => void confirmTwoFactorSetup()} />
                <Action title="Cancel setup" secondary onPress={() => { setSetupRequested(false); setCode(''); }} />
              </>
            ) : null}
            {enabled && !setupRequested ? (
              <>
                <Field label="Confirm account password to disable" value={twoFactorPassword} onChangeText={setTwoFactorPassword} secureTextEntry autoCapitalize="none" />
                <Action title="Disable two-factor authentication" icon="shield-off" secondary loading={disableTwoFactor.isPending} disabled={!twoFactorPassword} onPress={() => void turnOffTwoFactor()} />
              </>
            ) : null}
          </Card>

          <Card style={{ padding: 14 }}>
            <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '800' }}>Notification inbox</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 17, marginTop: 4 }}>Review and mark buyer account updates as read.</Text>
            <Action title="Open notifications" icon="bell" secondary onPress={() => router.push('/buyer-notifications')} />
          </Card>
        </>
      ) : null}

      {tab === 'devices' ? (
        <>
          {sessionsQuery.isLoading ? <LoadingCard label="Loading active devices…" lines={3} /> : null}
          {sessionsQuery.isError ? <Text style={{ color: colors.destructive, fontSize: 12 }}>Active devices could not be loaded.</Text> : null}
          {sessions.length === 0 && sessionsQuery.isSuccess ? <EmptyState title="No device sessions found" body="Your signed-in browsers and mobile devices will appear here." icon="smartphone" /> : null}
          {sessions.map((session, index) => {
            const id = first(session, ['id']);
            const current = session.is_current === true;
            return (
              <Card key={id || String(index)} style={{ padding: 13, marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '800' }}>{first(session, ['device', 'session_type'], 'Signed-in device')}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 4 }}>{first(session, ['session_type'], 'Account session')} · {first(session, ['last_activity_human'], displayDate(first(session, ['last_activity'])))}</Text>
                  </View>
                  {current ? <Status value="This device" /> : null}
                </View>
                {first(session, ['ip']) ? <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 6 }}>IP address: {first(session, ['ip'])}</Text> : null}
                {!current ? <Pressable accessibilityRole="button" disabled={revokeSession.isPending} onPress={() => removeSession(id, current)} style={{ minHeight: 35, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 4 }}>
                  <Text style={{ color: colors.destructive, fontSize: 10, fontWeight: '800' }}>Remove device</Text>
                </Pressable> : null}
              </Card>
            );
          })}
          {sessions.length > 1 ? <Action title="Sign out all other devices" icon="log-out" secondary loading={revokeOthers.isPending} onPress={removeOtherSessions} /> : null}
        </>
      ) : null}

      {tab === 'activity' ? (
        <>
          {activityQuery.isLoading ? <LoadingCard label="Loading account activity…" lines={3} /> : null}
          {activityQuery.isError ? <Text style={{ color: colors.destructive, fontSize: 12 }}>The audit log could not be loaded.</Text> : null}
          {activity.length === 0 && activityQuery.isSuccess ? <EmptyState title="No security events yet" body="Sign-ins and security changes will be recorded here." icon="list" /> : null}
          {activity.map((item, index) => (
            <Card key={first(item, ['id'], String(index))} style={{ padding: 12, marginBottom: 8 }}>
              <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '700' }}>{activityLabel(first(item, ['action']))}</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 5 }}>{displayDate(first(item, ['created_at']))}</Text>
              {first(item, ['ip']) ? <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 4 }}>IP address: {first(item, ['ip'])}</Text> : null}
            </Card>
          ))}
        </>
      ) : null}
    </Screen>
  );
}
