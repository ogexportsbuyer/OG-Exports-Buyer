import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { GlassPopupSurface } from '@/components/GlassPopupSurface';
import { useColors } from '@/hooks/useColors';
import {
  buyerDeliveryCalendarDays,
  buyerDeliveryDateKey,
  formatBuyerDeliveryDateLabel,
  isFutureBuyerDeliveryDate,
  parseBuyerDeliveryDate,
} from '@/lib/buyer-cart-flow';
import { formatAppDate } from '@/lib/strings';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function BuyerDeliveryDatePicker({
  label,
  value,
  testID,
  onSelect,
}: {
  label: string;
  value: string;
  testID: string;
  onSelect: (date: string) => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState(value);
  const [monthCursor, setMonthCursor] = useState(() => {
    const selected = parseBuyerDeliveryDate(value) ?? new Date();
    return new Date(selected.getFullYear(), selected.getMonth(), 1);
  });
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const calendarDays = buyerDeliveryCalendarDays(year, month);
  const selected = parseBuyerDeliveryDate(draft);
  const selectedLabel = formatBuyerDeliveryDateLabel(value);
  const monthLabel = formatAppDate(monthCursor, { month: 'long', year: 'numeric' });
  const previousMonth = new Date(year, month - 1, 1);
  const previousMonthLastDay = new Date(year, month, 0).getDate();
  const canGoBack = isFutureBuyerDeliveryDate(
    buyerDeliveryDateKey(previousMonth.getFullYear(), previousMonth.getMonth(), previousMonthLastDay),
  );

  function openPicker() {
    const start = parseBuyerDeliveryDate(value) ?? new Date();
    setDraft(value);
    setMonthCursor(new Date(start.getFullYear(), start.getMonth(), 1));
    setVisible(true);
  }

  function closePicker() {
    setVisible(false);
  }

  function moveMonth(delta: number) {
    setMonthCursor(current => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  function confirmDate() {
    if (!isFutureBuyerDeliveryDate(draft)) return;
    onSelect(draft);
    closePicker();
  }

  return (
    <>
      <View style={{ gap: 7, marginBottom: 14 }}>
        <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600' }}>{label}</Text>
        <Pressable
          testID={`${testID}-trigger`}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${selectedLabel || 'Choose a date'}`}
          accessibilityState={{ expanded: visible }}
          onPress={openPicker}
          style={({ pressed }) => ({
            minHeight: 58,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 14,
            borderWidth: 1,
            borderColor: visible ? colors.accent : colors.border,
            borderRadius: colors.radius,
            backgroundColor: colors.card,
            opacity: pressed ? 0.86 : 1,
          })}
        >
          <View style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lightGreen }}>
            <Feather name="calendar" size={17} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: selectedLabel ? colors.foreground : colors.mutedForeground, fontSize: 13, fontWeight: selectedLabel ? '700' : '500' }}>
              {selectedLabel || 'Choose a delivery date'}
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 3 }}>Select any date after today</Text>
          </View>
          <Feather name="chevron-down" size={17} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={closePicker}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable
            testID={`${testID}-backdrop`}
            accessibilityRole="button"
            accessibilityLabel="Close calendar"
            onPress={closePicker}
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.shadowColor, opacity: 0.46 }]}
          />
          <GlassPopupSurface
            testID={`${testID}-calendar`}
            accessibilityViewIsModal
            style={{
              height: Math.min(height * 0.92, 700),
              paddingTop: 10,
              paddingBottom: Math.max(insets.bottom, 14),
              paddingHorizontal: 18,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderTopWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ alignItems: 'center', paddingBottom: 14 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.accentSurface }} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 20 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.accent, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 }}>OG EXPORTS · DELIVERY</Text>
                <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: '800', marginTop: 4 }}>{label}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 4 }}>Choose a future date for your order.</Text>
              </View>
              <Pressable
                testID={`${testID}-close`}
                accessibilityRole="button"
                accessibilityLabel="Close calendar"
                onPress={closePicker}
                hitSlop={10}
                style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
              >
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Pressable
                testID={`${testID}-previous-month`}
                accessibilityRole="button"
                accessibilityLabel="Previous month"
                accessibilityState={{ disabled: !canGoBack }}
                disabled={!canGoBack}
                onPress={() => moveMonth(-1)}
                style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary, opacity: canGoBack ? 1 : 0.4 }}
              >
                <Feather name="chevron-left" size={20} color={colors.foreground} />
              </Pressable>
              <Text accessibilityRole="header" style={{ color: colors.foreground, fontSize: 15, fontWeight: '800' }}>{monthLabel}</Text>
              <Pressable
                testID={`${testID}-next-month`}
                accessibilityRole="button"
                accessibilityLabel="Next month"
                onPress={() => moveMonth(1)}
                style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary }}
              >
                <Feather name="chevron-right" size={20} color={colors.foreground} />
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', marginBottom: 7 }}>
              {WEEKDAYS.map(day => (
                <View key={day} style={{ flex: 1, alignItems: 'center', paddingVertical: 7 }}>
                  <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: '700' }}>{day}</Text>
                </View>
              ))}
            </View>
            <View testID={`${testID}-day-grid`} style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {calendarDays.map((day, index) => {
                if (day === null) return <View key={`empty-${index}`} style={{ width: '14.2857%', aspectRatio: 1, padding: 3 }} />;
                const dayValue = buyerDeliveryDateKey(year, month, day);
                const active = dayValue === draft;
                const future = isFutureBuyerDeliveryDate(dayValue);
                return (
                  <View key={dayValue} style={{ width: '14.2857%', aspectRatio: 1, padding: 3 }}>
                    <Pressable
                      testID={`${testID}-day-${dayValue}`}
                      accessibilityRole="button"
                      accessibilityLabel={formatAppDate(new Date(year, month, day), { dateStyle: 'full' })}
                      accessibilityState={{ selected: active, disabled: !future }}
                      disabled={!future}
                      onPress={() => setDraft(dayValue)}
                      style={({ pressed }) => ({
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 14,
                        backgroundColor: active ? colors.primary : pressed ? colors.secondary : 'transparent',
                        opacity: future ? 1 : 0.38,
                      })}
                    >
                      <Text style={{ color: active ? colors.primaryForeground : future ? colors.foreground : colors.mutedForeground, fontSize: 13, fontWeight: active ? '800' : '600' }}>{day}</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <View style={{ flex: 1, minHeight: 14 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 14, padding: 12, borderRadius: 14, backgroundColor: colors.secondary }}>
              <Feather name="info" size={15} color={colors.accent} />
              <Text style={{ flex: 1, color: colors.mutedForeground, fontSize: 10, lineHeight: 15 }}>
                {selected ? `Selected: ${formatBuyerDeliveryDateLabel(draft)}` : 'Dates before tomorrow are unavailable.'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                testID={`${testID}-cancel`}
                accessibilityRole="button"
                onPress={closePicker}
                style={{ minHeight: 48, flex: 1, borderRadius: 15, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '700' }}>Cancel</Text>
              </Pressable>
              <Pressable
                testID={`${testID}-confirm`}
                accessibilityRole="button"
                accessibilityState={{ disabled: !isFutureBuyerDeliveryDate(draft) }}
                disabled={!isFutureBuyerDeliveryDate(draft)}
                onPress={confirmDate}
                style={({ pressed }) => ({
                  minHeight: 48,
                  flex: 1.5,
                  flexDirection: 'row',
                  gap: 8,
                  borderRadius: 15,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: !isFutureBuyerDeliveryDate(draft) ? 0.45 : pressed ? 0.86 : 1,
                })}
              >
                <Feather name="check" size={16} color={colors.primaryForeground} />
                <Text style={{ color: colors.primaryForeground, fontSize: 12, fontWeight: '800' }}>Use this date</Text>
              </Pressable>
            </View>
          </GlassPopupSurface>
        </View>
      </Modal>
    </>
  );
}
