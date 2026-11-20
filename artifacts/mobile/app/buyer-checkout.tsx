import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { Action, Card, EmptyState, ErrorState, Field, LoadingCard, Screen } from '@/components/InvestorUI';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import {
  useCheckoutBuyerCart,
  useGetBuyerCart,
  useGetCountries,
  useGetCountryPorts,
  useGetIncoterms,
  useRequestBuyerCartQuotation,
  getGetBuyerCartQueryKey,
  getGetBuyerOrdersQueryKey,
  getGetBuyerRfqsQueryKey,
  getGetCountriesQueryKey,
  getGetCountryPortsQueryKey,
  getGetIncotermsQueryKey,
} from '@workspace/api-client-react';
import { amount, first, list, messageOf, record } from '@/lib/data';
import { rowsFromResponse } from '@/lib/buyer-data';

function isFutureIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const selected = new Date(`${value}T00:00:00`);
  if (Number.isNaN(selected.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selected > today;
}

export default function BuyerCheckout() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const cartQuery = useGetBuyerCart({ query: { queryKey: getGetBuyerCartQueryKey(), enabled: !!token, staleTime: 10_000 } });
  const countriesQuery = useGetCountries({ query: { queryKey: getGetCountriesQueryKey(), staleTime: 300_000 } });
  const incotermsQuery = useGetIncoterms({ query: { queryKey: getGetIncotermsQueryKey(), staleTime: 300_000 } });
  const countries = rowsFromResponse(countriesQuery.data).filter(country => (amount(country, ['ports_count']) ?? 0) > 0);
  const [countryId, setCountryId] = useState<number | null>(null);
  const [portId, setPortId] = useState<number | null>(null);
  const [incoterm, setIncoterm] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const portsQuery = useGetCountryPorts(countryId ?? 0, { query: { queryKey: getGetCountryPortsQueryKey(countryId ?? 0), enabled: countryId !== null } });
  const ports = rowsFromResponse(portsQuery.data);
  const terms = rowsFromResponse(incotermsQuery.data);
  const cart = record(record(cartQuery.data).data);
  const cartItems = list(cart.items);
  const subtotal = cartItems.reduce((sum, item) => {
    return sum + (amount(item, ['qty']) ?? 0) * (amount(item, ['unit_price']) ?? 0);
  }, 0);
  const placeOrder = useCheckoutBuyerCart();
  const requestQuote = useRequestBuyerCartQuotation();
  const isBusy = placeOrder.isPending || requestQuote.isPending;
  const selectedCountry = countries.find(country => amount(country, ['id']) === countryId);
  const selectedPort = ports.find(port => amount(port, ['id']) === portId);
  const selectedTerm = terms.find(term => first(term, ['code', 'name']) === incoterm);

  function selectCountry(country: ReturnType<typeof record>) {
    const id = amount(country, ['id']);
    setCountryId(id);
    setPortId(null);
    setError('');
  }

  function validate(): boolean {
    if (!countryId || !selectedCountry) { setError('Select a destination country.'); return false; }
    if (!portId || !selectedPort) { setError('Select a destination port.'); return false; }
    if (!incoterm || !selectedTerm) { setError('Select a delivery term.'); return false; }
    if (!isFutureIsoDate(deliveryDate)) { setError('Enter a valid delivery date after today in YYYY-MM-DD format.'); return false; }
    if (cartItems.length === 0) { setError('Your cart is empty. Add a product before continuing.'); return false; }
    return true;
  }

  async function submit() {
    setError('');
    if (!validate() || countryId === null || portId === null) return;
    const data = {
      destination_country_id: countryId,
      destination_port_id: portId,
      incoterm,
      required_delivery_date: deliveryDate,
      notes: notes.trim(),
    };
    try {
      if (incoterm.trim().toUpperCase() === 'FOB') {
        await placeOrder.mutateAsync({ data });
        await queryClient.invalidateQueries({ queryKey: getGetBuyerOrdersQueryKey({ per_page: 50 }) });
        await queryClient.invalidateQueries({ queryKey: getGetBuyerOrdersQueryKey() });
        router.replace({ pathname: '/(buyer-tabs)/buyer-orders', params: { view: 'orders' } });
      } else {
        await requestQuote.mutateAsync({ data });
        await queryClient.invalidateQueries({ queryKey: getGetBuyerRfqsQueryKey({ per_page: 50 }) });
        await queryClient.invalidateQueries({ queryKey: getGetBuyerRfqsQueryKey() });
        router.replace({ pathname: '/(buyer-tabs)/buyer-orders', params: { view: 'rfqs' } });
      }
      await queryClient.invalidateQueries({ queryKey: getGetBuyerCartQueryKey() });
    } catch (err) {
      setError(messageOf(err));
    }
  }

  return (
    <Screen title="Checkout" subtitle="Confirm destination and delivery details">
      {cartQuery.isLoading ? <LoadingCard label="Loading your cart…" /> : null}
      {cartQuery.isError ? <ErrorState message="Your cart could not be loaded." error={cartQuery.error} onRetry={() => void cartQuery.refetch()} /> : null}
      {!cartQuery.isLoading && !cartQuery.isError && cartItems.length === 0 ? (
        <EmptyState title="Your cart is empty" body="Add a product before starting checkout." icon="shopping-cart" />
      ) : null}

      {cartItems.length > 0 ? (
        <>
          <Card style={{ padding: 16, marginBottom: 16 }}>
            <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '700' }}>Order summary</Text>
            {cartItems.map((item, index) => {
              const product = record(item.product);
              return (
                <View key={first(item, ['id'], String(index))} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 10 }}>
                  <Text style={{ color: colors.mutedForeground, flex: 1, fontSize: 12 }}>
                    {first(product, ['name'], 'Export product')} × {amount(item, ['qty']) ?? 0}
                  </Text>
                  <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '600' }}>
                    {amount(item, ['unit_price']) ? `USD ${((amount(item, ['unit_price']) ?? 0) * (amount(item, ['qty']) ?? 0)).toFixed(2)}` : 'Quote'}
                  </Text>
                </View>
              );
            })}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, marginTop: 13, paddingTop: 12 }}>
              <Text style={{ color: colors.foreground, fontWeight: '700' }}>Estimated subtotal</Text>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>{subtotal > 0 ? `USD ${subtotal.toFixed(2)}` : 'Price by quotation'}</Text>
            </View>
          </Card>

          <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 13, marginBottom: 8 }}>Destination country</Text>
          {countriesQuery.isLoading ? <LoadingCard label="Loading destination countries…" lines={2} /> : null}
          {countriesQuery.isError ? <ErrorState message="Destination countries could not be loaded." error={countriesQuery.error} onRetry={() => void countriesQuery.refetch()} /> : null}
          {!countriesQuery.isLoading && !countriesQuery.isError ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 14 }}>
              {countries.map(country => {
                const id = amount(country, ['id']);
                const selected = id !== null && id === countryId;
                return (
                  <Pressable
                    key={String(id)}
                    testID={`buyer-checkout-country-${id}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => selectCountry(country)}
                    style={{ minHeight: 40, borderRadius: 20, paddingHorizontal: 14, justifyContent: 'center', backgroundColor: selected ? colors.primary : colors.secondary, borderWidth: 1, borderColor: selected ? colors.primary : colors.border }}
                  >
                    <Text style={{ color: selected ? colors.primaryForeground : colors.foreground, fontSize: 12, fontWeight: '600' }}>{first(country, ['name'], 'Country')}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          {countryId !== null ? (
            <>
              <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 13, marginBottom: 8 }}>Destination port</Text>
              {portsQuery.isLoading ? <LoadingCard label="Loading ports…" lines={2} /> : null}
              {portsQuery.isError ? <ErrorState message="Ports for this country could not be loaded." error={portsQuery.error} onRetry={() => void portsQuery.refetch()} /> : null}
              {!portsQuery.isLoading && !portsQuery.isError && ports.length === 0 ? <Text style={{ color: colors.mutedForeground, fontSize: 12, marginBottom: 12 }}>No ports are listed for this country.</Text> : null}
              {!portsQuery.isLoading && !portsQuery.isError ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 14 }}>
                  {ports.map(port => {
                    const id = amount(port, ['id']);
                    const selected = id !== null && id === portId;
                    return (
                      <Pressable
                        key={String(id)}
                        testID={`buyer-checkout-port-${id}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        onPress={() => { setPortId(id); setError(''); }}
                        style={{ minHeight: 40, borderRadius: 20, paddingHorizontal: 14, justifyContent: 'center', backgroundColor: selected ? colors.primary : colors.secondary, borderWidth: 1, borderColor: selected ? colors.primary : colors.border }}
                      >
                        <Text style={{ color: selected ? colors.primaryForeground : colors.foreground, fontSize: 12, fontWeight: '600' }}>{first(port, ['name'], 'Port')}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : null}
            </>
          ) : null}

          <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 13, marginBottom: 8 }}>Delivery term</Text>
          {incotermsQuery.isLoading ? <LoadingCard label="Loading delivery terms…" lines={2} /> : null}
          {incotermsQuery.isError ? <ErrorState message="Delivery terms could not be loaded." error={incotermsQuery.error} onRetry={() => void incotermsQuery.refetch()} /> : null}
          {!incotermsQuery.isLoading && !incotermsQuery.isError ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {terms.map(term => {
                const code = first(term, ['code', 'name']);
                const selected = code === incoterm;
                return (
                  <Pressable
                    key={code}
                    testID={`buyer-checkout-incoterm-${code.toLowerCase()}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => { setIncoterm(code); setError(''); }}
                    style={{ minHeight: 40, borderRadius: 20, paddingHorizontal: 14, justifyContent: 'center', backgroundColor: selected ? colors.primary : colors.secondary, borderWidth: 1, borderColor: selected ? colors.primary : colors.border }}
                  >
                    <Text style={{ color: selected ? colors.primaryForeground : colors.foreground, fontSize: 12, fontWeight: '600' }}>{code}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <Field
            label="Required delivery date"
            value={deliveryDate}
            onChangeText={value => { setDeliveryDate(value); setError(''); }}
            placeholder="YYYY-MM-DD"
            keyboardType="numeric"
            autoCapitalize="none"
          />
          <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: -8, marginBottom: 14 }}>
            Choose a date after today. Format: YYYY-MM-DD.
          </Text>
          <Field
            label="Notes for OG Exports"
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional delivery or product notes"
            multiline
          />
          <Card style={{ padding: 14, marginBottom: 15, backgroundColor: colors.lightGreen }}>
            <Text style={{ color: colors.foreground, fontSize: 12, lineHeight: 18 }}>
              {incoterm.trim().toUpperCase() === 'FOB'
                ? 'FOB checkout records your order. OG Exports will confirm payment instructions separately; no payment is collected here.'
                : 'For non-FOB terms, this submits a quotation request. OG Exports will confirm pricing and delivery details.'}
            </Text>
          </Card>
          {error ? <Text accessibilityRole="alert" style={{ color: colors.destructive, fontSize: 12, lineHeight: 18, marginBottom: 12 }}>{error}</Text> : null}
          <Action
            title={incoterm.trim().toUpperCase() === 'FOB' ? 'Place order' : 'Request quotation'}
            icon={incoterm.trim().toUpperCase() === 'FOB' ? 'check' : 'file-text'}
            loading={isBusy}
            disabled={isBusy || countriesQuery.isLoading || incotermsQuery.isLoading}
            onPress={() => void submit()}
            testID="buyer-checkout-submit"
          />
        </>
      ) : null}
    </Screen>
  );
}
