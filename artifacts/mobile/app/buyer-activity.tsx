import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import {
  getGetBuyerDocumentsQueryKey,
  getGetBuyerOrdersQueryKey,
  getGetBuyerQuotationsQueryKey,
  getGetBuyerRfqsQueryKey,
  getGetBuyerShipmentsQueryKey,
  useGetBuyerDocuments,
  useGetBuyerOrders,
  useGetBuyerQuotations,
  useGetBuyerRfqs,
  useGetBuyerShipments,
} from '@workspace/api-client-react';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { Card, EmptyState, ErrorState, LoadingCard, Screen } from '@/components/InvestorUI';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useAppPreferences } from '@/context/AppPreferencesContext';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { rowsFromResponse } from '@/lib/buyer-data';
import {
  buildBuyerTradeActivity,
  buyerActivityHasMore,
  formatBuyerActivityDateTime,
  mergeBuyerActivitySources,
  type BuyerActivitySources,
} from '@/lib/buyer-trade-activity';

const PAGE_SIZE = 50;
const EMPTY_SOURCES: BuyerActivitySources = {
  orders: [],
  rfqs: [],
  quotations: [],
  shipments: [],
  documents: [],
};

export default function BuyerActivity() {
  const colors = useColors();
  const { token } = useAuth();
  const { preferences } = useAppPreferences();
  const dateLocale = preferences.language === 'ur' ? 'ur-PK' : preferences.language === 'ar' ? 'ar' : 'en-US';
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState<BuyerActivitySources>(EMPTY_SOURCES);
  const [hasOlder, setHasOlder] = useState(false);

  const params = { per_page: PAGE_SIZE, page };
  const ordersQuery = useGetBuyerOrders(params, {
    query: { queryKey: getGetBuyerOrdersQueryKey(params), enabled: !!token, staleTime: 30_000 },
  });
  const rfqsQuery = useGetBuyerRfqs(params, {
    query: { queryKey: getGetBuyerRfqsQueryKey(params), enabled: !!token, staleTime: 30_000 },
  });
  const quotationsQuery = useGetBuyerQuotations(params, {
    query: { queryKey: getGetBuyerQuotationsQueryKey(params), enabled: !!token, staleTime: 30_000 },
  });
  const shipmentsQuery = useGetBuyerShipments(params, {
    query: { queryKey: getGetBuyerShipmentsQueryKey(params), enabled: !!token, staleTime: 30_000 },
  });
  const documentsQuery = useGetBuyerDocuments(params, {
    query: { queryKey: getGetBuyerDocumentsQueryKey(params), enabled: !!token, staleTime: 30_000 },
  });

  const queries = [ordersQuery, rfqsQuery, quotationsQuery, shipmentsQuery, documentsQuery];
  const responses = useMemo(() => ({
    orders: ordersQuery.data,
    rfqs: rfqsQuery.data,
    quotations: quotationsQuery.data,
    shipments: shipmentsQuery.data,
    documents: documentsQuery.data,
  }), [ordersQuery.data, rfqsQuery.data, quotationsQuery.data, shipmentsQuery.data, documentsQuery.data]);
  const currentSources = useMemo<BuyerActivitySources>(() => ({
    orders: rowsFromResponse(ordersQuery.data),
    rfqs: rowsFromResponse(rfqsQuery.data),
    quotations: rowsFromResponse(quotationsQuery.data),
    shipments: rowsFromResponse(shipmentsQuery.data),
    documents: rowsFromResponse(documentsQuery.data),
  }), [ordersQuery.data, rfqsQuery.data, quotationsQuery.data, shipmentsQuery.data, documentsQuery.data]);
  const pageSettled = queries.every(query => query.data !== undefined || query.isError);

  useEffect(() => {
    if (!token || !pageSettled) return;
    setHistory(current => mergeBuyerActivitySources(page === 1 ? EMPTY_SOURCES : current, currentSources));
    setHasOlder(buyerActivityHasMore(responses, currentSources, PAGE_SIZE));
  }, [token, page, pageSettled, currentSources, responses]);

  const activity = useMemo(() => buildBuyerTradeActivity(history), [history]);
  const firstError = queries.find(query => query.isError)?.error;
  const currentPageHasRows = Object.values(currentSources).some(rows => rows.length > 0);
  const loadingFirstPage = page === 1
    && activity.length === 0
    && (queries.some(query => query.isLoading) || (pageSettled && currentPageHasRows && !firstError));
  const loadingOlderPage = page > 1 && queries.some(query => query.isLoading);

  if (!token) {
    return <BuyerAuthGate title="Trade activity" body="Sign in to view your full orders, quote requests, shipment updates, and trade documents." returnTo="/buyer-activity" />;
  }

  const retry = () => {
    queries.forEach(query => { void query.refetch(); });
  };

  return (
    <Screen title="Trade activity" subtitle="Your orders, RFQs, quotations, shipments, and documents" refreshable>
      {activity.length ? (
        <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: '700', marginBottom: 10 }}>
          {activity.length} {activity.length === 1 ? 'entry' : 'entries'} loaded
        </Text>
      ) : null}

      {loadingFirstPage ? <LoadingCard label="Loading your trade history…" lines={4} /> : null}
      {firstError ? (
        <ErrorState
          message={activity.length ? 'Some trade activity could not be loaded.' : 'Trade activity could not be loaded.'}
          error={firstError}
          onRetry={retry}
        />
      ) : null}
      {!loadingFirstPage && !firstError && pageSettled && activity.length === 0 && !currentPageHasRows ? (
        <EmptyState title="No trade activity yet" body="Your orders, quote requests, shipment updates, and trade documents will appear here." icon="activity" />
      ) : null}

      {activity.map(item => (
        <Pressable
          key={item.id}
          testID={`buyer-trade-activity-${item.id}`}
          accessibilityRole="button"
          accessibilityLabel={`${item.title}. ${item.description}. ${formatBuyerActivityDateTime(item.timestamp, dateLocale)}`}
          onPress={() => router.push(item.route as never)}
        >
          <Card style={{ padding: 13, marginBottom: 9 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <View style={{ width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lightGreen }}>
                <Feather name={item.icon} size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '800' }}>{item.title}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: 3 }}>{item.description}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 }}>
                  <Feather name="clock" size={11} color={colors.primary} />
                  <Text style={{ color: colors.mutedForeground, fontSize: 9, fontWeight: '600' }}>
                    {formatBuyerActivityDateTime(item.timestamp, dateLocale)}
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
            </View>
          </Card>
        </Pressable>
      ))}

      {loadingOlderPage ? <LoadingCard label="Loading older activity…" /> : null}
      {!firstError && hasOlder && !loadingOlderPage ? (
        <Pressable
          testID="buyer-trade-activity-load-older"
          accessibilityRole="button"
          onPress={() => setPage(current => current + 1)}
          style={{ minHeight: 44, marginBottom: 14, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>Load older activity</Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}
