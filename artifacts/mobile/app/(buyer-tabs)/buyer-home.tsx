import React, { useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View, useWindowDimensions, type ScrollViewInstance } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LocalizedText as Text, LocalizedTextInput as TextInput } from '@/components/LocalizedText';
import { Card, EmptyState, ErrorState, LoadingCard, Screen, Section, Status } from '@/components/InvestorUI';
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
  const heroCardWidth = Math.min(328, Math.max(windowWidth * 0.74, 270));
  const heroCardGap = 12;
  const heroSideInset = Math.max((windowWidth - heroCardWidth) / 2, 20);

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
      subtitle="Pakistan export marketplace"
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
        {['For you', 'Products', 'Worldwide'].map(label => {
          const active = activeTopTab === label;
          return (
            <Pressable
              key={label}
              testID={`buyer-home-nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => {
                setActiveTopTab(label);
                if (label === 'Products') browseProducts();
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

      <Pressable
        testID="buyer-home-catalogue-guide"
        accessibilityRole="button"
        accessibilityLabel="Browse approved products from Pakistan"
        onPress={() => browseProducts()}
        style={({ pressed }) => ({
          minHeight: 40,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 9,
          marginBottom: 13,
          paddingHorizontal: 12,
          borderRadius: 13,
          backgroundColor: colors.lightGreen,
          opacity: pressed ? 0.82 : 1,
        })}
      >
        <Feather name="globe" size={16} color={colors.primary} />
        <Text style={{ flex: 1, color: colors.foreground, fontSize: 11, fontWeight: '600' }}>
          Approved products from Pakistan
        </Text>
        <Feather name="arrow-right" size={15} color={colors.primary} />
      </Pressable>

      {heroProducts.length > 0 ? (
        <View style={{ marginBottom: 5 }}>
          <Section
            title="Featured export picks"
            right={
              <Pressable accessibilityRole="button" onPress={() => browseProducts()}>
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>See all</Text>
              </Pressable>
            }
          />
          <ScrollView
            ref={featuredScrollRef}
            horizontal
            snapToInterval={heroCardWidth + heroCardGap}
            snapToAlignment="start"
            disableIntervalMomentum
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={event => setFeaturedIndex(Math.max(0, Math.min(
              heroProducts.length - 1,
              Math.round(event.nativeEvent.contentOffset.x / (heroCardWidth + heroCardGap)),
            )))}
            style={{ marginHorizontal: -20 }}
            contentContainerStyle={{ gap: heroCardGap, paddingHorizontal: heroSideInset, paddingTop: 3, paddingBottom: 9 }}
          >
            {heroProducts.map((product, index) => {
              const image = first(product, ['image_url', 'imageUrl']);
              const name = first(product, ['name'], 'Export product');
              const category = categoryName(product);
              const origin = first(product, ['origin']);
              const minOrder = first(product, ['moq', 'min_order']);
              const approved = first(product, ['status']).toLowerCase() === 'approved';
              return (
                <Pressable
                  key={first(product, ['id'], String(index))}
                  testID={`buyer-home-featured-${first(product, ['id'], String(index))}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${name}, ${category}${origin ? `, origin ${origin}` : ''}, ${displayPrice(product)}`}
                  onPress={() => browseProducts(name)}
                  style={({ pressed }) => ({ width: heroCardWidth, opacity: pressed ? 0.9 : 1 })}
                >
                  <Card style={{ width: heroCardWidth, padding: 0, marginBottom: 0, overflow: 'hidden', borderRadius: 20 }}>
                    <View style={{ height: 184, backgroundColor: colors.primary }}>
                      {image ? (
                        <Image source={{ uri: image }} accessibilityLabel={`${name} product image`} resizeMode="cover" style={{ position: 'absolute', width: '100%', height: '100%' }} />
                      ) : (
                        <View style={{ ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }}>
                          <Feather name="package" size={38} color={colors.primaryForeground} />
                        </View>
                      )}
                      <LinearGradient
                        pointerEvents="none"
                        colors={['rgba(6, 32, 32, 0.04)', 'rgba(6, 32, 32, 0.28)', 'rgba(6, 32, 32, 0.88)']}
                        locations={[0, 0.48, 1]}
                        style={StyleSheet.absoluteFill}
                      />
                      <View style={{ position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <View style={{ paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20, backgroundColor: 'rgba(8, 39, 39, 0.74)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.26)' }}>
                          <Text numberOfLines={1} style={{ color: '#FFFFFF', fontSize: 9, lineHeight: 12, fontWeight: '700', letterSpacing: 0.5 }}>
                            {category.toUpperCase()}
                          </Text>
                        </View>
                        {approved ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 20, backgroundColor: 'rgba(8, 39, 39, 0.74)' }}>
                            <Feather name="check-circle" size={11} color={colors.statusSuccess} />
                            <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '700' }}>OG approved</Text>
                          </View>
                        ) : null}
                      </View>
                      <View style={{ position: 'absolute', left: 15, right: 15, bottom: 14 }}>
                        <Text style={{ color: colors.accent, fontSize: 9, fontWeight: '800', letterSpacing: 1.1, marginBottom: 5 }}>
                          FEATURED EXPORT
                        </Text>
                        <Text numberOfLines={2} style={{ color: '#FFFFFF', fontSize: 19, lineHeight: 24, fontWeight: '800' }}>
                          {name}
                        </Text>
                        {origin ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 }}>
                            <Feather name="map-pin" size={11} color="#FFFFFF" />
                            <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 10, fontWeight: '600' }}>Origin: {origin}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                    <View style={{ minHeight: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.card }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.mutedForeground, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>FOB PRICE</Text>
                        <Text numberOfLines={1} style={{ color: colors.primary, fontSize: 13, fontWeight: '800', marginTop: 3 }}>
                          {displayPrice(product)}
                        </Text>
                      </View>
                      {minOrder ? (
                        <View style={{ flex: 1.1, alignItems: 'flex-end' }}>
                          <Text style={{ color: colors.mutedForeground, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>MINIMUM ORDER</Text>
                          <Text numberOfLines={1} style={{ color: colors.foreground, fontSize: 10, fontWeight: '600', marginTop: 3 }}>
                            {minOrder}
                          </Text>
                        </View>
                      ) : null}
                      <Feather name="arrow-up-right" size={17} color={colors.accent} />
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </ScrollView>
          {heroProducts.length > 1 ? (
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5, paddingBottom: 7 }}>
              {heroProducts.map((product, index) => (
                <Pressable
                  key={first(product, ['id'], String(index))}
                  testID={`buyer-home-feature-dot-${index}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Show featured product ${index + 1}`}
                  accessibilityState={{ selected: featuredIndex === index }}
                  onPress={() => {
                    setFeaturedIndex(index);
                    featuredScrollRef.current?.scrollTo({ x: index * (heroCardWidth + heroCardGap), animated: true });
                  }}
                  style={{ width: featuredIndex === index ? 20 : 6, height: 6, borderRadius: 5, backgroundColor: featuredIndex === index ? colors.accent : colors.border }}
                />
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <Section title="Browse by origin" right={
        <Pressable accessibilityRole="button" onPress={() => setSelectedOrigin('Global')}>
          <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>All origins</Text>
        </Pressable>
      } />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingBottom: 10 }}>
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

      <Section title="Worldwide picks for you" right={
        <Pressable accessibilityRole="button" onPress={() => browseProducts()}>
          <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>Browse all</Text>
        </Pressable>
      } />
      {productsQuery.isLoading ? <LoadingCard label="Loading products…" /> : null}
      {productsQuery.isError ? <ErrorState message="Recommended products could not be loaded." error={productsQuery.error} onRetry={() => void productsQuery.refetch()} /> : null}
      {ready && !!apiOrigin && !productsQuery.isLoading && !productsQuery.isError && products.length === 0 ? (
        <EmptyState title="No products published" body="Approved products published by OG Exports will appear here." icon="package" />
      ) : null}
      {!productsQuery.isLoading && !productsQuery.isError && products.length > 0 && filteredProducts.length === 0 ? (
        <EmptyState title={`No products from ${selectedOrigin}`} body="Choose another origin to explore the current catalogue." icon="package" />
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ gap: 9, paddingHorizontal: 20, paddingBottom: 11 }}>
        {filteredProducts.slice(0, 8).map((product, index) => {
          const id = first(product, ['id'], `product-${index}`);
          const image = first(product, ['image_url', 'imageUrl']);
          const name = first(product, ['name'], 'Export product');
          return (
            <Pressable key={id} testID={`buyer-home-product-${id}`} accessibilityRole="button" accessibilityLabel={`Browse ${name}`} onPress={() => browseProducts(name)}>
              <Card style={{ width: 144, padding: 0, overflow: 'hidden', borderRadius: 14, marginBottom: 0 }}>
                {image
                  ? <Image source={{ uri: image }} accessibilityLabel={`${name} product image`} resizeMode="cover" style={{ height: 91, width: '100%', backgroundColor: colors.secondary }} />
                  : <View style={{ height: 91, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary }}><Feather name="package" size={22} color={colors.mutedForeground} /></View>}
                <View style={{ paddingHorizontal: 9, paddingTop: 7, paddingBottom: 9 }}>
                  {record(product).featured === true ? (
                    <Text style={{ alignSelf: 'flex-start', color: colors.accent, backgroundColor: colors.glassTintGold, overflow: 'hidden', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3, fontSize: 8, fontWeight: '700', marginBottom: 4 }}>Featured</Text>
                  ) : null}
                  <Text numberOfLines={2} style={{ minHeight: 28, color: colors.foreground, fontWeight: '700', fontSize: 10, lineHeight: 14 }}>{name}</Text>
                  <Text numberOfLines={1} style={{ color: colors.mutedForeground, fontSize: 9, marginTop: 3 }}>{first(product, ['origin'], 'Origin not specified')}</Text>
                  <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700', marginTop: 5 }}>{displayPrice(product)}</Text>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </ScrollView>

      <Section title="Explore by category" right={
        <Pressable accessibilityRole="button" onPress={() => browseProducts()}>
          <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>See all</Text>
        </Pressable>
      } />
      {!ready ? <LoadingCard label="Connecting to the OG Exports catalogue…" lines={2} /> : null}
      {ready && !apiOrigin ? <ErrorState message="The product catalogue is not connected. Please try again later." /> : null}
      {categoriesQuery.isLoading ? <LoadingCard label="Loading categories…" lines={2} /> : null}
      {categoriesQuery.isError ? <ErrorState message="Product categories could not be loaded." error={categoriesQuery.error} onRetry={() => void categoriesQuery.refetch()} /> : null}
      {ready && !!apiOrigin && !categoriesQuery.isLoading && !categoriesQuery.isError && categories.length === 0 ? (
        <EmptyState title="No categories published" body="Categories will appear here when OG Exports publishes them." icon="grid" />
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ gap: 9, paddingHorizontal: 20, paddingBottom: 13 }}>
        {categories.map(category => (
          <Pressable
            key={category}
            testID={`buyer-home-category-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/(buyer-tabs)/buyer-products', params: { category } })}
            style={({ pressed }) => ({ width: 137, minHeight: 145, borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, overflow: 'hidden', opacity: pressed ? 0.82 : 1 })}
          >
            {(() => {
              const categoryProduct = products.find(product => categoryName(product) === category);
              const image = categoryProduct ? first(categoryProduct, ['image_url', 'imageUrl']) : '';
              return image ? (
                <Image source={{ uri: image }} accessibilityLabel={`${category} product`} resizeMode="cover" style={{ height: 93, width: '100%', backgroundColor: colors.secondary }} />
              ) : (
                <View style={{ height: 93, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lightGreen }}>
                  <Feather name="grid" size={23} color={colors.primary} />
                </View>
              );
            })()}
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5, paddingHorizontal: 9 }}>
              <Text numberOfLines={2} style={{ flex: 1, color: colors.foreground, fontSize: 10, lineHeight: 14, fontWeight: '700' }}>{category}</Text>
              <Feather name="arrow-up-right" size={13} color={colors.primary} />
            </View>
          </Pressable>
        ))}
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
