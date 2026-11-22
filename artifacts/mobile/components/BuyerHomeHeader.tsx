import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions, type LayoutChangeEvent, type ScrollViewInstance, type ViewStyle } from 'react-native';
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
    eyebrow: 'GLOBAL PRESENCE',
    title: 'Connecting Markets. Delivering Excellence.',
    body: 'Your Gateway to Premium Products and Global Trade Opportunities.',
    icon: 'globe' as const,
    backgroundColors: ['#07363A', '#0F6260'] as const,
    iconColors: ['#2A716C', '#0A3335'] as const,
    accent: '#E6C77D',
  },
  {
    id: 'catalogue',
    eyebrow: 'PRODUCT EXCELLENCE',
    title: 'Exceptional Quality. Uncompromising Standards.',
    body: 'Discover a Premium Selection of Agricultural Commodities and Natural Products.',
    icon: 'award' as const,
    backgroundColors: ['#0C4A35', '#1E8354'] as const,
    iconColors: ['#3C8A5C', '#0A3928'] as const,
    accent: '#E7CD8A',
  },
  {
    id: 'supply',
    eyebrow: 'GLOBAL SUPPLY',
    title: 'Powering Global Trade Through Reliable Supply.',
    body: 'Consistent Supply. Competitive Export Solutions. Worldwide Reach.',
    icon: 'truck' as const,
    backgroundColors: ['#193F33', '#47735B'] as const,
    iconColors: ['#568B66', '#143C30'] as const,
    accent: '#E4C27A',
  },
  {
    id: 'trust',
    eyebrow: 'TRUST & COMMITMENT',
    title: 'Quality Assured. Relationships Built on Trust.',
    body: 'Professional Standards, Careful Selection and Commitment in Every Shipment.',
    icon: 'shield' as const,
    backgroundColors: ['#1D4033', '#4F7653'] as const,
    iconColors: ['#6A8962', '#1E3A32'] as const,
    accent: '#E6C982',
  },
  {
    id: 'partnerships',
    eyebrow: 'BUSINESS PARTNERSHIPS',
    title: 'Beyond Business. Building Lasting Partnerships.',
    body: 'Your Trusted Partner for Sustainable Growth and Global Business Opportunities.',
    icon: 'users' as const,
    backgroundColors: ['#3B4025', '#6A7137'] as const,
    iconColors: ['#7C8150', '#343B25'] as const,
    accent: '#E4C27A',
  },
] as const;

function BrandSlideMotion({
  active,
  reduceMotion,
  style,
  children,
}: {
  active: boolean;
  reduceMotion: boolean;
  style: ViewStyle;
  children: React.ReactNode;
}) {
  const progress = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(active ? 1 : 0);
      return;
    }
    const animation = Animated.spring(progress, {
      toValue: active ? 1 : 0,
      damping: 14,
      stiffness: 150,
      mass: 0.85,
      overshootClamping: false,
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [active, progress, reduceMotion]);

  const scaleX = progress.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.045] });
  const scaleY = progress.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.015] });
  const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] });

  return (
    <Animated.View style={[style, { opacity, transform: [{ scaleX }, { scaleY }] }]}>
      {children}
    </Animated.View>
  );
}

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
  promoCard: {
    height: 236,
    overflow: 'hidden',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
  },
  promoGlowOrb: {
    position: 'absolute',
    top: -70,
    right: -52,
    width: 190,
    height: 190,
    borderRadius: 95,
    opacity: 0.055,
  },
  promoGlowOrbSecondary: {
    position: 'absolute',
    left: -78,
    bottom: -132,
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.075,
  },
  promoTopAccent: {
    position: 'absolute',
    top: 0,
    left: 22,
    width: 54,
    height: 2,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    opacity: 0.9,
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
  promoIndexPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderRadius: 12,
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
    letterSpacing: 1.15,
    textTransform: 'uppercase',
  },
  promoEyebrowBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: 10,
  },
  promoEyebrowDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  promoTitle: {
    marginTop: 6,
    fontSize: 16,
    lineHeight: 20,
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
    overflow: 'hidden',
  },
  promoArtworkShadow: {
    width: 80,
    height: 80,
    borderRadius: 40,
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  promoArtworkInner: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 29,
    shadowOpacity: 0.24,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  promoIconDisc: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 21,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  promoArtworkHighlight: {
    position: 'absolute',
    top: 11,
    left: 14,
    width: 19,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    opacity: 0.28,
    transform: [{ rotate: '-35deg' }],
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
    }, 7000);
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
        style={{ marginHorizontal: -20, marginTop: 17 }}
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
            <BrandSlideMotion
              key={`${slide.id}-${index}`}
              active={isActive}
              reduceMotion={reduceMotion}
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
                  backgroundColor: slide.backgroundColors[0],
                  borderColor: isActive ? slide.accent : `${slide.accent}66`,
                  opacity: pressed ? 0.95 : 1,
                }]}
              >
                <LinearGradient
                  colors={slide.backgroundColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View pointerEvents="none" style={[styles.promoGlowOrb, { backgroundColor: '#FFFFFF' }]} />
                <View pointerEvents="none" style={[styles.promoGlowOrbSecondary, { backgroundColor: slide.accent }]} />
                <View pointerEvents="none" style={[styles.promoTopAccent, { backgroundColor: slide.accent }]} />
                <View style={styles.promoHeader}>
                  <View style={styles.promoBrandLockup}>
                    <BrandMark width={37} onBackground="dark" />
                    <View>
                      <Text style={[styles.promoWordmark, { color: colors.splashText }]}>OG EXPORTS</Text>
                      <Text style={[styles.promoSubmark, { color: colors.splashMuted }]}>PAKISTAN · GLOBAL TRADE</Text>
                    </View>
                  </View>
                  <View style={[styles.promoIndexPill, {
                    borderColor: `${slide.accent}55`,
                    backgroundColor: 'rgba(255,255,255,0.06)',
                  }]}>
                    <Text style={[styles.promoIndex, { color: colors.splashMuted }]}>
                      {String(realIndex + 1).padStart(2, '0')} / {String(brandSlides.length).padStart(2, '0')}
                    </Text>
                  </View>
                </View>

                <View style={styles.promoBody}>
                  <View style={styles.promoCopy}>
                    <View style={[styles.promoEyebrowBadge, {
                      borderColor: `${slide.accent}55`,
                      backgroundColor: `${slide.accent}18`,
                    }]}>
                      <View style={[styles.promoEyebrowDot, { backgroundColor: slide.accent }]} />
                      <Text style={[styles.promoEyebrow, { color: slide.accent }]}>{slide.eyebrow}</Text>
                    </View>
                    <Text numberOfLines={3} style={[styles.promoTitle, { color: colors.splashText }]}>{slide.title}</Text>
                    <Text numberOfLines={3} style={[styles.promoDescription, { color: colors.splashMuted }]}>{slide.body}</Text>
                  </View>
                  <View style={[styles.promoArtworkShadow, { shadowColor: slide.backgroundColors[0] }]}>
                    <View style={[styles.promoArtwork, {
                      borderColor: `${slide.accent}A8`,
                      backgroundColor: slide.iconColors[0],
                    }]}>
                      <View style={[styles.promoArtworkInner, {
                        borderColor: `${slide.accent}99`,
                        backgroundColor: slide.iconColors[1],
                        shadowColor: slide.backgroundColors[0],
                      }]}>
                        <View style={[styles.promoIconDisc, {
                          borderColor: `${slide.accent}99`,
                          backgroundColor: slide.iconColors[0],
                          shadowColor: slide.backgroundColors[0],
                        }]}>
                          <Feather name={slide.icon} size={30} color="#FFF0B8" />
                        </View>
                      </View>
                      <View pointerEvents="none" style={styles.promoArtworkHighlight} />
                    </View>
                  </View>
                </View>

                <View style={styles.promoFooter}>
                  <View style={{ flex: 1, height: 1, backgroundColor: slide.accent, opacity: 0.32 }} />
                  <Text style={{ color: colors.splashMuted, fontSize: 7, fontWeight: '700', letterSpacing: 0.8 }}>OG EXPORTS</Text>
                </View>
              </Pressable>
            </BrandSlideMotion>
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
