import React, { useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, View, useWindowDimensions, type ScrollViewInstance } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LocalizedText as Text, LocalizedTextInput as TextInput } from '@/components/LocalizedText';
import { Action, Card, EmptyState, ErrorState, LoadingCard, Screen, Section, Status } from '@/components/InvestorUI';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { useGetBuyerOrders, useGetProductCategories, useGetProducts, getGetBuyerOrdersQueryKey, getGetProductCategoriesQueryKey, getGetProductsQueryKey } from '@workspace/api-client-react';
import { first, record } from '@/lib/data';
import { categoryName, displayOrderNumber, displayPrice, rowsFromResponse } from '@/lib/buyer-data';

type HomeIconName = keyof typeof Feather.glyphMap;

function HomeIconButton({ icon, label, onPress, testID }: {
  icon: HomeIconName;
  label: string;
  onPress: () => void;
  testID: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({ minWidth: 42, minHeight: 42, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.68 : 1 })}
    >
      <Feather name={icon} size={20} color={colors.foreground} />
    </Pressable>
  );
}

export default function BuyerHome() {
  const { ready, token, apiOrigin } = useAuth();
  const colors = useColors();
  const { width: windowWidth } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [selectedOrigin, setSelectedOrigin] = useState('Global');
  const [activeTopTab, setActiveTopTab] = useState('Worldwide');
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const featuredScrollRef = useRef<ScrollViewInstance | null>(null);
  const ordersQuery = useGetBuyerOrders({ per_page: 10 }, { query: { queryKey: getGetBuyerOrdersQueryKey({ per_page: 10 }), enabled: ready && !!token && !!apiOrigin, staleTime: 30_000 } });
  const catalogEnabled = ready && !!apiOrigin;
  const productsQuery = useGetProducts({ per_page: 8 }, { query: { queryKey: getGetProductsQueryKey({ per_page: 8 }), enabled: catalogEnabled, retry: false, staleTime: 60_000 } });
  const categoriesQuery = useGetProductCategories({ query: { queryKey: getGetProductCategoriesQueryKey(), enabled: catalogEnabled, retry: false, staleTime: 300_000 } });
  const orders = rowsFromResponse(ordersQuery.data);
  const activeOrders = orders.filter(order => !['completed', 'cancelled', 'delivered'].includes(first(order, ['status']).toLowerCase()));
  const products = rowsFromResponse(productsQuery.data);
  const categories = rowsFromResponse(categoriesQuery.data).map(category => first(category, ['name'])).filter(Boolean).slice(0, 8);
  const origins = Array.from(new Set(products.map(product => first(product, ['origin'])).filter(Boolean)));
  const originOptions = ['Global', ...origins.filter(origin => origin !== 'Global')];
  const filteredProducts = useMemo(
    () => selectedOrigin === 'Global' ? products : products.filter(product => first(product, ['origin']) === selectedOrigin),
    [products, selectedOrigin],
  );
  const featuredProducts = products.filter(product => record(product).featured === true);
  const heroProducts = (featuredProducts.length ? featuredProducts : products).slice(0, 3);
  const heroCardWidth = Math.max(windowWidth - 40, 280);

  function browseProducts(searchTerm = '') {
    const normalized = searchTerm.trim();
    router.push({
      pathname: '/(buyer-tabs)/buyer-products',
      ...(normalized ? { params: { search: normalized } } : {}),
    });
  }

  function openOrders() {
    if (token) {
      router.push('/(buyer-tabs)/buyer-orders');
      return;
    }
    router.push({
      pathname: '/(auth)/login',
      params: { returnTo: '/(buyer-tabs)/buyer-orders' },
    });
  }

  return (
    <Screen
      title="OG Exports"
      subtitle="Global buyer marketplace"
      refreshable
      action={
        <View style={{ flexDirection: 'row', marginTop: -7, marginRight: -8 }}>
          <HomeIconButton icon="message-circle" label="Messages" testID="buyer-home-messages" onPress={() => router.push('/(buyer-tabs)/buyer-messages')} />
          <HomeIconButton icon="shopping-cart" label="Cart" testID="buyer-home-cart" onPress={() => router.push('/(buyer-tabs)/buyer-cart')} />
        </View>
      }
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 22, paddingBottom: 13, paddingRight: 12 }}
        style={{ marginBottom: 2 }}
      >
        {['For you', 'Products', 'Categories', 'Worldwide'].map((label, index) => {
          const active = activeTopTab === label;
          return (
            <Pressable
              key={label}
              testID={`buyer-home-nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => {
                setActiveTopTab(label);
                if (label === 'Products' || label === 'Categories') browseProducts();
                if (label === 'Worldwide') setSelectedOrigin('Global');
                if (label === 'For you') setSelectedOrigin('Global');
              }}
              style={{ minHeight: 34, justifyContent: 'center', borderBottomWidth: active ? 3 : 0, borderBottomColor: colors.accent }}
            >
              <Text style={{ color: active ? colors.foreground : colors.mutedForeground, fontSize: 13, fontWeight: active ? '700' : '600' }}>{label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 52, marginBottom: 12, paddingLeft: 13, paddingRight: 5, borderRadius: 16, borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.card }}>
        <Feather name="search" size={18} color={colors.mutedForeground} />
        <TextInput
          testID="buyer-home-search-input"
          accessibilityLabel="Search products"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => browseProducts(search)}
          returnKeyType="search"
          autoCapitalize="none"
          placeholder="Search export products"
          placeholderTextColor={colors.mutedForeground}
          style={{ flex: 1, minHeight: 48, marginLeft: 10, paddingVertical: 0, paddingHorizontal: 0, color: colors.foreground, fontSize: 14, outlineWidth: 0 }}
        />
        <Pressable
          testID="buyer-home-search-products"
          accessibilityRole="button"
          accessibilityLabel="Search catalogue"
          onPress={() => browseProducts(search)}
          style={({ pressed }) => ({ width: 44, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 })}
        >
          <Feather name="arrow-right" size={19} color={colors.primaryForeground} />
        </Pressable>
      </View>

      <Card style={{ padding: 17, marginBottom: 15, backgroundColor: colors.balanceCardStart, borderRadius: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <View style={{ width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.glassTintGold }}>
            <Feather name="globe" size={17} color={colors.accentForeground} />
          </View>
          <Text style={{ color: colors.accent, fontSize: 10, fontWeight: '700', letterSpacing: 1.1 }}>OG EXPORTS · GLOBAL SOURCING</Text>
        </View>
        <Text style={{ color: colors.balanceCardText, fontSize: 21, lineHeight: 27, fontWeight: '700', marginTop: 12 }}>
          Find products for your next order.
        </Text>
        <Text style={{ color: colors.balanceCardText, opacity: 0.82, fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 13 }}>
          Browse approved export products and request a quote directly from OG Exports.
        </Text>
        <Pressable
          testID="buyer-home-explore-products"
          accessibilityRole="button"
          onPress={() => browseProducts()}
          style={({ pressed }) => ({ alignSelf: 'flex-start', minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 13, borderRadius: 20, backgroundColor: colors.glassTintGold, opacity: pressed ? 0.8 : 1 })}
        >
          <Text style={{ color: colors.accentForeground, fontSize: 12, fontWeight: '700' }}>Explore products</Text>
          <Feather name="arrow-right" size={14} color={colors.accentForeground} />
        </Pressable>
      </Card>

      {heroProducts.length > 0 ? (
        <View style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <View>
              <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: '700' }}>Featured picks</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 3 }}>From the OG Exports catalogue</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 5 }}>
              {heroProducts.map((product, index) => (
                <Pressable
                  key={first(product, ['id'], String(index))}
                  testID={`buyer-home-feature-dot-${index}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Show featured product ${index + 1}`}
                  accessibilityState={{ selected: featuredIndex === index }}
                  onPress={() => {
                    setFeaturedIndex(index);
                    featuredScrollRef.current?.scrollTo({ x: index * heroCardWidth, animated: true });
                  }}
                  style={{ width: featuredIndex === index ? 18 : 7, height: 7, borderRadius: 6, backgroundColor: featuredIndex === index ? colors.primary : colors.border }}
                />
              ))}
            </View>
          </View>
          <ScrollView
            ref={featuredScrollRef}
            horizontal
            pagingEnabled
            snapToInterval={heroCardWidth}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={event => setFeaturedIndex(Math.round(event.nativeEvent.contentOffset.x / heroCardWidth))}
            contentContainerStyle={{ gap: 10 }}
          >
            {heroProducts.map((product, index) => {
              const image = first(product, ['image_url', 'imageUrl']);
              const name = first(product, ['name'], 'Export product');
              return (
                <Pressable
                  key={first(product, ['id'], String(index))}
                  testID={`buyer-home-featured-${first(product, ['id'], String(index))}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Browse ${name}`}
                  onPress={() => browseProducts(name)}
                  style={{ width: heroCardWidth }}
                >
                  <Card style={{ padding: 0, marginBottom: 0, overflow: 'hidden', borderRadius: 20 }}>
                    {image ? (
                      <Image source={{ uri: image }} accessibilityLabel={`${name} product image`} resizeMode="cover" style={{ width: '100%', height: 156, backgroundColor: colors.secondary }} />
                    ) : (
                      <View style={{ width: '100%', height: 156, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary }}>
                        <Feather name="package" size={28} color={colors.mutedForeground} />
                      </View>
                    )}
                    <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 13 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <Text numberOfLines={1} style={{ flex: 1, color: colors.foreground, fontSize: 15, fontWeight: '700' }}>{name}</Text>
                        <Feather name="arrow-up-right" size={17} color={colors.primary} />
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 }}>
                        <Text numberOfLines={1} style={{ color: colors.mutedForeground, fontSize: 11 }}>{categoryName(product)}</Text>
                        <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: colors.accent }} />
                        <Text numberOfLines={1} style={{ color: colors.mutedForeground, fontSize: 11 }}>{first(product, ['origin'], 'Origin not specified')}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }}>
                        <View style={{ flex: 1, paddingRight: 12 }}>
                          <Text style={{ color: colors.mutedForeground, fontSize: 9, fontWeight: '700', letterSpacing: 0.8 }}>FOB PRICE</Text>
                          <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '700', marginTop: 3 }}>{displayPrice(product)}</Text>
                        </View>
                        <Text numberOfLines={1} style={{ maxWidth: '53%', color: colors.mutedForeground, fontSize: 9, textAlign: 'right' }}>
                          MOQ · {first(product, ['moq', 'min_order'], 'Contact OG Exports')}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <Section title="Explore by category" right={
        <Pressable accessibilityRole="button" onPress={() => browseProducts()}>
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>See all</Text>
        </Pressable>
      } />
      {!ready ? <LoadingCard label="Connecting to the OG Exports catalogue…" lines={2} /> : null}
      {ready && !apiOrigin ? <ErrorState message="The product catalogue is not connected. Please try again later." /> : null}
      {categoriesQuery.isLoading ? <LoadingCard label="Loading categories…" lines={2} /> : null}
      {categoriesQuery.isError ? <ErrorState message="Product categories could not be loaded." error={categoriesQuery.error} onRetry={() => void categoriesQuery.refetch()} /> : null}
      {ready && !!apiOrigin && !categoriesQuery.isLoading && !categoriesQuery.isError && categories.length === 0 ? (
        <EmptyState title="No categories published" body="Categories will appear here when OG Exports publishes them." icon="grid" />
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 11, paddingRight: 12, paddingBottom: 13 }}>
        {categories.map(category => (
          <Pressable
            key={category}
            testID={`buyer-home-category-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/(buyer-tabs)/buyer-products', params: { category } })}
            style={({ pressed }) => ({ width: 144, minHeight: 154, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, overflow: 'hidden', opacity: pressed ? 0.82 : 1 })}
          >
            {(() => {
              const categoryProduct = products.find(product => categoryName(product) === category);
              const image = categoryProduct ? first(categoryProduct, ['image_url', 'imageUrl']) : '';
              return image ? (
                <Image source={{ uri: image }} accessibilityLabel={`${category} product`} resizeMode="cover" style={{ height: 98, width: '100%', backgroundColor: colors.secondary }} />
              ) : (
                <View style={{ height: 98, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lightGreen }}>
                  <Feather name="grid" size={25} color={colors.primary} />
                </View>
              );
            })()}
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5, paddingHorizontal: 11 }}>
              <Text numberOfLines={2} style={{ flex: 1, color: colors.foreground, fontSize: 11, lineHeight: 15, fontWeight: '700' }}>{category}</Text>
              <Feather name="arrow-up-right" size={14} color={colors.primary} />
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <Section title="Worldwide picks for you" right={
        <Pressable accessibilityRole="button" onPress={() => browseProducts()}>
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>Browse all</Text>
        </Pressable>
      } />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 13 }}>
        {originOptions.map(origin => {
          const active = selectedOrigin === origin;
          return (
            <Pressable
              key={origin}
              testID={`buyer-home-origin-${origin.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setSelectedOrigin(origin)}
              style={({ pressed }) => ({ minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 13, borderRadius: 20, borderWidth: 1, borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.lightGreen : colors.card, opacity: pressed ? 0.78 : 1 })}
            >
              <Feather name={origin === 'Global' ? 'globe' : 'map-pin'} size={13} color={active ? colors.primary : colors.mutedForeground} />
              <Text style={{ color: active ? colors.primary : colors.foreground, fontSize: 11, fontWeight: active ? '700' : '600' }}>{origin}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {productsQuery.isLoading ? <LoadingCard label="Loading products…" /> : null}
      {productsQuery.isError ? <ErrorState message="Recommended products could not be loaded." error={productsQuery.error} onRetry={() => void productsQuery.refetch()} /> : null}
      {ready && !!apiOrigin && !productsQuery.isLoading && !productsQuery.isError && products.length === 0 ? (
        <EmptyState title="No products published" body="Approved products published by OG Exports will appear here." icon="package" />
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 12 }}>
        {filteredProducts.slice(0, 8).map((product, index) => {
          const id = first(product, ['id'], `product-${index}`);
          const image = first(product, ['image_url', 'imageUrl']);
          const name = first(product, ['name'], 'Export product');
          return (
            <Pressable key={id} testID={`buyer-home-product-${id}`} accessibilityRole="button" accessibilityLabel={`Browse ${name}`} onPress={() => browseProducts(name)}>
              <Card style={{ width: 145, padding: 0, overflow: 'hidden', borderRadius: 17, marginBottom: 0 }}>
                {image
                  ? <Image source={{ uri: image }} accessibilityLabel={`${name} product image`} resizeMode="cover" style={{ height: 112, width: '100%', backgroundColor: colors.secondary }} />
                  : <View style={{ height: 112, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary }}><Feather name="package" size={22} color={colors.mutedForeground} /></View>}
                <View style={{ padding: 11 }}>
                  {record(product).featured === true ? (
                    <Text style={{ alignSelf: 'flex-start', color: colors.accentForeground, backgroundColor: colors.glassTintGold, overflow: 'hidden', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3, fontSize: 9, fontWeight: '700', marginBottom: 6 }}>Featured</Text>
                  ) : null}
                  <Text numberOfLines={2} style={{ minHeight: 32, color: colors.foreground, fontWeight: '700', fontSize: 11, lineHeight: 16 }}>{name}</Text>
                  <Text numberOfLines={1} style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 3 }}>{first(product, ['origin'], 'Origin not specified')}</Text>
                  <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', marginTop: 7 }}>{displayPrice(product)}</Text>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </ScrollView>

      {token ? (
        <>
          <Section title="Your active orders" right={<Pressable accessibilityRole="button" onPress={openOrders}><Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>View all</Text></Pressable>} />
          {ordersQuery.isLoading ? <LoadingCard label="Loading orders…" lines={2} /> : null}
          {ordersQuery.isError ? <ErrorState message="Your orders could not be loaded." error={ordersQuery.error} onRetry={() => void ordersQuery.refetch()} /> : null}
          {!ordersQuery.isLoading && !ordersQuery.isError && activeOrders.length === 0
            ? <EmptyState title="No active orders" body="Orders placed from your cart will appear here." icon="package" />
            : null}
          {activeOrders.slice(0, 3).map(order => {
            const id = first(order, ['id']);
            return (
              <Pressable
                key={id || displayOrderNumber(order)}
                testID={`buyer-home-order-${id}`}
                accessibilityRole="button"
                onPress={() => id && router.push(`/buyer-order/${id}`)}
              >
                <Card style={{ padding: 15, marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.foreground, fontWeight: '700' }}>{displayOrderNumber(order)}</Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>
                        {first(order, ['destination_port', 'destination'], 'Destination pending')}
                      </Text>
                    </View>
                    <Status value={first(order, ['status'], 'Pending')} />
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </>
      ) : null}
      <Card style={{ padding: 16, marginTop: 6, marginBottom: 12, borderRadius: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
          <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.lightGreen }}>
            <Feather name="message-circle" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700' }}>Need help with sourcing?</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 16, marginTop: 3 }}>Message the OG Exports team about your requirements.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Message OG Exports" testID="buyer-home-contact" onPress={() => router.push('/(buyer-tabs)/buyer-messages')} hitSlop={8}>
            <Feather name="arrow-up-right" size={18} color={colors.primary} />
          </Pressable>
        </View>
      </Card>
    </Screen>
  );
}
