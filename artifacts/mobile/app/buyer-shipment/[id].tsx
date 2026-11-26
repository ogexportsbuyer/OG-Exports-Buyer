import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { getGetBuyerShipmentQueryKey, useGetBuyerShipment } from '@workspace/api-client-react';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { Action, Card, EmptyState, ErrorState, LoadingCard, Screen, Status } from '@/components/InvestorUI';
import { BuyerShipmentDocuments } from '@/components/BuyerShipmentDocuments';
import { BuyerShipmentTimeline } from '@/components/BuyerShipmentTimeline';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { record } from '@/lib/data';
import { buyerShipmentDetailRows, mapBuyerShipment } from '@/lib/buyer-shipment-data';

export default function BuyerShipmentDetail() {
  const colors = useColors();
  const { token } = useAuth();
  const { id: rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const routeId = Array.isArray(rawId) ? rawId[0] : rawId;
  const id = Number(routeId);
  const validId = Number.isInteger(id) && id > 0;
  const query = useGetBuyerShipment(validId ? id : 0, {
    query: { queryKey: getGetBuyerShipmentQueryKey(validId ? id : 0), enabled: !!token && validId },
  });
  const shipment = useMemo(
    () => mapBuyerShipment(record(query.data).data),
    [query.data],
  );
  const detailRows = useMemo(() => buyerShipmentDetailRows(shipment), [shipment]);

  if (!token) return <BuyerAuthGate title="Shipment details" body="Sign in to view shipment milestones, documents, and order information." returnTo={`/buyer-shipment/${routeId ?? ''}`} />;

  return (
    <Screen title="Shipment details" subtitle={shipment.container === '—' ? `Shipment ${routeId ?? ''}` : shipment.container} refreshable>
      {!validId ? <Text accessibilityRole="alert" style={{ color: colors.destructive }}>This shipment link is invalid.</Text> : null}
      {query.isLoading ? <LoadingCard label="Loading shipment details…" lines={4} /> : null}
      {query.isError ? <ErrorState message="Shipment details could not be loaded." error={query.error} onRetry={() => void query.refetch()} /> : null}
      {query.isSuccess && !shipment.id ? (
        <EmptyState title="Shipment unavailable" body="This shipment could not be found for your buyer account." icon="truck" />
      ) : null}
      {query.isSuccess && shipment.id ? (
        <>
          <Card style={{ padding: 15, marginBottom: 13 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.mutedForeground, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>Shipment #{shipment.id}</Text>
                <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800', marginTop: 5 }}>{shipment.product}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 5 }}>Order {shipment.orderNumber}</Text>
              </View>
              <Status value={shipment.statusLabel} />
            </View>

            <View style={{ marginTop: 13, padding: 11, borderRadius: 12, backgroundColor: colors.secondary }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 9, fontWeight: '700', letterSpacing: 0.7, textTransform: 'uppercase' }}>
                Current logistics milestone
              </Text>
              <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '800', marginTop: 4 }}>
                {shipment.currentMilestone || 'Awaiting Booking'}
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 9, marginTop: 3 }}>
                Separate from the order fulfilment status.
              </Text>
            </View>

            {shipment.trackingNumber ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 13 }}>
                <Feather name="hash" size={13} color={colors.primary} />
                <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: '700' }}>Tracking number: {shipment.trackingNumber}</Text>
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 }}>
              <Feather name="map-pin" size={14} color={colors.primary} />
              <Text style={{ flex: 1, color: colors.foreground, fontSize: 11, fontWeight: '700' }}>{shipment.origin}  →  {shipment.destination}</Text>
            </View>
            <View style={{ height: 6, borderRadius: 5, overflow: 'hidden', backgroundColor: colors.border, marginTop: 10 }}>
              <View style={{ width: `${shipment.progress}%`, height: '100%', borderRadius: 5, backgroundColor: shipment.statusLabel === 'Delivered' ? colors.statusSuccess : colors.primary }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 9 }}>ETD {shipment.etd}</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 9 }}>ETA {shipment.eta}</Text>
            </View>
            {shipment.orderRecordId ? (
              <Action
                title="Open related order"
                icon="arrow-up-right"
                secondary
                onPress={() => router.push(`/buyer-order/${shipment.orderRecordId}`)}
                testID={`buyer-shipment-order-${shipment.id}`}
              />
            ) : null}
          </Card>

          <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800', marginBottom: 9 }}>Shipping details</Text>
          <Card style={{ padding: 13, marginBottom: 13 }}>
            {detailRows.map((detail, index) => (
              <DetailRow
                key={detail.label}
                label={detail.label}
                value={detail.value}
                colors={colors}
                last={index === detailRows.length - 1}
              />
            ))}
            {detailRows.length < 8 ? (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 11, marginTop: detailRows.length ? 9 : 0, borderRadius: 12, backgroundColor: colors.secondary }}>
                <Feather name="info" size={14} color={colors.primary} style={{ marginTop: 1 }} />
                <Text style={{ flex: 1, color: colors.mutedForeground, fontSize: 10, lineHeight: 15 }}>
                  More shipping details will appear here when OG Exports shares them.
                </Text>
              </View>
            ) : null}
          </Card>

          <BuyerShipmentTimeline steps={shipment.timeline} updates={shipment.recentUpdates} />
          <BuyerShipmentDocuments documents={shipment.documents} />
        </>
      ) : null}
    </Screen>
  );
}

function DetailRow({ label, value, colors, last = false }: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
  last?: boolean;
}) {
  return (
    <View style={{ minHeight: 39, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.border }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>{label}</Text>
      <Text numberOfLines={2} style={{ flex: 1, textAlign: 'right', color: colors.foreground, fontSize: 10, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}
