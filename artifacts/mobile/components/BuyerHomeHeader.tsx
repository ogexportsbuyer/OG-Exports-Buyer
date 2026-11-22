import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions, type LayoutChangeEvent, type ScrollViewInstance } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { BrandMark } from '@/components/BrandMark';
import { LocalizedText as Text, LocalizedTextInput as TextInput } from '@/components/LocalizedText';
import { useColors } from '@/hooks/useColors';
import { useMotion } from '@/lib/motion';

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  onBrowse: (searchTerm?: string) => void;
  onOpenCart: () => void;
  onOpenAccount: () => void;
  onSelectTab: (label: string) => void;
};

const brandSlides = [
  {
    id: 'origin',
    eyebrow: 'PAKISTAN ORIGIN',
    title: 'Pakistan’s exports, clearly presented.',
    body: 'Explore current products, origin and trade information in one place.',
    icon: 'globe' as const,
  },
  {
    id: 'catalogue',
    eyebrow: 'THE OG EXPORTS CATALOGUE',
    title: 'A clearer way to discover products.',
    body: 'Review specifications, packaging and order details before you enquire.',
    icon: 'search' as const,
  },
  {
    id: 'support',
    eyebrow: 'TRADE SUPPORT',
    title: 'Product details. Trade support.',
    body: 'Browse the catalogue, then contact our team when you are ready.',
    icon: 'message-circle' as const,
  },
] as const;

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
  promoCard: {
    height: 210,
    overflow: 'hidden',
    borderRadius: 22,
    padding: 15,
    borderWidth: 1,
  },
  promoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  promoBrandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  promoWordmark: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  promoSubmark: {
    marginTop: 2,
    fontSize: 7,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  promoIndex: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  promoBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  promoCopy: {
    flex: 1,
    justifyContent: 'center',
  },
  promoEyebrow: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  promoTitle: {
    marginTop: 6,
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  promoDescription: {
    marginTop: 6,
    fontSize: 9,
    lineHeight: 14,
  },
  promoArtwork: {
    width: 80,
    height: 80,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 40,
  },
  promoArtworkInner: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 29,
  },
  promoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  dots: {
    minHeight: 24,
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
  search,
  onSearchChange,
  onBrowse,
  onOpenCart,
  onOpenAccount,
  onSelectTab,
}: Props) {
  const colors = useColors();
  const { reduceMotion } = useMotion();
  const [isFocused, setIsFocused] = useState(false);
  const { width: windowWidth } = useWindowDimensions();
  const [activeTopTab, setActiveTopTab] = useState('Worldwide');
  const [carouselPosition, setCarouselPosition] = useState(1);
  const [carouselInteracting, setCarouselInteracting] = useState(false);
  const [carouselViewportWidth, setCarouselViewportWidth] = useState(windowWidth);
  const featuredScrollRef = useRef<ScrollViewInstance | null>(null);
  const carouselPositionRef = useRef(1);
  const dragReleaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastViewportWidth = useRef(0);
  const carouselItems = [brandSlides[brandSlides.length - 1], ...brandSlides, brandSlides[0]];
  const heroCardWidth = Math.min(carouselViewportWidth * 0.76, 360);
  const heroCardOverlap = 24;
  const heroStep = heroCardWidth - heroCardOverlap;
  const heroSideInset = (carouselViewportWidth - heroCardWidth) / 2;
  const activeDotIndex = carouselPosition >= brandSlides.length + 1
    ? 0
    : carouselPosition <= 0
      ? brandSlides.length - 1
      : carouselPosition - 1;

  useFocusEffect(useCallback(() => {
    setIsFocused(true);
    return () => setIsFocused(false);
  }, []));

  const updateCarouselPosition = useCallback((position: number) => {
    carouselPositionRef.current = position;
    setCarouselPosition(position);
  }, []);

  useEffect(() => {
    if (!isFocused || reduceMotion || carouselInteracting) return;
    const timer = setTimeout(() => {
      const currentPosition = carouselPositionRef.current;
      const nextPosition = currentPosition === brandSlides.length + 1
        ? 2
        : currentPosition === brandSlides.length
          ? brandSlides.length + 1
          : currentPosition + 1;
      updateCarouselPosition(nextPosition);
      featuredScrollRef.current?.scrollTo({ x: nextPosition * heroStep, animated: true });
    }, 5000);
    return () => clearTimeout(timer);
  }, [carouselInteracting, carouselPosition, heroStep, isFocused, reduceMotion, updateCarouselPosition]);

  useEffect(() => {
    if (!isFocused || carouselPosition !== brandSlides.length + 1 || carouselInteracting) return;
    const timer = setTimeout(() => {
      if (carouselPositionRef.current !== brandSlides.length + 1) return;
      updateCarouselPosition(1);
      featuredScrollRef.current?.scrollTo({ x: heroStep, animated: false });
    }, 900);
    return () => clearTimeout(timer);
  }, [carouselInteracting, carouselPosition, heroStep, isFocused, updateCarouselPosition]);

  function clearDragReleaseTimer() {
    if (dragReleaseTimer.current) clearTimeout(dragReleaseTimer.current);
    dragReleaseTimer.current = null;
  }

  function beginCarouselInteraction() {
    clearDragReleaseTimer();
    setCarouselInteracting(true);
  }

  function resumeCarouselAfterDrag() {
    clearDragReleaseTimer();
    dragReleaseTimer.current = setTimeout(() => {
      dragReleaseTimer.current = null;
      setCarouselInteracting(false);
    }, 800);
  }

  function syncCarouselViewport(event: LayoutChangeEvent) {
    const width = event.nativeEvent.layout.width;
    if (!width || Math.abs(width - lastViewportWidth.current) < 1) return;
    lastViewportWidth.current = width;
    setCarouselViewportWidth(width);
    const measuredCardWidth = Math.min(width * 0.76, 360);
    const measuredStep = measuredCardWidth - heroCardOverlap;
    requestAnimationFrame(() => featuredScrollRef.current?.scrollTo({
      x: carouselPositionRef.current * measuredStep,
      animated: false,
    }));
  }

  function settleCarousel(offsetX: number) {
    clearDragReleaseTimer();
    setCarouselInteracting(false);
    const rawIndex = Math.round(offsetX / heroStep);
    if (rawIndex <= 0) {
      featuredScrollRef.current?.scrollTo({ x: brandSlides.length * heroStep, animated: false });
      updateCarouselPosition(brandSlides.length);
      return;
    }
    if (rawIndex >= brandSlides.length + 1) {
      featuredScrollRef.current?.scrollTo({ x: heroStep, animated: false });
      updateCarouselPosition(1);
      return;
    }
    updateCarouselPosition(rawIndex);
  }

  function showSlide(index: number) {
    const nextPosition = index + 1;
    beginCarouselInteraction();
    updateCarouselPosition(nextPosition);
    featuredScrollRef.current?.scrollTo({ x: nextPosition * heroStep, animated: !reduceMotion });
    if (reduceMotion) setCarouselInteracting(false);
    else resumeCarouselAfterDrag();
  }

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
            <Feather name="search" size={19} color={colors.primary} />
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

      <ScrollView
        ref={featuredScrollRef}
        horizontal
        snapToInterval={heroStep}
        snapToAlignment="start"
        disableIntervalMomentum
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onLayout={syncCarouselViewport}
        onScrollBeginDrag={beginCarouselInteraction}
        onScrollEndDrag={resumeCarouselAfterDrag}
        onMomentumScrollEnd={event => settleCarousel(event.nativeEvent.contentOffset.x)}
        style={{ marginHorizontal: -20 }}
        contentContainerStyle={{
          paddingLeft: heroSideInset,
          paddingRight: heroSideInset + heroCardOverlap,
          paddingBottom: 3,
        }}
      >
        {carouselItems.map((slide, index) => {
          const isActive = carouselPosition === index;
          const realIndex = index === 0
            ? brandSlides.length - 1
            : index === brandSlides.length + 1
              ? 0
              : index - 1;
          return (
            <View
              key={`${slide.id}-${index}`}
              style={{
                width: heroCardWidth,
                marginRight: -heroCardOverlap,
                zIndex: isActive ? 4 : 1,
                elevation: isActive ? 14 : 1,
                shadowColor: colors.shadowColor,
                shadowOpacity: isActive ? 0.28 : 0.035,
                shadowRadius: isActive ? 22 : 7,
                shadowOffset: { width: 0, height: isActive ? 11 : 3 },
                overflow: 'visible',
              }}
            >
              <Pressable
                testID={`buyer-home-brand-slide-${slide.id}-${index}`}
                accessibilityRole="button"
                accessibilityLabel={`${slide.title} ${slide.body}`}
                accessibilityState={{ selected: isActive }}
                onPress={() => onBrowse()}
                style={({ pressed }) => [styles.promoCard, {
                  width: heroCardWidth,
                  backgroundColor: colors.balanceCardStart,
                  borderColor: isActive ? colors.accent : colors.glassBorder,
                  opacity: pressed ? 0.95 : isActive ? 1 : 0.48,
                  transform: [{ scale: isActive ? 1 : 0.88 }],
                }]}
              >
                <LinearGradient
                  colors={[colors.balanceCardStart, colors.balanceCardEnd] as const}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.promoHeader}>
                  <View style={styles.promoBrandLockup}>
                    <BrandMark width={37} onBackground="dark" />
                    <View>
                      <Text style={[styles.promoWordmark, { color: colors.splashText }]}>OG EXPORTS</Text>
                      <Text style={[styles.promoSubmark, { color: colors.splashMuted }]}>PAKISTAN · GLOBAL TRADE</Text>
                    </View>
                  </View>
                  <Text style={[styles.promoIndex, { color: colors.splashMuted }]}>
                    {String(realIndex + 1).padStart(2, '0')} / {String(brandSlides.length).padStart(2, '0')}
                  </Text>
                </View>

                <View style={styles.promoBody}>
                  <View style={styles.promoCopy}>
                    <Text style={[styles.promoEyebrow, { color: colors.accent }]}>{slide.eyebrow}</Text>
                    <Text numberOfLines={2} style={[styles.promoTitle, { color: colors.splashText }]}>{slide.title}</Text>
                    <Text numberOfLines={2} style={[styles.promoDescription, { color: colors.splashMuted }]}>{slide.body}</Text>
                  </View>
                  <View style={[styles.promoArtwork, { borderColor: colors.glassBorder, backgroundColor: colors.glassFill }]}>
                    <View style={[styles.promoArtworkInner, { borderColor: colors.glassBorder, backgroundColor: colors.glassTintTeal }]}>
                      <Feather name={slide.icon} size={24} color={colors.accent} />
                    </View>
                  </View>
                </View>

                <View style={styles.promoFooter}>
                  <View style={{ flex: 1, height: 1, backgroundColor: colors.glassBorder, opacity: 0.3 }} />
                  <Text style={{ color: colors.splashMuted, fontSize: 7, fontWeight: '700', letterSpacing: 0.8 }}>OG EXPORTS</Text>
                </View>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
      <View style={styles.dots}>
        {brandSlides.map((slide, index) => (
          <Pressable
            key={slide.id}
            testID={`buyer-home-brand-slide-dot-${slide.id}`}
            accessibilityRole="button"
            accessibilityLabel={`Show brand slide ${index + 1}`}
            accessibilityState={{ selected: activeDotIndex === index }}
            onPress={() => showSlide(index)}
            style={[styles.dot, {
              width: activeDotIndex === index ? 20 : 6,
              backgroundColor: activeDotIndex === index ? colors.accent : colors.border,
            }]}
          />
        ))}
      </View>
    </>
  );
}
