import React, { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { AuthBrandHeader } from '@/components/AuthBrandHeader';
import { LocalizedText as Text, LocalizedTextInput as TextInput } from '@/components/LocalizedText';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { Action, Card } from '@/components/InvestorUI';
import { useAuth } from '@/context/AuthContext';
import { messageOf, record } from '@/lib/data';
import { useBuyerRegister } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MOTION, MotionReveal, motionHaptic } from '@/lib/motion';
import { goBackOrReplace } from '@/lib/safe-navigation';
import { normalizeAuthResponse, readEmailVerificationChallenge } from '@/lib/auth-response';
import { hasBuyerAccount, postAuthRouteForAccount } from '@/lib/account-role';
import { RouteBrandBackdrop } from "@/components/GlassSurface";
import { buyerRegistrationPayload, validateBuyerRegistration } from '@/lib/buyer-registration';

type RegisterFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoComplete?: 'name' | 'email' | 'tel' | 'new-password';
  textContentType?: 'name' | 'emailAddress' | 'telephoneNumber' | 'newPassword';
  autoCapitalize?: 'none' | 'words';
  required?: boolean;
  secureTextEntry?: boolean;
  trailing?: React.ReactNode;
};

function RegisterField({
  label,
  value,
  placeholder,
  focused,
  onFocus,
  onBlur,
  onChangeText,
  keyboardType = 'default',
  autoComplete,
  textContentType,
  autoCapitalize = 'none',
  required = false,
  secureTextEntry = false,
  trailing,
}: RegisterFieldProps) {
  const colors = useColors();
  return (
    <View style={s.field}>
      <Text style={[s.label, { color: colors.mutedForeground }]}>
        {label}
        {required ? <Text style={{ color: colors.destructive }}> *</Text> : null}
      </Text>
      <View style={[
        s.inputShell,
        { borderBottomColor: focused ? colors.primary : colors.border },
        focused ? s.inputShellFocused : null,
      ]}>
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          autoComplete={autoComplete}
          textContentType={textContentType}
          secureTextEntry={secureTextEntry}
          selectionColor={colors.primary}
          underlineColorAndroid="transparent"
          style={[s.input, { color: colors.foreground, outlineWidth: 0 }]}
        />
        {trailing}
      </View>
    </View>
  );
}

export default function Register() {
  const { apiOrigin, setChallenge, acceptSession } = useAuth();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const postAuthPath = Array.isArray(returnTo) ? returnTo[0] : returnTo;
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const mutation = useBuyerRegister({ request: { timeoutMs: 45000, responseType: 'json' } });
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [focusedField, setFocusedField] = useState<'fullName' | 'email' | 'password' | 'confirmPassword' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const passwordRequirements = [
    { label: '8–128 characters', met: password.length >= 8 && password.length <= 128 },
    { label: 'Uppercase and lowercase letters', met: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: 'At least one number', met: /\d/.test(password) },
    { label: 'At least one symbol', met: /[^A-Za-z0-9\s]/.test(password) },
  ];

  async function submit() {
    setError('');
    const validation = validateBuyerRegistration({ fullName, email, password, confirmPassword });
    if (validation) {
      setError({
        name_required: 'Enter your full name.',
        email_required: 'Enter your email address.',
        email_invalid: 'Enter a valid email address.',
        password_weak: 'Use 8–128 characters with uppercase and lowercase letters, a number, and a symbol.',
        password_mismatch: 'Passwords do not match.',
      }[validation]);
      return;
    }
    if (!apiOrigin) {
      setError('The OG Exports service is not configured for this app. Contact support.');
      return;
    }
    try {
      const response = await mutation.mutateAsync({
        data: buyerRegistrationPayload({ fullName, email, password, confirmPassword }),
      });
      const result = normalizeAuthResponse(response);
      const sessionToken = typeof result.token === 'string' ? result.token.trim() : '';
      const sessionUser = record(result.user);
      if (sessionToken && Object.keys(sessionUser).length > 0) {
        if (!hasBuyerAccount(sessionUser)) {
          throw new Error('The server returned a non-buyer account. Your buyer account was not signed in; contact OG Exports support.');
        }
        await acceptSession(sessionToken, sessionUser);
        router.replace(postAuthRouteForAccount(sessionUser, postAuthPath));
        return;
      }
      const verification = readEmailVerificationChallenge(response);
      if (!verification) {
        throw new Error('The server did not confirm email verification or return a buyer sign-in session.');
      }
      setChallenge({
        email: verification.email || email.trim(),
        mode: 'email',
        message: verification.message,
        ...(postAuthPath ? { returnTo: postAuthPath } : {}),
      });
      router.replace('/(auth)/verify');
    } catch (err) {
      const challenge = readEmailVerificationChallenge(record(err).data);
      if (challenge) {
        setChallenge({
          ...challenge,
          mode: 'email',
          ...(postAuthPath ? { returnTo: postAuthPath } : {}),
        });
        router.replace('/(auth)/verify');
        return;
      }
      motionHaptic('error');
      setError(messageOf(err));
    }
  }

  const topInset = Platform.OS === 'web' ? 72 : Platform.OS === 'ios' ? insets.top : insets.top + 10;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom + 24;
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}><RouteBrandBackdrop /><KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: 'transparent' }}
      contentInsetAdjustmentBehavior="never"
      contentContainerStyle={[s.container, { paddingTop: topInset, paddingBottom: bottomInset }]}
      bottomOffset={72}
      keyboardShouldPersistTaps="handled"
    >
      <View style={s.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={10}
          onPress={() => goBackOrReplace('/(auth)/login')}
          style={s.backButton}
        >
          <Feather name="arrow-left" size={21} color={colors.primary} />
        </Pressable>
        <AuthBrandHeader />
      </View>

      <MotionReveal delay={MOTION.revealStagger}>
        <View style={s.intro}>
          <Text style={[s.title, { color: colors.foreground }]}>Create buyer account</Text>
          <Text style={[s.subtitle, { color: colors.mutedForeground }]}>
            Join OG Exports to request quotes and manage your orders.
          </Text>
        </View>
      </MotionReveal>

      <MotionReveal delay={MOTION.revealStagger * 2}>
      <View style={s.form}>
        <Card style={s.registerCard}>
        <RegisterField
          label="FULL NAME"
          value={fullName}
          onChangeText={value => { setFullName(value); setError(''); }}
          placeholder="Your full name"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          focused={focusedField === 'fullName'}
          onFocus={() => setFocusedField('fullName')}
          onBlur={() => setFocusedField(null)}
          required
        />
        <RegisterField
          label="EMAIL ADDRESS"
          value={email}
          onChangeText={value => { setEmail(value); setError(''); }}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          focused={focusedField === 'email'}
          onFocus={() => setFocusedField('email')}
          onBlur={() => setFocusedField(null)}
          required
        />
        <RegisterField
          label="PASSWORD"
          value={password}
          onChangeText={value => { setPassword(value); setError(''); }}
          placeholder="Create a strong password"
          autoComplete="new-password"
          textContentType="newPassword"
          secureTextEntry={!showPassword}
          focused={focusedField === 'password'}
          onFocus={() => setFocusedField('password')}
          onBlur={() => setFocusedField(null)}
          required
          trailing={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              hitSlop={8}
              onPress={() => setShowPassword(value => !value)}
              style={s.visibilityButton}
            >
              <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.mutedForeground} />
            </Pressable>
          }
        />
        <RegisterField
          label="CONFIRM PASSWORD"
          value={confirmPassword}
          onChangeText={value => { setConfirmPassword(value); setError(''); }}
          placeholder="Re-enter your password"
          autoComplete="new-password"
          textContentType="newPassword"
          secureTextEntry={!showConfirmPassword}
          focused={focusedField === 'confirmPassword'}
          onFocus={() => setFocusedField('confirmPassword')}
          onBlur={() => setFocusedField(null)}
          required
          trailing={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
              hitSlop={8}
              onPress={() => setShowConfirmPassword(value => !value)}
              style={s.visibilityButton}
            >
              <Feather name={showConfirmPassword ? 'eye-off' : 'eye'} size={18} color={colors.mutedForeground} />
            </Pressable>
          }
        />
        <View style={s.passwordRequirements} accessibilityLabel="Password requirements">
          {passwordRequirements.map(requirement => (
            <View key={requirement.label} style={s.passwordRequirement}>
              <Feather
                name={requirement.met ? 'check-circle' : 'circle'}
                size={13}
                color={requirement.met ? colors.primary : colors.mutedForeground}
              />
              <Text style={[s.passwordRequirementText, { color: requirement.met ? colors.primary : colors.mutedForeground }]}>
                {requirement.label}
              </Text>
            </View>
          ))}
        </View>
        <Text style={[s.verificationHint, { color: colors.mutedForeground }]}>
          We’ll email you a verification code to finish creating your account.
        </Text>
        {error ? (
          <View style={s.errorRow}>
            <Feather name="alert-circle" size={16} color={colors.destructive} />
            <Text accessibilityRole="alert" style={[s.errorText, { color: colors.destructive }]}>{error}</Text>
          </View>
        ) : null}
        <Action
          title="Create buyer account"
          loading={mutation.isPending}
          disabled={!fullName.trim() || !email.trim() || !password || !confirmPassword}
          onPress={() => void submit()}
          testID="buyer-register-submit"
        />
        </Card>
      </View>
      </MotionReveal>

      <View style={s.footer}>
        <Text style={[s.footerText, { color: colors.mutedForeground }]}>Already have an account?</Text>
        <Pressable accessibilityRole="link" onPress={() => router.replace(postAuthPath
          ? { pathname: '/(auth)/login', params: { returnTo: postAuthPath } }
          : '/(auth)/login'
        )}>
          <Text style={[s.footerLink, { color: colors.primary }]}>Sign in</Text>
        </Pressable>
      </View>
    </KeyboardAwareScrollViewCompat></View>
  );
}

const s = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 28 },
  topBar: { minHeight: 150, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  backButton: { position: 'absolute', left: 0, top: 0, width: 42, height: 46, alignItems: 'flex-start', justifyContent: 'center', zIndex: 1 },
  intro: { alignItems: 'center', marginBottom: 22 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.6 },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: 6, textAlign: 'center' },
  form: { width: '100%' },
  registerCard: { padding: 18, marginBottom: 14 },
  field: { gap: 5, marginBottom: 15 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.65 },
  inputShell: { minHeight: 46, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingHorizontal: 4 },
  inputShellFocused: { borderBottomWidth: 1.5 },
  input: { flex: 1, minWidth: 0, paddingVertical: 10, fontSize: 16 },
  visibilityButton: { padding: 5 },
  passwordRequirements: { gap: 5, marginTop: -7, marginBottom: 12, marginLeft: 2 },
  passwordRequirement: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  passwordRequirementText: { fontSize: 11, lineHeight: 15 },
  verificationHint: { fontSize: 12, lineHeight: 17, marginTop: 2, marginBottom: 14 },
  errorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 14 },
  errorText: { flex: 1, fontSize: 12, lineHeight: 18 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 16 },
  footerText: { fontSize: 13 },
  footerLink: { fontSize: 13, fontWeight: '700' },
});