import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Platform, Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/components/InvestorUI';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useAuth } from '@/context/AuthContext';
import { useOptionalAppPreferences } from '@/context/AppPreferencesContext';
import { useColors } from '@/hooks/useColors';
import { messageOf } from '@/lib/data';
import { prepareInvestorFilePreview, releaseInvestorFilePreview, shareInvestorFile } from '@/lib/file-download';
import { shipmentDocumentPreviewKind, type ShipmentDocument } from '@/lib/buyer-shipment-data';

export function BuyerShipmentDocuments({ documents, title = 'Shipment documents' }: {
  documents: ShipmentDocument[];
  title?: string;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { apiOrigin } = useAuth();
  const preferences = useOptionalAppPreferences();
  const rtl = preferences?.isRTL ?? false;
  const [activeDocument, setActiveDocument] = useState<ShipmentDocument | null>(null);
  const [previewUri, setPreviewUri] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [savingDocumentId, setSavingDocumentId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const previewRequest = useRef(0);
  const activePreviewUri = useRef('');

  async function openDocument(document: ShipmentDocument) {
    if (document.status !== 'available' || !document.viewUrl) return;
    previewRequest.current += 1;
    const request = previewRequest.current;
    if (activePreviewUri.current) releaseInvestorFilePreview(activePreviewUri.current);
    activePreviewUri.current = '';
    setPreviewUri('');
    setActiveDocument(document);
    setPreviewError('');
    setError('');
    const previewKind = shipmentDocumentPreviewKind(document);
    if (previewKind === 'unsupported') {
      setPreviewLoading(false);
      return;
    }

    setPreviewLoading(true);
    try {
      const uri = await prepareInvestorFilePreview(
        document.viewUrl,
        document.title,
        apiOrigin,
        document.mimeType,
        document.extension,
      );
      if (request !== previewRequest.current) {
        releaseInvestorFilePreview(uri);
        return;
      }
      activePreviewUri.current = uri;
      setPreviewUri(uri);
    } catch (reason) {
      if (request === previewRequest.current) setPreviewError(messageOf(reason));
    } finally {
      if (request === previewRequest.current) setPreviewLoading(false);
    }
  }

  function closePreview() {
    previewRequest.current += 1;
    if (activePreviewUri.current) releaseInvestorFilePreview(activePreviewUri.current);
    activePreviewUri.current = '';
    setPreviewUri('');
    setPreviewLoading(false);
    setPreviewError('');
    setActiveDocument(null);
  }

  async function saveDocument(document: ShipmentDocument) {
    if (document.status !== 'available' || !document.downloadUrl) return;
    setError('');
    setPreviewError('');
    setSavingDocumentId(document.id);
    try {
      await shareInvestorFile(document.downloadUrl, document.title, apiOrigin, document.mimeType, document.extension);
    } catch (reason) {
      const message = `${document.title}: ${messageOf(reason)}`;
      setError(message);
      if (activeDocument?.id === document.id) setPreviewError(message);
    } finally {
      setSavingDocumentId(null);
    }
  }

  useEffect(() => () => {
    previewRequest.current += 1;
    if (activePreviewUri.current) releaseInvestorFilePreview(activePreviewUri.current);
    activePreviewUri.current = '';
  }, []);

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
                  busy={false}
                  disabled={savingDocumentId !== null}
                  onPress={() => void openDocument(document)}
                  testID={`shipment-document-view-${document.id}`}
                />
                <DocumentAction
                  title="Save / share"
                  accessibilityLabel={`Save or share ${document.title}`}
                  icon="download"
                  busy={savingDocumentId === document.id}
                  disabled={savingDocumentId !== null}
                  onPress={() => void saveDocument(document)}
                  testID={`shipment-document-download-${document.id}`}
                />
              </View>
            )}
          </Card>
        );
      })}
      {error ? <Text accessibilityRole="alert" style={{ color: colors.destructive, fontSize: 11, marginTop: 4 }}>{error}</Text> : null}

      <Modal
        visible={activeDocument !== null}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closePreview}
      >
        {activeDocument ? (
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={{
              minHeight: 60,
              paddingTop: insets.top + 5,
              paddingHorizontal: 16,
              paddingBottom: 10,
              flexDirection: rtl ? 'row-reverse' : 'row',
              alignItems: 'center',
              gap: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              backgroundColor: colors.card,
            }}>
              <View style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.accentSurface,
              }}>
                <Feather name="file-text" size={20} color={colors.accentForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 }}>OG EXPORTS</Text>
                <Text numberOfLines={1} style={{ color: colors.foreground, fontSize: 14, fontWeight: '800', marginTop: 3 }}>
                  {activeDocument.title}
                </Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 2 }}>Secure account record</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close document preview"
                testID="shipment-document-preview-close"
                onPress={closePreview}
                hitSlop={8}
                style={({ pressed }) => ({
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.secondary,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Feather name="x" size={19} color={colors.foreground} />
              </Pressable>
            </View>

            <View style={{ flex: 1, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10 }}>
              <View style={{
                flex: 1,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: colors.glassBorder,
                borderRadius: 22,
                backgroundColor: colors.card,
              }}>
                <View style={{ height: 6, backgroundColor: colors.accent }} />
                <View style={{
                  minHeight: 58,
                  paddingHorizontal: 14,
                  flexDirection: rtl ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  gap: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}>
                  <Feather name="lock" size={14} color={colors.accent} />
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ color: colors.foreground, fontSize: 11, fontWeight: '800' }}>
                      {activeDocument.type}
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 9, marginTop: 3 }}>
                      {activeDocument.extension.toUpperCase()}
                    </Text>
                  </View>
                  <Feather name="check-circle" size={16} color={colors.statusSuccess} />
                </View>

                <View style={{ flex: 1, padding: 11 }}>
                  <View style={{
                    flex: 1,
                    overflow: 'hidden',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 14,
                    backgroundColor: '#FFFFFF',
                  }}>
                    {previewLoading ? (
                      <View style={{ alignItems: 'center', gap: 10, padding: 24 }}>
                        <ActivityIndicator size="large" color={colors.accent} />
                        <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Preparing file…</Text>
                      </View>
                    ) : previewError ? (
                      <PreviewFallback message={previewError} colors={colors} />
                    ) : previewUri && shipmentDocumentPreviewKind(activeDocument) === 'image' ? (
                      <Image
                        source={{ uri: previewUri }}
                        resizeMode="contain"
                        accessibilityLabel={activeDocument.title}
                        style={{ width: '100%', height: '100%' }}
                      />
                    ) : previewUri && shipmentDocumentPreviewKind(activeDocument) === 'pdf' ? (
                      Platform.OS === 'web' ? (
                        React.createElement('iframe', {
                          title: activeDocument.title,
                          src: previewUri,
                          style: { width: '100%', height: '100%', border: 0, backgroundColor: '#FFFFFF' },
                        })
                      ) : (
                        <WebView
                          source={{ uri: previewUri }}
                          originWhitelist={['*']}
                          allowFileAccess
                          allowFileAccessFromFileURLs
                          allowingReadAccessToURL={previewUri}
                          style={{ flex: 1, width: '100%', backgroundColor: '#FFFFFF' }}
                          onShouldStartLoadWithRequest={({ url }) => (
                            url.startsWith('file://')
                            || url.startsWith('data:')
                            || url.startsWith('blob:')
                            || url === 'about:blank'
                          )}
                          onError={() => setPreviewError('This file type cannot be previewed here. Use Save / share to open it.')}
                        />
                      )
                    ) : (
                      <PreviewFallback
                        message="This file type cannot be previewed here. Use Save / share to open it."
                        colors={colors}
                        extension={activeDocument.extension}
                      />
                    )}
                  </View>
                </View>
              </View>
            </View>

            <View style={{
              paddingHorizontal: 16,
              paddingTop: 8,
              paddingBottom: Math.max(insets.bottom, 10) + 10,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              backgroundColor: colors.card,
            }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Save or share ${activeDocument.title}`}
                accessibilityState={{ disabled: savingDocumentId !== null, busy: savingDocumentId === activeDocument.id }}
                testID={`shipment-document-preview-save-${activeDocument.id}`}
                disabled={savingDocumentId !== null}
                onPress={() => void saveDocument(activeDocument)}
                style={({ pressed }) => ({
                  minHeight: 50,
                  borderRadius: 15,
                  flexDirection: rtl ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 9,
                  backgroundColor: colors.accent,
                  opacity: savingDocumentId !== null ? 0.62 : pressed ? 0.82 : 1,
                })}
              >
                {savingDocumentId === activeDocument.id
                  ? <ActivityIndicator size="small" color={colors.accentForeground} />
                  : <Feather name="download" size={16} color={colors.accentForeground} />}
                <Text style={{ color: colors.accentForeground, fontSize: 12, fontWeight: '900' }}>Save / share</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

function PreviewFallback({ message, colors, extension }: {
  message: string;
  colors: ReturnType<typeof useColors>;
  extension?: string;
}) {
  return (
    <View style={{ alignItems: 'center', paddingHorizontal: 26, paddingVertical: 24 }}>
      <View style={{
        width: 72,
        height: 82,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        backgroundColor: colors.accentSurface,
      }}>
        <Feather name="file-text" size={31} color={colors.accentForeground} />
        {extension ? (
          <Text style={{ color: colors.accentForeground, fontSize: 8, fontWeight: '900', marginTop: 4 }}>
            {extension.toUpperCase()}
          </Text>
        ) : null}
      </View>
      <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '800', textAlign: 'center', lineHeight: 18, marginTop: 16 }}>
        {message}
      </Text>
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
