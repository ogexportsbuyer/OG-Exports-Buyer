import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Platform, Pressable, StatusBar as NativeStatusBar, View } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Redirect, router, Stack, useGlobalSearchParams, usePathname, useSegments, type Href } from 'expo-router';
import { isRunningInExpoGo } from 'expo';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import type { NotificationResponse } from 'expo-notifications';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AppPreferencesProvider, useAppPreferences } from '@/context/AppPreferencesContext';
import { useColors } from '@/hooks/useColors';
import { serializeRouteState } from '@/lib/post-auth-route';
import { notificationHref } from '@/lib/notification-routing';
import { record } from '@/lib/data';
import { translateUi } from '@/lib/strings';
import { MOTION, MotionProvider, useMotion } from '@/lib/motion';
import { goBackOrReplace } from '@/lib/safe-navigation';
import { homeRouteForAccount, hasBuyerAccount } from '@/lib/account-role';
import { isBuyerAppRoute } from '@/lib/post-auth-route';
import { BuyerAccountRequired } from '@/components/BuyerAccountRequired';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { reduceMotion } = useMotion();
  const { ready, token, user, apiOrigin, appUnlocked } = useAuth();
  const sessionQueryClient = useQueryClient();
  const { isRTL, preferences, resolvedAppearance } = useAppPreferences();
  const colors = useColors();
  const t = (value: string) => translateUi(value, preferences.language);
  const segments = useSegments();
  const isHomeRoute = segments[0] === '(buyer-tabs)' && segments[1] === 'buyer-home';
  const isDarkStatusBar = resolvedAppearance === 'dark';
  const useLightStatusBar = isHomeRoute || isDarkStatusBar;
  const statusBar = Platform.OS === 'android'
    ? <NativeStatusBar barStyle={useLightStatusBar ? 'light-content' : 'dark-content'} />
    : <ExpoStatusBar style={useLightStatusBar ? 'light' : 'dark'} />;
  const safeBackButton = (fallbackHref: Href, testID: string) => () => (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={t('Back')}
      hitSlop={10}
      onPress={() => goBackOrReplace(fallbackHref)}
      style={{ minWidth: 40, minHeight: 44, justifyContent: 'center', paddingRight: 8 }}
    >
      <Feather name={isRTL ? 'arrow-right' : 'arrow-left'} size={21} color={colors.primary} />
    </Pressable>
  );
  const pathname = usePathname();
  const routeParams = useGlobalSearchParams();
  const returnTo = serializeRouteState(pathname, routeParams);
  const firstSegment = String(segments[0] ?? '');
  const publicSegments = new Set(['', 'index', '(auth)', 'forgot-password', '(buyer-tabs)', 'buyer-product']);
  const routeAllowed = isBuyerAppRoute(firstSegment, pathname);
  const accountId = String(record(user).id ?? record(user).user_id ?? '');
  const sessionScope = token ? `${apiOrigin}|${accountId || 'authenticated'}` : 'signed-out';
  const previousSessionScope = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!ready) return;
    // Query keys are shared across accounts; never reuse another user's cached data.
    if (previousSessionScope.current !== undefined && previousSessionScope.current !== sessionScope) {
      sessionQueryClient.clear();
    }
    previousSessionScope.current = sessionScope;
  }, [ready, sessionScope, sessionQueryClient]);

  useEffect(() => {
    if (Platform.OS === 'web' || (Platform.OS === 'android' && isRunningInExpoGo())) return;
    let active = true;
    let subscription: { remove: () => void } | undefined;
    const handledResponses = new Set<string>();
    const handleResponse = (notificationsApi: typeof import('expo-notifications'), response: NotificationResponse) => {
      if (!active) return;
      const request = response.notification.request;
      const responseKey = `${request.identifier}:${response.actionIdentifier}`;
      if (handledResponses.has(responseKey)) return;
      handledResponses.add(responseKey);
      if (handledResponses.size > 10) handledResponses.clear();
      void notificationsApi.clearLastNotificationResponseAsync();
      const data = record(request.content.data);
      router.push(notificationHref(data) ?? '/account/notifications');
    };
    void import('expo-notifications').then(notificationsApi => {
      if (!active) return;
      notificationsApi.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
      if (Platform.OS === 'android') {
        void notificationsApi.setNotificationChannelAsync('og-exports-updates', {
          name: 'OG Exports updates',
          importance: notificationsApi.AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
          lockscreenVisibility: notificationsApi.AndroidNotificationVisibility.PUBLIC,
        }).catch(() => undefined);
      }
      subscription = notificationsApi.addNotificationResponseReceivedListener(response => handleResponse(notificationsApi, response));
      return notificationsApi.getLastNotificationResponseAsync().then(response => {
        if (response) handleResponse(notificationsApi, response);
      });
    }).catch(() => undefined);
    return () => {
      active = false;
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (token && !hasBuyerAccount(user)) return;
    if (token && !appUnlocked && firstSegment !== 'lock' && firstSegment !== '(auth)') {
      router.replace({ pathname: '/lock', params: { returnTo } });
    }
  }, [ready, token, user, appUnlocked, firstSegment, returnTo]);

  if (!ready && (!routeAllowed || !publicSegments.has(firstSegment))) {
    return <>
      {statusBar}
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    </>;
  }
  if (ready && token && !hasBuyerAccount(user)) {
    return <>{statusBar}<BuyerAccountRequired /></>;
  }
  if (ready && (!routeAllowed || (!token && !publicSegments.has(firstSegment)))) {
    return <Redirect href={token
      ? homeRouteForAccount(user)
      : { pathname: '/(auth)/login', params: { returnTo } }
    } />;
  }

  if (token && !appUnlocked) {
    return <>
      {statusBar}
      <Stack screenOptions={{ headerShown: false, animation: reduceMotion ? 'fade' : 'slide_from_right', animationDuration: MOTION.page, contentStyle: { backgroundColor: colors.background, direction: isRTL ? 'rtl' : 'ltr' } }}>
        <Stack.Screen name="lock" />
        <Stack.Screen name="(auth)" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
    </>;
  }

  return (
    <>
      {statusBar}
      <Stack screenOptions={{
        animation: reduceMotion ? 'fade' : 'slide_from_right',
        animationDuration: MOTION.page,
        gestureEnabled: true,
        headerBackTitle: t('Back'),
        headerTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.foreground },
        headerLeft: safeBackButton('/(buyer-tabs)/buyer-home', 'stack-header-back'),
        contentStyle: { backgroundColor: colors.background, direction: isRTL ? 'rtl' : 'ltr' },
      }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="lock" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{
          title: t('Reset password'),
          presentation: 'formSheet',
          headerShown: false,
          sheetAllowedDetents: [0.82, 1],
          sheetInitialDetentIndex: 0,
          sheetGrabberVisible: true,
          sheetCornerRadius: 28,
          sheetElevation: 16,
          sheetExpandsWhenScrolledToEdge: true,
        }} />
        <Stack.Screen name="(buyer-tabs)" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="buyer-product/[id]" options={{ title: t('Product details') }} />
        <Stack.Screen name="buyer-cart" options={{ headerShown: false }} />
        <Stack.Screen name="buyer-checkout" options={{ title: t('Checkout') }} />
        <Stack.Screen name="buyer-orders" options={{ headerShown: false }} />
        <Stack.Screen name="buyer-order/[id]" options={{ title: t('Order details') }} />
        <Stack.Screen name="buyer-quotation/[id]" options={{ title: t('Quotation') }} />
        <Stack.Screen name="buyer-overview" options={{ title: t('Executive dashboard') }} />
        <Stack.Screen name="buyer-analytics" options={{ title: t('Analytics') }} />
        <Stack.Screen name="buyer-profile-details" options={{ title: t('My profile') }} />
        <Stack.Screen name="buyer-company" options={{ title: t('Company profile') }} />
        <Stack.Screen name="buyer-security" options={{ title: t('Security & devices') }} />
        <Stack.Screen name="buyer-notifications" options={{ title: t('Notifications') }} />
        <Stack.Screen name="buyer-system-settings" options={{ title: t('System settings') }} />
        <Stack.Screen name="buyer-repeat-orders" options={{ title: t('Repeat orders') }} />
        <Stack.Screen name="buyer-rfq" options={{ title: t('Request a quotation') }} />
        <Stack.Screen name="buyer-rfq/[id]" options={{ title: t('Quotation request') }} />
        <Stack.Screen name="buyer-shipments" options={{ title: t('Shipment tracking') }} />
        <Stack.Screen name="buyer-shipment/[id]" options={{ title: t('Shipment details') }} />
        <Stack.Screen name="buyer-documents" options={{ title: t('Trade documents') }} />
        <Stack.Screen name="buyer-trade-finance" options={{ title: t('Trade finance') }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="project/[id]" options={{
          title: t('Opportunity'),
          headerLeft: safeBackButton('/(tabs)/trade', 'project-header-back'),
        }} />
        <Stack.Screen name="position/[id]" options={{ title: t('Investment') }} />
        <Stack.Screen name="tracking/[id]" options={{ title: t('Container tracking') }} />
        <Stack.Screen name="account/profile" options={{ title: '' }} />
        <Stack.Screen name="account/portfolio" options={{ title: t('Portfolio') }} />
        <Stack.Screen name="account/transactions" options={{ title: t('Transactions') }} />
        <Stack.Screen name="account/transaction/[id]" options={{ title: t('Transaction details') }} />
        <Stack.Screen name="account/security" options={{ title: t('Security & devices') }} />
        <Stack.Screen name="account/legal/[section]" options={{ title: t('Policies') }} />
        <Stack.Screen name="account/data-preferences" options={{ title: t('Data preferences') }} />
        <Stack.Screen name="wallet/deposit" options={{ title: t('Add funds') }} />
        <Stack.Screen name="wallet/withdraw" options={{ title: t('Withdraw') }} />
        <Stack.Screen name="account/kyc" options={{ title: t('Identity verification') }} />
        <Stack.Screen name="account/reports" options={{ title: t('Reports') }} />
        <Stack.Screen name="account/notifications" options={{ title: t('Notifications') }} />
        <Stack.Screen name="account/messages" options={{ title: t('Support') }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView>
            <KeyboardProvider>
              <AuthProvider>
                <AppPreferencesProvider>
                  <MotionProvider>
                    <RootLayoutNav />
                  </MotionProvider>
                </AppPreferencesProvider>
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
