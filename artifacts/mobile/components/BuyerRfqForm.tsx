import React, { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File as ExpoFile } from 'expo-file-system';
import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetBuyerRfqsQueryKey,
  getGetCountriesQueryKey,
  getGetCountryPortsQueryKey,
  getGetIncotermsQueryKey,
  getGetProductsQueryKey,
  useCreateBuyerRfq,
  useGetCountries,
  useGetCountryPorts,
  useGetIncoterms,
  useGetProducts,
} from '@workspace/api-client-react';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { Action, Card, ErrorState, Field, LoadingCard, Screen } from '@/components/InvestorUI';
import { BuyerRfqPicker, type BuyerRfqOption } from '@/components/BuyerRfqPicker';
import { DateOfBirthPicker } from '@/components/DateOfBirthPicker';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { uploadInvestorFile } from '@/lib/file-upload';
import { INVESTOR_DOCUMENT_MIME_TYPES, validateInvestorUploadFileSize } from '@/lib/upload-rules';
import {
  BUYER_RFQ_PACKAGING_OPTIONS,
  BUYER_RFQ_PAYMENT_TERMS,
  formatBuyerRfqReference,
  isFutureBuyerRfqDate,
  parseBuyerRfqQuantity,
  type BuyerRfqDraft,
} from '@/lib/buyer-rfq';
import { amount, first, messageOf, record } from '@/lib/data';
import { rowsFromResponse } from '@/lib/buyer-data';

const MAX_RFQ_FILES = 5;
const MAX_RFQ_FILE_BYTES = 10 * 1024 * 1024;
const wordAndSpreadsheetMimes = [
  'image/bmp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
const attachmentMimeTypes = [...INVESTOR_DOCUMENT_MIME_TYPES, ...wordAndSpreadsheetMimes];
const acceptedExtensions = new Set(['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'doc', 'docx', 'xls', 'xlsx']);
const extensionMimes: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

type Attachment = {
  key: string;
  source: string | ExpoFile;
  name: string;
  mime: string;
  size: number;
};

function fileExtension(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

function mimeForFile(name: string, mime: string | null | undefined) {
  const extension = fileExtension(name);
  return mime && mime !== 'application/octet-stream' ? mime : extensionMimes[extension] ?? 'application/octet-stream';
}

function formatFileSize(size: number) {
  return size >= 1024 * 1024
    ? `${(size / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(size / 1024))} KB`;
}

export function BuyerRfqForm({
  initialDraft,
  onCancel,
  onSubmitted,
}: {
  initialDraft?: BuyerRfqDraft;
  onCancel: () => void;
  onSubmitted: (reference: string) => void;
}) {
  const colors = useColors();
  const queryClient = useQueryClient();
  const { ready, token, apiOrigin } = useAuth();
  const [productId, setProductId] = useState(initialDraft?.productId ?? '');
  const [quantity, setQuantity] = useState(initialDraft?.quantity ?? '');
  const [packaging, setPackaging] = useState(initialDraft?.packaging ?? '25 kg PP Bag');
  const [countryId, setCountryId] = useState(initialDraft?.countryId ?? '');
  const [portId, setPortId] = useState(initialDraft?.portId ?? '');
  const [incoterm, setIncoterm] = useState(initialDraft?.incoterm ?? '');
  const [paymentTerms, setPaymentTerms] = useState(initialDraft?.paymentTerms ?? '');
  const [deliveryDate, setDeliveryDate] = useState(initialDraft?.deliveryDate ?? '');
  const [notes, setNotes] = useState(initialDraft?.notes ?? '');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState('');
  const [picking, setPicking] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const createRfq = useCreateBuyerRfq();
  const busy = createRfq.isPending || Boolean(uploadProgress);

  const productsQuery = useGetProducts({ per_page: 100 }, {
    query: {
      queryKey: getGetProductsQueryKey({ per_page: 100 }),
      enabled: ready && Boolean(apiOrigin),
      staleTime: 300_000,
      retry: false,
    },
  });
  const countriesQuery = useGetCountries({
    query: { queryKey: getGetCountriesQueryKey(), enabled: ready && Boolean(token), staleTime: 300_000, retry: false },
  });
  const incotermsQuery = useGetIncoterms({
    query: { queryKey: getGetIncotermsQueryKey(), enabled: ready && Boolean(token), staleTime: 300_000, retry: false },
  });
  const portsQuery = useGetCountryPorts(Number(countryId) || 0, {
    query: {
      queryKey: getGetCountryPortsQueryKey(Number(countryId) || 0),
      enabled: Boolean(token && countryId),
      staleTime: 300_000,
      retry: false,
    },
  });

  const products = rowsFromResponse(productsQuery.data);
  const countries = rowsFromResponse(countriesQuery.data).filter(country => (amount(country, ['ports_count']) ?? 0) > 0);
  const ports = rowsFromResponse(portsQuery.data);
  const incoterms = rowsFromResponse(incotermsQuery.data);
  const selectedProduct = products.find(product => first(product, ['id']) === productId);
  const productOptions: BuyerRfqOption[] = products.map(product => ({
    value: first(product, ['id']),
    label: first(product, ['name'], 'Product'),
    keywords: `${first(product, ['category', 'type'])} ${first(product, ['description'])}`,
  }));
  const countryOptions: BuyerRfqOption[] = countries.map(country => ({
    value: first(country, ['id']),
    label: first(country, ['name'], 'Country'),
    keywords: `${first(country, ['code'])} ${first(country, ['iso2'])}`,
  }));
  const portOptions: BuyerRfqOption[] = ports.map(port => ({
    value: first(port, ['id']),
    label: `${first(port, ['name'], 'Port')}${first(port, ['unlocode']) ? ` (${first(port, ['unlocode'])})` : ''}`,
    keywords: first(port, ['unlocode']),
  }));
  const incotermOptions: BuyerRfqOption[] = incoterms.map(term => {
    const code = first(term, ['code', 'name']);
    const label = first(term, ['label']);
    return { value: code, label: label ? `${code} — ${label}` : code, keywords: code };
  }).filter(option => option.value);
  const packagingOptions: BuyerRfqOption[] = BUYER_RFQ_PACKAGING_OPTIONS.map(value => ({ value, label: value }));
  const paymentOptions: BuyerRfqOption[] = BUYER_RFQ_PAYMENT_TERMS.map(value => ({ value, label: value }));

  if (!token) {
    return <BuyerAuthGate
      title="Request a quotation"
      body="Sign in to send product, quantity, delivery, and payment requirements to the OG Exports trade desk."
      returnTo="/buyer-rfq?mode=new"
    />;
  }

  async function attachFile() {
    setError('');
    setPicking(true);
    try {
      if (attachments.length >= MAX_RFQ_FILES) throw new Error(`Up to ${MAX_RFQ_FILES} files can be attached to one request.`);
      let attachment: Attachment;
      if (Platform.OS === 'web') {
        const result = await DocumentPicker.getDocumentAsync({ type: attachmentMimeTypes, copyToCacheDirectory: true });
        if (result.canceled) return;
        const file = result.assets[0];
        if (!file) throw new Error('No file was selected.');
        const mime = mimeForFile(file.name, file.mimeType);
        if (!attachmentMimeTypes.includes(mime as typeof attachmentMimeTypes[number]) && !acceptedExtensions.has(fileExtension(file.name))) {
          throw new Error('Choose an image, PDF, Word, or Excel file.');
        }
        const size = file.size ?? 0;
        validateInvestorUploadFileSize(size);
        attachment = { key: `${Date.now()}-${file.name}`, source: file.uri, name: file.name, mime, size };
      } else {
        const result = await ExpoFile.pickFileAsync({ mimeTypes: attachmentMimeTypes });
        if (result.canceled) return;
        const file = result.result;
        const mime = mimeForFile(file.name, file.type);
        if (!attachmentMimeTypes.includes(mime as typeof attachmentMimeTypes[number]) && !acceptedExtensions.has(fileExtension(file.name))) {
          throw new Error('Choose an image, PDF, Word, or Excel file.');
        }
        const size = validateInvestorUploadFileSize(file.size);
        attachment = { key: `${Date.now()}-${file.name}`, source: file, name: file.name, mime, size };
      }
      if (attachment.size > MAX_RFQ_FILE_BYTES) throw new Error('Choose a file that is 10 MB or smaller.');
      setAttachments(current => [...current, attachment]);
    } catch (pickerError) {
      setError(messageOf(pickerError));
    } finally {
      setPicking(false);
    }
  }

  async function submit() {
    setError('');
    if (!productId || !selectedProduct) return setError('Select a valid product from the catalogue.');
    const quantityNumber = parseBuyerRfqQuantity(quantity);
    if (quantityNumber === null) return setError('Enter a valid quantity in MT greater than zero.');
    if (!countryId || !countries.some(country => first(country, ['id']) === countryId)) return setError('Select a destination country.');
    if (!portId || !ports.some(port => first(port, ['id']) === portId)) return setError('Select a valid destination port.');
    if (!incoterm || !incotermOptions.some(option => option.value === incoterm)) return setError('Select a preferred Incoterm.');
    if (!paymentOptions.some(option => option.value === paymentTerms)) return setError('Select preferred payment terms.');
    if (!isFutureBuyerRfqDate(deliveryDate)) return setError('Required delivery date must be after today.');

    try {
      const uploaded: { path: string; original_name: string; mime: string; size: number }[] = [];
      for (let index = 0; index < attachments.length; index += 1) {
        const attachment = attachments[index];
        setUploadProgress(`Uploading file ${index + 1} of ${attachments.length}…`);
        const path = await uploadInvestorFile(attachment.source, attachment.name, attachment.mime, 'rfq-attachments', apiOrigin);
        uploaded.push({
          path,
          original_name: attachment.name,
          mime: attachment.mime,
          size: attachment.size,
        });
      }
      setUploadProgress('Submitting your RFQ…');
      const response = await createRfq.mutateAsync({
        data: {
          product_id: Number(first(selectedProduct, ['id'])),
          product_name: first(selectedProduct, ['name']),
          qty: `${quantityNumber} MT`,
          packaging: packaging.trim() || null,
          country_id: Number(countryId),
          port_id: Number(portId),
          incoterm,
          payment_terms: paymentTerms,
          required_delivery_date: deliveryDate,
          notes: notes.trim() || undefined,
          attachments: uploaded.length ? uploaded : undefined,
        },
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetBuyerRfqsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetBuyerRfqsQueryKey({ per_page: 50 }) }),
        queryClient.invalidateQueries({ queryKey: getGetBuyerRfqsQueryKey({ per_page: 100 }) }),
      ]);
      const responseData = record(record(response).data ?? response);
      const submittedId = responseData.id ?? responseData.reference ?? responseData.rfq_number ?? '';
      onSubmitted(formatBuyerRfqReference(String(submittedId)));
    } catch (submitError) {
      setError(messageOf(submitError));
    } finally {
      setUploadProgress('');
    }
  }

  const statusMessage = countriesQuery.isError
    ? 'Destination countries could not be loaded.'
    : incotermsQuery.isError
      ? 'Delivery terms could not be loaded.'
      : portsQuery.isError
        ? 'Destination ports could not be loaded.'
        : productsQuery.isError
          ? 'Products could not be loaded.'
          : '';

  return (
    <Screen title="New RFQ" subtitle="Share your product and delivery requirements with our trade desk">
      {productsQuery.isLoading || countriesQuery.isLoading || incotermsQuery.isLoading ? <LoadingCard label="Loading live products and trade options…" lines={2} /> : null}
      {statusMessage ? (
        <View style={{ marginBottom: 12 }}>
          <ErrorState
            message={statusMessage}
            error={productsQuery.error ?? countriesQuery.error ?? incotermsQuery.error ?? portsQuery.error}
            onRetry={() => {
              if (productsQuery.isError) void productsQuery.refetch();
              if (countriesQuery.isError) void countriesQuery.refetch();
              if (incotermsQuery.isError) void incotermsQuery.refetch();
              if (portsQuery.isError) void portsQuery.refetch();
            }}
          />
        </View>
      ) : null}

      <Card style={{ padding: 15, marginBottom: 14 }}>
        <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800', marginBottom: 10 }}>Product requirements</Text>
        <BuyerRfqPicker
          label="Product *"
          value={productId}
          options={productOptions}
          placeholder={productsQuery.isLoading ? 'Loading products…' : 'Search and select a product'}
          testID="buyer-rfq-product"
          disabled={productsQuery.isLoading || productsQuery.isError}
          emptyMessage="No catalogue products match your search."
          onSelect={setProductId}
        />
        <Field
          label="Quantity (MT) *"
          value={quantity}
          onChangeText={value => setQuantity(value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
          placeholder="e.g. 25"
          keyboardType="decimal-pad"
          autoCapitalize="none"
          maxLength={12}
        />
        <BuyerRfqPicker
          label="Packaging"
          value={packaging}
          options={packagingOptions}
          placeholder="Select packaging"
          testID="buyer-rfq-packaging"
          onSelect={setPackaging}
        />
      </Card>

      <Card style={{ padding: 15, marginBottom: 14 }}>
        <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800', marginBottom: 10 }}>Destination and terms</Text>
        <BuyerRfqPicker
          label="Destination country *"
          value={countryId}
          options={countryOptions}
          placeholder={countriesQuery.isLoading ? 'Loading countries…' : 'Search and select a country'}
          testID="buyer-rfq-country"
          disabled={countriesQuery.isLoading || countriesQuery.isError}
          emptyMessage="No eligible destination country found."
          onSelect={value => { setCountryId(value); setPortId(''); }}
        />
        <BuyerRfqPicker
          label="Destination port *"
          value={portId}
          options={portOptions}
          placeholder={!countryId ? 'Select a country first' : portsQuery.isLoading ? 'Loading ports…' : 'Search and select a port'}
          testID="buyer-rfq-port"
          disabled={!countryId || portsQuery.isLoading || portsQuery.isError}
          emptyMessage="No ports are available for this country."
          onSelect={setPortId}
        />
        <BuyerRfqPicker
          label="Preferred Incoterms *"
          value={incoterm}
          options={incotermOptions}
          placeholder={incotermsQuery.isLoading ? 'Loading Incoterms…' : 'Select an Incoterm'}
          testID="buyer-rfq-incoterm"
          disabled={incotermsQuery.isLoading || incotermsQuery.isError}
          emptyMessage="No delivery terms are currently available."
          onSelect={setIncoterm}
        />
        <BuyerRfqPicker
          label="Preferred payment terms *"
          value={paymentTerms}
          options={paymentOptions}
          placeholder="Select payment terms"
          testID="buyer-rfq-payment"
          onSelect={setPaymentTerms}
        />
        <DateOfBirthPicker
          label="Required delivery date *"
          value={deliveryDate}
          onChange={setDeliveryDate}
          testID="buyer-rfq-delivery-date"
          futureOnly
        />
        <Text style={{ color: colors.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: -8 }}>
          Choose a date after today. This is your requested delivery date.
        </Text>
      </Card>

      <Card style={{ padding: 15, marginBottom: 14 }}>
        <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800', marginBottom: 10 }}>Special instructions and files</Text>
        <Field
          label="Special instructions / requirements"
          value={notes}
          onChangeText={setNotes}
          placeholder="Quality specifications, certifications, inspection, or labeling requirements"
          multiline
          maxLength={5000}
        />
        <Pressable
          testID="buyer-rfq-attach"
          accessibilityRole="button"
          accessibilityState={{ disabled: picking || attachments.length >= MAX_RFQ_FILES }}
          disabled={picking || attachments.length >= MAX_RFQ_FILES || busy}
          onPress={() => void attachFile()}
          style={({ pressed }) => ({
            minHeight: 48,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: colors.border,
            borderRadius: colors.radius,
            backgroundColor: colors.card,
            opacity: picking || attachments.length >= MAX_RFQ_FILES ? 0.55 : pressed ? 0.82 : 1,
          })}
        >
          <Feather name="paperclip" size={16} color={colors.primary} />
          <Text style={{ flex: 1, color: colors.primary, fontSize: 12, fontWeight: '700' }}>
            {picking ? 'Opening files…' : `Attach requirement files (${attachments.length}/${MAX_RFQ_FILES})`}
          </Text>
          <Feather name="plus" size={16} color={colors.primary} />
        </Pressable>
        {attachments.map((attachment, index) => (
          <View key={attachment.key} style={{ minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 8, paddingHorizontal: 10, borderRadius: 12, backgroundColor: colors.secondary }}>
            <Feather name={attachment.mime.startsWith('image/') ? 'image' : 'file-text'} size={15} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ color: colors.foreground, fontSize: 11, fontWeight: '600' }}>{attachment.name}</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 9, marginTop: 2 }}>{formatFileSize(attachment.size)}</Text>
            </View>
            <Pressable
              testID={`buyer-rfq-remove-file-${index}`}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${attachment.name}`}
              disabled={busy}
              onPress={() => setAttachments(current => current.filter(file => file.key !== attachment.key))}
              hitSlop={8}
              style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }}
            >
              <Feather name="x" size={17} color={colors.destructive} />
            </Pressable>
          </View>
        ))}
        <Text style={{ color: colors.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: 8 }}>
          Images, PDF, Word, and Excel files; up to 10 MB each and 5 files per request.
        </Text>
      </Card>

      {error ? <Text accessibilityRole="alert" style={{ color: colors.destructive, fontSize: 12, lineHeight: 18, marginBottom: 9 }}>{error}</Text> : null}
      {uploadProgress ? <Text accessibilityLiveRegion="polite" style={{ color: colors.primary, fontSize: 11, marginBottom: 9 }}>{uploadProgress}</Text> : null}
      <Action title="Cancel" icon="arrow-left" secondary disabled={busy} onPress={onCancel} testID="buyer-rfq-cancel" />
      <View style={{ height: 9 }} />
      <Action title="Submit RFQ" icon="send" loading={busy} disabled={busy} onPress={() => void submit()} testID="buyer-rfq-submit" />
      <Text style={{ color: colors.mutedForeground, fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 8 }}>
        No payment is collected here. The trade desk will review your requirements.
      </Text>
    </Screen>
  );
}
