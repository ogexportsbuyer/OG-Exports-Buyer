import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { getGetBuyerShipmentsQueryKey, useGetBuyerShipments } from '@workspace/api-client-react';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { Card, EmptyState, ErrorState, Field, LoadingCard, Screen, Status } from '@/components/InvestorUI';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { first } from '@/lib/data';
import { rowsFromResponse } from '@/lib/buyer-data';

type ShipmentFilter = 'all' | 'active' | 'in-transit' | 'delivered';

function normalizedStatus(value: string) {
  return value.toLowerCase().replace(/[\s_]+/g, '-');
}

export default function BuyerShipments() {
  const colors = useColors();
  const { token } = useAuth();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ShipmentFilter>('all');
  const query = useGetBuyerShipments({ per_page: 100 }, {
    query: { queryKey: getGetBuyerShipmentsQueryKey({ per_page: 100 }), enabled: !!token, staleTime: 20_000 },
  });
  const shipments = rowsFromResponse(query.data);
  const counts = useMemo(() => {
    const delivered = shipments.filter(item => normalizedStatus(first(item, ['status'])) === 'delivered').length;
    const transit = shipments.filter(item => ['in-transit', 'transit', 'arrived'].includes(normalizedStatus(first(item, ['status'])))).length;
    const loading = shipments.filter(item => ['booking', 'loading', 'booked', 'order-confirmed'].includes(normalizedStatus(first(item, ['status'])))).length;
    return { active: shipments.length - delivered, loading, transit, delivered };
  }, [shipments]);
  const visible = shipments.filter(item => {
    const status = normalizedStatus(first(item, ['status']));
    const matchesFilter = filter === 'all'
      || (filter === 'active' && status !== 'delivered')
      || (filter === 'in-transit' && ['in-transit', 'transit', 'arrived'].includes(status))
      || (filter === 'delivered' && status === 'delivered');
    const haystack = `${first(item, ['container_number'])} ${first(item, ['tracking_number', 'tracking_code'])} ${first(item, ['destination', 'destination_port'])} ${first(item, ['product_name'])}`.toLowerCase();
    return matchesFilter && (!search.trim() || haystack.includes(search.trim().toLowerCase()));
  });

  if (!token) return <BuyerAuthGate title="Shipment tracking" body="Sign in to follow active and past buyer shipments." returnTo="/buyer-shipments" />;

  return (
    <Screen title="Shipment tracking" subtitle="Live shipment records for your orders" refreshable>
      {query.isLoading ? <LoadingCard label="Loading shipments…" lines={3} /> : null}
      {query.isError ? <ErrorState message="Your shipment records could not be loaded." error={query.error} onRetry={() => void query.refetch()} /> : null}
      {query.isSuccess ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 13 }}>
            {[
              ['Active', counts.active],
              ['Loading', counts.loading],
              ['In transit', counts.transit],
              ['Delivered', counts.delivered],
            ].map(([label, count]) => (
              <Card key={String(label)} style={{ width: '48%', minHeight: 72, padding: 12 }}>
                <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: '700' }}>{label}</Text>
                <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: '800', marginTop: 7 }}>{count}</Text>
              </Card>
            ))}
          </View>
          <Field label="Search container, product or destination" value={search} onChangeText={setSearch} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginVertical: 11 }}>
            {([
              ['all', 'All shipments'],
              ['active', 'Active'],
              ['in-transit', 'In transit'],
              ['delivered', 'Delivered'],
            ] as const).map(([value, label]) => {
              const selected = filter === value;
              return (
                <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setFilter(value)} style={{ minHeight: 35, borderRadius: 18, paddingHorizontal: 11, justifyContent: 'center', backgroundColor: selected ? colors.primary : colors.secondary }}>
                  <Text style={{ color: selected ? colors.primaryForeground : colors.foreground, fontSize: 10, fontWeight: '700' }}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
          {visible.length === 0 ? (
            <EmptyState title={search ? 'No matching shipments' : 'No shipments yet'} body={search ? 'Try another container, product, or destination.' : 'When an order is shipped, its tracking information will appear here.'} icon="truck" />
          ) : visible.map((shipment, index) => {
            const id = first(shipment, ['id']);
            const order = shipment.order && typeof shipment.order === 'object' ? shipment.order as Record<string, unknown> : {};
            return (
              <Pressable key={id || String(index)} accessibilityRole="button" onPress={() => id && router.push(`/buyer-shipment/${id}`)}>
                <Card style={{ padding: 14, marginBottom: 9 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center' }}>
                      <Feather name="truck" size={16} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '800' }}>{first(shipment, ['container_number', 'reference'], `Shipment ${index + 1}`)}</Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 3 }}>Order {first(order, ['order_number'], first(shipment, ['order_number'], '—'))}</Text>
                    </View>
                    <Status value={first(shipment, ['status'], 'Pending')} />
                  </View>
                  <View style={{ marginTop: 11, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
                    <Text style={{ color: colors.foreground, fontSize: 11 }}>{first(shipment, ['product_name'], first(order, ['product_name'], 'Export shipment'))}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 5 }}>Destination: {first(shipment, ['destination', 'destination_port'], 'Not provided')}</Text>
                    {first(shipment, ['tracking_number', 'tracking_code']) ? <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 4 }}>Tracking: {first(shipment, ['tracking_number', 'tracking_code'])}</Text> : null}
                    {first(shipment, ['estimated_delivery', 'estimated_delivery_date']) ? <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 4 }}>Estimated delivery: {first(shipment, ['estimated_delivery', 'estimated_delivery_date'])}</Text> : null}
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
