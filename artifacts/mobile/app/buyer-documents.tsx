import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { getGetBuyerDocumentsQueryKey, useGetBuyerDocuments } from '@workspace/api-client-react';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { Card, EmptyState, ErrorState, Field, LoadingCard, Screen } from '@/components/InvestorUI';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { shareInvestorFile } from '@/lib/file-download';
import { first, messageOf, record } from '@/lib/data';
import { rowsFromResponse } from '@/lib/buyer-data';

type DocumentFilter = 'all' | 'commercial' | 'shipping' | 'government' | 'quality' | 'insurance' | 'finance' | 'starred';
const documentFilters: [DocumentFilter, string][] = [
  ['all', 'All'],
  ['commercial', 'Commercial'],
  ['shipping', 'Shipping'],
  ['government', 'Government'],
  ['quality', 'Quality'],
  ['insurance', 'Insurance'],
  ['finance', 'Finance'],
  ['starred', 'Starred'],
];

function categoryFor(type: string): Exclude<DocumentFilter, 'all' | 'starred'> | null {
  const value = type.toLowerCase();
  return documentFilters.slice(1, 7).find(([key]) => value.includes(key))?.[0] as Exclude<DocumentFilter, 'all' | 'starred'> | undefined ?? null;
}

function extensionFor(path: string, mime: string) {
  const extension = path.split('?')[0].split('.').pop()?.toLowerCase();
  if (extension && /^[a-z0-9]{2,6}$/.test(extension)) return extension;
  return mime.includes('pdf') ? 'pdf' : mime.includes('image/') ? 'jpg' : 'file';
}

export default function BuyerDocuments() {
  const colors = useColors();
  const { token, apiOrigin, user } = useAuth();
  const { orderId: rawOrderId } = useLocalSearchParams<{ orderId?: string | string[] }>();
  const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId;
  const parsedOrderId = Number(orderId);
  const orderFilter = Number.isInteger(parsedOrderId) && parsedOrderId > 0 ? parsedOrderId : undefined;
  const userId = first(record(user), ['id'], 'account');
  const storageKey = `buyer-documents-starred:${userId}`;
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<DocumentFilter>('all');
  const [starred, setStarred] = useState<string[]>([]);
  const [downloadId, setDownloadId] = useState('');
  const [actionError, setActionError] = useState('');
  const documentParams = { per_page: 100, ...(orderFilter ? { order_id: orderFilter } : {}) };
  const query = useGetBuyerDocuments(documentParams, {
    query: { queryKey: getGetBuyerDocumentsQueryKey(documentParams), enabled: !!token, staleTime: 30_000 },
  });
  const documents = rowsFromResponse(query.data);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(storageKey).then(value => {
      if (!active) return;
      try {
        const parsed: unknown = value ? JSON.parse(value) : [];
        setStarred(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []);
      } catch {
        setStarred([]);
      }
    }).catch(() => setStarred([]));
    return () => { active = false; };
  }, [storageKey]);

  const visible = useMemo(() => documents.filter(document => {
    const id = first(document, ['id']);
    const category = categoryFor(first(document, ['type', 'title']));
    const matchesFilter = filter === 'all' || (filter === 'starred' ? starred.includes(id) : category === filter);
    const text = `${first(document, ['title'])} ${first(document, ['type'])} ${first(document, ['order_number'])}`.toLowerCase();
    return matchesFilter && (!search.trim() || text.includes(search.trim().toLowerCase()));
  }), [documents, filter, search, starred]);

  async function toggleStar(id: string) {
    const next = starred.includes(id) ? starred.filter(value => value !== id) : [...starred, id];
    setStarred(next);
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      setActionError('This document could not be saved to your device favourites.');
    }
  }

  async function downloadDocument(document: Record<string, unknown>) {
    const id = first(document, ['id']);
    setDownloadId(id);
    setActionError('');
    const title = first(document, ['title', 'type'], 'OG Exports trade document');
    const path = first(document, ['download_url']);
    const mime = first(document, ['mime'], 'application/octet-stream');
    try {
      await shareInvestorFile(path, title, apiOrigin, mime, extensionFor(first(document, ['path']), mime));
    } catch (error) {
      setActionError(messageOf(error));
    } finally {
      setDownloadId('');
    }
  }

  if (!token) return <BuyerAuthGate title="Trade documents" body="Sign in to view and download documents issued for your orders and shipments." returnTo="/buyer-documents" />;

  return (
    <Screen title="Trade documents" subtitle={orderFilter ? 'Documents for this order' : 'Documents issued for your orders and shipments'} refreshable>
      {query.isLoading ? <LoadingCard label="Loading trade documents…" lines={3} /> : null}
      {query.isError ? <ErrorState message="Trade documents could not be loaded." error={query.error} onRetry={() => void query.refetch()} /> : null}
      {query.isSuccess ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 13 }}>
            {documentFilters.filter(([key]) => key !== 'starred' || starred.length > 0).map(([value, label]) => {
              const count = value === 'starred'
                ? starred.filter(id => documents.some(doc => first(doc, ['id']) === id)).length
                : value === 'all'
                  ? documents.length
                  : documents.filter(doc => categoryFor(first(doc, ['type', 'title'])) === value).length;
              return (
                <Card key={value} style={{ width: '31.5%', minHeight: 57, padding: 9 }}>
                  <Text style={{ color: colors.mutedForeground, fontSize: 9, fontWeight: '700' }}>{label}</Text>
                  <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800', marginTop: 4 }}>{count}</Text>
                </Card>
              );
            })}
          </View>
          <Field label="Search documents" value={search} onChangeText={setSearch} placeholder="Name, category, or order reference" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginVertical: 10 }}>
            {documentFilters.map(([value, label]) => {
              if (value === 'starred' && starred.length === 0) return null;
              const selected = filter === value;
              return (
                <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setFilter(value)} style={{ minHeight: 34, borderRadius: 17, paddingHorizontal: 11, justifyContent: 'center', backgroundColor: selected ? colors.primary : colors.secondary }}>
                  <Text style={{ color: selected ? colors.primaryForeground : colors.foreground, fontSize: 10, fontWeight: '700' }}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
          {actionError ? <Text accessibilityRole="alert" style={{ color: colors.destructive, fontSize: 12, lineHeight: 17, marginBottom: 8 }}>{actionError}</Text> : null}
          {visible.length === 0 ? (
            <EmptyState title={search ? 'No matching documents' : filter === 'starred' ? 'No starred documents' : 'No trade documents yet'} body={search ? 'Try a different document name or order reference.' : 'Documents issued by OG Exports for your orders will appear here.'} icon="file-text" />
          ) : visible.map((document, index) => {
            const id = first(document, ['id'], String(index));
            const isStarred = starred.includes(id);
            return (
              <Card key={id} style={{ padding: 13, marginBottom: 9 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary }}>
                    <Feather name={first(document, ['mime']).includes('pdf') ? 'file-text' : 'file'} size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '800' }}>{first(document, ['title', 'type'], 'Trade document')}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 4 }}>
                      {first(document, ['type'], 'Document')} · Order {first(document, ['order_number'], '—')}
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 3 }}>{first(document, ['status'], 'Available')}</Text>
                  </View>
                  <Pressable accessibilityRole="button" accessibilityLabel={isStarred ? 'Remove from starred' : 'Add to starred'} onPress={() => void toggleStar(id)} style={{ padding: 7 }}>
                    <Feather name={isStarred ? 'star' : 'star'} size={17} color={isStarred ? colors.accent : colors.mutedForeground} />
                  </Pressable>
                </View>
                <Pressable accessibilityRole="button" disabled={downloadId === id} onPress={() => void downloadDocument(document)} style={{ minHeight: 39, marginTop: 9, borderRadius: 11, backgroundColor: colors.secondary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                  <Feather name="download" size={14} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>{downloadId === id ? 'Preparing file…' : 'Download / share'}</Text>
                </Pressable>
              </Card>
            );
          })}
          <Text style={{ color: colors.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: 5 }}>
            Documents are issued by OG Exports. Starred items are saved on this device; download files individually.
          </Text>
        </>
      ) : null}
    </Screen>
  );
}
