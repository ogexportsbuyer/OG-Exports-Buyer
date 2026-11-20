import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetBuyerCartQueryKey,
  getGetBuyerOrdersQueryKey,
  getGetProductsQueryKey,
  getGetBuyerRfqsQueryKey,
  useAddBuyerCartItem,
  useGetBuyerOrders,
  useGetProducts,
  useRepeatBuyerOrder,
} from '@workspace/api-client-react';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { Card, EmptyState, ErrorState, LoadingCard, Screen, Status } from '@/components/InvestorUI';
import { BuyerProductCard } from '@/components/BuyerProductCard';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { amount, first, messageOf, record } from '@/lib/data';
import { displayOrderNumber, productMinimumQuantity, rowsFromResponse } from '@/lib/buyer-data';

export default function BuyerRepeatOrders() {
  const colors = useColors();
  const { token, user } = useAuth();
  const client = useQueryClient();
  const { view } = useLocalSearchParams<{ view?: string | string[] }>();
  const requestedView = Array.isArray(view) ? view[0] : view;
  const activeView = requestedView === 'favorites' ? 'favorites' : 'orders';
  const favoritesKey = `buyer-product-favourites:${first(record(user), ['id'], 'guest')}`;
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState('');
  const [addedId, setAddedId] = useState('');
  const query = useGetBuyerOrders({ per_page: 100 }, {
    query: { queryKey: getGetBuyerOrdersQueryKey({ per_page: 100 }), enabled: !!token, staleTime: 30_000 },
  });
  const productsQuery = useGetProducts({ per_page: 100 }, {
    query: { queryKey: getGetProductsQueryKey({ per_page: 100 }), enabled: !!token, staleTime: 60_000 },
  });
  const repeat = useRepeatBuyerOrder();
  const addToCart = useAddBuyerCartItem();
  const orders = rowsFromResponse(query.data);
  const products = rowsFromResponse(productsQuery.data);
  const favoriteProducts = useMemo(() => products.filter(product => favoriteIds.includes(first(product, ['id']))), [favoriteIds, products]);

  useEffect(() => {
    let active = true;
    setFavoriteIds([]);
    AsyncStorage.getItem(favoritesKey).then(value => {
      if (!active || !value) return;
      try {
        const saved: unknown = JSON.parse(value);
        if (Array.isArray(saved)) setFavoriteIds(saved.filter((id): id is string => typeof id === 'string'));
      } catch {
        setFavoriteIds([]);
      }
    }).catch(() => setFavoriteIds([]));
    return () => { active = false; };
  }, [favoritesKey]);

  async function repeatOrder(id: number) {
    setPendingId(id);
    setError('');
    try {
      await repeat.mutateAsync({ id });
      await Promise.all([
        client.invalidateQueries({ queryKey: getGetBuyerRfqsQueryKey() }),
        client.invalidateQueries({ queryKey: getGetBuyerRfqsQueryKey({ per_page: 50 }) }),
      ]);
      router.replace({ pathname: '/(buyer-tabs)/buyer-orders', params: { view: 'rfqs' } });
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setPendingId(null);
    }
  }

  async function toggleFavorite(id: string) {
    const next = favoriteIds.filter(value => value !== id);
    setFavoriteIds(next);
    try {
      await AsyncStorage.setItem(favoritesKey, JSON.stringify(next));
    } catch {
      setError('This saved product could not be removed from your device.');
    }
  }

  async function addFavoriteToCart(product: ReturnType<typeof record>) {
    const productId = amount(product, ['id']);
    if (!productId) {
      setError('This product is missing its catalogue ID and cannot be added to the cart.');
      return;
    }
    setError('');
    try {
      await addToCart.mutateAsync({ data: { product_id: productId, qty: productMinimumQuantity(product) } });
      await client.invalidateQueries({ queryKey: getGetBuyerCartQueryKey() });
      setAddedId(String(productId));
    } catch (err) {
      setError(messageOf(err));
    }
  }

  if (!token) return <BuyerAuthGate title="Repeat orders" body="Sign in to create a new quotation request from a previous order." returnTo="/buyer-repeat-orders" />;

  return (
    <Screen title={activeView === 'favorites' ? 'Saved products' : 'Repeat orders'} subtitle={activeView === 'favorites' ? 'Products saved on this device' : 'Start a new quote request using an earlier trade'} refreshable>
      <View style={{ flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: colors.secondary, marginBottom: 14 }}>
        {([
          ['orders', 'Past orders'],
          ['favorites', `Saved products (${favoriteIds.length})`],
        ] as const).map(([value, label]) => (
          <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: activeView === value }} onPress={() => router.setParams({ view: value })} style={{ flex: 1, minHeight: 39, borderRadius: 11, justifyContent: 'center', alignItems: 'center', backgroundColor: activeView === value ? colors.card : 'transparent', borderWidth: activeView === value ? 1 : 0, borderColor: colors.border }}>
            <Text style={{ color: activeView === value ? colors.primary : colors.mutedForeground, fontSize: 11, fontWeight: '800' }}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {error ? <Text accessibilityRole="alert" style={{ color: colors.destructive, fontSize: 12, lineHeight: 18, marginBottom: 10 }}>{error}</Text> : null}
      {activeView === 'orders' ? (
        <>
      {query.isLoading ? <LoadingCard label="Loading past orders…" lines={3} /> : null}
      {query.isError ? <ErrorState message="Past orders could not be loaded." error={query.error} onRetry={() => void query.refetch()} /> : null}
      {query.isSuccess && orders.length === 0 ? <EmptyState title="No past orders yet" body="Once an order is available, you can start a repeat quotation from it." icon="rotate-ccw" /> : null}
      {orders.map((order, index) => {
        const id = Number(first(order, ['id']));
        const items = Array.isArray(order.items) ? order.items : [];
        const productNames = items.map(item => first(record(item), ['product_name'], first(record(record(item).product), ['name']))).filter(Boolean);
        const total = amount(order, ['total_value_usd', 'total_value']);
        return (
          <Card key={first(order, ['id'], String(index))} style={{ padding: 14, marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '800' }}>{displayOrderNumber(order)}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 4 }}>{first(order, ['created_at', 'placed_at'], 'Date unavailable').slice(0, 10)}</Text>
              </View>
              <Status value={first(order, ['status'], 'Pending')} />
            </View>
            <Text style={{ color: colors.foreground, fontSize: 11, lineHeight: 16, marginTop: 10 }}>
              {productNames.length ? productNames.join(', ') : first(order, ['product_name'], 'Order items')}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>Destination: {first(order, ['destination', 'destination_port'], 'Not recorded')}</Text>
              {total !== null ? <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '800' }}>USD {total.toLocaleString('en-US', { maximumFractionDigits: 0 })}</Text> : null}
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={!Number.isInteger(id) || id <= 0 || pendingId === id}
              onPress={() => Number.isInteger(id) && id > 0 && void repeatOrder(id)}
              style={{ minHeight: 42, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 12 }}
            >
              <Text style={{ color: colors.primaryForeground, fontSize: 11, fontWeight: '800' }}>{pendingId === id ? 'Creating request…' : 'Request repeat quotation'}</Text>
            </Pressable>
          </Card>
        );
      })}
        </>
      ) : (
        <>
          {productsQuery.isLoading ? <LoadingCard label="Loading saved products…" lines={3} /> : null}
          {productsQuery.isError ? <ErrorState message="Saved products could not be loaded." error={productsQuery.error} onRetry={() => void productsQuery.refetch()} /> : null}
          {productsQuery.isSuccess && favoriteProducts.length === 0 ? <EmptyState title="No saved products yet" body="Tap the heart on a product in the catalogue to save it here." icon="heart" /> : null}
          {favoriteProducts.map((product, index) => {
            const id = first(product, ['id'], String(index));
            const expanded = expandedId === id;
            const added = addedId === id;
            return (
              <BuyerProductCard
                key={id}
                product={product}
                expanded={expanded}
                added={added}
                adding={addToCart.isPending}
                signedIn={true}
                favorite={true}
                onToggleDetails={() => setExpandedId(expanded ? '' : id)}
                onAddToCart={() => void addFavoriteToCart(product)}
                onToggleFavorite={() => void toggleFavorite(id)}
              />
            );
          })}
        </>
      )}
    </Screen>
  );
}
