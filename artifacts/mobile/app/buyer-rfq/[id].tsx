import React, { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { getGetBuyerRfqQueryKey, useGetBuyerRfq } from '@workspace/api-client-react';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { Card, EmptyState, ErrorState, LoadingCard, Screen, Status } from '@/components/InvestorUI';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { first, list, record } from '@/lib/data';
import { buyerRfqStatus, formatBuyerRfqReference, resolveBuyerRfqAttachmentUrl } from '@/lib/buyer-rfq';

export default function BuyerRfqDetail() {
  const colors = useColors();
  const { token, apiOrigin } = useAuth();
  const [attachmentError, setAttachmentError] = useState('');
  const { id: rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const routeId = Array.isArray(rawId) ? rawId[0] : rawId;
  const id = Number(routeId);
  const validId = Number.isInteger(id) && id > 0;
  const query = useGetBuyerRfq(validId ? id : 0, {
    query: { queryKey: getGetBuyerRfqQueryKey(validId ? id : 0), enabled: !!token && validId },
  });
  const rfq = record(record(query.data).data);
  const quotations = list(rfq.quotations);
  const attachments = list(rfq.attachments);
  const reference = first(rfq, ['reference', 'rfq_number'], formatBuyerRfqReference(routeId ?? ''));

  if (!token) return <BuyerAuthGate title="Quote request" body="Sign in to view the requirements and responses for this quotation request." returnTo={`/buyer-rfq/${routeId ?? ''}`} />;

  return (
    <Screen title="Quote request" subtitle={reference} refreshable>
      {!validId ? <Text style={{ color: colors.destructive }}>This request link is invalid.</Text> : null}
      {query.isLoading ? <LoadingCard label="Loading quote request…" lines={3} /> : null}
      {query.isError ? <ErrorState message="Quote request details could not be loaded." error={query.error} onRetry={() => void query.refetch()} /> : null}
      {query.isSuccess ? (
        <>
          <Card style={{ padding: 15, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800' }}>{first(rfq, ['product_name'], first(record(rfq.product), ['name'], 'Export product'))}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 4 }}>Submitted {first(rfq, ['submitted_at', 'created_at'], 'Date unavailable').slice(0, 10)}</Text>
              </View>
              <Status value={buyerRfqStatus(rfq)} />
            </View>
            {[
              ['Quantity', first(rfq, ['qty'], 'Not provided')],
              ['Packaging', first(rfq, ['packaging'], 'Not specified')],
              ['Destination', first(rfq, ['destination'], `${first(record(rfq.port), ['name'])}${first(record(rfq.country), ['name']) ? `, ${first(record(rfq.country), ['name'])}` : ''}`)],
              ['Delivery term', first(rfq, ['incoterm'], 'Not specified')],
              ['Payment terms', first(rfq, ['payment_terms'], 'Not specified')],
              ['Required delivery', first(rfq, ['required_delivery_date'], 'Not specified')],
            ].map(([label, value]) => (
              <View key={label} style={{ minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8, paddingTop: 8 }}>
                <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>{label}</Text>
                <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: '600', flex: 1, textAlign: 'right' }}>{value}</Text>
              </View>
            ))}
            {first(rfq, ['notes']) ? (
              <View style={{ borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8, paddingTop: 10 }}>
                <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>Special requirements</Text>
                <Text style={{ color: colors.foreground, fontSize: 11, lineHeight: 17, marginTop: 4 }}>{first(rfq, ['notes'])}</Text>
              </View>
            ) : null}
          </Card>

          {attachments.length ? (
            <>
              <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800', marginBottom: 8 }}>Attachments</Text>
              {attachments.map((attachment, index) => (
                <Pressable
                  key={first(attachment, ['id'], String(index))}
                  accessibilityRole="button"
                  accessibilityLabel={`Open attachment ${first(attachment, ['original_name', 'name'], 'Supporting file')}`}
                  onPress={async () => {
                    const uri = resolveBuyerRfqAttachmentUrl(
                      first(attachment, ['path', 'attachment_path']),
                      first(attachment, ['url', 'attachment_url']),
                      apiOrigin,
                    );
                    if (!uri) {
                      setAttachmentError('This attachment link is not available.');
                      return;
                    }
                    try {
                      await Linking.openURL(uri);
                      setAttachmentError('');
                    } catch {
                      setAttachmentError('This attachment could not be opened on this device.');
                    }
                  }}
                >
                  <Card style={{ padding: 12, marginBottom: 7, flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                    <Feather name="paperclip" size={15} color={colors.primary} />
                    <Text style={{ color: colors.foreground, fontSize: 11, flex: 1 }}>{first(attachment, ['original_name', 'name'], 'Supporting file')}</Text>
                    <Feather name="external-link" size={14} color={colors.mutedForeground} />
                  </Card>
                </Pressable>
              ))}
              {attachmentError ? <Text accessibilityRole="alert" style={{ color: colors.destructive, fontSize: 11, marginTop: 2 }}>{attachmentError}</Text> : null}
            </>
          ) : null}

          <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800', marginTop: 12, marginBottom: 8 }}>Quotations received</Text>
          {quotations.length ? quotations.map((quotation, index) => {
            const quoteId = first(quotation, ['id']);
            return (
              <Pressable key={quoteId || String(index)} accessibilityRole="button" onPress={() => quoteId && router.push({ pathname: '/buyer-quotation/[id]', params: { id: quoteId } })}>
                <Card style={{ padding: 13, marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '800', flex: 1 }}>Quotation QT-{quoteId.padStart(6, '0')}</Text>
                    <Status value={first(quotation, ['status'], 'Pending')} />
                  </View>
                  <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700', marginTop: 8 }}>Review offer and contact the trade desk</Text>
                </Card>
              </Pressable>
            );
          }) : <EmptyState title="No quotations yet" body="The trade desk will add offers here when they respond." icon="file-text" />}
        </>
      ) : null}
    </Screen>
  );
}
