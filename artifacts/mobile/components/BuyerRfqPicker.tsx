import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Feather } from '@expo/vector-icons';
import { LocalizedText as Text, LocalizedTextInput as TextInput } from '@/components/LocalizedText';
import { GlassPopupSurface } from '@/components/GlassPopupSurface';
import { useColors } from '@/hooks/useColors';

export type BuyerRfqOption = { value: string; label: string; keywords?: string };

export function BuyerRfqPicker({
  label,
  value,
  options,
  placeholder,
  testID,
  disabled = false,
  emptyMessage = 'No options found.',
  onSelect,
}: {
  label: string;
  value: string;
  options: BuyerRfqOption[];
  placeholder: string;
  testID: string;
  disabled?: boolean;
  emptyMessage?: string;
  onSelect: (value: string) => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const selected = options.find(option => option.value === value);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? options.filter(option => `${option.label} ${option.keywords ?? ''}`.toLowerCase().includes(query))
      : options;
  }, [options, search]);

  function close() {
    setVisible(false);
    setSearch('');
  }

  return <>
    <View style={{ gap: 7, marginBottom: 14 }}>
      <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600' }}>{label}</Text>
      <Pressable
        testID={`${testID}-trigger`}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? placeholder}`}
        accessibilityState={{ disabled, expanded: visible }}
        disabled={disabled}
        onPress={() => setVisible(true)}
        style={({ pressed }) => ({
          minHeight: 54,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 11,
          paddingHorizontal: 13,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: colors.radius,
          backgroundColor: colors.card,
          opacity: disabled ? 0.55 : pressed ? 0.84 : 1,
        })}
      >
        <Text numberOfLines={1} style={{ flex: 1, color: selected ? colors.foreground : colors.mutedForeground, fontSize: 13, fontWeight: selected ? '600' : '400' }}>
          {selected?.label ?? placeholder}
        </Text>
        <Feather name="chevron-down" size={17} color={colors.mutedForeground} />
      </Pressable>
    </View>

    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={close}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Close ${label} list`} onPress={close} style={[StyleSheet.absoluteFill, { backgroundColor: colors.shadowColor, opacity: 0.45 }]} />
        <KeyboardAvoidingView behavior="padding" style={{ width: '100%', maxHeight: '92%' }}>
          <GlassPopupSurface style={{
            height: Math.min(height * 0.88, 700),
            paddingTop: 10,
            paddingBottom: Math.max(insets.bottom, 14),
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderTopWidth: 1,
            borderColor: colors.border,
          }}>
            <View style={{ alignItems: 'center', paddingBottom: 12 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.accentSurface }} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.accent, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 }}>OG EXPORTS</Text>
                <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: '700', marginTop: 3 }}>{label}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 3 }}>Search and select one option.</Text>
              </View>
              <Pressable testID={`${testID}-close`} accessibilityRole="button" accessibilityLabel={`Close ${label} list`} onPress={close} hitSlop={10} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <View style={{ minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 18, marginBottom: 8, paddingHorizontal: 13, borderWidth: 1, borderColor: colors.border, borderRadius: colors.radius, backgroundColor: colors.card }}>
              <Feather name="search" size={16} color={colors.mutedForeground} />
              <TextInput
                testID={`${testID}-search`}
                accessibilityLabel={`Search ${label}`}
                value={search}
                onChangeText={setSearch}
                placeholder={`Search ${label.toLowerCase()}`}
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                style={{ flex: 1, minHeight: 46, color: colors.foreground, fontSize: 14, outlineWidth: 0 }}
              />
              {search ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setSearch('')} hitSlop={8}><Feather name="x-circle" size={17} color={colors.mutedForeground} /></Pressable> : null}
            </View>
            <FlatList
              testID={`${testID}-options`}
              data={filtered}
              keyExtractor={option => option.value}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 16, flexGrow: 1 }}
              ListEmptyComponent={<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}><Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{emptyMessage}</Text></View>}
              renderItem={({ item }) => {
                const active = item.value === value;
                return <Pressable
                  testID={`${testID}-option-${item.value}`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={item.label}
                  onPress={() => { onSelect(item.value); close(); }}
                  style={({ pressed }) => ({
                    minHeight: 52,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    paddingHorizontal: 12,
                    borderRadius: 13,
                    backgroundColor: active ? colors.lightGreen : pressed ? colors.secondary : 'transparent',
                  })}
                >
                  <Text numberOfLines={2} style={{ flex: 1, color: colors.foreground, fontSize: 13, fontWeight: active ? '700' : '500' }}>{item.label}</Text>
                  {active ? <Feather name="check" size={17} color={colors.primary} /> : null}
                </Pressable>;
              }}
            />
          </GlassPopupSurface>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  </>;
}
