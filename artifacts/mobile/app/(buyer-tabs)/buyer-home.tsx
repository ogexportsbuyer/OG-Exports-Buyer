import React, { useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { Action, Card, EmptyState, ErrorState, Field, LoadingCard, Screen, Section, Status } from '@/components/InvestorUI';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { useGetBuyerOrders, useGetProductCategories, useGetProducts, getGetBuyerOrdersQueryKey, getGetProductCategoriesQueryKey, getGetProductsQueryKey } from '@workspace/api-client-react';
import { amount, first, record } from '@/lib/data';
import { categoryName, displayOrderNumber, displayPrice, rowsFromResponse } from '@/lib/buyer-data';

export default function BuyerHome() {
  const { ready, token, apiOrigin } = useAuth();
  const colors = useColors();
  const [search, setSearch] = useState('');
  const ordersQuery = useGetBuyerOrders({ per_page: 10 }, { query: { queryKey: getGetBuyerOrdersQueryKey({ per_page: 10 }), enabled: ready && !!token && !!apiOrigin, staleTime: 30_000 } });
  const catalogEnabled = ready && !!apiOrigin;
  const productsQuery = useGetProducts({ per_page: 8 }, { query: { queryKey: getGetProductsQueryKey({ per_page: 8 }), enabled: catalogEnabled, retry: false, staleTime: 60_000 } });
  const categoriesQuery = useGetProductCategories({ query: { queryKey: getGetProductCategoriesQueryKey(), enabled: catalogEnabled, retry: false, staleTime: 300_000 } });
  const orders = rowsFromResponse(ordersQuery.data);
  const activeOrders = orders.filter(order => !['completed', 'cancelled', 'delivered'].includes(first(order, ['status']).toLowerCase()));
  const products = rowsFromResponse(productsQuery.data);
  const categories = rowsFromResponse(categoriesQuery.data).map(category => first(category, ['name'])).filter(Boolean).slice(0, 8);

  return (
    <Screen title="Home" subtitle="OG Exports products for global buyers" refreshable>
      <Card style={{ padding: 20, marginBottom: 18 }}>
        <Text style={{ color: colors.accent, fontSize: 10, fontWeight: '700', letterSpacing: 1.4 }}>OG EXPORTS MARKETPLACE</Text>
        <Text style={{ color: colors.foreground, fontSize: 24, lineHeight: 30, fontWeight: '700', marginTop: 8 }}>
          Find export products for your business.
        </Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 19, marginTop: 8 }}>
          Browse products published by OG Exports, request a quote, and follow orders in one place.
        </Text>
        <View style={{ marginTop: 16, gap: 9 }}>
          <Field label="Search products" value={search} onChangeText={setSearch} placeholder="Product, category or origin" />
          <Action title="Search catalogue" icon="search" onPress={() => router.push({ pathname: '/(buyer-tabs)/buyer-products', params: search.trim() ? { search: search.trim() } : {} })} testID="buyer-home-search-products" />
        </View>
      </Card>

      <Section title="Shop by category" right={
        <Pressable accessibilityRole="button" onPress={() => router.push('/(buyer-tabs)/buyer-products')}>
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>View all</Text>
        </Pressable>
      } />
      {!ready ? <LoadingCard label="Connecting to the OG Exports catalogue…" lines={2} /> : null}
      {ready && !apiOrigin ? <ErrorState message="The product catalogue is not connected. Please try again later." /> : null}
      {categoriesQuery.isLoading ? <LoadingCard label="Loading categories…" lines={2} /> : null}
      {categoriesQuery.isError ? <ErrorState message="Product categories could not be loaded." error={categoriesQuery.error} onRetry={() => void categoriesQuery.refetch()} /> : null}
      {ready && !!apiOrigin && !categoriesQuery.isLoading && !categoriesQuery.isError && categories.length === 0 ? (
        <EmptyState title="No categories published" body="Categories will appear here when OG Exports publishes them." icon="grid" />
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 18 }}>
        {categories.map(category => (
          <Pressable
            key={category}
            testID={`buyer-home-category-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/(buyer-tabs)/buyer-products', params: { category } })}
            style={{ width: '48%', minHeight: 60, borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 12, justifyContent: 'center' }}
          >
            <Text numberOfLines={2} style={{ color: colors.foreground, fontSize: 12, fontWeight: '700' }}>{category}</Text>
          </Pressable>
        ))}
      </View>

      <Section title="Recommended products" right={
        <Pressable accessibilityRole="button" onPress={() => router.push('/(buyer-tabs)/buyer-products')}>
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>Browse all</Text>
        </Pressable>
      } />
      {productsQuery.isLoading ? <LoadingCard label="Loading products…" /> : null}
      {productsQuery.isError ? <ErrorState message="Recommended products could not be loaded." error={productsQuery.error} onRetry={() => void productsQuery.refetch()} /> : null}
      {ready && !!apiOrigin && !productsQuery.isLoading && !productsQuery.isError && products.length === 0 ? (
        <EmptyState title="No products published" body="Approved products published by OG Exports will appear here." icon="package" />
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 12 }}>
        {products.slice(0, 6).map((product, index) => {
          const id = first(product, ['id'], `product-${index}`);
          const image = first(product, ['image_url', 'imageUrl']);
          const name = first(product, ['name'], 'Export product');
          return (
            <Pressable key={id} accessibilityRole="button" onPress={() => router.push('/(buyer-tabs)/buyer-products')}>
              <Card style={{ width: 208, padding: 0, overflow: 'hidden' }}>
                {image
                  ? <Image source={{ uri: image }} resizeMode="cover" style={{ height: 118, width: '100%', backgroundColor: colors.secondary }} />
                  : <View style={{ height: 118, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary }}><Text style={{ color: colors.mutedForeground, fontSize: 11 }}>OG Exports product</Text></View>}
                <View style={{ padding: 13 }}>
                  <Text numberOfLines={1} style={{ color: colors.foreground, fontWeight: '700', fontSize: 13 }}>{name}</Text>
                  <Text numberOfLines={1} style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 4 }}>{categoryName(product)} · {first(product, ['origin'], 'Origin not specified')}</Text>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700', marginTop: 9 }}>{displayPrice(product)}</Text>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </ScrollView>

      {token ? (
        <>
          <Section title="Your active orders" right={
            <Pressable accessibilityRole="button" onPress={() => router.push('/(buyer-tabs)/buyer-orders')}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>View all</Text>
            </Pressable>
          } />
          {ordersQuery.isLoading ? <LoadingCard label="Loading orders…" lines={2} /> : null}
          {ordersQuery.isError ? <ErrorState message="Your orders could not be loaded." error={ordersQuery.error} onRetry={() => void ordersQuery.refetch()} /> : null}
          {!ordersQuery.isLoading && !ordersQuery.isError && activeOrders.length === 0
            ? <EmptyState title="No active orders" body="Orders placed from your cart will appear here." icon="package" />
            : null}
          {activeOrders.slice(0, 3).map(order => {
            const id = first(order, ['id']);
            return (
              <Pressable
                key={id || displayOrderNumber(order)}
                testID={`buyer-home-order-${id}`}
                accessibilityRole="button"
                onPress={() => id && router.push(`/buyer-order/${id}`)}
              >
                <Card style={{ padding: 15, marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.foreground, fontWeight: '700' }}>{displayOrderNumber(order)}</Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>
                        {first(order, ['destination_port', 'destination'], 'Destination pending')}
                      </Text>
                    </View>
                    <Status value={first(order, ['status'], 'Pending')} />
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </>
      ) : null}
    </Screen>
  );
}
