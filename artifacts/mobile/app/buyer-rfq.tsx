import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File as ExpoFile } from 'expo-file-system';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetBuyerRfqsQueryKey,
  getGetCountriesQueryKey,
  getGetCountryPortsQueryKey,
  getGetIncotermsQueryKey,
  getGetPaymentMethodsQueryKey,
  useCreateBuyerRfq,
  useGetCountries,
  useGetCountryPorts,
  useGetIncoterms,
  useGetPaymentMethods,
} from '@workspace/api-client-react';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { Action, Card, ErrorState, Field, LoadingCard, Screen } from '@/components/InvestorUI';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { uploadInvestorFile } from '@/lib/file-upload';
import { INVESTOR_DOCUMENT_MIME_TYPES } from '@/lib/upload-rules';
import { amount, first, list, messageOf, record } from '@/lib/data';
import { rowsFromResponse } from '@/lib/buyer-data';

const attachmentTypes = [
  ...INVESTOR_DOCUMENT_MIME_TYPES,
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

type Attachment = { source: string | ExpoFile; name: string; mime: string; size: number };

function isFutureIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date > today;
}

export default function BuyerRfq() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const { token, apiOrigin } = useAuth();
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [packaging, setPackaging] = useState('');
  const [countryId, setCountryId] = useState<number | null>(null);
  const [portId, setPortId] = useState<number | null>(null);
  const [incoterm, setIncoterm] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [picking, setPicking] = useState(false);
  const countriesQuery = useGetCountries({ query: { queryKey: getGetCountriesQueryKey(), enabled: !!token, staleTime: 300_000 } });
  const termsQuery = useGetIncoterms({ query: { queryKey: getGetIncotermsQueryKey(), enabled: !!token, staleTime: 300_000 } });
  const paymentsQuery = useGetPaymentMethods({ query: { queryKey: getGetPaymentMethodsQueryKey(), enabled: !!token, staleTime: 300_000 } });
  const portsQuery = useGetCountryPorts(countryId ?? 0, {
    query: { queryKey: getGetCountryPortsQueryKey(countryId ?? 0), enabled: countryId !== null, staleTime: 300_000 },
  });
  const countries = rowsFromResponse(countriesQuery.data).filter(country => (amount(country, ['ports_count']) ?? 0) > 0);
  const ports = rowsFromResponse(portsQuery.data);
  const terms = rowsFromResponse(termsQuery.data);
  const paymentMethods = rowsFromResponse(paymentsQuery.data);
  const createRfq = useCreateBuyerRfq();
  const busy = createRfq.isPending || uploading;
  const selectedCountry = countries.find(country => amount(country, ['id']) === countryId);
  const selectedPort = ports.find(port => amount(port, ['id']) === portId);

  if (!token) {
    return <BuyerAuthGate title="Request a quotation" body="Sign in to send product, quantity, delivery, and payment requirements to the OG Exports trade desk." returnTo="/buyer-rfq" />;
  }

  async function attachFile() {
    setError('');
    setPicking(true);
    try {
      if (attachments.length >= 5) throw new Error('Up to five files can be attached to one request.');
      if (Platform.OS === 'web') {
        const result = await DocumentPicker.getDocumentAsync({ type: attachmentTypes, copyToCacheDirectory: true });
        if (result.canceled) return;
        const file = result.assets[0];
        if (!file) throw new Error('No file was selected.');
        setAttachments(current => [...current, { source: file.uri, name: file.name, mime: file.mimeType ?? 'application/octet-stream', size: file.size ?? 0 }]);
      } else {
        const result = await ExpoFile.pickFileAsync({ mimeTypes: attachmentTypes });
        if (result.canceled) return;
        setAttachments(current => [...current, { source: result.result, name: result.result.name, mime: result.result.type || 'application/octet-stream', size: result.result.size }]);
      }
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setPicking(false);
    }
  }

  async function submit() {
    setError('');
    if (!productName.trim()) return setError('Enter the product you need a quotation for.');
    if (!quantity.trim()) return setError('Enter the requested quantity.');
    if (!countryId || !selectedCountry) return setError('Select a destination country.');
    if (!portId || !selectedPort) return setError('Select a destination port.');
    if (!incoterm) return setError('Select a delivery term.');
    if (!paymentTerms.trim()) return setError('Select or enter your preferred payment terms.');
    if (!isFutureIsoDate(deliveryDate)) return setError('Enter a required delivery date after today in YYYY-MM-DD format.');

    setUploading(true);
    try {
      const uploaded = [];
      for (const attachment of attachments) {
        const path = await uploadInvestorFile(attachment.source, attachment.name, attachment.mime, 'rfq', apiOrigin);
        uploaded.push({
          path,
          original_name: attachment.name,
          mime: attachment.mime,
          size: attachment.size,
        });
      }
      await createRfq.mutateAsync({
        data: {
          product_name: productName.trim(),
          qty: quantity.trim(),
          packaging: packaging.trim() || null,
          country_id: countryId,
          port_id: portId,
          incoterm,
          payment_terms: paymentTerms,
          required_delivery_date: deliveryDate,
          notes: notes.trim(),
          attachments: uploaded,
        },
      });
      await queryClient.invalidateQueries({ queryKey: getGetBuyerRfqsQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getGetBuyerRfqsQueryKey({ per_page: 50 }) });
      router.replace({ pathname: '/(buyer-tabs)/buyer-orders', params: { view: 'rfqs' } });
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setUploading(false);
    }
  }

  function selectCountry(country: ReturnType<typeof record>) {
    const id = amount(country, ['id']);
    setCountryId(id);
    setPortId(null);
    setError('');
  }

  function selectChip(value: string, selected: boolean, onSelect: () => void) {
    return (
      <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected }} onPress={onSelect} style={{ minHeight: 39, borderRadius: 20, paddingHorizontal: 13, justifyContent: 'center', backgroundColor: selected ? colors.primary : colors.secondary, borderWidth: 1, borderColor: selected ? colors.primary : colors.border }}>
        <Text style={{ color: selected ? colors.primaryForeground : colors.foreground, fontSize: 11, fontWeight: '700' }}>{value}</Text>
      </Pressable>
    );
  }

  return (
    <Screen title="Request a quotation" subtitle="Share your requirements with our trade desk">
      <Card style={{ padding: 15, marginBottom: 14 }}>
        <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800', marginBottom: 10 }}>Product requirements</Text>
        <Field label="Product name" value={productName} onChangeText={setProductName} placeholder="e.g. Premium Basmati Rice" />
        <Field label="Quantity and unit" value={quantity} onChangeText={setQuantity} placeholder="e.g. 25 MT" />
        <Field label="Packaging" value={packaging} onChangeText={setPackaging} placeholder="e.g. 25 kg PP bags" />
      </Card>

      <Card style={{ padding: 15, marginBottom: 14 }}>
        <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800', marginBottom: 10 }}>Destination and terms</Text>
        <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '700', marginBottom: 7 }}>Destination country</Text>
        {countriesQuery.isLoading ? <LoadingCard label="Loading destination countries…" lines={2} /> : null}
        {countriesQuery.isError ? <ErrorState message="Destination countries could not be loaded." error={countriesQuery.error} onRetry={() => void countriesQuery.refetch()} /> : null}
        {!countriesQuery.isLoading && !countriesQuery.isError ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingBottom: 12 }}>
            {countries.map(country => {
              const id = amount(country, ['id']);
              return selectChip(first(country, ['name'], 'Country'), id !== null && id === countryId, () => selectCountry(country));
            })}
          </ScrollView>
        ) : null}

        {countryId !== null ? (
          <>
            <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '700', marginBottom: 7 }}>Destination port</Text>
            {portsQuery.isLoading ? <LoadingCard label="Loading ports…" lines={2} /> : null}
            {portsQuery.isError ? <ErrorState message="Ports could not be loaded." error={portsQuery.error} onRetry={() => void portsQuery.refetch()} /> : null}
            {!portsQuery.isLoading && !portsQuery.isError ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingBottom: 12 }}>
                {ports.map(port => {
                  const id = amount(port, ['id']);
                  return selectChip(first(port, ['name'], 'Port'), id !== null && id === portId, () => { setPortId(id); setError(''); });
                })}
              </ScrollView>
            ) : null}
          </>
        ) : null}

        <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '700', marginBottom: 7 }}>Delivery term</Text>
        {termsQuery.isLoading ? <LoadingCard label="Loading delivery terms…" lines={1} /> : null}
        {termsQuery.isError ? <ErrorState message="Delivery terms could not be loaded." error={termsQuery.error} onRetry={() => void termsQuery.refetch()} /> : null}
        {!termsQuery.isLoading && !termsQuery.isError ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
            {terms.map(term => {
              const code = first(term, ['code', 'name']);
              return selectChip(code, code === incoterm, () => setIncoterm(code));
            })}
          </View>
        ) : null}

        <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '700', marginBottom: 7 }}>Payment terms</Text>
        {paymentsQuery.isLoading ? <LoadingCard label="Loading payment terms…" lines={1} /> : null}
        {paymentsQuery.isError ? <ErrorState message="Payment terms could not be loaded." error={paymentsQuery.error} onRetry={() => void paymentsQuery.refetch()} /> : null}
        {!paymentsQuery.isLoading && !paymentsQuery.isError ? (
          <View style={{ gap: 7, marginBottom: 12 }}>
            {paymentMethods.map(method => {
              const code = first(method, ['code']);
              const label = first(method, ['label'], code);
              const selected = paymentTerms === label;
              return (
                <Pressable key={code} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => setPaymentTerms(label)} style={{ minHeight: 48, padding: 11, borderRadius: 12, borderWidth: 1, borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? colors.secondary : colors.card, flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                  <Feather name={selected ? 'check-circle' : 'circle'} size={15} color={selected ? colors.primary : colors.mutedForeground} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '700' }}>{label}</Text>
                    {first(method, ['description']) ? <Text style={{ color: colors.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: 3 }}>{first(method, ['description'])}</Text> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        {!paymentMethods.length && !paymentsQuery.isLoading ? <Field label="Payment terms" value={paymentTerms} onChangeText={setPaymentTerms} placeholder="Enter preferred terms" /> : null}
        <Field label="Required delivery date" value={deliveryDate} onChangeText={setDeliveryDate} placeholder="YYYY-MM-DD" />
      </Card>

      <Card style={{ padding: 15, marginBottom: 14 }}>
        <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800', marginBottom: 10 }}>Additional information</Text>
        <Field label="Special requirements" value={notes} onChangeText={setNotes} placeholder="Quality, certification, inspection, or other requirements" multiline />
        <Pressable accessibilityRole="button" disabled={picking || attachments.length >= 5} onPress={() => void attachFile()} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <Feather name="paperclip" size={16} color={colors.primary} />
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>{picking ? 'Opening files…' : `Attach supporting file (${attachments.length}/5)`}</Text>
        </Pressable>
        {attachments.map((file, index) => (
          <View key={`${file.name}-${index}`} style={{ minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Feather name="file-text" size={14} color={colors.mutedForeground} />
            <Text style={{ color: colors.foreground, fontSize: 11, flex: 1 }} numberOfLines={1}>{file.name}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${file.name}`} onPress={() => setAttachments(current => current.filter((_, fileIndex) => fileIndex !== index))}>
              <Feather name="x" size={16} color={colors.destructive} />
            </Pressable>
          </View>
        ))}
        <Text style={{ color: colors.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: 5 }}>Up to five files. Images, PDF, Word and Excel documents are accepted.</Text>
      </Card>

      {error ? <Text accessibilityRole="alert" style={{ color: colors.destructive, fontSize: 12, lineHeight: 18, marginBottom: 9 }}>{error}</Text> : null}
      <Action title="Send quotation request" icon="send" loading={busy} disabled={busy} onPress={() => void submit()} testID="buyer-rfq-submit" />
      <Text style={{ color: colors.mutedForeground, fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 8 }}>Your request goes to the OG Exports trade desk. No payment is collected here.</Text>
    </Screen>
  );
}
