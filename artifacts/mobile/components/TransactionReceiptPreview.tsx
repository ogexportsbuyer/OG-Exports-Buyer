import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Asset, getPermissionsAsync, requestPermissionsAsync } from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useColors } from '@/hooks/useColors';
import {
  formatUiStatus,
  isRightToLeftLanguage,
  translateUi,
} from '@/lib/strings';
import {
  saveTransactionReceipt,
  transactionReceiptDisplayAmount,
  transactionReceiptRows,
  type TransactionReceipt,
} from '@/lib/transaction-receipt';
import { saveReceiptImageToGallery } from '@/lib/receipt-gallery';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  receipt: TransactionReceipt | null;
  onClose: () => void;
};

export function TransactionReceiptPreview({ receipt, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const receiptView = useRef<React.ElementRef<typeof View>>(null);
  const [saving, setSaving] = useState(false);
  const [sharingPdf, setSharingPdf] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [pdfError, setPdfError] = useState('');

  useEffect(() => {
    setSaved(false);
    setSaveError('');
    setPdfError('');
  }, [receipt]);

  if (!receipt) return null;
  const activeReceipt: TransactionReceipt = receipt;

  const t = (source: string) => translateUi(source, activeReceipt.language);
  const rtl = isRightToLeftLanguage(activeReceipt.language);
  const amount = transactionReceiptDisplayAmount(activeReceipt);
  const status = activeReceipt.status
    ? formatUiStatus(activeReceipt.status, activeReceipt.language)
    : t('Not provided');
  const detailRows = [
    ...transactionReceiptRows(activeReceipt),
    ...activeReceipt.details,
  ];

  async function saveToGallery() {
    if (saving || sharingPdf) return;
    setSaved(false);
    setSaveError('');
    if (Platform.OS === 'web') {
      setSaveError(t('Gallery saving is only available in the mobile app.'));
      return;
    }

    setSaving(true);
    try {
      const result = await saveReceiptImageToGallery(
        async () => {
          const target = receiptView.current;
          if (!target) throw new Error('Receipt preview is not ready.');
          return captureRef(target, {
            fileName: activeReceipt.filename,
            format: 'png',
            quality: 1,
            result: 'tmpfile',
          });
        },
        {
          getPermission: () => getPermissionsAsync(true, ['photo']),
          requestPermission: () => requestPermissionsAsync(true, ['photo']),
          saveImage: async localUri => {
            await Asset.create(localUri);
          },
        },
      );

      if (result === 'saved') {
        setSaved(true);
      } else if (result === 'permission-blocked') {
        Alert.alert(
          t('Photo access needed'),
          t('Allow photo access to save this receipt to your gallery.'),
          [
            { text: t('Cancel'), style: 'cancel' },
            {
              text: t('Open Settings'),
              onPress: () => void Linking.openSettings().catch(() => {
                setSaveError(t('Could not save receipt image. Please try again.'));
              }),
            },
          ],
        );
      } else {
        setSaveError(t('Allow photo access to save this receipt to your gallery.'));
      }
    } catch {
      setSaveError(t('Could not save receipt image. Please try again.'));
    } finally {
      setSaving(false);
    }
  }

  async function sharePdf() {
    if (sharingPdf || saving) return;
    setPdfError('');
    setSharingPdf(true);
    try {
      await saveTransactionReceipt(activeReceipt);
    } catch {
      setPdfError(t('Could not share receipt PDF.'));
    } finally {
      setSharingPdf(false);
    }
  }

  return <Modal
    visible
    animationType="slide"
    statusBarTranslucent
    onRequestClose={onClose}
  >
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{
        minHeight: 58,
        paddingTop: insets.top + 4,
        paddingHorizontal: 18,
        paddingBottom: 9,
        flexDirection: rtl ? 'row-reverse' : 'row',
        alignItems: 'center',
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Close receipt')}
          testID="transaction-receipt-close"
          onPress={onClose}
          hitSlop={8}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Feather name={rtl ? 'arrow-right' : 'arrow-left'} size={20} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: '800' }}>
            {activeReceipt.title}
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>
            Secure account record
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 20 }}
      >
        <View
          ref={receiptView}
          collapsable={false}
          style={{
            overflow: 'hidden',
            borderRadius: 22,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
          }}
        >
          <View style={{ height: 7, backgroundColor: colors.accent }} />
          <View style={{ padding: 20 }}>
            <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center', gap: 12 }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.accentSurface,
              }}>
                <Feather name="file-text" size={24} color={colors.accentForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '900', letterSpacing: 1.1 }}>
                  OG EXPORTS
                </Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 3 }}>
                  Secure account record
                </Text>
              </View>
            </View>

            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 18 }} />

            <Text style={{
              color: colors.accentForeground,
              fontSize: 10,
              fontWeight: '800',
              letterSpacing: 1,
              textTransform: 'uppercase',
              textAlign: rtl ? 'right' : 'left',
            }}>
              Official transaction receipt
            </Text>
            <Text style={{
              color: colors.foreground,
              fontSize: 19,
              lineHeight: 25,
              fontWeight: '800',
              marginTop: 5,
              textAlign: rtl ? 'right' : 'left',
            }}>
              {activeReceipt.title}
            </Text>

            <View style={{
              marginTop: 18,
              padding: 16,
              borderRadius: 16,
              backgroundColor: colors.accentSurface,
              alignItems: rtl ? 'flex-end' : 'flex-start',
            }}>
              <Text style={{ color: colors.accentForeground, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 }}>
                Recorded amount
              </Text>
              <Text selectable style={{
                color: colors.accentForeground,
                fontSize: 26,
                lineHeight: 34,
                fontWeight: '900',
                marginTop: 4,
                textAlign: rtl ? 'right' : 'left',
              }}>
                {amount}
              </Text>
            </View>

            <View style={{
              minHeight: 44,
              marginTop: 12,
              paddingHorizontal: 13,
              paddingVertical: 9,
              borderRadius: 13,
              flexDirection: rtl ? 'row-reverse' : 'row',
              alignItems: 'center',
              gap: 9,
              backgroundColor: colors.statusSuccessBackground,
            }}>
              <Feather name="check-circle" size={17} color={colors.statusSuccess} />
              <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: '700' }}>
                Server status
              </Text>
              <Text style={{ flex: 1, color: colors.foreground, fontSize: 12, fontWeight: '800', textAlign: rtl ? 'left' : 'right' }}>
                {status}
              </Text>
            </View>

            <View style={{ marginTop: 21, marginBottom: 2 }}>
              <Text style={{
                color: colors.foreground,
                fontSize: 12,
                fontWeight: '900',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                marginBottom: 3,
              }}>
                Transaction details
              </Text>
              {detailRows.map(([label, value], index) => <View
                key={`${label}-${index}`}
                style={{
                  minHeight: 45,
                  paddingVertical: 10,
                  flexDirection: rtl ? 'row-reverse' : 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 14,
                  borderBottomWidth: index === detailRows.length - 1 ? 0 : 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Text style={{
                  color: colors.mutedForeground,
                  fontSize: 11,
                  lineHeight: 17,
                  flex: 0.9,
                  textAlign: rtl ? 'right' : 'left',
                }}>
                  {label}
                </Text>
                <Text selectable style={{
                  color: colors.foreground,
                  fontSize: 11,
                  lineHeight: 17,
                  fontWeight: '700',
                  flex: 1.1,
                  textAlign: rtl ? 'left' : 'right',
                }}>
                  {value}
                </Text>
              </View>)}
            </View>

            <View style={{
              marginTop: 15,
              padding: 13,
              borderRadius: 14,
              backgroundColor: colors.secondary,
              borderStartWidth: 3,
              borderStartColor: colors.accent,
            }}>
              <Text style={{ color: colors.foreground, fontSize: 11, lineHeight: 17 }}>
                {activeReceipt.statusNote}
              </Text>
            </View>
            <Text style={{
              color: colors.mutedForeground,
              fontSize: 10,
              lineHeight: 16,
              marginTop: 13,
              textAlign: rtl ? 'right' : 'left',
            }}>
              Values on this receipt are limited to information returned by OG Exports. “Not provided” means that field was not available in the server record.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={{
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: Math.max(insets.bottom, 12),
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.background,
      }}>
        {saved ? <Text accessibilityRole="alert" style={{
          color: colors.statusSuccess,
          fontSize: 12,
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: 9,
        }}>
          Receipt image saved to your gallery.
        </Text> : null}
        {saveError ? <Text accessibilityRole="alert" style={{
          color: colors.destructive,
          fontSize: 12,
          lineHeight: 17,
          textAlign: 'center',
          marginBottom: 9,
        }}>
          {saveError}
        </Text> : null}
        {pdfError ? <Text accessibilityRole="alert" style={{
          color: colors.destructive,
          fontSize: 12,
          lineHeight: 17,
          textAlign: 'center',
          marginBottom: 9,
        }}>
          {pdfError}
        </Text> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: saving || sharingPdf }}
          testID="transaction-receipt-save-gallery"
          disabled={saving || sharingPdf}
          onPress={() => void saveToGallery()}
          style={({ pressed }) => ({
            minHeight: 54,
            borderRadius: 16,
            paddingHorizontal: 18,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            backgroundColor: colors.accentSurface,
            opacity: saving || sharingPdf ? 0.65 : pressed ? 0.82 : 1,
          })}
        >
          {saving
            ? <ActivityIndicator size="small" color={colors.accentForeground} />
            : <Feather name="download" size={18} color={colors.accentForeground} />}
          <Text style={{ color: colors.accentForeground, fontSize: 14, fontWeight: '800' }}>
            {saving ? 'Saving receipt…' : 'Save to Gallery'}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: sharingPdf || saving }}
          testID="transaction-receipt-share-pdf"
          disabled={sharingPdf || saving}
          onPress={() => void sharePdf()}
          style={({ pressed }) => ({
            minHeight: 44,
            marginTop: 7,
            borderRadius: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            opacity: sharingPdf || saving ? 0.6 : pressed ? 0.7 : 1,
          })}
        >
          {sharingPdf
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Feather name="share-2" size={16} color={colors.primary} />}
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>
            {sharingPdf ? 'Preparing receipt…' : 'Share PDF'}
          </Text>
        </Pressable>
      </View>
    </View>
  </Modal>;
}
