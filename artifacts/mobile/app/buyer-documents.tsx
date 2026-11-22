import React, { useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, Platform, Pressable, View } from 'react-native';
import { useGetBuyerDocuments, getGetBuyerDocumentsQueryKey } from '@workspace/api-client-react';
import { Feather, Ionicons } from '@expo/vector-icons';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { Card, EmptyState, ErrorState, Field, LoadingCard, Screen, Status } from '@/components/InvestorUI';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { rowsFromResponse } from '@/lib/buyer-data';
import { first, messageOf, record } from '@/lib/data';
import { openInvestorFile, shareInvestorFile } from '@/lib/file-download';
import {
  BUYER_DOCUMENT_CATEGORIES,
  buyerDocumentCategoryCounts,
  filterBuyerTradeDocuments,
  mapBuyerTradeDocument,
  sortBuyerTradeDocuments,
  type BuyerDocumentCategory,
  type BuyerTradeDocument,
} from '@/lib/buyer-trade-documents';

type DocumentFilter = BuyerDocumentCategory | 'All';
type FileAction = { id: string; kind: 'view' | 'download' };
const EMPTY_STARRED = new Set<string>();

const categoryIcons: Record<BuyerDocumentCategory, keyof typeof Feather.glyphMap> = {
  Commercial: 'file-text',
  Shipping: 'package',
  Government: 'shield',
  Quality: 'check-circle',
  Insurance: 'lock',
  Finance: 'archive',
  Other: 'folder',
};

export default function BuyerDocuments() {
  const colors = useColors();
  const { token, apiOrigin, user } = useAuth();
  const userId = first(record(user), ['id'], 'account');
  const storageKey = `buyer-documents-starred:${userId}`;
  const storageKeyRef = useRef(storageKey);
  storageKeyRef.current = storageKey;
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<DocumentFilter>('All');
  const [starredOnly, setStarredOnly] = useState(false);
  const [starred, setStarred] = useState<Set<string>>(() => new Set());
  const [starredKeyLoaded, setStarredKeyLoaded] = useState('');
  const [starBusy, setStarBusy] = useState<{ id: string; key: string } | null>(null);
  const [busyAction, setBusyAction] = useState<FileAction | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null);
  const [starError, setStarError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const params = { per_page: 100 };
  const query = useGetBuyerDocuments(params, {
    query: {
      queryKey: getGetBuyerDocumentsQueryKey(params),
      enabled: !!token,
      staleTime: 30_000,
    },
  });
  const documents = useMemo(
    () => sortBuyerTradeDocuments(rowsFromResponse(query.data).map(mapBuyerTradeDocument)),
    [query.data],
  );
  const officialDocuments = useMemo(
    () => documents.filter(document => document.source === 'admin'),
    [documents],
  );
  const counts = useMemo(() => buyerDocumentCategoryCounts(officialDocuments), [officialDocuments]);
  const starsReady = starredKeyLoaded === storageKey;
  const starBusyForAccount = starBusy?.key === storageKey;
  const activeStarred = starsReady ? starred : EMPTY_STARRED;
  const filteredDocuments = useMemo(() => filterBuyerTradeDocuments(officialDocuments, {
    search,
    category: filter,
    starredOnly,
    starred: activeStarred,
  }), [activeStarred, filter, officialDocuments, search, starredOnly]);
  const availableCount = filteredDocuments.filter(document => document.status === 'available').length;

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(storageKey).then(value => {
      if (!active) return;
      try {
        const parsed: unknown = value ? JSON.parse(value) : [];
        setStarred(new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []));
      } catch {
        setStarred(new Set());
      }
      setStarError('');
      setStarredKeyLoaded(storageKey);
    }).catch(() => {
      if (!active) return;
      setStarred(new Set());
      setStarError('Saved favourites could not be loaded from this device.');
      setStarredKeyLoaded(storageKey);
    });
    return () => { active = false; };
  }, [storageKey]);

  async function toggleStar(documentId: string) {
    if (!documentId || !starsReady || starBusyForAccount || downloadingAll) return;
    const targetKey = storageKey;
    const next = new Set(starred);
    if (next.has(documentId)) next.delete(documentId);
    else next.add(documentId);
    setStarBusy({ id: documentId, key: targetKey });
    setStarError('');
    setActionMessage('');
    try {
      await AsyncStorage.setItem(targetKey, JSON.stringify([...next]));
      if (storageKeyRef.current === targetKey) setStarred(next);
    } catch (error) {
      if (storageKeyRef.current === targetKey) {
        setStarError(messageOf(error) || 'This document could not be saved to your favourites.');
      }
    } finally {
      if (storageKeyRef.current === targetKey) setStarBusy(null);
    }
  }

  async function handleFileAction(document: BuyerTradeDocument, kind: 'view' | 'download') {
    if (document.status !== 'available' || downloadingAll || busyAction) return;
    const path = kind === 'view' ? document.viewUrl : document.downloadUrl;
    if (!path) {
      setActionError('This document does not have an authorized file link.');
      return;
    }

    setBusyAction({ id: document.id, kind });
    setActionError('');
    setActionMessage('');
    try {
      if (kind === 'view') {
        await openInvestorFile(path, document.name, apiOrigin, document.mimeType, document.extension);
      } else {
        await shareInvestorFile(path, document.name, apiOrigin, document.mimeType, document.extension);
      }
    } catch (error) {
      setActionError(`${document.name}: ${messageOf(error)}`);
    } finally {
      setBusyAction(null);
    }
  }

  async function downloadAll() {
    if (downloadingAll || busyAction) return;
    const available = filteredDocuments.filter(document => document.status === 'available');
    if (!available.length) {
      setActionError('There are no available documents in this filter.');
      setActionMessage('');
      return;
    }

    setActionError('');
    setActionMessage('');
    setDownloadingAll(true);
    setDownloadProgress({ current: 0, total: available.length });
    let completed = 0;
    try {
      for (let index = 0; index < available.length; index += 1) {
        const document = available[index];
        if (!document.downloadUrl) throw new Error(`${document.name} does not have an authorized file link.`);
        setDownloadProgress({ current: index + 1, total: available.length });
        await shareInvestorFile(document.downloadUrl, document.name, apiOrigin, document.mimeType, document.extension);
        completed += 1;
      }
      setActionMessage(Platform.OS === 'web'
        ? `${available.length} available document${available.length === 1 ? '' : 's'} prepared for download.`
        : `${available.length} files prepared. Choose Save to Files or another destination in each share sheet.`);
    } catch (error) {
      const detail = messageOf(error) || 'The next document could not be prepared.';
      setActionError(completed
        ? `${completed} document${completed === 1 ? '' : 's'} prepared before the next file failed. ${detail}`
        : detail);
    } finally {
      setDownloadingAll(false);
      setDownloadProgress(null);
    }
  }

  if (!token) return <BuyerAuthGate title="Trade documents" body="Sign in to view and download documents issued for your orders and shipments." returnTo="/buyer-documents" />;

  return (
    <Screen title="Trade documents" subtitle="Documents issued by OG Exports for your orders and shipments." refreshable>
      {query.isLoading ? <LoadingCard label="Loading trade documents…" lines={4} /> : null}
      {query.isError ? <ErrorState message="Trade documents could not be loaded." error={query.error} onRetry={() => void query.refetch()} /> : null}
      {query.isSuccess ? (
        <>
          <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '800', marginBottom: 9 }}>Documents from OG Exports</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 13 }}>
            {BUYER_DOCUMENT_CATEGORIES.map(category => {
              const selected = filter === category;
              return (
                <Pressable
                  key={category}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  testID={`buyer-document-category-${category.toLowerCase()}`}
                  disabled={downloadingAll}
                  onPress={() => setFilter(selected ? 'All' : category)}
                  style={({ pressed }) => ({
                    width: '31.5%',
                    minHeight: 76,
                    padding: 9,
                    borderWidth: 1,
                    borderColor: selected ? colors.primary : colors.glassBorder,
                    borderRadius: 15,
                    backgroundColor: selected ? colors.secondary : colors.glassFill,
                    opacity: downloadingAll ? 0.55 : pressed ? 0.82 : 1,
                  })}
                >
                  <View style={{ width: 29, height: 29, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary }}>
                    <Feather name={categoryIcons[category]} size={14} color={colors.primary} />
                  </View>
                  <Text style={{ color: colors.mutedForeground, fontSize: 8, fontWeight: '700', marginTop: 6 }}>{category}</Text>
                  <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '800', marginTop: 1 }}>{counts[category]}</Text>
                </Pressable>
              );
            })}
          </View>

          <Field
            label="Search documents"
            value={search}
            onChangeText={setSearch}
            placeholder="Name, type, order, or shipment"
            editable={!downloadingAll}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7, marginTop: -5, marginBottom: 10 }}>
            <FilterChip
              label="All documents"
              selected={filter === 'All' && !starredOnly}
              disabled={downloadingAll}
              onPress={() => { setFilter('All'); setStarredOnly(false); }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={starredOnly ? 'Turn off starred filter' : 'Show starred documents'}
              accessibilityState={{ selected: starredOnly, disabled: downloadingAll || !starsReady }}
              testID="buyer-documents-starred-filter"
              disabled={downloadingAll || !starsReady}
              onPress={() => setStarredOnly(value => !value)}
              style={({ pressed }) => ({
                minHeight: 35,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingHorizontal: 11,
                borderRadius: 18,
                backgroundColor: starredOnly ? colors.primary : colors.secondary,
                opacity: !starsReady || downloadingAll ? 0.5 : pressed ? 0.8 : 1,
              })}
            >
              <Ionicons name={starredOnly ? 'star' : 'star-outline'} size={13} color={starredOnly ? colors.primaryForeground : colors.foreground} />
              <Text style={{ color: starredOnly ? colors.primaryForeground : colors.foreground, fontSize: 9, fontWeight: '700' }}>Starred</Text>
            </Pressable>
            {BUYER_DOCUMENT_CATEGORIES.map(category => {
              const selected = filter === category && !starredOnly;
              return selected ? <FilterChip key={category} label={category} selected disabled={downloadingAll} onPress={() => setFilter('All')} /> : null;
            })}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={downloadingAll ? 'Preparing documents' : `Download all ${availableCount} available documents`}
              accessibilityState={{ disabled: downloadingAll || busyAction !== null, busy: downloadingAll }}
              testID="buyer-documents-download-all"
              disabled={downloadingAll || busyAction !== null || filteredDocuments.length === 0}
              onPress={() => void downloadAll()}
              style={({ pressed }) => ({
                minHeight: 35,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                paddingHorizontal: 10,
                marginLeft: 'auto',
                borderRadius: 18,
                backgroundColor: colors.primary,
                opacity: downloadingAll || filteredDocuments.length === 0 ? 0.55 : pressed ? 0.8 : 1,
              })}
            >
              {downloadingAll ? <ActivityIndicator size="small" color={colors.primaryForeground} /> : <Feather name="download" size={13} color={colors.primaryForeground} />}
              <Text style={{ color: colors.primaryForeground, fontSize: 9, fontWeight: '800' }}>
                {downloadingAll && downloadProgress ? `${downloadProgress.current}/${downloadProgress.total}` : 'Download all'}
              </Text>
            </Pressable>
          </View>

          {!query.isLoading && !query.isError ? (
            <Text style={{ color: colors.mutedForeground, fontSize: 9, lineHeight: 14, marginBottom: 9 }}>
              {filteredDocuments.length} document{filteredDocuments.length === 1 ? '' : 's'} from OG Exports · {availableCount} available · {filteredDocuments.length - availableCount} pending
            </Text>
          ) : null}
          {starError ? <Text accessibilityRole="alert" style={{ color: colors.destructive, fontSize: 11, lineHeight: 16, marginBottom: 8 }}>{starError}</Text> : null}
          {actionError ? <Text accessibilityRole="alert" style={{ color: colors.destructive, fontSize: 11, lineHeight: 16, marginBottom: 8 }}>{actionError}</Text> : null}
          {actionMessage ? <Text accessibilityRole="status" style={{ color: colors.statusSuccess, fontSize: 11, lineHeight: 16, marginBottom: 8 }}>{actionMessage}</Text> : null}

          {filteredDocuments.length === 0 ? (
            <EmptyState
              title={starredOnly ? 'No starred documents' : search || filter !== 'All' ? 'No matching documents' : 'No OG Exports documents yet'}
              body={starredOnly
                ? 'Star an OG Exports document to keep it easy to find.'
                : search || filter !== 'All'
                  ? 'Try another document name, type, order reference, or filter.'
                  : 'Documents issued by OG Exports for your orders and shipments will appear here.'}
              icon="file-text"
            />
          ) : filteredDocuments.map(document => (
            <BuyerDocumentCard
              key={document.id}
              document={document}
              starred={starsReady && starred.has(document.id)}
              starsReady={starsReady}
              starBusy={starBusyForAccount && starBusy?.id === document.id}
              starLocked={starBusyForAccount}
              fileBusyKind={busyAction?.id === document.id ? busyAction.kind : null}
              downloadingAll={downloadingAll || busyAction !== null}
              colors={colors}
              onToggleStar={() => void toggleStar(document.id)}
              onView={() => void handleFileAction(document, 'view')}
              onDownload={() => void handleFileAction(document, 'download')}
            />
          ))}

          <Text style={{ color: colors.mutedForeground, fontSize: 9, lineHeight: 14, marginTop: 5 }}>
            OG Exports files are access-controlled. Starred documents are saved on this device; download all prepares only available files in the current search and filter.
          </Text>
        </>
      ) : null}
    </Screen>
  );
}

function FilterChip({ label, selected, disabled, onPress }: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 35,
        justifyContent: 'center',
        paddingHorizontal: 11,
        borderRadius: 18,
        backgroundColor: selected ? colors.primary : colors.secondary,
        opacity: disabled ? 0.55 : pressed ? 0.8 : 1,
      })}
    >
      <Text style={{ color: selected ? colors.primaryForeground : colors.foreground, fontSize: 9, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

function BuyerDocumentCard({ document, starred, starsReady, starBusy, starLocked, fileBusyKind, downloadingAll, colors, onToggleStar, onView, onDownload }: {
  document: BuyerTradeDocument;
  starred: boolean;
  starsReady: boolean;
  starBusy: boolean;
  starLocked: boolean;
  fileBusyKind: FileAction['kind'] | null;
  downloadingAll: boolean;
  colors: ReturnType<typeof useColors>;
  onToggleStar: () => void;
  onView: () => void;
  onDownload: () => void;
}) {
  const pending = document.status !== 'available';
  const fileBusy = fileBusyKind !== null;
  const disabled = pending || downloadingAll || fileBusy;
  const icon = categoryIcons[document.category];

  return (
    <Card style={{ padding: 13, marginBottom: 9 }} testID={`buyer-document-${document.id}`}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <View style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary }}>
          <Feather name={icon} size={16} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={2} style={{ color: colors.foreground, fontSize: 12, fontWeight: '800' }}>{document.name}</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 9, marginTop: 4 }}>{document.rawType} · {document.orderId}</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 9, marginTop: 3 }}>{document.date} · {document.sizeLabel}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={starred ? `Remove ${document.name} from starred` : `Star ${document.name}`}
          accessibilityState={{ selected: starred, disabled: !starsReady || starLocked || downloadingAll }}
          testID={`buyer-document-star-${document.id}`}
          disabled={!starsReady || starLocked || downloadingAll}
          onPress={onToggleStar}
          style={{ minWidth: 34, minHeight: 34, alignItems: 'center', justifyContent: 'center', opacity: !starsReady || starLocked || downloadingAll ? 0.5 : 1 }}
        >
          {starBusy ? <ActivityIndicator size="small" color={colors.accent} /> : <Ionicons name={starred ? 'star' : 'star-outline'} size={18} color={starred ? colors.accent : colors.mutedForeground} />}
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 11, paddingTop: 9, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Status value={pending ? 'Pending' : 'Available'} />
        {pending ? (
          <Text style={{ flex: 1, textAlign: 'right', color: colors.statusPending, fontSize: 9 }}>OG Exports has not attached the file yet.</Text>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <DocumentAction title="View" icon="eye" kind="view" id={document.id} disabled={disabled} busy={fileBusyKind === 'view'} onPress={onView} />
            <DocumentAction title="Download" icon="download" kind="download" id={document.id} disabled={disabled} busy={fileBusyKind === 'download'} onPress={onDownload} />
          </View>
        )}
      </View>
    </Card>
  );
}

function DocumentAction({ title, icon, kind, id, disabled, busy, onPress }: {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  kind: 'view' | 'download';
  id: string;
  disabled: boolean;
  busy: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title} document ${id}`}
      accessibilityState={{ disabled, busy }}
      testID={`buyer-document-${kind}-${id}`}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 34,
        minWidth: 74,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingHorizontal: 9,
        borderRadius: 10,
        backgroundColor: colors.secondary,
        opacity: disabled ? 0.48 : pressed ? 0.78 : 1,
      })}
    >
      {busy ? <ActivityIndicator size="small" color={colors.primary} /> : <Feather name={icon} size={12} color={colors.primary} />}
      <Text style={{ color: colors.primary, fontSize: 9, fontWeight: '800' }}>{title}</Text>
    </Pressable>
  );
}
