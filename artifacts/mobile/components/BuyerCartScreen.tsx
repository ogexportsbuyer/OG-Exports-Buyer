import React, { useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { BuyerProductPrice } from '@/components/BuyerProductPrice';
import { BuyerProductImage } from '@/components/BuyerProductImage';
import { Action, Card, EmptyState, ErrorState, LoadingCard, Screen } from '@/components/InvestorUI';
import { useAuth } from '@/context/AuthContext';
import { useBuyerGuestFlow } from '@/context/BuyerGuestFlowContext';
import { useColors } from '@/hooks/useColors';
import { useGetBuyerCart, useRemoveBuyerCartItem, useUpdateBuyerCartItem, getGetBuyerCartQueryKey } from '@workspace/api-client-react';
import { amount, first, list, messageOf, record } from '@/lib/data';
import { buyerCartItemMinimumQuantity, nextBuyerCartQuantity, parseBuyerCartQuantityInput } from '@/lib/buyer-cart-flow';
import { buyerGuestCartRow } from '@/lib/buyer-guest-flow';
import { formatFobPrice } from '@/lib/format-fob-price';

function CartThumbnail({ uri, label }: { uri: string; label: string }) {
  return <BuyerProductImage uri={uri} label={`${label} product image`} style={{ width: 78, height: 78, borderRadius: 13 }} />;
}

function CartQuantityControl({
  itemId,
  name,
  quantity,
  minimumQuantity,
  disabled,
  colors,
  onChangeQuantity,
}: {
  itemId: string;
  name: string;
  quantity: number;
  minimumQuantity: number;
  disabled: boolean;
  colors: ReturnType<typeof useColors>;
  onChangeQuantity: (nextQuantity: number) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState(String(quantity));
  const lastSubmitted = useRef(String(quantity));
  const committing = useRef(false);

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
    const currentDraft = parseBuyerCartQuantityInput(draft, minimumQuantity);
    const nextQuantity = nextBuyerCartQuantity(currentDraft, delta, minimumQuantity);
    void commitQuantity(String(nextQuantity));
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Pressable
        testID={`buyer-cart-decrease-${itemId}`}
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${name} quantity`}
        disabled={disabled || quantity <= minimumQuantity}
        onPress={() => stepQuantity(-1)}
        style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', opacity: disabled || quantity <= minimumQuantity ? 0.45 : 1 }}
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
          width: 48,
          height: 36,
          paddingVertical: 0,
          paddingHorizontal: 4,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          backgroundColor: colors.secondary,
          color: colors.foreground,
          fontSize: 13,
          fontWeight: '700',
          textAlign: 'center',
        }}
      />
      <Pressable
        testID={`buyer-cart-increase-${itemId}`}
        accessibilityRole="button"
        accessibilityLabel={`Increase ${name} quantity`}
        disabled={disabled}
        onPress={() => stepQuantity(1)}
        style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.5 : 1 }}
      >
        <Feather name="plus" size={14} color={colors.foreground} />
      </Pressable>
    </View>
  );
}

export default function BuyerCartScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const guestFlow = useBuyerGuestFlow();
  const cartQuery = useGetBuyerCart({ query: { queryKey: getGetBuyerCartQueryKey(), enabled: !!token, staleTime: 15_000 } });
  const updateItem = useUpdateBuyerCartItem();
  const removeItem = useRemoveBuyerCartItem();
  const cart = record(record(cartQuery.data).data);
  const items = token && !guestFlow.mergeError
    ? list(cart.items)
    : guestFlow.cart.length
      ? guestFlow.cart.map(buyerGuestCartRow)
      : list(cart.items);
  const cartCurrency = first(cart, ['currency', 'currency_code'], 'USD').toUpperCase();
  const [actionError, setActionError] = useState('');
  const [clearAllConfirm, setClearAllConfirm] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const attemptedMergeKey = React.useRef('');
  const guestMergeKey = guestFlow.cart.map(item => `${item.productId}:${item.quantity}`).join('|');
  React.useEffect(() => {
    if (!token || !guestFlow.ready || !guestFlow.cart.length || attemptedMergeKey.current === guestMergeKey) return;
    attemptedMergeKey.current = guestMergeKey;
    void guestFlow.mergeGuestCart().then(merged => {
      if (!merged) setActionError('Your saved guest cart could not be added to your account. Retry before checkout.');
    });
  }, [guestFlow.cart, guestFlow.mergeGuestCart, guestFlow.ready, guestMergeKey, token]);
  const waitingForGuestCart = Boolean(token && guestFlow.cart.length && !guestFlow.mergeError);
  const canRenderCart = !cartQuery.isLoading && !waitingForGuestCart
    && (!cartQuery.isError || (token && Boolean(guestFlow.mergeError)));
  const total = items.reduce((sum, item) => {
    const quantity = amount(item, ['qty']) ?? 0;
    const unitPrice = amount(item, ['unit_price']) ?? 0;
    return sum + quantity * unitPrice;
  }, 0);
  const discountTotal = items.reduce((sum, item) => {
    const quantity = amount(item, ['qty']) ?? 0;
    return sum + quantity * (amount(item, ['discount_amount_per_unit']) ?? 0);
  }, 0);
  const mutationPending = updateItem.isPending || removeItem.isPending || clearingAll || guestFlow.isMergingCart;

  async function changeQuantity(item: ReturnType<typeof record>, requestedQuantity: number): Promise<boolean> {
    const id = amount(item, ['id']);
    const minimumQuantity = buyerCartItemMinimumQuantity(item);
    const nextQuantity = nextBuyerCartQuantity(requestedQuantity, 0, minimumQuantity);
    setActionError('');
    if (!token || String(item.id).startsWith('guest-')) {
      const productId = amount(item, ['product_id']);
      if (!productId) return false;
      try {
        await guestFlow.setGuestQuantity(productId, nextQuantity);
        return true;
      } catch (error) {
        setActionError(messageOf(error));
        return false;
      }
    }
    if (!id) return false;
    try {
      await updateItem.mutateAsync({ item: id, data: { qty: nextQuantity } });
      await queryClient.invalidateQueries({ queryKey: getGetBuyerCartQueryKey() });
      return true;
    } catch (error) {
      setActionError(messageOf(error));
      return false;
    }
  }

  async function deleteItem(item: ReturnType<typeof record>) {
    if (!token || String(item.id).startsWith('guest-')) {
      const productId = amount(item, ['product_id']);
      if (!productId) return;
      setActionError('');
      try {
        await guestFlow.removeGuestProduct(productId);
      } catch (error) {
        setActionError(messageOf(error));
      }
      return;
    }
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
    if (!token || items.every(item => String(item.id).startsWith('guest-'))) {
      try {
        await guestFlow.clearGuestCart();
        setClearAllConfirm(false);
      } catch (error) {
        setActionError(messageOf(error));
      }
      return;
    }
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

  return (
    <Screen title="Your cart" subtitle={`${items.length} ${items.length === 1 ? 'product' : 'products'} in your cart`} refreshable>
      {actionError ? <Text accessibilityRole="alert" style={{ color: colors.destructive, marginBottom: 12 }}>{actionError}</Text> : null}
      {token && (cartQuery.isLoading || waitingForGuestCart) ? <LoadingCard label={waitingForGuestCart ? 'Preparing your saved cart…' : 'Loading your cart…'} /> : null}
      {!token && items.length > 0 ? (
        <Card style={{ padding: 13, marginBottom: 12 }}>
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>Your cart is saved on this device.</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 16, marginTop: 4 }}>You can browse and prepare your request now. Sign in or register only when you submit it.</Text>
        </Card>
      ) : null}
      {token && guestFlow.mergeError ? (
        <Action title="Retry cart sync" icon="refresh-cw" secondary onPress={() => void guestFlow.mergeGuestCart()} testID="buyer-cart-retry-merge" />
      ) : null}
      {cartQuery.isError ? <ErrorState message="Your cart could not be loaded." error={cartQuery.error} onRetry={() => void cartQuery.refetch()} /> : null}
      {canRenderCart && items.length === 0 ? (
        <>
          <EmptyState title="Your cart is empty" body="Browse the approved product catalogue and add products to start an order." icon="shopping-cart" />
          <Action title="Browse products" icon="grid" secondary onPress={() => router.push('/(buyer-tabs)/buyer-products')} testID="buyer-cart-browse-empty" />
        </>
      ) : null}

      {canRenderCart && items.map((item, index) => {
        const product = record(item.product);
        const itemId = first(item, ['id'], `item-${index}`);
        const minimumQuantity = buyerCartItemMinimumQuantity(item);
        const quantity = amount(item, ['qty']) ?? minimumQuantity;
        const unitPrice = amount(item, ['unit_price']) ?? 0;
        const name = first(product, ['name'], first(item, ['product_name'], 'Export product'));
        const imagePath = first(
          product,
          ['image_url', 'imageUrl', 'image_path', 'imagePath'],
          first(item, ['product_image_url', 'productImageUrl']),
        );
        const subtotal = quantity * unitPrice;
        return (
          <Card key={itemId} testID={`buyer-cart-item-${itemId}`} style={{ padding: 16, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <CartThumbnail uri={imagePath} label={name} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 5 }}>
                  <Text style={{ flex: 1, color: colors.foreground, fontSize: 14, lineHeight: 19, fontWeight: '700' }}>{name}</Text>
                  <Pressable
                    testID={`buyer-cart-remove-${itemId}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${name} from cart`}
                    disabled={mutationPending || Boolean(guestFlow.mergeError)}
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
                <View style={{ marginTop: 7 }}>
                  <BuyerProductPrice product={item} compact />
                </View>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                <CartQuantityControl
                  key={`${itemId}:${quantity}`}
                  itemId={itemId}
                  name={name}
                  quantity={quantity}
                  minimumQuantity={minimumQuantity}
                  disabled={mutationPending || Boolean(guestFlow.mergeError)}
                  colors={colors}
                  onChangeQuantity={nextQuantity => changeQuantity(item, nextQuantity)}
                />
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
            {discountTotal > 0 ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -6, marginBottom: 12 }}>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>Product discounts saved</Text>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>−{formatFobPrice(discountTotal, cartCurrency)}</Text>
              </View>
            ) : null}
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
