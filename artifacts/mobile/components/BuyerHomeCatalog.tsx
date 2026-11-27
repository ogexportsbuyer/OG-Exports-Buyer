import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { Card, EmptyState, ErrorState, LoadingCard } from '@/components/InvestorUI';
import { BuyerProductPrice } from '@/components/BuyerProductPrice';
import { BuyerProductImage } from '@/components/BuyerProductImage';
import { useColors } from '@/hooks/useColors';
import { first, record } from '@/lib/data';
import { categoryName, displayPrice, rowsFromResponse } from '@/lib/buyer-data';
import { buyerHomeCategoryProducts } from '@/lib/buyer-product-filters';

type Product = ReturnType<typeof rowsFromResponse>[number];

type Props = {
  products: Product[];
  categories: string[];
  selectedOrigin: string;
  onSelectOrigin: (origin: string) => void;
  onBrowse: (searchTerm?: string) => void;
  onSelectProduct: (productId: string) => void;
  onSelectCategory: (category: string) => void;
  productsLoading: boolean;
  productsError: boolean;
  productsErrorValue?: unknown;
  onRetryProducts: () => void;
  categoriesLoading: boolean;
  categoriesError: boolean;
  categoriesErrorValue?: unknown;
  onRetryCategories: () => void;
  connectionReady: boolean;
  isCatalogConfigured: boolean;
};

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.7,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    marginTop: 4,
    fontFamily: 'serif',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '400',
    letterSpacing: -0.4,
  },
  textAction: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  originRow: {
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  originChip: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderRadius: 18,
  },
  originLabel: {
    fontSize: 10,
  },
  recommendationRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  recommendationImage: {
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  recommendationBody: {
    paddingHorizontal: 8,
    paddingTop: 7,
    paddingBottom: 9,
  },
  recommendationCategory: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  recommendationName: {
    minHeight: 27,
    marginTop: 3,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
  },
  recommendationPrice: {
    marginTop: 4,
    fontSize: 9,
    fontWeight: '800',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    paddingBottom: 10,
  },
  landscapeCard: {
    flexDirection: 'row',
    minHeight: 136,
    overflow: 'hidden',
  },
  landscapeImage: {
    minHeight: 136,
    overflow: 'hidden',
  },
  landscapeBody: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  productBody: {
    paddingHorizontal: 10,
    paddingTop: 9,
    paddingBottom: 11,
  },
  productCategory: {
    minHeight: 12,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  productName: {
    minHeight: 32,
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  productOrigin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  productPrice: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '800',
  },
  productMoq: {
    marginTop: 3,
    fontSize: 9,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  categoryImage: {
    height: 125,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 12,
  },
  categoryCaption: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 5,
    paddingHorizontal: 10,
    paddingBottom: 9,
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 14,
  },
  supportIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
});

export default function BuyerHomeCatalog({
  products,
  categories,
  selectedOrigin,
  onSelectOrigin,
  onBrowse,
  onSelectProduct,
  onSelectCategory,
  productsLoading,
  productsError,
  productsErrorValue,
  onRetryProducts,
  categoriesLoading,
  categoriesError,
  categoriesErrorValue,
  onRetryCategories,
  connectionReady,
  isCatalogConfigured,
}: Props) {
  const colors = useColors();
  const { width: windowWidth } = useWindowDimensions();
  const origins = useMemo(
    () => ['Global', ...Array.from(new Set(products.map(product => first(product, ['origin'])).filter(Boolean)))],
    [products],
  );
  const categorySections = useMemo(
    () => buyerHomeCategoryProducts(products, categories.map(name => ({ name }))),
    [categories, products],
  );
  const filteredProducts = selectedOrigin === 'Global'
    ? products
    : products.filter(product => first(product, ['origin']) === selectedOrigin);
  const productGridCardWidth = Math.min(224, (windowWidth - 54) / 2);
  const landscapeCardWidth = Math.max(0, Math.min(620, windowWidth - 40));

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -20 }}
        contentContainerStyle={styles.originRow}
      >
        {origins.map(origin => {
          const active = selectedOrigin === origin;
          return (
            <Pressable
              key={origin}
              testID={`buyer-home-origin-${origin.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onSelectOrigin(origin)}
              style={({ pressed }) => [styles.originChip, {
                borderColor: active ? colors.primary : colors.border,
                backgroundColor: active ? colors.lightGreen : colors.card,
                opacity: pressed ? 0.8 : 1,
              }]}
            >
              <Feather name={origin === 'Global' ? 'globe' : 'map-pin'} size={12} color={active ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.originLabel, { color: active ? colors.primary : colors.mutedForeground, fontWeight: active ? '700' : '500' }]}>{origin}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {!productsLoading && !productsError && filteredProducts.length > 0 ? (
        <>
          <View style={[styles.sectionHeader, { marginTop: 8, marginBottom: 12 }]}>
            <View>
              <Text style={[styles.eyebrow, { color: colors.accentText }]}>OG EXPORTS CATALOGUE</Text>
              <Text style={[styles.sectionTitle, { color: colors.foreground, fontSize: 20, lineHeight: 24 }]}>Products to explore</Text>
            </View>
            <Pressable
              testID="buyer-home-products-all"
              accessibilityRole="button"
              onPress={() => onBrowse()}
              style={styles.textAction}
            >
              <Text style={{ color: colors.foreground, fontSize: 10, fontWeight: '700' }}>Browse all</Text>
              <Feather name="arrow-up-right" size={13} color={colors.accent} />
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -20 }}
            contentContainerStyle={styles.recommendationRow}
          >
            {filteredProducts.slice(0, 6).map((product, index) => {
              const id = first(product, ['id'], `recommendation-${index}`);
              const image = first(product, ['image_url', 'imageUrl']);
              const name = first(product, ['name'], 'Export product');
              return (
                <Pressable
                  key={id}
                  testID={`buyer-home-recommendation-${id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`View ${name}, ${displayPrice(product)}`}
                  onPress={() => id.startsWith('recommendation-') ? onBrowse(name) : onSelectProduct(id)}
                  style={({ pressed }) => ({ width: 112, opacity: pressed ? 0.86 : 1 })}
                >
                  <Card style={{ width: 112, padding: 0, overflow: 'hidden', borderRadius: colors.radius + 2, marginBottom: 0 }}>
                    <View style={[styles.recommendationImage, { backgroundColor: colors.secondary }]}>
                      <BuyerProductImage uri={image} label={`${name} product`} style={StyleSheet.absoluteFill} priority="low" />
                    </View>
                    <View style={styles.recommendationBody}>
                      <Text numberOfLines={1} style={[styles.recommendationCategory, { color: colors.accentText }]}>
                        {categoryName(product)}
                      </Text>
                      <Text numberOfLines={2} style={[styles.recommendationName, { color: colors.foreground }]}>{name}</Text>
                      <View style={{ marginTop: 4 }}>
                        <BuyerProductPrice product={product} compact />
                      </View>
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      ) : null}

      {productsLoading ? <LoadingCard label="Loading products…" /> : null}
      {productsError ? (
        <ErrorState message="Recommended products could not be loaded." error={productsErrorValue} onRetry={onRetryProducts} />
      ) : null}
      {!productsLoading && !productsError && products.length === 0 ? (
        <EmptyState title="No products published" body="Approved products published by OG Exports will appear here." icon="package" />
      ) : null}
      {!productsLoading && !productsError && products.length > 0 && filteredProducts.length === 0 ? (
        <EmptyState title={`No products from ${selectedOrigin}`} body="Choose another origin to explore the current catalogue." icon="package" />
      ) : null}

      <View style={[styles.sectionHeader, { marginTop: 12, marginBottom: 12 }]}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.accentText }]}>Browse by trade</Text>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Explore categories</Text>
        </View>
        <Pressable
          testID="buyer-home-categories-all"
          accessibilityRole="button"
          onPress={() => onBrowse()}
          style={styles.textAction}
        >
          <Text style={{ color: colors.foreground, fontSize: 10, fontWeight: '700' }}>See all</Text>
          <Feather name="arrow-up-right" size={13} color={colors.accent} />
        </Pressable>
      </View>
      {!connectionReady ? <LoadingCard label="Connecting to the OG Exports catalogue…" lines={2} /> : null}
      {connectionReady && !isCatalogConfigured ? <ErrorState message="The product catalogue is not connected. Please try again later." /> : null}
      {categoriesLoading ? <LoadingCard label="Loading categories…" lines={2} /> : null}
      {categoriesError ? (
        <ErrorState message="Product categories could not be loaded." error={categoriesErrorValue} onRetry={onRetryCategories} />
      ) : null}
      {!categoriesLoading && !categoriesError && categorySections.length === 0 ? (
        <EmptyState title="No products in categories yet" body="Published products will appear in their matching category here." icon="grid" />
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={styles.categoryRow}>
        {categorySections.map(categorySection => {
          const { name: category } = categorySection;
          const categoryProduct = categorySection.products[0];
          const image = categoryProduct ? first(categoryProduct, ['image_url', 'imageUrl']) : '';
          return (
            <Pressable
              key={category}
              testID={`buyer-home-category-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
              accessibilityRole="button"
              accessibilityLabel={`Browse ${category}`}
              onPress={() => onSelectCategory(category)}
              style={({ pressed }) => ({ width: 137, opacity: pressed ? 0.84 : 1 })}
            >
              <View style={[styles.categoryImage, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                  <BuyerProductImage uri={image} label={`${category} product`} fallbackIcon="grid" style={StyleSheet.absoluteFill} priority="low" />
                <LinearGradient
                  colors={['transparent', colors.splashEnd] as const}
                  start={{ x: 0, y: 0.15 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.categoryCaption}>
                  <Text numberOfLines={2} style={{ flex: 1, color: colors.splashText, fontSize: 10, lineHeight: 13, fontWeight: '700' }}>{category}</Text>
                  <Feather name="arrow-up-right" size={13} color={colors.accentForeground} />
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {categorySections.map((section, sectionIndex) => {
        const categorySlug = section.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        return (
          <View
            key={section.name}
            testID={`buyer-home-category-products-${categorySlug}`}
            style={{ marginTop: sectionIndex === 0 ? 2 : 14 }}
          >
            <View style={[styles.sectionHeader, { marginBottom: 10 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.eyebrow, { color: colors.accentText }]}>OG EXPORTS CATALOGUE</Text>
                <Text numberOfLines={2} style={[styles.sectionTitle, { color: colors.foreground, fontSize: 19, lineHeight: 23 }]}>
                  {section.name}
                </Text>
              </View>
              <Pressable
                testID={`buyer-home-category-browse-${categorySlug}`}
                accessibilityRole="button"
                accessibilityLabel={`Browse all ${section.name} products`}
                onPress={() => onSelectCategory(section.name)}
                style={styles.textAction}
              >
                <Text style={{ color: colors.foreground, fontSize: 10, fontWeight: '700' }}>View all</Text>
                <Feather name="arrow-up-right" size={13} color={colors.accent} />
              </Pressable>
            </View>
            <View style={section.products.length === 1 ? { alignItems: 'flex-start' } : styles.productGrid}>
              {section.products.map((product, index) => {
                const productId = first(product, ['id'], `${categorySlug}-${index}`);
                const landscape = section.products.length === 1;
                return (
                  <HomeProductCard
                    key={`${section.name}-${productId}`}
                    product={product}
                    index={index}
                    width={landscape ? landscapeCardWidth : productGridCardWidth}
                    layout={landscape ? 'landscape' : 'grid'}
                    testID={`buyer-home-category-product-${categorySlug}-${productId}`}
                    onBrowse={onBrowse}
                    onSelectProduct={onSelectProduct}
                  />
                );
              })}
            </View>
          </View>
        );
      })}

      <Card style={{ marginTop: 14, marginBottom: 16, borderRadius: colors.radius + 2 }}>
        <View style={styles.supportRow}>
          <View style={[styles.supportIcon, { backgroundColor: colors.lightGreen }]}>
            <Feather name="message-circle" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '700' }}>A sourcing question?</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: 4 }}>
              Tell our team what you need. We’ll help you find a way forward.
            </Text>
          </View>
          <Pressable
            testID="buyer-home-contact"
            accessibilityRole="button"
            accessibilityLabel="Message OG Exports"
            onPress={() => router.push('/(buyer-tabs)/buyer-messages')}
            hitSlop={8}
            style={({ pressed }) => ({ padding: 5, opacity: pressed ? 0.6 : 1 })}
          >
            <Feather name="arrow-up-right" size={18} color={colors.accent} />
          </Pressable>
        </View>
      </Card>
    </>
  );
}

type HomeProductCardProps = {
  product: Product;
  index: number;
  width: number;
  layout?: 'grid' | 'landscape';
  testID: string;
  onBrowse: (searchTerm?: string) => void;
  onSelectProduct: (productId: string) => void;
};

function HomeProductCard({ product, index, width, layout = 'grid', testID, onBrowse, onSelectProduct }: HomeProductCardProps) {
  const colors = useColors();
  const landscape = layout === 'landscape';
  const id = first(product, ['id'], `product-${index}`);
  const image = first(product, ['image_url', 'imageUrl']);
  const name = first(product, ['name'], 'Export product');
  const origin = first(product, ['origin'], 'Origin not specified');
  const minimumOrder = first(product, ['moq', 'min_order']);
  const imageHeight = Math.min(190, Math.round(width * 1.02));
  const imageWidth = Math.min(138, Math.max(102, Math.round(width * 0.33)));

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`View ${name}, ${displayPrice(product)}, origin ${origin}`}
      onPress={() => id.startsWith('product-') ? onBrowse(name) : onSelectProduct(id)}
      style={({ pressed }) => ({ width, opacity: pressed ? 0.88 : 1 })}
    >
      <Card style={{ width, padding: 0, overflow: 'hidden', borderRadius: colors.radius + 2, marginBottom: 0 }}>
        <View style={landscape ? styles.landscapeCard : undefined}>
          <View
            style={[
              landscape ? styles.landscapeImage : { width: '100%', height: imageHeight },
              { width: landscape ? imageWidth : '100%', backgroundColor: colors.secondary },
            ]}
          >
            <BuyerProductImage
              uri={image}
              label={`${name} product image`}
              style={StyleSheet.absoluteFill}
              priority="low"
            />
          </View>
          <View style={landscape ? [styles.productBody, styles.landscapeBody] : styles.productBody}>
            <View style={{ minHeight: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
              <Text numberOfLines={1} style={[styles.productCategory, { flex: 1, color: colors.mutedForeground }]}>
                {categoryName(product)}
              </Text>
              {recordFeatured(product) ? <Text style={{ color: colors.accentText, fontSize: 8, fontWeight: '800' }}>FEATURED</Text> : null}
            </View>
            <Text numberOfLines={2} style={[styles.productName, landscape ? { minHeight: 0, fontSize: 14, lineHeight: 18 } : undefined, { color: colors.foreground }]}>{name}</Text>
            <View style={[styles.productOrigin, landscape ? { marginTop: 4 } : undefined]}>
              <Feather name="map-pin" size={10} color={colors.mutedForeground} />
              <Text numberOfLines={1} style={{ flex: 1, color: colors.mutedForeground, fontSize: 9 }}>{origin}</Text>
            </View>
            <View style={{ marginTop: landscape ? 8 : 5 }}>
              <BuyerProductPrice product={product} compact />
            </View>
            {minimumOrder ? (
              <Text numberOfLines={landscape ? 2 : 1} style={[styles.productMoq, { color: colors.mutedForeground }]}>
                {landscape ? 'Minimum order: ' : 'MOQ: '}{minimumOrder}
              </Text>
            ) : null}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

function recordFeatured(product: Product) {
  return record(product).featured === true;
}
