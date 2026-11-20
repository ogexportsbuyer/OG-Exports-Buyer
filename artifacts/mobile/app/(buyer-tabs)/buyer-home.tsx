import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { Card, EmptyState, ErrorState, LoadingCard, Screen, Status } from '@/components/InvestorUI';
import BuyerHomeCatalog from '@/components/BuyerHomeCatalog';
import BuyerHomeHeader from '@/components/BuyerHomeHeader';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import {
  getGetBuyerOrdersQueryKey,
  getGetProductCategoriesQueryKey,
  getGetProductsQueryKey,
  useGetBuyerOrders,
  useGetProductCategories,
  useGetProducts,
} from '@workspace/api-client-react';
import { first } from '@/lib/data';
import { displayOrderNumber, rowsFromResponse } from '@/lib/buyer-data';

const styles = StyleSheet.create({
  ordersSection: {
    marginTop: 13,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.7,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    marginTop: 4,
    fontFamily: 'serif',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '400',
    letterSpacing: -0.4,
  },
  textAction: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
});

export default function BuyerHome() {
  const { ready, token, apiOrigin } = useAuth();
  const colors = useColors();
  const [search, setSearch] = useState('');
  const [selectedOrigin, setSelectedOrigin] = useState('Global');
  const ordersQuery = useGetBuyerOrders(
    { per_page: 10 },
    { query: { queryKey: getGetBuyerOrdersQueryKey({ per_page: 10 }), enabled: ready && !!token && !!apiOrigin, staleTime: 30_000 } },
  );
  const catalogEnabled = ready && !!apiOrigin;
  const productsQuery = useGetProducts(
    { per_page: 8 },
    { query: { queryKey: getGetProductsQueryKey({ per_page: 8 }), enabled: catalogEnabled, retry: false, staleTime: 60_000 } },
  );
  const categoriesQuery = useGetProductCategories(
    { query: { queryKey: getGetProductCategoriesQueryKey(), enabled: catalogEnabled, retry: false, staleTime: 300_000 } },
  );
  const orders = rowsFromResponse(ordersQuery.data);
  const activeOrders = orders.filter(order => !['completed', 'cancelled', 'delivered'].includes(first(order, ['status']).toLowerCase()));
  const products = rowsFromResponse(productsQuery.data);
  const categories = rowsFromResponse(categoriesQuery.data).map(category => first(category, ['name'])).filter(Boolean).slice(0, 8);

  function browseProducts(searchTerm = '') {
    const normalized = searchTerm.trim();
    router.push({
      pathname: '/(buyer-tabs)/buyer-products',
      ...(normalized ? { params: { search: normalized } } : {}),
    });
  }

  function openOrders() {
    if (token) {
      router.push('/(buyer-tabs)/buyer-orders');
      return;
    }
    router.push({
      pathname: '/(auth)/login',
      params: { returnTo: '/(buyer-tabs)/buyer-orders' },
    });
  }

  function selectTopTab(label: string) {
    if (label === 'Products') browseProducts(search);
    if (label === 'Worldwide' || label === 'For you') setSelectedOrigin('Global');
  }

  return (
    <Screen title="" hideHeader refreshable>
      <BuyerHomeHeader
        products={products}
        search={search}
        onSearchChange={setSearch}
        onBrowse={browseProducts}
        onOpenCart={() => router.push('/(buyer-tabs)/buyer-cart')}
        onOpenAccount={() => router.push('/(buyer-tabs)/buyer-profile')}
        onSelectTab={selectTopTab}
      />
      <BuyerHomeCatalog
        products={products}
        categories={categories}
        selectedOrigin={selectedOrigin}
        onSelectOrigin={setSelectedOrigin}
        onBrowse={browseProducts}
        onSelectCategory={category => router.push({ pathname: '/(buyer-tabs)/buyer-products', params: { category } })}
        productsLoading={productsQuery.isLoading}
        productsError={productsQuery.isError}
        productsErrorValue={productsQuery.error}
        onRetryProducts={() => void productsQuery.refetch()}
        categoriesLoading={categoriesQuery.isLoading}
        categoriesError={categoriesQuery.isError}
        categoriesErrorValue={categoriesQuery.error}
        onRetryCategories={() => void categoriesQuery.refetch()}
        connectionReady={ready}
        isCatalogConfigured={!!apiOrigin}
      />

      {token ? (
        <View style={styles.ordersSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.eyebrow, { color: colors.accent }]}>Your trade, in view</Text>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Active orders</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={openOrders} style={styles.textAction}>
              <Text style={{ color: colors.foreground, fontSize: 10, fontWeight: '700' }}>View all</Text>
              <Feather name="arrow-up-right" size={13} color={colors.accent} />
            </Pressable>
          </View>
          {ordersQuery.isLoading ? <LoadingCard label="Loading orders…" lines={2} /> : null}
          {ordersQuery.isError ? (
            <ErrorState message="Your orders could not be loaded." error={ordersQuery.error} onRetry={() => void ordersQuery.refetch()} />
          ) : null}
          {!ordersQuery.isLoading && !ordersQuery.isError && activeOrders.length === 0 ? (
            <EmptyState title="No active orders" body="Orders placed from your cart will appear here." icon="package" />
          ) : null}
          {activeOrders.slice(0, 3).map(order => {
            const id = first(order, ['id']);
            return (
              <Pressable
                key={id || displayOrderNumber(order)}
                testID={`buyer-home-order-${id}`}
                accessibilityRole="button"
                onPress={() => id && router.push(`/buyer-order/${id}`)}
              >
                <Card style={{ padding: 14, marginBottom: 9, borderRadius: colors.radius + 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.foreground, fontWeight: '700' }}>{displayOrderNumber(order)}</Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 4 }}>
                        {first(order, ['destination_port', 'destination'], 'Destination pending')}
                      </Text>
                    </View>
                    <Status value={first(order, ['status'], 'Pending')} />
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </Screen>
  );
}
