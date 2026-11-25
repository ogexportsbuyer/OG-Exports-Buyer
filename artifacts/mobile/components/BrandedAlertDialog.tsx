import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { GlassPopupSurface } from '@/components/GlassPopupSurface';
import { useColors } from '@/hooks/useColors';

export type BrandedAlertDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  tone?: 'brand' | 'success' | 'warning' | 'danger';
  buttons: Array<{
    label: string;
    style?: 'default' | 'cancel' | 'destructive';
    onPress?: () => void;
  }>;
  cancelable?: boolean;
  onClose: () => void;
};

const tonePresentation: Record<NonNullable<BrandedAlertDialogProps['tone']>, { icon: React.ComponentProps<typeof Feather>['name']; colorKey: 'primary' | 'statusSuccess' | 'statusPending' | 'destructive'; tintKey: 'glassTintTeal' | 'glassTintGold' }> = {
  brand: { icon: 'info', colorKey: 'primary', tintKey: 'glassTintTeal' },
  success: { icon: 'check-circle', colorKey: 'statusSuccess', tintKey: 'glassTintTeal' },
  warning: { icon: 'alert-triangle', colorKey: 'statusPending', tintKey: 'glassTintGold' },
  danger: { icon: 'x-circle', colorKey: 'destructive', tintKey: 'glassTintGold' },
};

export function BrandedAlertDialog({
  visible,
  title,
  message,
  tone = 'brand',
  buttons,
  cancelable = true,
  onClose,
}: BrandedAlertDialogProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const presentation = tonePresentation[tone];
  const toneColor = colors[presentation.colorKey];
  const dismiss = () => {
    if (cancelable) onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <View
        accessibilityViewIsModal
        accessibilityRole="alert"
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 22,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 12,
        }}
      >
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary, opacity: 0.48 }]} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss alert"
          disabled={!cancelable}
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
                width: 54,
                height: 54,
                borderRadius: 19,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.glassBorder,
                backgroundColor: colors[presentation.tintKey],
              }}
            >
              <Feather name={presentation.icon} size={24} color={toneColor} />
            </View>
            <Text
              style={{
                color: colors.accent,
                fontSize: 9,
                fontWeight: '900',
                letterSpacing: 1.25,
                marginTop: 14,
                textAlign: 'center',
              }}
            >
              OG EXPORTS · BUYER ALERT
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
            {message ? (
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
            ) : null}
            <View
              style={{
                width: '100%',
                flexDirection: buttons.length === 2 ? 'row' : 'column',
                gap: 9,
                marginTop: 19,
              }}
            >
              {buttons.map((button, index) => {
                const destructive = button.style === 'destructive' || (button.style !== 'cancel' && tone === 'danger');
                const primary = button.style !== 'cancel';
                const buttonColor = primary ? destructive ? colors.destructive : colors.primary : colors.secondary;
                const buttonTextColor = primary
                  ? destructive ? colors.destructiveForeground : colors.primaryForeground
                  : colors.foreground;
                return (
                  <Pressable
                    key={`${button.label}-${index}`}
                    accessibilityRole="button"
                    onPress={() => {
                      try {
                        button.onPress?.();
                      } finally {
                        onClose();
                      }
                    }}
                    style={({ pressed }) => ({
                      flex: buttons.length === 2 ? 1 : undefined,
                      minHeight: 46,
                      paddingHorizontal: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 14,
                      borderWidth: primary ? 0 : 1,
                      borderColor: colors.border,
                      backgroundColor: buttonColor,
                      opacity: pressed ? 0.78 : 1,
                    })}
                  >
                    <Text numberOfLines={2} style={{ color: buttonTextColor, fontSize: 11, fontWeight: '800', textAlign: 'center' }}>
                      {button.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </GlassPopupSurface>
        </View>
      </View>
    </Modal>
  );
}
