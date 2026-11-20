import React, { useMemo, useRef, useState } from 'react';
import {
  Card,
  EmptyState,
  ErrorState,
  Feather,
  Image,
  LocalizedText as Text,
  LocalizedTextInput as TextInput,
  LoadingCard,
  Pressable,
  router,
  ScrollView,
  Screen,
  Section,
  Status,
  useAuth,
  useColors,
  useGetBuyerOrders,
  useGetProductCategories,
  useGetProducts,
  getGetBuyerOrdersQueryKey,
  getGetProductCategoriesQueryKey,
  getGetProductsQueryKey,
  useWindowDimensions,
  View,
  first,
  record,
  categoryName,
  displayOrderNumber,
  displayPrice,
  rowsFromResponse,
} from './_preview-runtime';
import './_group.css';

export function Current() {
  const { ready, token, apiOrigin } = useAuth();
  const colors = useColors();
  const { width: windowWidth } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [selectedOrigin, setSelectedOrigin] = useState('Global');
  const [activeTopTab, setActiveTopTab] = useState('Worldwide');
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const featuredScrollRef = useRef<any>(null);
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
  const productGridCardWidth = Math.min(224, (windowWidth - 50) / 2);

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
      title=""
      hideHeader
      refreshable
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
          style={({ pressed }: { pressed: boolean }) => ({ width: 44, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 })}
        >
          <Feather name="arrow-right" size={19} color={colors.primaryForeground} />
        </Pressable>
      </View>

      <Pressable
        testID="buyer-home-catalogue-guide"
        accessibilityRole="button"
        accessibilityLabel="Browse approved products from Pakistan"
        onPress={() => browseProducts()}
        style={({ pressed }: { pressed: boolean }) => ({
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
          Explore export-ready products from Pakistan
        </Text>
        <Feather name="arrow-right" size={15} color={colors.primary} />
      </Pressable>

      {heroProducts.length > 0 ? (
        <View style={{ marginBottom: 5 }}>
          <ScrollView
            ref={featuredScrollRef}
            horizontal
            snapToInterval={heroCardWidth + heroCardGap}
            snapToAlignment="start"
            disableIntervalMomentum
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event: { nativeEvent: { contentOffset: { x: number } } }) => setFeaturedIndex(Math.max(0, Math.min(
              heroProducts.length - 1,
              Math.round(event.nativeEvent.contentOffset.x / (heroCardWidth + heroCardGap)),
            )))}
            style={{ marginHorizontal: -20 }}
            contentContainerStyle={{ gap: heroCardGap, paddingHorizontal: heroSideInset, paddingTop: 3, paddingBottom: 9 }}
          >
            {heroProducts.map((product, index) => {
              const name = first(product, ['name'], 'Export product');
              const category = categoryName(product);
              const origin = first(product, ['origin']);
              const galleryProducts = heroProducts.map((_, offset) => heroProducts[(index + offset) % heroProducts.length]);
              return (
                <View
                  key={first(product, ['id'], String(index))}
                  testID={`buyer-home-featured-${first(product, ['id'], String(index))}`}
                  style={{ width: heroCardWidth }}
                >
                  <Card style={{ width: heroCardWidth, padding: 13, marginBottom: 0, overflow: 'hidden', borderRadius: 18, backgroundColor: colors.primary, borderColor: colors.primary }}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Browse ${name}, ${category}${origin ? `, origin ${origin}` : ''}`}
                      onPress={() => browseProducts(name)}
                      style={({ pressed }: { pressed: boolean }) => ({ opacity: pressed ? 0.84 : 1 })}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <View style={{ flex: 1 }}>
                          <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,0.76)', fontSize: 9, fontWeight: '700', letterSpacing: 0.6 }}>
                            {category.toUpperCase()}
                          </Text>
                          <Text numberOfLines={1} style={{ color: '#FFFFFF', fontSize: 14, lineHeight: 19, fontWeight: '800', marginTop: 2 }}>
                            {name}
                          </Text>
                          {origin ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                              <Feather name="map-pin" size={10} color="rgba(255,255,255,0.82)" />
                              <Text style={{ color: 'rgba(255,255,255,0.82)', fontSize: 9, fontWeight: '600' }}>{origin}</Text>
                            </View>
                          ) : null}
                        </View>
                        <View style={{ width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.15)' }}>
                          <Feather name="arrow-up-right" size={16} color="#FFFFFF" />
                        </View>
                      </View>
                    </Pressable>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 11 }}>
                      {galleryProducts.map((galleryProduct, tileIndex) => {
                        const tileName = first(galleryProduct, ['name'], 'Export product');
                        const tileImage = first(galleryProduct, ['image_url', 'imageUrl']);
                        return (
                          <Pressable
                            key={first(galleryProduct, ['id'], `tile-${tileIndex}`)}
                            testID={`buyer-home-feature-tile-${index}-${tileIndex}`}
                            accessibilityRole="button"
                            accessibilityLabel={`Browse ${tileName}`}
                            onPress={() => browseProducts(tileName)}
                            style={({ pressed }: { pressed: boolean }) => ({ flex: 1, height: 72, overflow: 'hidden', borderRadius: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', backgroundColor: colors.lightGreen, opacity: pressed ? 0.78 : 1 })}
                          >
                            {tileImage ? (
                              <Image source={{ uri: tileImage }} accessibilityLabel={`${tileName} product image`} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
                            ) : (
                              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                <Feather name="package" size={19} color={colors.primary} />
                              </View>
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 9 }}>
                      <Text numberOfLines={1} style={{ flex: 1, color: 'rgba(255,255,255,0.8)', fontSize: 9 }}>
                        {displayPrice(product)} · Min. {first(product, ['moq', 'min_order'], 'order varies')}
                      </Text>
                        <Feather name="chevron-right" size={14} color={colors.primaryForeground} />
                    </View>
                  </Card>
                </View>
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
              style={({ pressed }: { pressed: boolean }) => ({ minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 13, borderRadius: 20, borderWidth: 1, borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.lightGreen : colors.card, opacity: pressed ? 0.78 : 1 })}
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
      <Section title="Products" right={
        <Pressable accessibilityRole="button" onPress={() => browseProducts()}>
          <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>View all</Text>
        </Pressable>
      } />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 10 }}>
        {filteredProducts.slice(0, 8).map((product, index) => {
          const id = first(product, ['id'], `product-${index}`);
          const image = first(product, ['image_url', 'imageUrl']);
          const name = first(product, ['name'], 'Export product');
          const origin = first(product, ['origin'], 'Origin not specified');
          const minimumOrder = first(product, ['moq', 'min_order']);
          const imageHeight = Math.min(190, Math.round(productGridCardWidth * 1.04));
          return (
            <Pressable
              key={id}
              testID={`buyer-home-product-${id}`}
              accessibilityRole="button"
              accessibilityLabel={`View ${name}, ${displayPrice(product)}, origin ${origin}`}
              onPress={() => browseProducts(name)}
              style={({ pressed }: { pressed: boolean }) => ({ width: productGridCardWidth, opacity: pressed ? 0.88 : 1 })}
            >
              <Card style={{ width: productGridCardWidth, padding: 0, overflow: 'hidden', borderRadius: 15, marginBottom: 0 }}>
                {image ? (
                  <Image source={{ uri: image }} accessibilityLabel={`${name} product image`} resizeMode="cover" style={{ height: imageHeight, width: '100%', backgroundColor: colors.secondary }} />
                ) : (
                  <View style={{ height: imageHeight, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary }}>
                    <Feather name="package" size={25} color={colors.mutedForeground} />
                  </View>
                )}
                <View style={{ paddingHorizontal: 10, paddingTop: 9, paddingBottom: 11 }}>
                  <View style={{ minHeight: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5, marginBottom: 3 }}>
                    <Text numberOfLines={1} style={{ flex: 1, color: colors.mutedForeground, fontSize: 8, fontWeight: '700', letterSpacing: 0.35 }}>
                      {categoryName(product).toUpperCase()}
                    </Text>
                    {record(product).featured === true ? (
                      <Text style={{ color: colors.accent, fontSize: 8, fontWeight: '800' }}>FEATURED</Text>
                    ) : null}
                  </View>
                  <Text numberOfLines={2} style={{ minHeight: 36, color: colors.foreground, fontWeight: '700', fontSize: 12, lineHeight: 17 }}>
                    {name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 }}>
                    <Feather name="map-pin" size={10} color={colors.mutedForeground} />
                    <Text numberOfLines={1} style={{ flex: 1, color: colors.mutedForeground, fontSize: 9 }}>{origin}</Text>
                  </View>
                  <Text numberOfLines={1} style={{ color: colors.primary, fontSize: 13, fontWeight: '800', marginTop: 7 }}>
                    {displayPrice(product)}
                  </Text>
                  {minimumOrder ? (
                    <Text numberOfLines={1} style={{ color: colors.mutedForeground, fontSize: 9, marginTop: 4 }}>
                      MOQ: {minimumOrder}
                    </Text>
                  ) : null}
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>

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
            style={({ pressed }: { pressed: boolean }) => ({ width: 137, minHeight: 145, borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, overflow: 'hidden', opacity: pressed ? 0.82 : 1 })}
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
