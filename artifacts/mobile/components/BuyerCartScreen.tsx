import React, { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { Action, Card, EmptyState, ErrorState, LoadingCard, Screen } from '@/components/InvestorUI';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { useGetBuyerCart, useRemoveBuyerCartItem, useUpdateBuyerCartItem, getGetBuyerCartQueryKey } from '@workspace/api-client-react';
import { amount, first, list, messageOf, record } from '@/lib/data';
import { buyerCartItemMinimumQuantity, nextBuyerCartQuantity } from '@/lib/buyer-cart-flow';
import { formatFobPrice } from '@/lib/format-fob-price';

function CartThumbnail({ uri, label }: { uri: string; label: string }) {
  const colors = useColors();
  const [failed, setFailed] = useState(false);

  return (
    <View style={{ width: 78, height: 78, borderRadius: 13, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lightGreen }}>
      {uri && !failed ? (
        <Image
          source={{ uri }}
          accessibilityLabel={`${label} product image`}
          resizeMode="cover"
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%' }}
        />
      ) : (
        <Feather name="package" size={25} color={colors.primary} />
      )}
    </View>
  );
}

export default function BuyerCartScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const cartQuery = useGetBuyerCart({ query: { queryKey: getGetBuyerCartQueryKey(), enabled: !!token, staleTime: 15_000 } });
  const updateItem = useUpdateBuyerCartItem();
  const removeItem = useRemoveBuyerCartItem();
  const cart = record(record(cartQuery.data).data);
  const items = list(cart.items);
  const cartCurrency = first(cart, ['currency', 'currency_code'], 'USD').toUpperCase();
  const [actionError, setActionError] = useState('');
  const [clearAllConfirm, setClearAllConfirm] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const total = items.reduce((sum, item) => {
    const quantity = amount(item, ['qty']) ?? 0;
    const unitPrice = amount(item, ['unit_price']) ?? 0;
    return sum + quantity * unitPrice;
  }, 0);
  const mutationPending = updateItem.isPending || removeItem.isPending || clearingAll;

  async function changeQuantity(item: ReturnType<typeof record>, delta: number) {
    const id = amount(item, ['id']);
    const minimumQuantity = buyerCartItemMinimumQuantity(item);
    const currentQuantity = amount(item, ['qty']) ?? minimumQuantity;
    if (!id) return;
    const nextQuantity = nextBuyerCartQuantity(currentQuantity, delta, minimumQuantity);
    setActionError('');
    try {
      await updateItem.mutateAsync({ item: id, data: { qty: nextQuantity } });
      await queryClient.invalidateQueries({ queryKey: getGetBuyerCartQueryKey() });
    } catch (error) {
      setActionError(messageOf(error));
    }
  }

  async function deleteItem(item: ReturnType<typeof record>) {
    const id = amount(item, ['id']);
    if (!id) return;
    setActionError('');
    try {
      await removeItem.mutateAsync({ item: id });
      await queryClient.invalidateQueries({ queryKey: getGetBuyerCartQueryKey() });
    } catch (error) {
      setActionError(messageOf(error));
    }
  }

  async function clearCart() {
    if (!items.length) return;
    setActionError('');
    setClearingAll(true);
    try {
      for (const item of items) {
        const id = amount(item, ['id']);
        if (id === null) throw new Error('A cart item is missing its server ID. Refresh the cart and try again.');
        await removeItem.mutateAsync({ item: id });
      }
      await queryClient.invalidateQueries({ queryKey: getGetBuyerCartQueryKey() });
      setClearAllConfirm(false);
    } catch (error) {
      setActionError(messageOf(error));
    } finally {
      setClearingAll(false);
    }
  }

  if (!token) {
    return <BuyerAuthGate
      title="Your cart"
      body="Sign in to view saved products, change quantities, and continue to order or request a quotation."
      returnTo="/buyer-cart"
    />;
  }

  return (
    <Screen title="Your cart" subtitle={`${items.length} ${items.length === 1 ? 'product' : 'products'} in your cart`} refreshable>
      {actionError ? <Text accessibilityRole="alert" style={{ color: colors.destructive, marginBottom: 12 }}>{actionError}</Text> : null}
      {cartQuery.isLoading ? <LoadingCard label="Loading your cart…" /> : null}
      {cartQuery.isError ? <ErrorState message="Your cart could not be loaded." error={cartQuery.error} onRetry={() => void cartQuery.refetch()} /> : null}
      {!cartQuery.isLoading && !cartQuery.isError && items.length === 0 ? (
        <>
          <EmptyState title="Your cart is empty" body="Browse the approved product catalogue and add products to start an order." icon="shopping-cart" />
          <Action title="Browse products" icon="grid" secondary onPress={() => router.push('/(buyer-tabs)/buyer-products')} testID="buyer-cart-browse-empty" />
        </>
      ) : null}

      {!cartQuery.isLoading && !cartQuery.isError && items.map((item, index) => {
        const product = record(item.product);
        const itemId = first(item, ['id'], `item-${index}`);
        const minimumQuantity = buyerCartItemMinimumQuantity(item);
        const quantity = amount(item, ['qty']) ?? minimumQuantity;
        const unitPrice = amount(item, ['unit_price']) ?? 0;
        const name = first(product, ['name'], first(item, ['product_name'], 'Export product'));
        const image = first(product, ['image_url', 'imageUrl']);
        const subtotal = quantity * unitPrice;
        return (
          <Card key={itemId} testID={`buyer-cart-item-${itemId}`} style={{ padding: 16, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <CartThumbnail uri={image} label={name} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 5 }}>
                  <Text style={{ flex: 1, color: colors.foreground, fontSize: 14, lineHeight: 19, fontWeight: '700' }}>{name}</Text>
                  <Pressable
                    testID={`buyer-cart-remove-${itemId}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${name} from cart`}
                    disabled={mutationPending}
                    onPress={() => void deleteItem(item)}
                    hitSlop={8}
                    style={{ width: 30, height: 30, alignItems: 'center', justifyContent: 'center', opacity: mutationPending ? 0.5 : 1 }}
                  >
                    <Feather name="trash-2" size={16} color={colors.destructive} />
                  </Pressable>
                </View>
                <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 3 }}>
                  {first(product, ['origin'], 'Origin not specified')}
                  {first(product, ['sku']) ? ` · ${first(product, ['sku'])}` : ''}
                </Text>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700', marginTop: 7 }}>
                  {unitPrice > 0 ? `${formatFobPrice(unitPrice, cartCurrency)} per unit` : 'Price confirmed by OG Exports'}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Pressable
                  testID={`buyer-cart-decrease-${itemId}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Decrease ${name} quantity`}
                  disabled={mutationPending || quantity <= minimumQuantity}
                  onPress={() => void changeQuantity(item, -1)}
                  style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', opacity: quantity <= minimumQuantity ? 0.45 : 1 }}
                >
                  <Feather name="minus" size={14} color={colors.foreground} />
                </Pressable>
                <Text style={{ color: colors.foreground, minWidth: 20, textAlign: 'center', fontWeight: '700' }}>{quantity}</Text>
                <Pressable
                  testID={`buyer-cart-increase-${itemId}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Increase ${name} quantity`}
                  disabled={mutationPending}
                  onPress={() => void changeQuantity(item, 1)}
                  style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', opacity: mutationPending ? 0.5 : 1 }}
                >
                  <Feather name="plus" size={14} color={colors.foreground} />
                </Pressable>
                <Text style={{ color: colors.mutedForeground, fontSize: 9, marginLeft: 2 }}>MOQ {minimumQuantity}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: colors.mutedForeground, fontSize: 10, textTransform: 'uppercase' }}>Line total</Text>
                <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '700', marginTop: 3 }}>
                  {subtotal > 0 ? formatFobPrice(subtotal, cartCurrency) : 'Quote required'}
                </Text>
              </View>
            </View>
          </Card>
        );
      })}

      {items.length > 0 ? (
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 3, marginBottom: 8 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: '700' }}>{items.length} {items.length === 1 ? 'product' : 'products'} selected</Text>
            <Pressable
              testID="buyer-cart-clear-all"
              accessibilityRole="button"
              accessibilityState={{ disabled: mutationPending }}
              disabled={mutationPending}
              onPress={() => { setActionError(''); setClearAllConfirm(true); }}
              style={{ minHeight: 36, paddingHorizontal: 10, justifyContent: 'center', opacity: mutationPending ? 0.5 : 1 }}
            >
              <Text style={{ color: colors.destructive, fontSize: 11, fontWeight: '700' }}>Clear all</Text>
            </Pressable>
          </View>
          {clearAllConfirm ? (
            <Card style={{ padding: 14, marginBottom: 10 }}>
              <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700' }}>Remove every item?</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 16, marginTop: 4 }}>This will clear all {items.length} {items.length === 1 ? 'product' : 'products'} from your saved cart.</Text>
              <View style={{ flexDirection: 'row', gap: 9, marginTop: 12 }}>
                <Pressable
                  testID="buyer-cart-clear-cancel"
                  accessibilityRole="button"
                  onPress={() => setClearAllConfirm(false)}
                  disabled={clearingAll}
                  style={{ minHeight: 40, flex: 1, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '700' }}>Keep cart</Text>
                </Pressable>
                <Pressable
                  testID="buyer-cart-clear-confirm"
                  accessibilityRole="button"
                  accessibilityState={{ disabled: clearingAll, busy: clearingAll }}
                  onPress={() => void clearCart()}
                  disabled={clearingAll}
                  style={{ minHeight: 40, flex: 1, borderRadius: 12, backgroundColor: colors.destructive, alignItems: 'center', justifyContent: 'center', opacity: clearingAll ? 0.6 : 1 }}
                >
                  <Text style={{ color: colors.destructiveForeground, fontSize: 12, fontWeight: '700' }}>{clearingAll ? 'Clearing…' : 'Remove all'}</Text>
                </Pressable>
              </View>
            </Card>
          ) : null}
          <Card style={{ padding: 17, marginTop: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ color: colors.mutedForeground }}>Estimated subtotal</Text>
              <Text style={{ color: colors.foreground, fontWeight: '700' }}>{total > 0 ? formatFobPrice(total, cartCurrency) : 'Final price by quotation'}</Text>
            </View>
            {items.some(item => (amount(item, ['unit_price']) ?? 0) <= 0) ? (
              <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '600', marginBottom: 10 }}>
                Some items need a confirmed quotation.
              </Text>
            ) : null}
            <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 16, marginBottom: 14 }}>
              Final pricing, freight and payment instructions are confirmed by OG Exports. No payment is taken in this cart.
            </Text>
            <Action
              title="Continue to checkout"
              icon="arrow-right"
              onPress={() => router.push('/buyer-checkout')}
              disabled={mutationPending}
              testID="buyer-cart-checkout"
            />
          </Card>
        </>
      ) : null}
      {!cartQuery.isError ? (
        <Pressable accessibilityRole="button" onPress={() => router.push('/(buyer-tabs)/buyer-products')} style={{ alignSelf: 'center', padding: 14 }}>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>Browse products</Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}
