import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { Card, EmptyState, ErrorState, LoadingCard, Screen } from '@/components/InvestorUI';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import {
  getGetBuyerCartQueryKey,
  getGetProductsQueryKey,
  useAddBuyerCartItem,
  useGetProducts,
} from '@workspace/api-client-react';
import { amount, first, messageOf, record } from '@/lib/data';
import { categoryName, displayPrice, productMinimumQuantity, rowsFromResponse } from '@/lib/buyer-data';
import { buyerProductSpecs, buyerProductValues } from '@/lib/buyer-product-data';
import { pendingProductAuthReturnTo } from '@/lib/buyer-auth-flow';
import { motionHaptic } from '@/lib/motion';

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <Card style={{ marginTop: 12, padding: 16, borderRadius: 20 }}>
      <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800', marginBottom: 10 }}>{title}</Text>
      {children}
    </Card>
  );
}

function DetailRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  const colors = useColors();
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 14,
      paddingVertical: 10,
      borderBottomWidth: last ? 0 : 1,
      borderBottomColor: colors.border,
    }}>
      <Text style={{ flex: 1, color: colors.mutedForeground, fontSize: 12, lineHeight: 17 }}>{label}</Text>
      <Text style={{ flex: 1.2, color: colors.foreground, fontSize: 12, lineHeight: 17, fontWeight: '600', textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

function ValueSection({ title, values }: { title: string; values: string[] }) {
  const colors = useColors();
  if (!values.length) return null;
  return (
    <DetailSection title={title}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
        {values.map((value, index) => (
          <View key={`${value}-${index}`} style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.secondary,
            paddingHorizontal: 10,
            paddingVertical: 7,
          }}>
            <Text style={{ color: colors.foreground, fontSize: 10, lineHeight: 14, fontWeight: '600' }}>{value}</Text>
          </View>
        ))}
      </View>
    </DetailSection>
  );
}

export default function BuyerProductDetails() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const { ready, token, apiOrigin, user } = useAuth();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const numericId = Number(rawId);
  const validId = !!rawId && /^\d+$/.test(rawId) && Number.isSafeInteger(numericId) && numericId > 0;
  const catalogEnabled = ready && !!apiOrigin && validId;
  const productsQuery = useGetProducts({ per_page: 100 }, {
    query: {
      queryKey: getGetProductsQueryKey({ per_page: 100 }),
      enabled: catalogEnabled,
      retry: false,
      staleTime: 60_000,
    },
  });
  const products = rowsFromResponse(productsQuery.data);
  const product = useMemo(
    () => validId ? products.find(item => amount(item, ['id']) === numericId) ?? null : null,
    [numericId, products, validId],
  );
  const [imageFailed, setImageFailed] = useState(false);
  const [added, setAdded] = useState(false);
  const [actionError, setActionError] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const productId = product ? String(amount(product, ['id']) ?? numericId) : String(numericId);
  const favoritesKey = `buyer-product-favourites:${first(record(user), ['id'], 'guest')}`;
  const addToCart = useAddBuyerCartItem();
  const name = product ? first(product, ['name'], 'Export product') : 'Product details';
  const imageUrl = product ? first(product, ['image_url', 'imageUrl']) : '';
  const summary = product
    ? first(product, ['short_description', 'shortDescription', 'description'])
    : '';
  const fullDescription = product
    ? first(product, ['description'], summary)
    : '';
  const specs = product ? buyerProductSpecs(product) : [];
  const certifications = product ? buyerProductValues(product, 'certifications') : [];
  const paymentTerms = product ? buyerProductValues(product, 'payment_terms') : [];
  const deliveryTerms = product ? buyerProductValues(product, 'delivery_terms') : [];
  const packaging = product ? buyerProductValues(product, 'packaging_options') : [];
  const exportMarkets = product ? buyerProductValues(product, 'export_markets') : [];
  const additionalDetails = product
    ? ([
      ['HS code', first(product, ['hs_code'])],
      ['Shelf life', first(product, ['shelf_life'])],
      ['Storage', first(product, ['storage_instructions'])],
      ['Lead time', first(product, ['lead_time'])],
    ] as [string, string][]).filter(([, value]) => value)
    : [];
  const favorite = favoriteIds.includes(productId);

  useEffect(() => {
    let active = true;
    setFavoriteIds([]);
    AsyncStorage.getItem(favoritesKey).then(value => {
      if (!active || !value) return;
      try {
        const saved: unknown = JSON.parse(value);
        if (Array.isArray(saved)) setFavoriteIds(saved.filter((id): id is string => typeof id === 'string'));
      } catch {
        setFavoriteIds([]);
      }
    }).catch(() => setFavoriteIds([]));
    return () => { active = false; };
  }, [favoritesKey]);

  useEffect(() => {
    setImageFailed(false);
    setAdded(false);
    setActionError('');
  }, [productId]);

  async function handleAddToCart() {
    if (!product) return;
    const id = amount(product, ['id']);
    if (!id) {
      setActionError('This product is missing its catalogue ID, so it cannot be added to your cart.');
      return;
    }
    if (!token) {
      const returnTo = pendingProductAuthReturnTo(id);
      if (!returnTo) {
        setActionError('This product cannot be saved while you sign in. Please return to the catalogue and try again.');
        return;
      }
      router.push({ pathname: '/(auth)/login', params: { returnTo } });
      return;
    }
    setActionError('');
    try {
      await addToCart.mutateAsync({ data: { product_id: id, qty: productMinimumQuantity(product) } });
      await queryClient.invalidateQueries({ queryKey: getGetBuyerCartQueryKey() });
      setAdded(true);
      motionHaptic('action');
    } catch (error) {
      motionHaptic('error');
      setActionError(messageOf(error));
    }
  }

  async function handleToggleFavorite() {
    if (!product) return;
    if (!token) {
      router.push({ pathname: '/(auth)/login', params: { returnTo: '/(buyer-tabs)/buyer-products' } });
      return;
    }
    const next = favorite
      ? favoriteIds.filter(id => id !== productId)
      : [...favoriteIds, productId];
    setFavoriteIds(next);
    try {
      await AsyncStorage.setItem(favoritesKey, JSON.stringify(next));
      setActionError('');
    } catch {
      setActionError('This product could not be saved to your device favourites.');
    }
  }

  return (
    <Screen title="Product details" hideHeader refreshable>
      {!ready ? <LoadingCard label="Connecting to the OG Exports catalogue…" lines={2} /> : null}
      {ready && !apiOrigin ? <ErrorState message="The product catalogue is not connected. Please try again later." /> : null}
      {ready && !!apiOrigin && productsQuery.isLoading ? <LoadingCard label="Loading product details…" lines={3} /> : null}
      {productsQuery.isError ? (
        <ErrorState message="Product details could not be loaded." error={productsQuery.error} onRetry={() => void productsQuery.refetch()} />
      ) : null}
      {ready && !!apiOrigin && !productsQuery.isLoading && !productsQuery.isError && !product ? (
        <EmptyState
          title={validId ? 'Product is no longer available' : 'Product not found'}
          body="This item may have been removed from the approved catalogue. Return to Products to choose another export."
          icon="package"
        />
      ) : null}

      {product ? (
        <>
          <View style={{ height: 246, overflow: 'hidden', borderRadius: 24, backgroundColor: colors.secondary }}>
            {imageUrl && !imageFailed ? (
              <Image
                source={{ uri: imageUrl }}
                accessibilityLabel={`${name} product`}
                resizeMode="cover"
                onError={() => setImageFailed(true)}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lightGreen }}>
                <Feather name="package" size={42} color={colors.primary} />
                <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 8 }}>OG Exports product</Text>
              </View>
            )}
            <View style={{ position: 'absolute', top: 13, left: 13, flexDirection: 'row', gap: 7 }}>
              <View style={{ borderRadius: 18, backgroundColor: colors.card, paddingHorizontal: 10, paddingVertical: 6 }}>
                <Text style={{ color: colors.accent, fontSize: 10, fontWeight: '800' }}>{categoryName(product)}</Text>
              </View>
              {first(product, ['status']).toLowerCase() === 'approved' ? (
                <View style={{ borderRadius: 18, backgroundColor: colors.statusSuccessBackground, paddingHorizontal: 10, paddingVertical: 6 }}>
                  <Text style={{ color: colors.statusSuccess, fontSize: 10, fontWeight: '800' }}>OG approved</Text>
                </View>
              ) : null}
            </View>
            <Pressable
              testID={`buyer-product-detail-favorite-${productId}`}
              accessibilityRole="button"
              accessibilityLabel={favorite ? `Remove ${name} from saved products` : `Save ${name}`}
              accessibilityState={{ selected: favorite }}
              onPress={() => void handleToggleFavorite()}
              style={({ pressed }) => ({
                position: 'absolute',
                top: 12,
                right: 12,
                width: 42,
                height: 42,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 21,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: pressed ? 0.78 : 1,
              })}
            >
              <Feather name="heart" size={18} color={favorite ? colors.accent : colors.foreground} />
            </Pressable>
          </View>

          <View style={{ marginTop: 17 }}>
            <Text style={{ color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>
              OG Exports · Product catalogue
            </Text>
            <Text style={{ color: colors.foreground, fontSize: 25, lineHeight: 31, fontWeight: '800', marginTop: 6 }}>{name}</Text>
            {first(product, ['origin']) ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 7 }}>
                <Feather name="map-pin" size={13} color={colors.mutedForeground} />
                <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Origin: {first(product, ['origin'])}</Text>
              </View>
            ) : null}
            {first(product, ['sku']) ? (
              <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 5 }}>Product code: {first(product, ['sku'])}</Text>
            ) : null}
            {summary ? (
              <Text numberOfLines={4} style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 20, marginTop: 12 }}>{summary}</Text>
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <Card style={{ flex: 1, marginBottom: 0, padding: 14, borderRadius: 18, backgroundColor: colors.glassTintGold }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 }}>FOB PRICE</Text>
              <Text style={{ color: colors.primary, fontSize: 16, lineHeight: 21, fontWeight: '800', marginTop: 5 }}>{displayPrice(product)}</Text>
            </Card>
            <Card style={{ flex: 1, marginBottom: 0, padding: 14, borderRadius: 18 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 }}>MINIMUM ORDER</Text>
              <Text style={{ color: colors.foreground, fontSize: 13, lineHeight: 19, fontWeight: '700', marginTop: 5 }}>
                {first(product, ['moq', 'min_order'], 'Confirm with our trade desk')}
              </Text>
            </Card>
          </View>

          <View style={{ flexDirection: 'row', gap: 9, marginTop: 14 }}>
            <Pressable
              testID={`buyer-product-detail-add-${productId}`}
              accessibilityRole="button"
              accessibilityState={{ disabled: addToCart.isPending || added, busy: addToCart.isPending }}
              disabled={addToCart.isPending || added}
              onPress={() => void handleAddToCart()}
              style={({ pressed }) => ({
                minHeight: 50,
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderRadius: 15,
                backgroundColor: added ? colors.statusSuccess : colors.buttonBackground,
                opacity: addToCart.isPending ? 0.72 : pressed ? 0.86 : 1,
              })}
            >
              {addToCart.isPending
                ? <ActivityIndicator size="small" color={colors.buttonForeground} />
                : <Feather name={added ? 'check' : 'shopping-cart'} size={16} color={colors.buttonForeground} />}
              <Text style={{ color: colors.buttonForeground, fontSize: 12, fontWeight: '800' }}>
                {addToCart.isPending ? 'Adding…' : added ? 'Added to cart' : token ? 'Add to cart' : 'Sign in to add'}
              </Text>
            </Pressable>
            {added ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/(buyer-tabs)/buyer-cart')}
                style={({ pressed }) => ({
                  minHeight: 50,
                  paddingHorizontal: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 15,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: '700' }}>View cart</Text>
              </Pressable>
            ) : null}
          </View>
          {actionError ? (
            <Text accessibilityRole="alert" style={{ color: colors.destructive, fontSize: 12, lineHeight: 18, marginTop: 10 }}>
              {actionError}
            </Text>
          ) : null}

          {fullDescription && fullDescription !== summary ? (
            <DetailSection title="Product overview">
              <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 19 }}>{fullDescription}</Text>
            </DetailSection>
          ) : null}

          {specs.length ? (
            <DetailSection title="Complete specifications">
              {specs.map((spec, index) => (
                <DetailRow key={`${spec.label}-${index}`} label={spec.label} value={spec.value} last={index === specs.length - 1} />
              ))}
            </DetailSection>
          ) : null}

          <ValueSection title="Certifications" values={certifications} />
          <ValueSection title="Payment terms" values={paymentTerms} />
          <ValueSection title="Delivery terms" values={deliveryTerms} />
          <ValueSection title="Packaging options" values={packaging} />
          <ValueSection title="Active export markets" values={exportMarkets} />

          {additionalDetails.length ? (
            <DetailSection title="Additional product information">
              {additionalDetails.map(([label, value], index) => (
                <DetailRow key={label} label={label} value={value} last={index === additionalDetails.length - 1} />
              ))}
            </DetailSection>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}
