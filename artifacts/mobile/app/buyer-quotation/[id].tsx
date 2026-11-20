import React, { useState } from 'react';
import { FlatList, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import {
  useGetBuyerQuotation,
  useGetBuyerQuotationMessages,
  useSendBuyerQuotationMessage,
  getGetBuyerQuotationQueryKey,
  getGetBuyerQuotationMessagesQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { Action, Card, EmptyState, ErrorState, Field, LoadingCard, Screen, Status } from '@/components/InvestorUI';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { amount, first, list, messageOf, record } from '@/lib/data';

function quotationReference(id: number) {
  return `QT-${String(id).padStart(6, '0')}`;
}

function money(value: number) {
  return `USD ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function timestamp(value: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function BuyerQuotationDetail() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { token, user } = useAuth();
  const { id: rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const routeId = Array.isArray(rawId) ? rawId[0] : rawId;
  const id = Number(routeId);
  const validId = Number.isInteger(id) && id > 0;
  const quotationQuery = useGetBuyerQuotation(validId ? id : 0, {
    query: { queryKey: getGetBuyerQuotationQueryKey(validId ? id : 0), enabled: validId && !!token },
  });
  const quotationResponse = record(quotationQuery.data);
  const quotation = record(quotationResponse.data);
  const quotationLoaded = quotationQuery.isSuccess && Object.keys(quotation).length > 0;
  const messagesQuery = useGetBuyerQuotationMessages(validId ? id : 0, {
    query: {
      queryKey: getGetBuyerQuotationMessagesQueryKey(validId ? id : 0),
      enabled: validId && !!token && quotationLoaded,
      refetchInterval: quotationLoaded ? 5_000 : false,
      refetchIntervalInBackground: false,
    },
  });
  const sendMessage = useSendBuyerQuotationMessage();
  const [message, setMessage] = useState('');
  const [sendError, setSendError] = useState('');
  const messages = list(record(messagesQuery.data).data);
  const orderedMessages = [...messages].sort((left, right) => {
    const leftTime = Date.parse(first(left, ['created_at'], ''));
    const rightTime = Date.parse(first(right, ['created_at'], ''));
    return Number.isFinite(leftTime) && Number.isFinite(rightTime) ? rightTime - leftTime : 0;
  });
  const buyerId = first(record(user), ['id'], '');
  const product = first(quotation, ['product_name'], first(record(quotation.rfq), ['product_name'], 'Export product'));
  const productUnitPrice = amount(quotation, ['fob_unit_price']);

  async function submitMessage() {
    const body = message.trim();
    if (!body || !validId) return;
    setSendError('');
    try {
      await sendMessage.mutateAsync({ id, data: { body } });
      setMessage('');
      await queryClient.invalidateQueries({ queryKey: getGetBuyerQuotationMessagesQueryKey(id) });
    } catch (error) {
      setSendError(messageOf(error));
    }
  }

  if (!token) {
    return (
      <BuyerAuthGate
        title="Quotation messages"
        body="Sign in to review this quotation and message the OG Exports trade desk."
        returnTo={`/buyer-quotation/${routeId ?? ''}`}
      />
    );
  }

  return (
    <Screen title="Quotation" subtitle={validId ? quotationReference(id) : 'Quotation details'} scrollable={false}>
      {!validId ? <Text style={{ color: colors.destructive }}>This quotation link is invalid.</Text> : null}
      {validId && quotationQuery.isLoading ? <LoadingCard label="Loading quotation…" /> : null}
      {quotationQuery.isError ? (
        <ErrorState
          message="This quotation could not be loaded."
          error={quotationQuery.error}
          onRetry={() => void quotationQuery.refetch()}
        />
      ) : null}

      {quotationLoaded ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
          <Card testID="buyer-quotation-context" style={{ padding: 15, marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.mutedForeground, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.7 }}>
                  Quotation {quotationReference(id)}
                </Text>
                <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700', marginTop: 5 }}>{product}</Text>
              </View>
              <Status value={first(quotation, ['status'], 'Pending')} />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 11 }}>
              {first(quotation, ['qty_mt']) ? <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Quantity: {first(quotation, ['qty_mt'])} MT</Text> : null}
              {first(quotation, ['incoterm']) ? <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Term: {first(quotation, ['incoterm'])}</Text> : null}
              {first(quotation, ['destination']) ? <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Destination: {first(quotation, ['destination'])}</Text> : null}
            </View>
            {productUnitPrice !== null ? (
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700', marginTop: 10 }}>
                FOB unit price: {money(productUnitPrice)}
              </Text>
            ) : null}
            {first(quotation, ['valid_until']) ? (
              <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 6 }}>
                Valid until: {first(quotation, ['valid_until'])}
              </Text>
            ) : null}
          </Card>

          {messagesQuery.isError ? (
            <ErrorState
              message="Quotation messages could not be loaded."
              error={messagesQuery.error}
              onRetry={() => void messagesQuery.refetch()}
            />
          ) : null}
          {messagesQuery.isLoading ? <LoadingCard label="Loading quotation messages…" /> : null}
          <FlatList
            testID="buyer-quotation-messages"
            style={{ flex: 1 }}
            data={orderedMessages}
            inverted={orderedMessages.length > 0}
            scrollEnabled={orderedMessages.length > 0}
            keyExtractor={(item, index) => first(item, ['id'], String(index))}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1, paddingVertical: 6 }}
            ListEmptyComponent={
              messagesQuery.isLoading || messagesQuery.isError
                ? undefined
                : <EmptyState title="Start a conversation" body="Ask the trade desk about this quotation. Replies will appear here." />
            }
            renderItem={({ item }) => {
              const senderId = first(item, ['user_id'], first(record(item.user), ['id'], ''));
              const own = buyerId !== '' && senderId === buyerId;
              const createdAt = first(item, ['created_at'], '');
              return (
                <Card style={{
                  backgroundColor: own ? colors.secondary : colors.card,
                  alignSelf: own ? 'flex-end' : 'flex-start',
                  width: '88%',
                  borderRadius: 18,
                  marginBottom: 8,
                }}>
                  <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: '700', marginBottom: 5 }}>
                    {own ? 'You' : 'OG Exports Trade Desk'}
                  </Text>
                  <Text style={{ color: colors.foreground, lineHeight: 20 }}>{first(item, ['body'], '')}</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 7 }}>{timestamp(createdAt)}</Text>
                </Card>
              );
            }}
          />
          {sendError ? <Text accessibilityRole="alert" style={{ color: colors.destructive, fontSize: 12, marginBottom: 8 }}>{sendError}</Text> : null}
          <View style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
            <Card style={{ marginBottom: 0 }}>
              <Field label="Message" value={message} onChangeText={setMessage} placeholder="Ask about this quotation…" multiline />
              <Action
                title="Send message"
                icon="send"
                loading={sendMessage.isPending}
                disabled={!message.trim()}
                onPress={() => void submitMessage()}
                testID="buyer-quotation-send-message"
              />
            </Card>
          </View>
        </KeyboardAvoidingView>
      ) : null}
    </Screen>
  );
}
