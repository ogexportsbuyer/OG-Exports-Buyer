import React, { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View, useWindowDimensions, type ScrollViewInstance } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { BrandMark } from '@/components/BrandMark';
import { LocalizedText as Text, LocalizedTextInput as TextInput } from '@/components/LocalizedText';
import { useColors } from '@/hooks/useColors';
import { first, record } from '@/lib/data';
import { categoryName, displayPrice, rowsFromResponse } from '@/lib/buyer-data';

type Product = ReturnType<typeof rowsFromResponse>[number];

type Props = {
  products: Product[];
  search: string;
  onSearchChange: (value: string) => void;
  onBrowse: (searchTerm?: string) => void;
  onOpenCart: () => void;
  onOpenAccount: () => void;
  onSelectTab: (label: string) => void;
};

const styles = StyleSheet.create({
  masthead: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wordmark: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  mastheadSubtitle: {
    marginTop: 2,
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 1.1,
  },
  iconActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTabs: {
    marginHorizontal: -20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topTab: {
    minHeight: 39,
    justifyContent: 'center',
    borderBottomWidth: 2,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.7,
    textTransform: 'uppercase',
  },
  headline: {
    marginTop: 7,
    marginBottom: 8,
    fontFamily: 'serif',
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '400',
    letterSpacing: -0.7,
  },
  intro: {
    maxWidth: 320,
    marginBottom: 17,
    fontSize: 12,
    lineHeight: 18,
  },
  searchRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingLeft: 13,
    paddingRight: 5,
    borderWidth: 1,
    borderRadius: 13,
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    marginLeft: 1,
    paddingVertical: 0,
    paddingHorizontal: 0,
    fontSize: 12,
    outlineWidth: 0,
  },
  searchButton: {
    width: 38,
    height: 38,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  guide: {
    minHeight: 39,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 12,
    marginBottom: 17,
    paddingHorizontal: 12,
    borderRadius: 11,
  },
  guideText: {
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
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
  featureCard: {
    height: 184,
    overflow: 'hidden',
    borderRadius: 17,
    padding: 12,
  },
  featureTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 9,
  },
  featureCategory: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  featureName: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  featureMeta: {
    marginTop: 3,
    fontSize: 9,
    lineHeight: 13,
  },
  featureOpen: {
    width: 27,
    height: 27,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 14,
  },
  featureThumbnails: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 10,
  },
  featureThumbnail: {
    height: 70,
    flex: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
  },
  featureFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dots: {
    minHeight: 21,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  dot: {
    height: 6,
    borderRadius: 4,
  },
});

export default function BuyerHomeHeader({
  products,
  search,
  onSearchChange,
  onBrowse,
  onOpenCart,
  onOpenAccount,
  onSelectTab,
}: Props) {
  const colors = useColors();
  const { width: windowWidth } = useWindowDimensions();
  const [activeTopTab, setActiveTopTab] = useState('Worldwide');
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const featuredScrollRef = useRef<ScrollViewInstance | null>(null);
  const featuredProducts = products.filter(product => record(product).featured === true);
  const heroProducts = (featuredProducts.length ? featuredProducts : products).slice(0, 6);
  const heroCardWidth = Math.max(260, Math.min(windowWidth * 0.72, 360));
  const heroCardGap = 12;
  const heroSideInset = Math.max((windowWidth + 40 - heroCardWidth) / 2, 28);

  function selectTab(label: string) {
    setActiveTopTab(label);
    onSelectTab(label);
  }

  return (
    <>
      <View style={styles.masthead}>
        <View style={styles.brandLockup}>
          <BrandMark width={46} />
          <View>
            <Text style={[styles.wordmark, { color: colors.foreground }]}>OG Exports</Text>
            <Text style={[styles.mastheadSubtitle, { color: colors.mutedForeground }]}>BUYER MARKETPLACE</Text>
          </View>
        </View>
        <View style={styles.iconActions}>
          <Pressable
            testID="buyer-home-cart"
            accessibilityRole="button"
            accessibilityLabel="Open cart"
            onPress={onOpenCart}
            hitSlop={8}
            style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Feather name="shopping-bag" size={19} color={colors.foreground} />
          </Pressable>
          <Pressable
            testID="buyer-home-account"
            accessibilityRole="button"
            accessibilityLabel="Open buyer account"
            onPress={onOpenAccount}
            hitSlop={8}
            style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Feather name="user" size={19} color={colors.foreground} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.topTabs, { borderBottomColor: colors.border }]}
        contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', gap: 25, paddingHorizontal: 20 }}
      >
        {['For you', 'Products', 'Worldwide'].map(label => {
          const active = activeTopTab === label;
          return (
            <Pressable
              key={label}
              testID={`buyer-home-nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => selectTab(label)}
              style={[styles.topTab, { borderBottomColor: active ? colors.accent : 'transparent' }]}
            >
              <Text style={{ color: active ? colors.foreground : colors.mutedForeground, fontSize: 12, fontWeight: active ? '700' : '500' }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ paddingTop: 5 }}>
        <View style={[styles.searchRow, { backgroundColor: colors.card, borderColor: colors.accent, borderRadius: colors.radius + 5 }]}>
          <Feather name="search" size={17} color={colors.mutedForeground} />
          <TextInput
            testID="buyer-home-search-input"
            accessibilityLabel="Search products"
            value={search}
            onChangeText={onSearchChange}
            onSubmitEditing={() => onBrowse(search)}
            returnKeyType="search"
            autoCapitalize="none"
            placeholder="Search products, categories or origin"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          <Pressable
            testID="buyer-home-search-products"
            accessibilityRole="button"
            accessibilityLabel="Search catalogue"
            onPress={() => onBrowse(search)}
            style={({ pressed }) => [styles.searchButton, { backgroundColor: colors.accent, opacity: pressed ? 0.82 : 1 }]}
          >
            <Feather name="search" size={19} color={colors.buttonForeground} />
          </Pressable>
        </View>
      </View>

      <Pressable
        testID="buyer-home-catalogue-guide"
        accessibilityRole="button"
        accessibilityLabel="Explore export-ready products from Pakistan"
        onPress={() => onBrowse()}
        style={({ pressed }) => [styles.guide, { backgroundColor: colors.glassTintGold, opacity: pressed ? 0.82 : 1 }]}
      >
        <Feather name="map" size={15} color={colors.primary} />
        <Text style={[styles.guideText, { color: colors.foreground }]}>Your guide to export products from Pakistan</Text>
        <Feather name="arrow-right" size={14} color={colors.accent} />
      </Pressable>

      {heroProducts.length > 0 ? (
        <>
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
            contentContainerStyle={{ gap: heroCardGap, paddingHorizontal: heroSideInset, paddingBottom: 3 }}
          >
            {heroProducts.map((product, index) => {
              const name = first(product, ['name'], 'Export product');
              const origin = first(product, ['origin']);
              const minimumOrder = first(product, ['moq', 'min_order']);
              const thumbnailProducts = heroProducts.length > 1
                ? [0, 1, 2].map(offset => heroProducts[(index + offset) % heroProducts.length])
                : [product];
              return (
                <Pressable
                  key={first(product, ['id'], String(index))}
                  testID={`buyer-home-featured-${first(product, ['id'], String(index))}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Browse ${name}, ${origin ? `origin ${origin}` : ''}, ${displayPrice(product)}`}
                  onPress={() => onBrowse(name)}
                  style={({ pressed }) => [styles.featureCard, { width: heroCardWidth, backgroundColor: colors.balanceCardStart, opacity: pressed ? 0.92 : 1 }]}
                >
                  <LinearGradient
                    colors={[colors.balanceCardStart, colors.balanceCardEnd] as const}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.featureTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.featureCategory, { color: colors.splashMuted }]}>{categoryName(product)}</Text>
                      <Text numberOfLines={1} style={[styles.featureName, { color: colors.splashText }]}>{name}</Text>
                      <Text numberOfLines={1} style={[styles.featureMeta, { color: colors.splashMuted }]}>
                        {origin || 'OG Exports catalogue'}{origin ? `  ·  ${displayPrice(product)}` : ''}
                      </Text>
                    </View>
                    <View style={[styles.featureOpen, { borderColor: colors.glassBorder, backgroundColor: colors.glassFill }]}>
                      <Feather name="chevron-right" size={17} color={colors.primary} />
                    </View>
                  </View>
                  <View style={styles.featureThumbnails}>
                    {thumbnailProducts.map((thumbnail, thumbnailIndex) => {
                      const thumbnailName = first(thumbnail, ['name'], 'Export product');
                      const thumbnailImage = first(thumbnail, ['image_url', 'imageUrl']);
                      return (
                        <View
                          key={`${first(thumbnail, ['id'], String(index))}-${thumbnailIndex}`}
                          style={[styles.featureThumbnail, { borderColor: colors.glassBorder, backgroundColor: colors.card }]}
                        >
                          {thumbnailImage ? (
                            <Image
                              source={{ uri: thumbnailImage }}
                              accessibilityLabel={`${thumbnailName} product`}
                              resizeMode="cover"
                              style={StyleSheet.absoluteFill}
                            />
                          ) : (
                            <Feather name="package" size={21} color={colors.primary} />
                          )}
                        </View>
                      );
                    })}
                  </View>
                  <View style={styles.featureFooter}>
                    <Text numberOfLines={1} style={{ flex: 1, color: colors.splashText, fontSize: 9, fontWeight: '700' }}>
                      {minimumOrder ? `MOQ ${minimumOrder}` : 'OG Exports selection'}
                    </Text>
                    <Text style={{ color: colors.splashMuted, fontSize: 9 }}>Explore  ›</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
          {heroProducts.length > 1 ? (
            <View style={styles.dots}>
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
                  style={[styles.dot, { width: featuredIndex === index ? 18 : 6, backgroundColor: featuredIndex === index ? colors.accent : colors.border }]}
                />
              ))}
            </View>
          ) : null}
        </>
      ) : (
        <Pressable
          testID="buyer-home-featured-fallback"
          accessibilityRole="button"
          accessibilityLabel="Browse products published by OG Exports"
          onPress={() => onBrowse()}
          style={({ pressed }) => [styles.featureCard, {
            width: heroCardWidth,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 15,
            paddingHorizontal: 17,
            backgroundColor: colors.buttonBackground,
            opacity: pressed ? 0.88 : 1,
          }]}
        >
          <BrandMark width={56} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.featureCategory, { color: colors.accent }]}>OG EXPORTS</Text>
            <Text style={[styles.featureName, { color: colors.buttonForeground }]}>Explore the catalogue</Text>
            <Text style={{ color: colors.buttonForeground, fontSize: 10, lineHeight: 15, marginTop: 4 }}>
              Browse products currently published by OG Exports.
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 }}>
              <Text style={{ color: colors.buttonForeground, fontSize: 10, fontWeight: '700' }}>Browse products</Text>
              <Feather name="arrow-right" size={13} color={colors.accent} />
            </View>
          </View>
        </Pressable>
      )}
    </>
  );
}
