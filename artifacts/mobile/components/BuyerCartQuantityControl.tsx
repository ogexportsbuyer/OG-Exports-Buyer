import React, { useEffect, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { nextBuyerCartQuantity, parseBuyerCartQuantityInput } from '@/lib/buyer-cart-flow';

export function BuyerCartQuantityControl({
  itemId,
  name,
  quantity,
  minimumQuantity,
  disabled,
  onChangeQuantity,
}: {
  itemId: string;
  name: string;
  quantity: number;
  minimumQuantity: number;
  disabled: boolean;
  onChangeQuantity: (nextQuantity: number) => Promise<boolean>;
}) {
  const colors = useColors();
  const [draft, setDraft] = useState(String(quantity));
  const lastSubmitted = useRef(String(quantity));
  const committing = useRef(false);

  useEffect(() => {
    if (!committing.current) {
      const next = String(quantity);
      setDraft(next);
      lastSubmitted.current = next;
    }
  }, [quantity]);

  async function commitQuantity(value: string) {
    const nextQuantity = parseBuyerCartQuantityInput(value, minimumQuantity);
    const normalized = String(nextQuantity);
    setDraft(normalized);
    if (normalized === lastSubmitted.current || committing.current) return;

    lastSubmitted.current = normalized;
    committing.current = true;
    const saved = await onChangeQuantity(nextQuantity);
    committing.current = false;
    if (!saved) {
      lastSubmitted.current = String(quantity);
      setDraft(String(quantity));
    }
  }

  function stepQuantity(delta: number) {
    if (disabled || committing.current) return;
    const current = parseBuyerCartQuantityInput(draft, minimumQuantity);
    void commitQuantity(String(nextBuyerCartQuantity(current, delta, minimumQuantity)));
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, padding: 4, borderRadius: 15, borderWidth: 1, borderColor: colors.glassEdge, backgroundColor: colors.glassTintTeal }}>
      <Pressable
        testID={`buyer-cart-decrease-${itemId}`}
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${name} quantity`}
        disabled={disabled || quantity <= minimumQuantity}
        onPress={() => stepQuantity(-1)}
        style={{ width: 34, height: 34, borderRadius: 11, borderWidth: 1, borderColor: colors.glassEdge, backgroundColor: colors.glassFill, alignItems: 'center', justifyContent: 'center', opacity: disabled || quantity <= minimumQuantity ? 0.45 : 1 }}
      >
        <Feather name="minus" size={14} color={colors.foreground} />
      </Pressable>
      <TextInput
        testID={`buyer-cart-quantity-input-${itemId}`}
        accessibilityLabel={`${name} quantity`}
        accessibilityHint={`Minimum order quantity is ${minimumQuantity}.`}
        value={draft}
        onChangeText={value => {
          if (value === '' || /^\d+$/.test(value)) setDraft(value);
        }}
        onBlur={() => void commitQuantity(draft)}
        onSubmitEditing={() => void commitQuantity(draft)}
        keyboardType="number-pad"
        returnKeyType="done"
        selectTextOnFocus
        maxLength={9}
        editable={!disabled}
        style={{
          width: 72,
          height: 42,
          paddingVertical: 0,
          paddingHorizontal: 8,
          borderWidth: 1,
          borderColor: colors.glassEdge,
          borderRadius: 12,
          backgroundColor: colors.glassFill,
          color: colors.foreground,
          fontSize: 15,
          fontWeight: '800',
          textAlign: 'center',
        }}
      />
      <Pressable
        testID={`buyer-cart-increase-${itemId}`}
        accessibilityRole="button"
        accessibilityLabel={`Increase ${name} quantity`}
        disabled={disabled}
        onPress={() => stepQuantity(1)}
        style={{ width: 34, height: 34, borderRadius: 11, borderWidth: 1, borderColor: colors.glassEdge, backgroundColor: colors.glassFill, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.5 : 1 }}
      >
        <Feather name="plus" size={14} color={colors.foreground} />
      </Pressable>
    </View>
  );
}
