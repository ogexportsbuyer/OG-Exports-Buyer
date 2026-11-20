import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { Action, Card, EmptyState, ErrorState, LoadingCard, Screen, Section, Status } from '@/components/InvestorUI';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { useGetBuyerOrders, useGetProducts } from '@workspace/api-client-react';
import { amount, first, record } from '@/lib/data';
import { displayOrderNumber, rowsFromResponse } from '@/lib/buyer-data';

export default function BuyerHome() {
  const { token, user } = useAuth();
  const colors = useColors();
  const ordersQuery = useGetBuyerOrders({ per_page: 10 }, { query: { enabled: !!token, staleTime: 30_000 } });
  const productsQuery = useGetProducts({ per_page: 1 }, { query: { staleTime: 60_000 } });
  const orders = rowsFromResponse(ordersQuery.data);
  const activeOrders = orders.filter(order => !['completed', 'cancelled', 'delivered'].includes(first(order, ['status']).toLowerCase()));
  const company = first(record(record(user).profile), ['companyName', 'company_name']);
  const accountName = first(record(user), ['name', 'fullName'], 'Buyer');
  const productTotal = amount(record(record(productsQuery.data).meta), ['total']);

  return (
    <Screen title="Buyer dashboard" subtitle={company ? `Welcome, ${company}` : `Welcome, ${accountName}`} refreshable>
      <Card style={{ padding: 20, marginBottom: 18 }}>
        <Text style={{ color: colors.accent, fontSize: 10, fontWeight: '700', letterSpacing: 1.4 }}>OG EXPORTS MARKETPLACE</Text>
        <Text style={{ color: colors.foreground, fontSize: 24, lineHeight: 30, fontWeight: '700', marginTop: 8 }}>
          Source export products with confidence.
        </Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 19, marginTop: 8 }}>
          Browse approved products, build a cart, and follow your orders from one place.
        </Text>
        <View style={{ marginTop: 16 }}>
          <Action title="Browse products" icon="package" onPress={() => router.push('/(buyer-tabs)/buyer-products')} testID="buyer-home-browse-products" />
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        <Card style={{ flex: 1, padding: 15 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Active orders</Text>
          <Text style={{ color: colors.foreground, fontSize: 26, fontWeight: '700', marginTop: 5 }}>
            {ordersQuery.isLoading ? '—' : activeOrders.length}
          </Text>
        </Card>
        <Card style={{ flex: 1, padding: 15 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Products available</Text>
          <Text style={{ color: colors.foreground, fontSize: 26, fontWeight: '700', marginTop: 5 }}>
            {productsQuery.isLoading ? '—' : productTotal ?? '—'}
          </Text>
        </Card>
      </View>

      <Section title="Recent orders" right={
        <Pressable accessibilityRole="button" onPress={() => router.push('/(buyer-tabs)/buyer-orders')}>
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>View all</Text>
        </Pressable>
      } />
      {ordersQuery.isLoading ? <LoadingCard label="Loading orders…" lines={2} /> : null}
      {ordersQuery.isError ? <ErrorState message="Your orders could not be loaded." error={ordersQuery.error} onRetry={() => void ordersQuery.refetch()} /> : null}
      {!ordersQuery.isLoading && !ordersQuery.isError && orders.length === 0
        ? <EmptyState title="No orders yet" body="When you place an order, its status will appear here." icon="package" />
        : null}
      {orders.slice(0, 3).map(order => {
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
    </Screen>
  );
}
