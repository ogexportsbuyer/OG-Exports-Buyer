import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { EmptyState, ErrorState, Field, LoadingCard, Screen } from '@/components/InvestorUI';
import { BuyerProductCard } from '@/components/BuyerProductCard';
import { BuyerProductFilterSheet } from '@/components/BuyerProductFilterSheet';
import { useColors } from '@/hooks/useColors';
import { useAddBuyerCartItem, useGetProductCategories, useGetProducts, getGetBuyerCartQueryKey, getGetProductCategoriesQueryKey, getGetProductsQueryKey } from '@workspace/api-client-react';
import { amount, first, messageOf, record } from '@/lib/data';
import { productMinimumQuantity, rowsFromResponse } from '@/lib/buyer-data';
import { buyerCartRouteAfterProductAdd, claimPendingBuyerProduct, pendingProductAuthReturnTo } from '@/lib/buyer-auth-flow';
import {
  buyerProductFilterCount,
  emptyBuyerProductFilters,
  filterBuyerProducts,
  filtersFromBuyerCategoryRoute,
  type BuyerProductFilterState,
} from '@/lib/buyer-product-filters';
import { motionHaptic } from '@/lib/motion';
import { useAuth } from '@/context/AuthContext';

export default function BuyerProducts() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const { ready, token, apiOrigin, user } = useAuth();
  const userId = first(record(user), ['id'], 'guest');
  const favoritesKey = `buyer-product-favourites:${userId}`;
  const { category: routeCategory, search: routeSearch, pendingProduct: routePendingProduct } = useLocalSearchParams<{
    category?: string | string[];
    search?: string | string[];
    pendingProduct?: string | string[];
  }>();
  const initialCategory = Array.isArray(routeCategory) ? routeCategory[0] : routeCategory;
  const initialSearch = Array.isArray(routeSearch) ? routeSearch[0] : routeSearch;
  const pendingProduct = Array.isArray(routePendingProduct) ? routePendingProduct[0] : routePendingProduct;
  const catalogEnabled = ready && !!apiOrigin;
  const productsQuery = useGetProducts({ per_page: 100 }, { query: { queryKey: getGetProductsQueryKey({ per_page: 100 }), enabled: catalogEnabled, retry: false, staleTime: 60_000 } });
  const categoriesQuery = useGetProductCategories({ query: { queryKey: getGetProductCategoriesQueryKey(), enabled: catalogEnabled, retry: false, staleTime: 300_000 } });
  const addToCart = useAddBuyerCartItem();
  const products = rowsFromResponse(productsQuery.data);
  const apiCategories = rowsFromResponse(categoriesQuery.data);
  const [search, setSearch] = useState(initialSearch || '');
  const [filters, setFilters] = useState<BuyerProductFilterState>(() => ({
    ...emptyBuyerProductFilters(),
    ...filtersFromBuyerCategoryRoute(initialCategory || ''),
  }));
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [filterSession, setFilterSession] = useState(0);
  const [addedId, setAddedId] = useState('');
  const [actionError, setActionError] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const autoAddHandled = useRef('');

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
    if (!initialCategory) return;
    setFilters(current => ({ ...current, ...filtersFromBuyerCategoryRoute(initialCategory) }));
  }, [initialCategory]);

  useEffect(() => {
    if (initialSearch) setSearch(initialSearch);
  }, [initialSearch]);

  const filteredProducts = useMemo(
    () => filterBuyerProducts(products, filters, search),
    [filters, products, search],
  );
  const activeFilterCount = buyerProductFilterCount(filters);

  const activeFilterChips: { label: string; clear: () => void }[] = [];
  if (filters.category) activeFilterChips.push({ label: filters.category, clear: () => setFilters(current => ({ ...current, category: '', subcategory: '' })) });
  if (filters.subcategory) activeFilterChips.push({ label: filters.subcategory, clear: () => setFilters(current => ({ ...current, subcategory: '' })) });
  if (filters.productType) activeFilterChips.push({ label: filters.productType, clear: () => setFilters(current => ({ ...current, productType: '' })) });
  if (filters.origin) activeFilterChips.push({ label: filters.origin, clear: () => setFilters(current => ({ ...current, origin: '' })) });
  if (filters.supplierLocation) activeFilterChips.push({ label: `Supplier: ${filters.supplierLocation}`, clear: () => setFilters(current => ({ ...current, supplierLocation: '' })) });
  if (filters.moqMinMt) activeFilterChips.push({ label: `MOQ ≥ ${filters.moqMinMt} MT`, clear: () => setFilters(current => ({ ...current, moqMinMt: '' })) });
  if (filters.capacityMinMt || filters.capacityMaxMt) activeFilterChips.push({ label: `Capacity ${filters.capacityMinMt || '0'}–${filters.capacityMaxMt || '∞'} MT`, clear: () => setFilters(current => ({ ...current, capacityMinMt: '', capacityMaxMt: '' })) });
  if (filters.priceMin || filters.priceMax) activeFilterChips.push({ label: `FOB ${filters.priceMin || '0'}–${filters.priceMax || '∞'} ${filters.currency}`, clear: () => setFilters(current => ({ ...current, priceMin: '', priceMax: '' })) });
  if (filters.currency) activeFilterChips.push({ label: filters.currency, clear: () => setFilters(current => ({ ...current, currency: '' })) });
  if (filters.tradeTerm) activeFilterChips.push({ label: filters.tradeTerm, clear: () => setFilters(current => ({ ...current, tradeTerm: '' })) });
  if (filters.packaging) activeFilterChips.push({ label: filters.packaging, clear: () => setFilters(current => ({ ...current, packaging: '' })) });
  if (filters.qualityGrade) activeFilterChips.push({ label: filters.qualityGrade, clear: () => setFilters(current => ({ ...current, qualityGrade: '' })) });
  if (filters.specification) activeFilterChips.push({ label: `Spec: ${filters.specification}`, clear: () => setFilters(current => ({ ...current, specification: '' })) });
  if (filters.certification) activeFilterChips.push({ label: filters.certification, clear: () => setFilters(current => ({ ...current, certification: '' })) });
  if (filters.supplierType) activeFilterChips.push({ label: filters.supplierType, clear: () => setFilters(current => ({ ...current, supplierType: '' })) });
  if (filters.availability) activeFilterChips.push({ label: filters.availability, clear: () => setFilters(current => ({ ...current, availability: '' })) });
  if (filters.shipmentMethod) activeFilterChips.push({ label: filters.shipmentMethod, clear: () => setFilters(current => ({ ...current, shipmentMethod: '' })) });
  if (filters.customPackagingOnly) activeFilterChips.push({ label: 'Custom packaging', clear: () => setFilters(current => ({ ...current, customPackagingOnly: false })) });
  if (filters.privateLabelOnly) activeFilterChips.push({ label: 'Private label', clear: () => setFilters(current => ({ ...current, privateLabelOnly: false })) });
  if (filters.verifiedSupplierOnly) activeFilterChips.push({ label: 'Verified supplier', clear: () => setFilters(current => ({ ...current, verifiedSupplierOnly: false })) });

  const addProduct = useCallback(async (product: ReturnType<typeof record>): Promise<boolean> => {
    const productId = amount(product, ['id']);
    if (!productId) {
      setActionError('This product is missing its catalogue ID, so it cannot be added to your cart.');
      return false;
    }
    if (!token) {
      const returnTo = pendingProductAuthReturnTo(productId);
      if (!returnTo) {
        setActionError('This product ID cannot be saved while you sign in.');
        return false;
      }
      router.push({
        pathname: '/(auth)/login',
        params: { returnTo },
      });
      return false;
    }
    setActionError('');
    try {
      await addToCart.mutateAsync({
        data: { product_id: productId, qty: productMinimumQuantity(product) },
      });
      await queryClient.invalidateQueries({ queryKey: getGetBuyerCartQueryKey() });
      setAddedId(String(productId));
      motionHaptic('action');
      return true;
    } catch (error) {
      motionHaptic('error');
      setActionError(messageOf(error));
      return false;
    }
  }, [token, addToCart, queryClient]);

  const toggleFavorite = useCallback(async (productId: string) => {
    if (!token) {
      router.push({ pathname: '/(auth)/login', params: { returnTo: '/(buyer-tabs)/buyer-products' } });
      return;
    }
    const next = favoriteIds.includes(productId)
      ? favoriteIds.filter(id => id !== productId)
      : [...favoriteIds, productId];
    setFavoriteIds(next);
    try {
      await AsyncStorage.setItem(favoritesKey, JSON.stringify(next));
      setActionError('');
    } catch {
      setActionError('This product could not be saved to your device favourites.');
    }
  }, [favoriteIds, favoritesKey, token]);

  useEffect(() => {
    if (!ready || !apiOrigin || !token || productsQuery.isLoading || productsQuery.isError) return;
    const pendingId = claimPendingBuyerProduct(pendingProduct, autoAddHandled);
    if (!pendingId) return;
    const id = Number(pendingId);
    const product = products.find(item => amount(item, ['id']) === id);
    if (!product) {
      setActionError('The selected product is no longer in the current catalogue. Choose it again to add it to your cart.');
      return;
    }
    void addProduct(product).then(added => {
      const destination = buyerCartRouteAfterProductAdd(added);
      if (destination) router.replace(destination);
    });
  }, [ready, apiOrigin, token, pendingProduct, productsQuery.isLoading, productsQuery.isError, products, addProduct]);

  return (
    <Screen title="Products" subtitle="Approved export products from OG Exports" refreshable>
      <Field label="Search products" value={search} onChangeText={setSearch} placeholder="Product, category, origin or SKU" />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10 }}>
        <Pressable
          testID="buyer-product-open-filters"
          accessibilityRole="button"
          accessibilityLabel={`Categories and filters${activeFilterCount ? `, ${activeFilterCount} active` : ''}`}
          onPress={() => { setFilterSession(current => current + 1); setFiltersVisible(true); }}
          style={({ pressed }) => ({ flex: 1, minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 14, borderWidth: 1, borderColor: activeFilterCount ? colors.primary : colors.border, backgroundColor: activeFilterCount ? colors.lightGreen : colors.card, opacity: pressed ? 0.82 : 1 })}
        >
          <Feather name="sliders" size={15} color={colors.primary} />
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>Categories & filters</Text>
          {activeFilterCount ? <View style={{ minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }}><Text style={{ color: colors.primaryForeground, fontSize: 9, fontWeight: '900' }}>{activeFilterCount}</Text></View> : null}
        </Pressable>
        {activeFilterCount ? (
          <Pressable testID="buyer-product-clear-filters" accessibilityRole="button" onPress={() => setFilters(emptyBuyerProductFilters())} style={{ minHeight: 42, justifyContent: 'center', paddingHorizontal: 5 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: '700' }}>Clear all</Text>
          </Pressable>
        ) : null}
      </View>
      {activeFilterChips.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingBottom: 11, paddingRight: 12 }}>
          {activeFilterChips.map((chip, index) => (
            <Pressable key={`${chip.label}-${index}`} accessibilityRole="button" accessibilityLabel={`Remove ${chip.label} filter`} onPress={chip.clear} style={{ minHeight: 31, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
              <Text numberOfLines={1} style={{ maxWidth: 150, color: colors.foreground, fontSize: 9, fontWeight: '700' }}>{chip.label}</Text>
              <Feather name="x" size={12} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
      {!productsQuery.isLoading && !productsQuery.isError ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: '700' }}>{filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found</Text>
          {filters.currency || filters.priceMin || filters.priceMax ? <Text style={{ color: colors.accent, fontSize: 9, fontWeight: '800' }}>FOB PRICE FILTER</Text> : null}
        </View>
      ) : null}
      <BuyerProductFilterSheet
        key={filterSession}
        visible={filtersVisible}
        products={products}
        apiCategories={apiCategories}
        search={search}
        initialFilters={filters}
        onClose={() => setFiltersVisible(false)}
        onApply={nextFilters => { setFilters(nextFilters); setFiltersVisible(false); }}
      />
      {token ? (
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/buyer-repeat-orders', params: { view: 'favorites' } })} style={{ minHeight: 39, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, borderRadius: 12, backgroundColor: colors.secondary, marginBottom: 10 }}>
          <Feather name="heart" size={14} color={colors.accent} />
          <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: '700' }}>Saved products · {favoriteIds.length}</Text>
        </Pressable>
      ) : null}

      {!ready ? <LoadingCard label="Connecting to the OG Exports catalogue…" lines={2} /> : null}
      {ready && !apiOrigin ? <ErrorState message="The product catalogue is not connected. Please try again later." /> : null}
      {categoriesQuery.isError ? (
        <Text style={{ color: colors.destructive, fontSize: 12, marginBottom: 12 }}>
          Categories could not be loaded. You can still search all products.
        </Text>
      ) : null}
      {actionError ? (
        <Text accessibilityRole="alert" style={{ color: colors.destructive, fontSize: 13, lineHeight: 19, marginBottom: 12 }}>
          {actionError}
        </Text>
      ) : null}
      {productsQuery.isLoading ? <LoadingCard label="Loading approved products…" /> : null}
      {productsQuery.isError ? (
        <ErrorState message="The product catalogue could not be loaded." error={productsQuery.error} onRetry={() => void productsQuery.refetch()} />
      ) : null}
      {!productsQuery.isLoading && !productsQuery.isError && filteredProducts.length === 0 ? (
        <EmptyState
          title={products.length ? 'No products match your search' : 'No published products yet'}
          body={products.length ? 'Try another search or category.' : 'Approved products published on the OG Exports website will appear here.'}
          icon="package"
        />
      ) : null}

      {filteredProducts.map((product, index) => {
        const id = first(product, ['id'], `product-${index}`);
        const isAdded = addedId === id;

        return (
          <BuyerProductCard
            key={id}
            product={product}
            added={isAdded}
            adding={addToCart.isPending}
            signedIn={!!token}
            favorite={favoriteIds.includes(id)}
            onOpenDetails={() => router.push({ pathname: '/buyer-product/[id]', params: { id } })}
            onAddToCart={() => void addProduct(product)}
            onToggleFavorite={() => void toggleFavorite(id)}
          />
        );
      })}
    </Screen>
  );
}
