import React from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { GlassPopupSurface } from '@/components/GlassPopupSurface';
import { useColors } from '@/hooks/useColors';

type DialogTone = 'brand' | 'danger';
type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

type BrandedConfirmDialogProps = {
  visible: boolean;
  eyebrow?: string;
  title: string;
  message: string;
  context?: string;
  icon?: FeatherIconName;
  tone?: DialogTone;
  confirmLabel: string;
  cancelLabel?: string;
  busy?: boolean;
  busyLabel?: string;
  testID?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function BrandedConfirmDialog({
  visible,
  eyebrow = 'OG EXPORTS · BUYER CONFIRMATION',
  title,
  message,
  context,
  icon = 'check',
  tone = 'brand',
  confirmLabel,
  cancelLabel = 'Cancel',
  busy = false,
  busyLabel = 'Please wait…',
  testID = 'branded-confirm-dialog',
  onCancel,
  onConfirm,
}: BrandedConfirmDialogProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const actionColor = tone === 'danger' ? colors.destructive : colors.primary;
  const actionTextColor = tone === 'danger' ? colors.destructiveForeground : colors.primaryForeground;

  function dismiss() {
    if (!busy) onCancel();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <View
        testID={testID}
        accessibilityViewIsModal
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 22,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 12,
        }}
      >
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary, opacity: 0.48 }]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close confirmation"
          disabled={busy}
          onPress={dismiss}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={{
            width: '100%',
            maxWidth: 390,
            shadowColor: colors.shadowColor,
            shadowOpacity: 0.24,
            shadowRadius: 28,
            shadowOffset: { width: 0, height: 15 },
            elevation: 18,
          }}
        >
          <GlassPopupSurface
            accessibilityViewIsModal
            style={{
              alignItems: 'center',
              borderRadius: 26,
              borderWidth: 1,
              borderColor: colors.glassBorder,
              paddingHorizontal: 21,
              paddingTop: 22,
              paddingBottom: 18,
            }}
          >
            <View
              style={{
                width: 58,
                height: 58,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.glassBorder,
                backgroundColor: colors.glassTintGold,
              }}
            >
              <Feather name={icon} size={25} color={actionColor} />
            </View>
            <Text
              style={{
                color: colors.accent,
                fontSize: 9,
                fontWeight: '900',
                letterSpacing: 1.3,
                marginTop: 15,
                textAlign: 'center',
              }}
            >
              {eyebrow}
            </Text>
            <Text
              accessibilityRole="header"
              style={{
                color: colors.foreground,
                fontSize: 19,
                fontWeight: '800',
                lineHeight: 25,
                marginTop: 8,
                textAlign: 'center',
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: 12,
                lineHeight: 19,
                marginTop: 8,
                textAlign: 'center',
              }}
            >
              {message}
            </Text>
            {context ? (
              <View
                style={{
                  width: '100%',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 9,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.secondary,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginTop: 15,
                }}
              >
                <Feather name="file-text" size={15} color={colors.accent} />
                <Text style={{ flex: 1, color: colors.foreground, fontSize: 11, lineHeight: 16, fontWeight: '700' }}>
                  {context}
                </Text>
              </View>
            ) : null}
            <View style={{ width: '100%', flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={dismiss}
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.secondary,
                  opacity: pressed && !busy ? 0.75 : 1,
                })}
              >
                <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: '800' }}>{cancelLabel}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: busy, busy }}
                disabled={busy}
                onPress={onConfirm}
                style={({ pressed }) => ({
                  flex: 1.3,
                  minHeight: 48,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  borderRadius: 14,
                  backgroundColor: actionColor,
                  opacity: pressed && !busy ? 0.84 : 1,
                })}
              >
                {busy ? <ActivityIndicator size="small" color={actionTextColor} /> : <Feather name={tone === 'danger' ? 'x' : 'check'} size={15} color={actionTextColor} />}
                <Text numberOfLines={1} style={{ color: actionTextColor, fontSize: 11, fontWeight: '900' }}>
                  {busy ? busyLabel : confirmLabel}
                </Text>
              </Pressable>
            </View>
          </GlassPopupSurface>
        </View>
      </View>
    </Modal>
  );
}
