import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { EmptyState, ErrorState, Field, LoadingCard, Screen } from '@/components/InvestorUI';
import { BuyerProductCard } from '@/components/BuyerProductCard';
import { useColors } from '@/hooks/useColors';
import { useAddBuyerCartItem, useGetProductCategories, useGetProducts, getGetBuyerCartQueryKey, getGetProductCategoriesQueryKey, getGetProductsQueryKey } from '@workspace/api-client-react';
import { amount, first, list, messageOf, record } from '@/lib/data';
import { categoryName, displayPrice, productMinimumQuantity, rowsFromResponse } from '@/lib/buyer-data';
import { buyerCartRouteAfterProductAdd, claimPendingBuyerProduct, pendingProductAuthReturnTo } from '@/lib/buyer-auth-flow';
import { motionHaptic } from '@/lib/motion';
import { useAuth } from '@/context/AuthContext';

function categoryOptions(response: unknown): string[] {
  const parents = rowsFromResponse(response);
  const names = parents.flatMap(parent => [
    first(parent, ['name']),
    ...list(record(parent).children).map(child => first(child, ['name'])),
  ]).filter(Boolean);
  return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
}

export default function BuyerProducts() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const { ready, token, apiOrigin } = useAuth();
  const { category: routeCategory, search: routeSearch, pendingProduct: routePendingProduct } = useLocalSearchParams<{
    category?: string | string[];
    search?: string | string[];
    pendingProduct?: string | string[];
  }>();
  const initialCategory = Array.isArray(routeCategory) ? routeCategory[0] : routeCategory;
  const initialSearch = Array.isArray(routeSearch) ? routeSearch[0] : routeSearch;
  const pendingProduct = Array.isArray(routePendingProduct) ? routePendingProduct[0] : routePendingProduct;
  const catalogEnabled = ready && !!apiOrigin;
  const productsQuery = useGetProducts({ per_page: 50 }, { query: { queryKey: getGetProductsQueryKey({ per_page: 50 }), enabled: catalogEnabled, retry: false, staleTime: 60_000 } });
  const categoriesQuery = useGetProductCategories({ query: { queryKey: getGetProductCategoriesQueryKey(), enabled: catalogEnabled, retry: false, staleTime: 300_000 } });
  const addToCart = useAddBuyerCartItem();
  const products = rowsFromResponse(productsQuery.data);
  const categories = categoryOptions(categoriesQuery.data);
  const [search, setSearch] = useState(initialSearch || '');
  const [category, setCategory] = useState(initialCategory || 'All');
  const [expandedId, setExpandedId] = useState('');
  const [addedId, setAddedId] = useState('');
  const [actionError, setActionError] = useState('');
  const autoAddHandled = useRef('');

  useEffect(() => {
    if (initialCategory) setCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    if (initialSearch) setSearch(initialSearch);
  }, [initialSearch]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter(product => {
      const productCategory = categoryName(product);
      if (category !== 'All' && productCategory !== category) return false;
      if (!term) return true;
      const searchable = [
        first(product, ['name']),
        productCategory,
        first(product, ['origin']),
        first(product, ['short_description', 'shortDescription']),
        first(product, ['description']),
        first(product, ['sku']),
      ].join(' ').toLowerCase();
      return searchable.includes(term);
    });
  }, [category, products, search]);

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

      {!ready ? <LoadingCard label="Connecting to the OG Exports catalogue…" lines={2} /> : null}
      {ready && !apiOrigin ? <ErrorState message="The product catalogue is not connected. Please try again later." /> : null}
      {categoriesQuery.isError ? (
        <Text style={{ color: colors.destructive, fontSize: 12, marginBottom: 12 }}>
          Categories could not be loaded. You can still search all products.
        </Text>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 12, paddingBottom: 12 }}>
        {['All', ...categories].map(option => {
          const selected = option === category;
          return (
            <Pressable
              key={option}
              testID={`buyer-product-category-${option.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => { motionHaptic('micro'); setCategory(option); }}
              style={{
                minHeight: 38,
                borderRadius: 20,
                paddingHorizontal: 15,
                justifyContent: 'center',
                backgroundColor: selected ? colors.primary : colors.secondary,
                borderWidth: 1,
                borderColor: selected ? colors.primary : colors.border,
              }}
            >
              <Text style={{ color: selected ? colors.primaryForeground : colors.foreground, fontWeight: '600', fontSize: 12 }}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

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
        const isExpanded = expandedId === id;
        const isAdded = addedId === id;

        return (
          <BuyerProductCard
            key={id}
            product={product}
            expanded={isExpanded}
            added={isAdded}
            adding={addToCart.isPending}
            signedIn={!!token}
            onToggleDetails={() => setExpandedId(isExpanded ? '' : id)}
            onAddToCart={() => void addProduct(product)}
          />
        );
      })}
    </Screen>
  );
}
