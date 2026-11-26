import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { BrandedConfirmDialog } from '@/components/BrandedConfirmDialog';
import { Action, Card, ErrorState, LoadingCard, Screen, Status } from '@/components/InvestorUI';
import { useColors } from '@/hooks/useColors';
import {
  getGetBuyerOrderQueryKey,
  getGetBuyerRfqsQueryKey,
  useGetBuyerOrder,
  useRepeatBuyerOrder,
} from '@workspace/api-client-react';
import { amount, first, list, messageOf, record } from '@/lib/data';
import { displayOrderNumber } from '@/lib/buyer-data';
import { useAuth } from '@/context/AuthContext';
import { shareInvestorFile } from '@/lib/file-download';

function money(value: number): string {
  return `USD ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BuyerOrderDetail() {
  const colors = useColors();
  const { apiOrigin } = useAuth();
  const client = useQueryClient();
  const { id: rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const id = Number(Array.isArray(rawId) ? rawId[0] : rawId);
  const validId = Number.isInteger(id) && id > 0;
  const [actionError, setActionError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [repeatConfirmationVisible, setRepeatConfirmationVisible] = useState(false);
  const repeatOrder = useRepeatBuyerOrder();
  const query = useGetBuyerOrder(validId ? id : 0, { query: { queryKey: getGetBuyerOrderQueryKey(validId ? id : 0), enabled: validId } });
  const order = record(record(query.data).data);
  const items = list(order.items);
  const shipments = list(order.shipments);
  const documents = list(order.trade_documents ?? order.tradeDocuments);
  const statusTimeline = list(order.status_timeline ?? order.statusTimeline);

  async function downloadOrderPdf() {
    setActionError('');
    setDownloading(true);
    try {
      await shareInvestorFile(`/api/buyer/orders/${id}/pdf`, `${displayOrderNumber(order)} order summary`, apiOrigin, 'application/pdf', 'pdf', true);
    } catch (error) {
      setActionError(messageOf(error));
    } finally {
      setDownloading(false);
    }
  }

  async function confirmRepeatOrder() {
    try {
      await repeatOrder.mutateAsync({ id });
      await Promise.all([
        client.invalidateQueries({ queryKey: getGetBuyerRfqsQueryKey() }),
        client.invalidateQueries({ queryKey: getGetBuyerRfqsQueryKey({ per_page: 50 }) }),
      ]);
      setRepeatConfirmationVisible(false);
      router.replace({ pathname: '/buyer-orders', params: { view: 'rfqs' } });
    } catch (error) {
      setRepeatConfirmationVisible(false);
      setActionError(messageOf(error));
    }
  }

  return (
    <Screen title="Order details" subtitle={displayOrderNumber(order)}>
      {!validId ? <Text style={{ color: colors.destructive }}>This order link is invalid.</Text> : null}
      {query.isLoading ? <LoadingCard label="Loading order details…" /> : null}
      {query.isError ? <ErrorState message="Order details could not be loaded." error={query.error} onRetry={() => void query.refetch()} /> : null}
      {!query.isLoading && !query.isError && validId ? (
        <>
          <BrandedConfirmDialog
            visible={repeatConfirmationVisible}
            eyebrow={`ORDER DESK · ${displayOrderNumber(order)}`}
            title="Request this order again?"
            message="We’ll prepare new quotation requests from the previous products and destination. This does not place an order or take payment."
            context={displayOrderNumber(order)}
            icon="rotate-ccw"
            confirmLabel="Create request"
            busyLabel="Preparing…"
            busy={repeatOrder.isPending}
            onCancel={() => setRepeatConfirmationVisible(false)}
            onConfirm={() => void confirmRepeatOrder()}
            testID="buyer-repeat-order-confirmation"
          />
          {actionError ? <Text accessibilityRole="alert" style={{ color: colors.destructive, fontSize: 12, lineHeight: 18, marginBottom: 10 }}>{actionError}</Text> : null}
          <Card style={{ padding: 11, marginBottom: 12 }}>
            <Action title="Download order PDF" icon="download" secondary loading={downloading} disabled={downloading} onPress={() => void downloadOrderPdf()} testID="buyer-order-download-pdf" />
            <Action title="Submit payment details" icon="credit-card" secondary onPress={() => router.push({ pathname: '/buyer-trade-finance', params: { orderId: String(id) } })} testID="buyer-order-payment" />
              <Action title={repeatOrder.isPending ? 'Creating quote request…' : 'Request repeat quotation'} icon="rotate-ccw" secondary loading={repeatOrder.isPending} disabled={repeatOrder.isPending} onPress={() => { setActionError(''); setRepeatConfirmationVisible(true); }} testID="buyer-order-repeat" />
          </Card>
          <Card style={{ padding: 16, marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Order reference</Text>
                <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700', marginTop: 4 }}>{displayOrderNumber(order)}</Text>
              </View>
              <Status value={first(order, ['status'], 'Pending')} />
            </View>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 12 }}>
              Destination: {first(order, ['destination_port', 'destination'], 'Not set')}
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 6 }}>
              Delivery term: {first(order, ['incoterm'], 'Not set')}
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 6 }}>
              Required delivery: {first(order, ['required_delivery_date'], 'Not set')}
            </Text>
          </Card>

          <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '700', marginBottom: 9 }}>Products</Text>
          {items.map((item, index) => {
            const qty = amount(item, ['qty']) ?? 0;
            const lineTotal = amount(item, ['line_total']);
            return (
              <Card key={first(item, ['id'], String(index))} style={{ padding: 14, marginBottom: 9 }}>
                <Text style={{ color: colors.foreground, fontWeight: '700' }}>{first(item, ['product_name'], first(record(item.product), ['name'], 'Export product'))}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Quantity: {qty}</Text>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>{lineTotal === null ? 'Price pending' : money(lineTotal)}</Text>
                </View>
              </Card>
            );
          })}

          {shipments.length ? (
            <>
              <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '700', marginTop: 12, marginBottom: 9 }}>Shipments</Text>
              {shipments.map((shipment, index) => (
                <Pressable key={first(shipment, ['id'], String(index))} accessibilityRole="button" onPress={() => first(shipment, ['id']) && router.push(`/buyer-shipment/${first(shipment, ['id'])}`)}>
                <Card style={{ padding: 14, marginBottom: 9 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: colors.foreground, fontWeight: '700', flex: 1 }}>
                      {first(shipment, ['container_number', 'reference'], `Shipment ${index + 1}`)}
                    </Text>
                    <Status value={first(shipment, ['status'], 'Pending')} />
                  </View>
                  <View style={{ marginTop: 9, padding: 9, borderRadius: 10, backgroundColor: colors.secondary }}>
                    <Text style={{ color: colors.mutedForeground, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Current logistics milestone
                    </Text>
                    <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: '700', marginTop: 3 }}>
                      {first(shipment, ['current_milestone'], 'Awaiting Booking')}
                    </Text>
                  </View>
                  {first(shipment, ['tracking_number', 'tracking_code']) ? (
                    <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 8 }}>
                      Tracking: {first(shipment, ['tracking_number', 'tracking_code'])}
                    </Text>
                  ) : null}
                  {first(shipment, ['estimated_delivery', 'estimated_delivery_date']) ? (
                    <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 5 }}>
                      Estimated delivery: {first(shipment, ['estimated_delivery', 'estimated_delivery_date'])}
                    </Text>
                  ) : null}
                </Card>
                </Pressable>
              ))}
            </>
          ) : null}

          {documents.length ? (
            <Card style={{ padding: 14, marginTop: 7 }}>
              <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700' }}>Trade documents</Text>
              {documents.map((document, index) => {
                const documentId = first(document, ['id']);
                return (
                  <Pressable key={documentId || String(index)} accessibilityRole="button" disabled={!documentId} onPress={() => documentId && router.push({ pathname: '/buyer-documents', params: { orderId: String(id) } })}>
                    <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600', marginTop: 8 }}>
                      {first(document, ['title', 'name', 'document_type'], 'Order document')} · View trade documents
                    </Text>
                  </Pressable>
                );
              })}
            </Card>
          ) : null}

          {statusTimeline.length ? (
            <Card style={{ padding: 14, marginTop: 12 }}>
              <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700' }}>Status history</Text>
              {statusTimeline.map((event, index) => (
                <Text key={`${first(event, ['status'], 'status')}-${index}`} style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 8 }}>
                  {first(event, ['date', 'created_at'], '')} {first(event, ['label', 'status'], '')}
                </Text>
              ))}
            </Card>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}
