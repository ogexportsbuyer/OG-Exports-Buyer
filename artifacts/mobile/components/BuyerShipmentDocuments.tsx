import React, { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Card } from '@/components/InvestorUI';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { messageOf } from '@/lib/data';
import { openInvestorFile, shareInvestorFile } from '@/lib/file-download';
import type { ShipmentDocument } from '@/lib/buyer-shipment-data';

export function BuyerShipmentDocuments({ documents, title = 'Shipment documents' }: {
  documents: ShipmentDocument[];
  title?: string;
}) {
  const colors = useColors();
  const { apiOrigin } = useAuth();
  const [busyAction, setBusyAction] = useState<{ id: string; kind: 'view' | 'save' } | null>(null);
  const [error, setError] = useState('');

  async function openDocument(document: ShipmentDocument) {
    if (document.status !== 'available' || !document.viewUrl) return;
    setError('');
    setBusyAction({ id: document.id, kind: 'view' });
    try {
      await openInvestorFile(document.viewUrl, document.title, apiOrigin, document.mimeType, document.extension);
    } catch (reason) {
      setError(`${document.title}: ${messageOf(reason)}`);
    } finally {
      setBusyAction(null);
    }
  }

  async function saveDocument(document: ShipmentDocument) {
    if (document.status !== 'available' || !document.downloadUrl) return;
    setError('');
    setBusyAction({ id: document.id, kind: 'save' });
    try {
      await shareInvestorFile(document.downloadUrl, document.title, apiOrigin, document.mimeType, document.extension);
    } catch (reason) {
      setError(`${document.title}: ${messageOf(reason)}`);
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <View style={{ marginTop: 8 }}>
      <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800', marginBottom: 9 }}>{title}</Text>
      {documents.length === 0 ? (
        <Card style={{ padding: 14, marginBottom: 10 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>No shipping documents have been added to this shipment yet.</Text>
        </Card>
      ) : documents.map(document => {
        const unavailable = document.status !== 'available';
        return (
          <Card key={document.id} style={{ padding: 12, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary }}>
                <Feather name="file-text" size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={2} style={{ color: colors.foreground, fontSize: 11, fontWeight: '800' }}>{document.title}</Text>
                <Text style={{ color: unavailable ? colors.statusPending : colors.mutedForeground, fontSize: 9, marginTop: 3 }}>
                  {unavailable ? 'File pending from the trade desk' : document.type}
                </Text>
              </View>
            </View>
            {unavailable ? (
              <View style={{ marginTop: 10, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, backgroundColor: colors.statusPendingBackground }}>
                <Text style={{ color: colors.statusPending, fontSize: 10 }}>This document is not available yet.</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <DocumentAction
                  title="View"
                  accessibilityLabel={`View ${document.title}`}
                  icon="eye"
                  busy={busyAction?.id === document.id && busyAction.kind === 'view'}
                  disabled={busyAction !== null}
                  onPress={() => void openDocument(document)}
                  testID={`shipment-document-view-${document.id}`}
                />
                <DocumentAction
                  title="Save / share"
                  accessibilityLabel={`Save or share ${document.title}`}
                  icon="download"
                  busy={busyAction?.id === document.id && busyAction.kind === 'save'}
                  disabled={busyAction !== null}
                  onPress={() => void saveDocument(document)}
                  testID={`shipment-document-download-${document.id}`}
                />
              </View>
            )}
          </Card>
        );
      })}
      {error ? <Text accessibilityRole="alert" style={{ color: colors.destructive, fontSize: 11, marginTop: 4 }}>{error}</Text> : null}
    </View>
  );
}

function DocumentAction({ title, accessibilityLabel, icon, busy, disabled, onPress, testID }: {
  title: string;
  accessibilityLabel: string;
  icon: keyof typeof Feather.glyphMap;
  busy: boolean;
  disabled: boolean;
  onPress: () => void;
  testID: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabled || busy, busy }}
      testID={testID}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 38,
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        opacity: disabled ? 0.55 : pressed ? 0.78 : 1,
      })}
    >
      {busy ? <ActivityIndicator size="small" color={colors.primary} /> : <Feather name={icon} size={13} color={colors.primary} />}
      <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '800' }}>{title}</Text>
    </Pressable>
  );
}
