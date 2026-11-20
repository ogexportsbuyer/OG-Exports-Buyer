import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { getGetBuyerShipmentQueryKey, useGetBuyerShipment } from '@workspace/api-client-react';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { Card, ErrorState, LoadingCard, Screen, Status } from '@/components/InvestorUI';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { shareInvestorFile } from '@/lib/file-download';
import { first, list, messageOf, record } from '@/lib/data';

export default function BuyerShipmentDetail() {
  const colors = useColors();
  const { token, apiOrigin } = useAuth();
  const { id: rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const routeId = Array.isArray(rawId) ? rawId[0] : rawId;
  const id = Number(routeId);
  const validId = Number.isInteger(id) && id > 0;
  const [downloadError, setDownloadError] = useState('');
  const query = useGetBuyerShipment(validId ? id : 0, {
    query: { queryKey: getGetBuyerShipmentQueryKey(validId ? id : 0), enabled: !!token && validId },
  });
  const shipment = record(record(query.data).data);
  const order = record(shipment.order);
  const milestones = list(shipment.milestones).sort((a, b) => {
    const firstTime = Date.parse(first(a, ['event_date', 'created_at'], ''));
    const secondTime = Date.parse(first(b, ['event_date', 'created_at'], ''));
    return Number.isFinite(firstTime) && Number.isFinite(secondTime) ? firstTime - secondTime : 0;
  });
  const documents = list(shipment.trade_documents ?? shipment.tradeDocuments);

  async function downloadDocument(document: Record<string, unknown>) {
    setDownloadError('');
    const title = first(document, ['title', 'type'], 'Trade document');
    const path = first(document, ['download_url']);
    const mime = first(document, ['mime'], 'application/octet-stream');
    const extension = first(document, ['path']).split('.').pop() || (mime.includes('pdf') ? 'pdf' : 'file');
    try {
      await shareInvestorFile(path, title, apiOrigin, mime, extension);
    } catch (error) {
      setDownloadError(messageOf(error));
    }
  }

  if (!token) return <BuyerAuthGate title="Shipment details" body="Sign in to view shipment milestones, documents, and order information." returnTo={`/buyer-shipment/${routeId ?? ''}`} />;

  return (
    <Screen title="Shipment details" subtitle={first(shipment, ['container_number', 'reference'], `Shipment ${routeId ?? ''}`)} refreshable>
      {!validId ? <Text style={{ color: colors.destructive }}>This shipment link is invalid.</Text> : null}
      {query.isLoading ? <LoadingCard label="Loading shipment details…" lines={3} /> : null}
      {query.isError ? <ErrorState message="Shipment details could not be loaded." error={query.error} onRetry={() => void query.refetch()} /> : null}
      {query.isSuccess ? (
        <>
          <Card style={{ padding: 15, marginBottom: 13 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.mutedForeground, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Current status</Text>
                <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800', marginTop: 5 }}>{first(shipment, ['container_number', 'reference'], 'Shipment')}</Text>
              </View>
              <Status value={first(shipment, ['status'], 'Pending')} />
            </View>
            {first(shipment, ['tracking_number', 'tracking_code']) ? <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 12 }}>Tracking number: {first(shipment, ['tracking_number', 'tracking_code'])}</Text> : null}
            <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 7 }}>Destination: {first(shipment, ['destination', 'destination_port'], 'Not provided')}</Text>
            {first(shipment, ['estimated_delivery', 'estimated_delivery_date']) ? <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 7 }}>Estimated delivery: {first(shipment, ['estimated_delivery', 'estimated_delivery_date'])}</Text> : null}
            {first(order, ['id']) ? (
              <Pressable accessibilityRole="button" onPress={() => router.push(`/buyer-order/${first(order, ['id'])}`)} style={{ minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>Open related order</Text>
                <Feather name="arrow-up-right" size={13} color={colors.primary} />
              </Pressable>
            ) : null}
          </Card>

          <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800', marginBottom: 9 }}>Shipment milestones</Text>
          {milestones.length ? milestones.map((milestone, index) => (
            <Card key={first(milestone, ['id'], String(index))} style={{ padding: 13, marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary }}>
                  <Feather name="check" size={14} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '800' }}>{first(milestone, ['title', 'label', 'status'], 'Shipment update')}</Text>
                  {first(milestone, ['description', 'notes']) ? <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 16, marginTop: 4 }}>{first(milestone, ['description', 'notes'])}</Text> : null}
                  <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 5 }}>{first(milestone, ['event_date', 'created_at'], '')}</Text>
                </View>
              </View>
            </Card>
          )) : (
            <Card style={{ padding: 14, marginBottom: 12 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>No shipment milestones have been posted yet.</Text>
            </Card>
          )}

          {documents.length ? (
            <>
              <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800', marginTop: 12, marginBottom: 9 }}>Shipment documents</Text>
              {documents.map((document, index) => (
                <Pressable key={first(document, ['id'], String(index))} accessibilityRole="button" onPress={() => void downloadDocument(document)}>
                  <Card style={{ padding: 13, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Feather name="file-text" size={16} color={colors.primary} />
                    <Text style={{ flex: 1, color: colors.foreground, fontSize: 12, fontWeight: '700' }}>{first(document, ['title', 'type'], 'Trade document')}</Text>
                    <Feather name="download" size={15} color={colors.primary} />
                  </Card>
                </Pressable>
              ))}
            </>
          ) : null}
          {downloadError ? <Text accessibilityRole="alert" style={{ color: colors.destructive, fontSize: 12, marginTop: 8 }}>{downloadError}</Text> : null}
        </>
      ) : null}
    </Screen>
  );
}
