import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, useColorScheme } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import {
  getInvestorMe,
  getGetInvestorMeQueryKey,
  useGetExchangeRates,
  useGetInvestorExchangeRates,
  useGetInvestorMe,
  useGetInvestorProfile,
  useUpdateInvestorMe,
  useUpdateInvestorProfile,
} from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { hasBuyerAccount } from '@/lib/account-role';
import { configureMoneyDisplay, first, messageOf, record, unwrap } from '@/lib/data';
import { configureUiLanguage, isRightToLeftLanguage, translateUi } from '@/lib/strings';
import { createPreferenceHydrator, createPreferenceSyncQueue, defaultPreferences, parsePreferences,
  persistPreferences, PreferenceSaveError, preferenceAccountId,
  type AppPreferences, type PreferencePatch } from '@/lib/app-preferences';
export type { AppearancePreference, DisplayCurrency, AppPreferences } from '@/lib/app-preferences';

type PreferencesContextValue = {
  preferences: AppPreferences;
  resolvedAppearance: 'light' | 'dark';
  isRTL: boolean;
  isLoading: boolean;
  isSaving: boolean;
  isSyncing: boolean;
  hasPendingSync: boolean;
  error: string;
  rates: Record<string, number>;
  ratesAsOf: string;
  ratesLoading: boolean;
  ratesError: boolean;
  savePreferences: (patch: Partial<AppPreferences>) => Promise<void>;
  clearError: () => void;
  retryLoading: () => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);
const preferenceStorageKey = (userId: string) => `og-investor-app-preferences:${userId}`;

function normalizeRates(value: unknown, base: string): Record<string, number> {
  const source = record(value);
  const rates: Record<string, number> = {};
  for (const [currency, rawRate] of Object.entries(source)) {
    const rate = typeof rawRate === 'number' ? rawRate : typeof rawRate === 'string' ? Number(rawRate) : Number.NaN;
    if (Number.isFinite(rate) && rate > 0) rates[currency.toUpperCase()] = rate;
  }
  if (base === 'USD') rates.USD = 1;
  return rates;
}

export function AppPreferencesProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const systemAppearance = useColorScheme();
  const isBuyer = hasBuyerAccount(user);
  const authUserId = preferenceAccountId(user);
  const [recoveredOwner, setRecoveredOwner] = useState<{ token: string; id: string } | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const userId = authUserId || (recoveredOwner?.token === token ? recoveredOwner.id : '');
  const [preferences, setPreferences] = useState<AppPreferences>(defaultPreferences);
  const [initializedSession, setInitializedSession] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState('');
  const currentPreferences = useRef<AppPreferences>(defaultPreferences);
  const pendingPreferences = useRef<PreferencePatch>({});
  const savingSession = useRef<string | null>(null);
  const saveRevision = useRef(0);
  const activeSession = `${userId}:${token ?? ''}`;
  const sessionRef = useRef(activeSession);
  sessionRef.current = activeSession;
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const storageWrites = useRef<Promise<void>>(Promise.resolve());
  const store = useCallback((owner: string, next: AppPreferences, pending: PreferencePatch) => {
    const write = storageWrites.current.catch(() => undefined).then(() =>
      AsyncStorage.setItem(preferenceStorageKey(owner), JSON.stringify({ ...next, pendingSync: pending })));
    storageWrites.current = write;
    return write;
  }, []);
  const apply = useCallback((next: AppPreferences, pending: PreferencePatch) => {
    currentPreferences.current = next;
    pendingPreferences.current = pending;
    setPreferences(next);
  }, []);
  const hydration = useMemo(() => createPreferenceHydrator(
    owner => AsyncStorage.getItem(preferenceStorageKey(owner)),
    (_owner, session, snapshot, readError) => {
      if (sessionRef.current !== session) return;
      apply(snapshot.preferences, snapshot.pending);
      setError(readError);
      setInitializedSession(session);
    },
  ), [apply]);
  const queueSync = useMemo(() => createPreferenceSyncQueue(), [activeSession]);
  const preferencesLoaded = initializedSession === activeSession;

  // A legacy/partial saved session may have a token but no top-level user ID.
  // Recover ownership from a fresh authenticated response, never another account's query cache.
  useEffect(() => {
    if (!token || authUserId) return;
    let active = true;
    void getInvestorMe({ timeoutMs: 8000 }).then(response => {
      if (!active || tokenRef.current !== token) return;
      const identity = unwrap(response);
      const id = preferenceAccountId(identity.user ?? identity);
      if (!id) throw new Error('The server did not return your account identity.');
      queryClient.setQueryData(getGetInvestorMeQueryKey(), response);
      setRecoveredOwner({ token, id });
    }).catch(() => {
      if (active && tokenRef.current === token) setError('Account details could not be loaded. Retry loading preferences.');
    });
    return () => { active = false; };
  }, [token, authUserId, queryClient, loadAttempt]);
  const investorProfileQuery = useGetInvestorProfile({
    query: {
      queryKey: ['investor-profile'],
      enabled: Boolean(token && userId && !isBuyer),
      staleTime: 60_000,
    },
  });
  const buyerMeQuery = useGetInvestorMe({
    query: {
      queryKey: getGetInvestorMeQueryKey(),
      enabled: Boolean(token && userId && isBuyer),
      staleTime: 60_000,
    },
  });
  const investorRatesQuery = useGetInvestorExchangeRates({
    query: {
      queryKey: ['investor-display-exchange-rates', userId],
      enabled: Boolean(token && userId && !isBuyer),
      staleTime: 300_000,
      retry: 1,
    },
  });
  const buyerRatesQuery = useGetExchangeRates({
    query: {
      queryKey: ['buyer-display-exchange-rates', userId],
      enabled: Boolean(token && userId && isBuyer),
      staleTime: 300_000,
      retry: 1,
    },
  });
  const { mutateAsync: updateProfile } = useUpdateInvestorProfile({ request: { timeoutMs: 10_000 } });
  const { mutateAsync: updateMe } = useUpdateInvestorMe({ request: { timeoutMs: 10_000 } });
  const buyerMeResponse = unwrap(buyerMeQuery.data);
  const buyerUser = record(buyerMeResponse.user ?? buyerMeResponse);
  const buyerMeta = record(record(buyerUser.profile).meta);
  const profile = isBuyer
    ? { user: buyerUser, preferences: record(buyerMeta.preferences) }
    : unwrap(investorProfileQuery.data);
  const ratesQuery = isBuyer ? buyerRatesQuery : investorRatesQuery;
  const rateResponse = unwrap(ratesQuery.data);
  const rates = normalizeRates(rateResponse.rates, first(rateResponse, ['base']).toUpperCase());
  const ratesAsOf = first(rateResponse, ['as_of', 'updated_at']);
  const isRTL = isRightToLeftLanguage(preferences.language);
  const resolvedAppearance = preferences.appearance === 'system'
    ? systemAppearance === 'dark' ? 'dark' : 'light'
    : preferences.appearance;

  configureMoneyDisplay({
    language: preferences.language,
    currency: preferences.currency,
    rates,
    conversionUnavailableLabel: translateUi('Currency conversion unavailable', preferences.language),
  });
  configureUiLanguage(preferences.language);

  useEffect(() => {
    apply(defaultPreferences, {});
    setInitializedSession(null);
    saveRevision.current += 1;
    savingSession.current = null;
    setIsSaving(false);
    setIsSyncing(false);
    setError('');
    if (!token) setInitializedSession(activeSession);
    else if (userId) void hydration.load(userId, activeSession);
    return () => hydration.invalidate();
  }, [userId, token, activeSession, apply, hydration, loadAttempt]);

  useEffect(() => {
    const response = isBuyer ? buyerMeQuery.data : investorProfileQuery.data;
    if (!preferencesLoaded || !userId || !response) return;
    if (first(record(profile.user), ['id']) !== userId) return;
    const parsed = parsePreferences(profile.preferences);
    const pending = pendingPreferences.current;
    const next = { ...currentPreferences.current, ...parsed, ...pending };
    apply(next, pending);
    if (!savingSession.current) {
      const ownerSession = activeSession;
      void store(userId, next, pending).catch(() => {
        if (sessionRef.current === ownerSession) setError('Account preferences loaded, but could not be cached on this device.');
      });
    }
  }, [preferencesLoaded, isBuyer, buyerMeQuery.data, investorProfileQuery.data, userId, apply, store, activeSession]);

  useEffect(() => {
    if (!preferencesLoaded || Platform.OS !== 'web') return;
    if (typeof document !== 'undefined') {
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = preferences.language;
    }
  }, [preferencesLoaded, preferences.language, isRTL]);

  const savePreferences = useCallback(async (patch: Partial<AppPreferences>) => {
    if (!userId || !token) {
      const error = new Error('Account details could not be loaded. Retry loading preferences.');
      setError(error.message);
      throw error;
    }
    // Do not reject a tap because a ref has not caught up with initialization.
    await hydration.load(userId, activeSession);
    if (sessionRef.current !== activeSession) return;
    const revision = ++saveRevision.current;
    setError('');
    savingSession.current = activeSession;
    setIsSaving(true);
    setIsSyncing(true);
    const isCurrent = () => sessionRef.current === activeSession && saveRevision.current === revision;
    try {
      await persistPreferences({
        current: currentPreferences.current,
        pending: pendingPreferences.current,
        patch, isCurrent, apply,
        stored: () => { if (isCurrent()) setIsSaving(false); },
        store: (next, pending) => store(userId, next, pending),
        sync: preferences => queueSync(isCurrent, async () => {
          const queryKey = isBuyer ? getGetInvestorMeQueryKey() : ['investor-profile'];
          await queryClient.cancelQueries({ queryKey });
          if (!isCurrent()) throw new Error('The signed-in account changed.');
          if (isBuyer) {
            const response = await updateMe({ data: { meta: { preferences } } });
            const saved = unwrap(response);
            const savedUser = record(saved.user ?? saved);
            const savedMeta = record(record(savedUser.profile).meta);
            return {
              data: { preferences: record(savedMeta.preferences) },
              profileResponse: response,
            };
          }
          return updateProfile({ data: { preferences } });
        }),
        confirmed: async response => {
          const queryKey = isBuyer ? getGetInvestorMeQueryKey() : ['investor-profile'];
          await queryClient.cancelQueries({ queryKey });
          const cacheResponse = isBuyer ? record(response).profileResponse ?? response : response;
          if (isCurrent()) queryClient.setQueryData(queryKey, cacheResponse);
        },
      });
    } catch (saveError) {
      if (isCurrent()) {
        const language = currentPreferences.current.language;
        setError(saveError instanceof PreferenceSaveError
          ? `${translateUi(saveError.summary, language)} ${translateUi(saveError.detail, language)}`
          : messageOf(saveError));
      }
      throw saveError;
    } finally {
      if (isCurrent()) {
        savingSession.current = null;
        setIsSaving(false);
        setIsSyncing(false);
      }
    }
  }, [activeSession, apply, hydration, isBuyer, queryClient, queueSync, store, token, updateMe, updateProfile, userId]);

  useEffect(() => {
    if (preferencesLoaded && token && userId && Object.keys(pendingPreferences.current).length) {
      void savePreferences({}).catch(() => { /* A visible sync error and Retry action are provided by Settings. */ });
    }
  }, [preferencesLoaded, token, userId, savePreferences]);

  const hasPendingSync = Object.keys(pendingPreferences.current).length > 0;

  const value = useMemo<PreferencesContextValue>(() => ({
    preferences,
    resolvedAppearance,
    isRTL,
    isLoading: Boolean(token) && (!userId || !preferencesLoaded),
    isSaving,
    isSyncing,
    hasPendingSync,
    error,
    rates,
    ratesAsOf,
    ratesLoading: ratesQuery.isLoading,
    ratesError: ratesQuery.isError,
    savePreferences,
    clearError: () => setError(''),
    retryLoading: () => setLoadAttempt(attempt => attempt + 1),
  }), [
    preferences, resolvedAppearance, isRTL, preferencesLoaded, isSaving, isSyncing, hasPendingSync, userId, token, error,
    rates, ratesAsOf, ratesQuery.isLoading, ratesQuery.isError, savePreferences,
  ]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function useOptionalAppPreferences() {
  return useContext(PreferencesContext);
}

export function useAppPreferences() {
  const value = useOptionalAppPreferences();
  if (!value) throw new Error('useAppPreferences must be used inside AppPreferencesProvider.');
  return value;
}
