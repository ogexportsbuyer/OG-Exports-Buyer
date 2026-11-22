import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { getGetBuyerShipmentsQueryKey, useGetBuyerShipments } from '@workspace/api-client-react';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { Action, Card, EmptyState, ErrorState, Field, LoadingCard, Screen, Status } from '@/components/InvestorUI';
import { BuyerShipmentDocuments } from '@/components/BuyerShipmentDocuments';
import { BuyerShipmentTimeline } from '@/components/BuyerShipmentTimeline';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { rowsFromResponse } from '@/lib/buyer-data';
import { isShipmentInTransit, mapBuyerShipment, shipmentSearchText } from '@/lib/buyer-shipment-data';

type ShipmentFilter = 'all' | 'active' | 'in-transit' | 'delivered';

export default function BuyerShipments() {
  const colors = useColors();
  const { token } = useAuth();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ShipmentFilter>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [autoExpanded, setAutoExpanded] = useState(false);
  const query = useGetBuyerShipments({ per_page: 100 }, {
    query: { queryKey: getGetBuyerShipmentsQueryKey({ per_page: 100 }), enabled: !!token, staleTime: 20_000 },
  });
  const shipments = useMemo(
    () => rowsFromResponse(query.data).map(mapBuyerShipment),
    [query.data],
  );
  useEffect(() => {
    if (!autoExpanded && shipments.length > 0) {
      setExpanded(shipments[0].id || null);
      setAutoExpanded(true);
    }
  }, [autoExpanded, shipments]);

  const counts = useMemo(() => {
    const delivered = shipments.filter(shipment => shipment.statusLabel === 'Delivered').length;
    const loading = shipments.filter(shipment => shipment.statusLabel === 'Loading').length;
    const transit = shipments.filter(shipment => shipment.statusLabel === 'In Transit').length;
    return { active: shipments.length - delivered, loading, transit, delivered };
  }, [shipments]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return shipments.filter(shipment => {
      const matchesFilter = filter === 'all'
        || (filter === 'active' && shipment.statusLabel !== 'Delivered')
        || (filter === 'in-transit' && isShipmentInTransit(shipment))
        || (filter === 'delivered' && shipment.statusLabel === 'Delivered');
      return matchesFilter && (!term || shipmentSearchText(shipment).includes(term));
    });
  }, [filter, search, shipments]);

  if (!token) return <BuyerAuthGate title="Shipment tracking" body="Sign in to follow active and past buyer shipments." returnTo="/buyer-shipments" />;

  return (
    <Screen title="Shipment tracking" subtitle="Follow active and past shipments, milestones, and documents." refreshable>
      {query.isLoading ? <LoadingCard label="Loading shipments…" lines={3} /> : null}
      {query.isError ? <ErrorState message="Your shipment records could not be loaded." error={query.error} onRetry={() => void query.refetch()} /> : null}
      {query.isSuccess ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 13 }}>
            {[
              ['Active shipments', counts.active, 'truck'],
              ['Loading', counts.loading, 'package'],
              ['In transit', counts.transit, 'navigation'],
              ['Delivered', counts.delivered, 'check-circle'],
            ].map(([label, count, icon]) => (
              <Card key={String(label)} style={{ width: '48%', minHeight: 76, padding: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                  <View style={{ width: 31, height: 31, borderRadius: 11, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name={icon as keyof typeof Feather.glyphMap} size={15} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: '800' }}>{count}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 9, marginTop: 2 }}>{label}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>

          <Field label="Search shipment, order, container or product" value={search} onChangeText={setSearch} placeholder="Enter a reference or product name" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
            {([
              ['all', 'All shipments'],
              ['active', 'Active'],
              ['in-transit', 'In transit'],
              ['delivered', 'Delivered'],
            ] as const).map(([value, label]) => {
              const selected = filter === value;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setFilter(value)}
                  style={({ pressed }) => ({
                    minHeight: 36,
                    borderRadius: 18,
                    paddingHorizontal: 12,
                    justifyContent: 'center',
                    backgroundColor: selected ? colors.primary : colors.secondary,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text style={{ color: selected ? colors.primaryForeground : colors.foreground, fontSize: 10, fontWeight: '700' }}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          {visible.length === 0 ? (
            <EmptyState
              title={search || filter !== 'all' ? 'No matching shipments' : 'No shipments yet'}
              body={search || filter !== 'all' ? 'Try a different search or status filter.' : 'When an order is shipped, its tracking information will appear here.'}
              icon="truck"
            />
          ) : visible.map((shipment, index) => {
            const id = shipment.id || String(index);
            const isExpanded = expanded === id;
            return (
              <Card key={id} style={{ padding: 0, marginBottom: 11 }} testID={`buyer-shipment-${id}`}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${isExpanded ? 'Collapse' : 'Expand'} shipment ${shipment.container}`}
                  accessibilityState={{ expanded: isExpanded }}
                  onPress={() => setExpanded(isExpanded ? null : id)}
                  style={({ pressed }) => ({ padding: 14, opacity: pressed ? 0.87 : 1 })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center' }}>
                      <Feather name="truck" size={16} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '800' }}>
                        {shipment.container === '—' ? `Shipment ${shipment.id || index + 1}` : shipment.container}
                      </Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 3 }}>
                        {shipment.id ? `Shipment #${shipment.id}  ·  ` : ''}Order {shipment.orderNumber}
                      </Text>
                    </View>
                    <Status value={shipment.statusLabel} />
                    <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={17} color={colors.mutedForeground} />
                  </View>
                  <Text numberOfLines={2} style={{ color: colors.foreground, fontSize: 11, fontWeight: '700', marginTop: 11 }}>{shipment.product}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 }}>
                    <Feather name="map-pin" size={12} color={colors.primary} />
                    <Text numberOfLines={1} style={{ flex: 1, color: colors.mutedForeground, fontSize: 10 }}>
                      {shipment.origin}  →  {shipment.destination}
                    </Text>
                  </View>
                  <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: colors.mutedForeground, fontSize: 9 }}>ETD {shipment.etd}</Text>
                    <View style={{ height: 5, flex: 1, borderRadius: 4, overflow: 'hidden', backgroundColor: colors.border }}>
                      <View style={{ height: '100%', width: `${shipment.progress}%`, borderRadius: 4, backgroundColor: shipment.statusLabel === 'Delivered' ? colors.statusSuccess : colors.primary }} />
                    </View>
                    <Text style={{ color: colors.mutedForeground, fontSize: 9 }}>ETA {shipment.eta}</Text>
                  </View>
                </Pressable>

                {isExpanded ? (
                  <View style={{ paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: colors.border }}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 12 }}>
                      {[
                        ['Container', shipment.container],
                        ['Order reference', shipment.orderNumber],
                        ['Shipping line', shipment.shippingLine],
                        ['Vessel', shipment.vessel],
                        ['Origin port', shipment.origin],
                        ['Destination port', shipment.destination],
                        ['ETD', shipment.etd],
                        ['ETA', shipment.eta],
                        ...(shipment.trackingNumber ? [['Tracking number', shipment.trackingNumber]] : []),
                      ].map(([label, value]) => (
                        <View key={label} style={{ width: '48%', minHeight: 56, padding: 9, borderRadius: 11, backgroundColor: colors.secondary }}>
                          <Text style={{ color: colors.mutedForeground, fontSize: 8, fontWeight: '700', textTransform: 'uppercase' }}>{label}</Text>
                          <Text numberOfLines={2} style={{ color: colors.foreground, fontSize: 10, fontWeight: '700', marginTop: 4 }}>{value}</Text>
                        </View>
                      ))}
                    </View>
                    <BuyerShipmentTimeline steps={shipment.timeline} updates={shipment.recentUpdates} />
                    <BuyerShipmentDocuments documents={shipment.documents} />
                    {shipment.orderRecordId ? (
                      <Action
                        title="Open related order"
                        icon="arrow-up-right"
                        secondary
                        onPress={() => router.push(`/buyer-order/${shipment.orderRecordId}`)}
                        testID={`buyer-shipment-order-${id}`}
                      />
                    ) : null}
                    {shipment.id ? (
                      <Pressable
                        accessibilityRole="button"
                        testID={`buyer-shipment-full-details-${id}`}
                        onPress={() => router.push(`/buyer-shipment/${shipment.id}`)}
                        style={{ minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}
                      >
                        <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>Open full shipment details</Text>
                        <Feather name="arrow-right" size={14} color={colors.primary} />
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </Card>
            );
          })}
        </>
      ) : null}
    </Screen>
  );
}
