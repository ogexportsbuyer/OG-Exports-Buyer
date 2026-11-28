import React from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { Card } from '@/components/InvestorUI';
import { BuyerCartQuantityControl } from '@/components/BuyerCartQuantityControl';
import { BuyerProductImage } from '@/components/BuyerProductImage';
import { BuyerProductPrice } from '@/components/BuyerProductPrice';
import { useColors } from '@/hooks/useColors';
import { amount, first, record } from '@/lib/data';
import { buyerCartItemMinimumQuantity } from '@/lib/buyer-cart-flow';
import { formatFobPrice } from '@/lib/format-fob-price';

function SummaryRow({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 9 }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{label}</Text>
      <Text style={{ color: colors.foreground, flex: 1, fontSize: 11, fontWeight: '700', textAlign: 'right' }}>{value || '—'}</Text>
    </View>
  );
}

export function BuyerCheckoutCartEditor({
  items,
  cartCurrency,
  discountTotal,
  subtotal,
  documentationFee,
  grandTotal,
  hasUnpricedItems,
  mutationPending,
  syncError,
  onChangeQuantity,
  onRemove,
  onClearCart,
}: {
  items: unknown[];
  cartCurrency: string;
  discountTotal: number;
  subtotal: number;
  documentationFee: number;
  grandTotal: number;
  hasUnpricedItems: boolean;
  mutationPending: boolean;
  syncError: string;
  onChangeQuantity: (item: ReturnType<typeof record>, nextQuantity: number) => Promise<boolean>;
  onRemove: (item: ReturnType<typeof record>) => void;
  onClearCart: () => void;
}) {
  const colors = useColors();

  return (
    <Card style={{ padding: 15, marginBottom: 13, borderRadius: 21 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1 }}>
          <View style={{ width: 32, height: 32, borderRadius: 11, backgroundColor: colors.glassTintGold, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="shopping-bag" size={15} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '800' }}>Cart items</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 2 }}>{items.length} {items.length === 1 ? 'product' : 'products'}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 2 }}>edit quantities here</Text>
          </View>
        </View>
        <Pressable
          testID="buyer-cart-clear-all"
          accessibilityRole="button"
          accessibilityState={{ disabled: mutationPending }}
          disabled={mutationPending || Boolean(syncError)}
          onPress={() => Alert.alert(
            'Clear your cart?',
            `Remove all ${items.length} ${items.length === 1 ? 'product' : 'products'} from your cart?`,
            [
              { text: 'Keep cart', style: 'cancel' },
              { text: 'Remove all', style: 'destructive', onPress: onClearCart },
            ],
          )}
          style={({ pressed }) => ({
            minHeight: 34,
            paddingHorizontal: 10,
            borderRadius: 11,
            borderWidth: 1,
            borderColor: colors.glassEdge,
            backgroundColor: colors.glassTintGold,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            opacity: mutationPending ? 0.48 : pressed ? 0.75 : 1,
          })}
        >
          <Feather name="trash-2" size={12} color={colors.destructive} />
          <Text style={{ color: colors.destructive, fontSize: 10, fontWeight: '700' }}>Clear all</Text>
        </Pressable>
      </View>

      {items.map((rawItem, index) => {
        const item = record(rawItem);
        const product = record(item.product);
        const itemId = first(item, ['id'], `item-${index}`);
        const quantity = amount(item, ['qty']) ?? 0;
        const unitPrice = amount(item, ['unit_price']) ?? 0;
        const minimumQuantity = buyerCartItemMinimumQuantity(item);
        const productName = first(product, ['name'], first(item, ['product_name'], 'Export product'));
        const imagePath = first(product, ['image_url', 'imageUrl', 'image_path', 'imagePath'], first(item, ['product_image_url', 'productImageUrl']));
        return (
          <View key={itemId} testID={`buyer-cart-item-${itemId}`} style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.glassEdge }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ padding: 3, borderRadius: 15, backgroundColor: colors.glassTintTeal, borderWidth: 1, borderColor: colors.glassBorder }}>
                <BuyerProductImage uri={imagePath} label={`${productName} product image`} style={{ width: 54, height: 54, borderRadius: 12 }} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: colors.foreground, fontSize: 12, lineHeight: 17, fontWeight: '800' }}>{productName}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 3 }}>{first(product, ['origin'], 'Origin not specified')}</Text>
                <View style={{ alignSelf: 'flex-start', marginTop: 5, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.glassTintGold }}>
                  <BuyerProductPrice product={item} compact />
                </View>
              </View>
              <Pressable
                testID={`buyer-cart-remove-${itemId}`}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${productName} from cart`}
                disabled={mutationPending || Boolean(syncError)}
                onPress={() => onRemove(item)}
                hitSlop={8}
                style={({ pressed }) => ({
                  width: 32,
                  height: 32,
                  borderRadius: 11,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.glassTintGold,
                  opacity: mutationPending ? 0.45 : pressed ? 0.7 : 1,
                })}
              >
                <Feather name="trash-2" size={14} color={colors.destructive} />
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', rowGap: 9, columnGap: 9, marginTop: 11, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.glassEdge }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <BuyerCartQuantityControl
                  key={`${itemId}:${quantity}`}
                  itemId={itemId}
                  name={productName}
                  quantity={quantity}
                  minimumQuantity={minimumQuantity}
                  disabled={mutationPending || Boolean(syncError)}
                  onChangeQuantity={nextQuantity => onChangeQuantity(item, nextQuantity)}
                />
                <Text style={{ color: colors.mutedForeground, fontSize: 9, fontWeight: '600' }}>MOQ {minimumQuantity}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: colors.mutedForeground, fontSize: 9, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' }}>Line total</Text>
                <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '800', marginTop: 3 }}>
                  {unitPrice > 0 ? formatFobPrice(quantity * unitPrice, cartCurrency) : 'Quote required'}
                </Text>
              </View>
            </View>
          </View>
        );
      })}

      {discountTotal > 0 ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 11 }}>
          <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>Product discounts saved</Text>
          <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>−{formatFobPrice(discountTotal, cartCurrency)}</Text>
        </View>
      ) : null}
      <View style={{ borderTopWidth: 1, borderTopColor: colors.border, marginTop: 13, paddingTop: 11 }}>
        <SummaryRow label="Commodity total" value={subtotal > 0 ? formatFobPrice(subtotal, cartCurrency) : 'Price by quotation'} />
        <SummaryRow label="Documentation fee (2%)" value={hasUnpricedItems ? 'Confirmed on quotation' : formatFobPrice(documentationFee, cartCurrency)} />
        <SummaryRow label="Freight / insurance" value="Quoted separately" />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 11, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '800' }}>Estimated total</Text>
          <Text style={{ color: colors.accentText, fontSize: 12, fontWeight: '800' }}>{hasUnpricedItems || subtotal <= 0 ? 'Price by quotation' : formatFobPrice(grandTotal, cartCurrency)}</Text>
        </View>
      </View>
      {hasUnpricedItems ? <Text style={{ color: colors.accentText, fontSize: 10, lineHeight: 15, marginTop: 8 }}>Some products need a confirmed price. Use a non-FOB term to send a quotation request.</Text> : null}
      <Text style={{ color: colors.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: 8 }}>Freight and final adjustments are confirmed separately.</Text>
      <Text style={{ color: colors.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: 4 }}>No payment is taken in this app.</Text>
    </Card>
  );
}
