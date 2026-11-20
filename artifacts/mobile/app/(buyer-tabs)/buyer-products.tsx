import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { Action, Card, EmptyState, ErrorState, Field, LoadingCard, Screen } from '@/components/InvestorUI';
import { useColors } from '@/hooks/useColors';
import { useAddBuyerCartItem, useGetProductCategories, useGetProducts, getGetBuyerCartQueryKey } from '@workspace/api-client-react';
import { amount, first, list, messageOf, record } from '@/lib/data';
import { categoryName, displayPrice, productMinimumQuantity, rowsFromResponse } from '@/lib/buyer-data';
import { motionHaptic } from '@/lib/motion';

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
  const productsQuery = useGetProducts({ per_page: 50 }, { query: { staleTime: 60_000 } });
  const categoriesQuery = useGetProductCategories({ query: { staleTime: 300_000 } });
  const addToCart = useAddBuyerCartItem();
  const products = rowsFromResponse(productsQuery.data);
  const categories = categoryOptions(categoriesQuery.data);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [expandedId, setExpandedId] = useState('');
  const [addedId, setAddedId] = useState('');
  const [actionError, setActionError] = useState('');

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

  async function addProduct(product: ReturnType<typeof record>) {
    const productId = amount(product, ['id']);
    if (!productId) {
      setActionError('This product is missing its catalogue ID, so it cannot be added to your cart.');
      return;
    }
    setActionError('');
    try {
      await addToCart.mutateAsync({
        data: { product_id: productId, qty: productMinimumQuantity(product) },
      });
      await queryClient.invalidateQueries({ queryKey: getGetBuyerCartQueryKey() });
      setAddedId(String(productId));
      motionHaptic('success');
    } catch (error) {
      motionHaptic('error');
      setActionError(messageOf(error));
    }
  }

  return (
    <Screen title="Products" subtitle="Approved export products from OG Exports" refreshable>
      <Field label="Search products" value={search} onChangeText={setSearch} placeholder="Product, category, origin or SKU" />

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
        const name = first(product, ['name'], 'Export product');
        const categoryLabel = categoryName(product);
        const imageUrl = first(product, ['image_url', 'imageUrl']);
        const minOrder = first(product, ['moq', 'min_order'], 'Contact OG Exports');
        const stock = amount(product, ['stock']);
        const description = first(product, ['short_description', 'shortDescription', 'description']);
        const certifications = list(product.certifications).map(value => String(value)).filter(Boolean);
        const isExpanded = expandedId === id;
        const isAdded = addedId === id;

        return (
          <Card key={id} testID={`buyer-product-card-${id}`} style={{ padding: 0, marginBottom: 14 }}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} accessibilityLabel={`${name} product image`} resizeMode="cover" style={{ height: 168, width: '100%', backgroundColor: colors.secondary }} />
            ) : (
              <View style={{ height: 112, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary }}>
                <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>OG Exports product</Text>
              </View>
            )}
            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <Text style={{ color: colors.accentForeground, backgroundColor: colors.glassTintGold, overflow: 'hidden', borderRadius: 12, paddingVertical: 5, paddingHorizontal: 9, fontSize: 10, fontWeight: '700' }}>
                  {categoryLabel}
                </Text>
                {product.featured === true ? <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>Featured</Text> : null}
              </View>
              <Text style={{ color: colors.foreground, fontSize: 18, lineHeight: 23, fontWeight: '700', marginTop: 10 }}>{name}</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>
                {first(product, ['origin'], 'Origin not specified')}
                {first(product, ['sku']) ? ` · ${first(product, ['sku'])}` : ''}
              </Text>
              {description ? <Text numberOfLines={isExpanded ? undefined : 3} style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 19, marginTop: 10 }}>{description}</Text> : null}
              {isExpanded ? (
                <View style={{ borderTopWidth: 1, borderTopColor: colors.border, marginTop: 13, paddingTop: 12, gap: 7 }}>
                  <Text style={{ color: colors.foreground, fontSize: 12 }}>MOQ: {minOrder}</Text>
                  {first(product, ['lead_time']) ? <Text style={{ color: colors.foreground, fontSize: 12 }}>Lead time: {first(product, ['lead_time'])}</Text> : null}
                  {first(product, ['incoterms']) ? <Text style={{ color: colors.foreground, fontSize: 12 }}>Incoterms: {first(product, ['incoterms'])}</Text> : null}
                  {certifications.length ? <Text style={{ color: colors.foreground, fontSize: 12 }}>Certifications: {certifications.join(', ')}</Text> : null}
                  {first(product, ['shelf_life']) ? <Text style={{ color: colors.foreground, fontSize: 12 }}>Shelf life: {first(product, ['shelf_life'])}</Text> : null}
                  {stock !== null ? <Text style={{ color: colors.foreground, fontSize: 12 }}>{stock > 0 ? 'Available stock' : 'Stock'}: {stock}</Text> : null}
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 14, marginBottom: 14 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.mutedForeground, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.7 }}>FOB price</Text>
                  <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '700', marginTop: 3 }}>{displayPrice(product)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: colors.mutedForeground, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.7 }}>Minimum order</Text>
                  <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600', marginTop: 3 }}>{minOrder}</Text>
                </View>
              </View>
              <Pressable
                testID={`buyer-product-details-${id}`}
                accessibilityRole="button"
                accessibilityState={{ expanded: isExpanded }}
                onPress={() => setExpandedId(isExpanded ? '' : id)}
                style={{ alignSelf: 'flex-start', paddingVertical: 8, paddingRight: 8, marginBottom: 8 }}
              >
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>{isExpanded ? 'Hide details' : 'View details'}</Text>
              </Pressable>
              <Action
                title={isAdded ? 'Added to cart' : addToCart.isPending ? 'Adding…' : 'Add to cart'}
                icon={isAdded ? 'check' : 'shopping-cart'}
                disabled={addToCart.isPending}
                loading={addToCart.isPending}
                onPress={() => void addProduct(product)}
                testID={`buyer-product-add-${id}`}
              />
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}
