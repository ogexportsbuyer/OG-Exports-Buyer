import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, PanResponder, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { BrandMark } from '@/components/BrandMark';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Action } from '@/components/InvestorUI';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { MOTION, MotionProgress, motionHaptic, useMotion } from '@/lib/motion';
import { RouteBrandBackdrop } from '@/components/GlassSurface';
import { Feather } from '@expo/vector-icons';

const slides = [
  {
    image: require('../assets/onboarding/sesame-4k.jpg'),
    imageLabel: 'White sesame seeds spilling from a burlap sack',
    eyebrow: '01  /  DISCOVER',
    title: 'A clearer way to source.',
    body: 'Explore export products with origin and specification details, then request a quote when a product fits your needs.',
    detail: 'LIVE CATALOGUE  ·  ORIGIN  ·  SPECS',
  },
  {
    image: require('../assets/onboarding/maize-4k.jpg'),
    imageLabel: 'Golden maize kernels and a fresh corn cob',
    eyebrow: '02  /  ALIGN',
    title: 'Decide with clear details.',
    body: 'Review quotation details and keep your RFQs, trade terms and order information together in your buyer account.',
    detail: 'RFQ  ·  QUOTATION  ·  TRADE TERMS',
  },
  {
    image: require('../assets/onboarding/rice-4k.jpg'),
    imageLabel: 'Long-grain basmati rice being poured into a bowl',
    eyebrow: '03  /  FOLLOW',
    title: 'Stay in step with every order.',
    body: 'Follow order progress, available trade documents and shipment updates in one place.',
    detail: 'ORDERS  ·  DOCUMENTS  ·  SHIPMENTS',
  },
];

export default function Onboarding() {
  const { completeOnboarding } = useAuth();
  const colors = useColors();
  const { reduceMotion } = useMotion();
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const opacity = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const photoOpacity = useRef(new Animated.Value(1)).current;
  const photoScale = useRef(new Animated.Value(1)).current;
  const copyOpacity = useRef(new Animated.Value(1)).current;
  const copyOffset = useRef(new Animated.Value(0)).current;
  const previousAnimatedStep = useRef(step);
  const previousPhotoStep = useRef(step);
  const swipeDirection = useRef(1);
  const slide = slides[step];
  const compact = windowHeight < 800 || windowWidth < 375;
  const horizontalPadding = windowWidth < 360 ? 18 : 24;
  const photoHeight = Math.max(
    280,
    Math.min(compact ? 410 : 530, windowHeight - (Platform.OS === 'web' ? 370 : 280)),
  );

  useEffect(() => {
    if (previousAnimatedStep.current === step) return;
    previousAnimatedStep.current = step;
    if (reduceMotion) {
      opacity.setValue(1);
      translateX.setValue(0);
      return;
    }
    opacity.setValue(0.82);
    translateX.setValue(MOTION.revealY * swipeDirection.current);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: MOTION.component, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(translateX, { toValue: 0, duration: MOTION.component, easing: MOTION.easeOut, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  }, [step, opacity, reduceMotion, translateX]);

  useEffect(() => {
    if (previousPhotoStep.current === step) return;
    previousPhotoStep.current = step;
    if (reduceMotion) {
      photoOpacity.setValue(1);
      photoScale.setValue(1);
      copyOpacity.setValue(1);
      copyOffset.setValue(0);
      return;
    }
    photoOpacity.setValue(0);
    photoScale.setValue(0.98);
    copyOpacity.setValue(0);
    copyOffset.setValue(10);
    const useNativeDriver = Platform.OS !== 'web';
    const entrance = Animated.parallel([
      Animated.timing(photoOpacity, { toValue: 1, duration: MOTION.component, easing: MOTION.easeOut, useNativeDriver }),
      Animated.spring(photoScale, { toValue: 1, ...MOTION.successSpring, useNativeDriver }),
      Animated.timing(copyOpacity, { toValue: 1, duration: MOTION.component, easing: MOTION.easeOut, useNativeDriver }),
      Animated.timing(copyOffset, { toValue: 0, duration: MOTION.component, easing: MOTION.easeOut, useNativeDriver }),
    ]);
    entrance.start();
    return () => entrance.stop();
  }, [copyOffset, copyOpacity, photoOpacity, photoScale, reduceMotion, step]);

  const swipeResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderMove: (_, gesture) => {
      translateX.setValue(Math.max(-90, Math.min(90, gesture.dx * 0.42)));
    },
    onPanResponderRelease: (_, gesture) => {
      if (Math.abs(gesture.dx) < 54 || Math.abs(gesture.dx) < Math.abs(gesture.dy) * 1.25) {
        if (reduceMotion) translateX.setValue(0);
        else Animated.spring(translateX, { toValue: 0, ...MOTION.spring, useNativeDriver: Platform.OS !== 'web' }).start();
        return;
      }
      const next = gesture.dx < 0 ? Math.min(slides.length - 1, step + 1) : Math.max(0, step - 1);
      if (next === step) {
        if (reduceMotion) translateX.setValue(0);
        else Animated.spring(translateX, { toValue: 0, ...MOTION.spring, useNativeDriver: Platform.OS !== 'web' }).start();
        return;
      }
      motionHaptic('micro');
      swipeDirection.current = gesture.dx < 0 ? 1 : -1;
      setStep(next);
    },
    onPanResponderTerminate: () => {
      if (reduceMotion) translateX.setValue(0);
      else Animated.spring(translateX, { toValue: 0, ...MOTION.spring, useNativeDriver: Platform.OS !== 'web' }).start();
    },
  }), [reduceMotion, step, translateX]);

  async function finish(destination: '/(auth)/register' | '/(auth)/login') {
    setError('');
    try {
      await completeOnboarding();
      router.replace(destination);
    } catch {
      setError('Onboarding could not be saved on this device. Please try again.');
    }
  }

  const goTo = (next: number) => {
    if (next < 0 || next >= slides.length || next === step) return;
    swipeDirection.current = next > step ? 1 : -1;
    motionHaptic('micro');
    setStep(next);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background, paddingHorizontal: horizontalPadding, paddingTop: 0, paddingBottom: 0 }]}>
      <RouteBrandBackdrop />
      <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? Math.max(insets.top, 67) : 8 }]}>
        <View style={styles.brandLockup}>
          <BrandMark width={57} />
          <View style={{ gap: 2 }}>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15, letterSpacing: 0.2 }}>OG Exports</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 10, letterSpacing: 1.25 }}>BUYER  ·  GLOBAL TRADE</Text>
          </View>
        </View>
        <View accessible accessibilityLabel={`Slide ${step + 1} of ${slides.length}`} style={[styles.stepPill, { backgroundColor: colors.secondary }]}>
          <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>{String(step + 1).padStart(2, '0')} / 03</Text>
        </View>
      </View>
      <View style={styles.content}>
        <Animated.View {...swipeResponder.panHandlers} style={{ opacity, transform: [{ translateX }] }}>
          <Animated.View style={{ opacity: photoOpacity, transform: [{ scale: photoScale }] }}>
            <View testID={`onboarding-illustration-${step + 1}`} style={[styles.photoCard, { height: photoHeight, borderColor: colors.border }]}>
              <View style={styles.photo}>
                <Image
                  source={slide.image}
                  accessible
                  accessibilityRole="image"
                  accessibilityLabel={slide.imageLabel}
                  resizeMode="cover"
                  style={styles.photoImage}
                />
                <View pointerEvents="none" style={[styles.photoTint, { backgroundColor: colors.primary, opacity: 0.16 }]} />
                <View pointerEvents="none" style={[styles.photoTop, { backgroundColor: colors.primary }]}>
                  <Feather name={step === 0 ? 'search' : step === 1 ? 'file-text' : 'navigation'} size={13} color={colors.primaryForeground} />
                  <Text style={[styles.photoEyebrow, { color: colors.primaryForeground }]}>{slide.eyebrow}</Text>
                </View>
                <Animated.View style={[styles.photoCopy, { backgroundColor: colors.primary, opacity: 0.78, transform: [{ translateY: copyOffset }] }]}>
                  <Animated.View style={{ opacity: copyOpacity }}>
                    <Text style={[styles.photoKicker, { color: colors.accent }]}>{slide.eyebrow.split('/')[1].trim()}</Text>
                    <Text accessibilityRole="header" style={[styles.title, { color: colors.primaryForeground, fontSize: compact ? 27 : 31, lineHeight: compact ? 33 : 38 }]}>
                      {slide.title}
                    </Text>
                    <Text style={[styles.body, { color: colors.primaryForeground, opacity: 0.94 }]}>{slide.body}</Text>
                    <View style={[styles.photoDetail, { borderColor: colors.primaryForeground }]}>
                      <Text style={[styles.detailText, { color: colors.primaryForeground }]}>{slide.detail}</Text>
                    </View>
                  </Animated.View>
                </Animated.View>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </View>
      <View style={styles.controlsBlock}>
        <View style={styles.controlTopline}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous onboarding page"
            testID="onboarding-back"
            accessibilityState={{ disabled: step === 0 }}
            disabled={step === 0}
            hitSlop={10}
            onPress={() => goTo(step - 1)}
            style={({ pressed }) => [styles.previousButton, { opacity: step === 0 ? 0.35 : pressed ? 0.65 : 1 }]}
          >
            <Feather name="arrow-left" size={16} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>Back</Text>
          </Pressable>
          <View accessibilityRole="tablist" accessibilityLabel="Onboarding pages" style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            {slides.map((item, index) => (
              <Pressable
                key={`page-${index + 1}`}
                accessibilityRole="tab"
                accessibilityLabel={`Page ${index + 1}: ${item.title}`}
                testID={`onboarding-page-${index + 1}`}
                accessibilityState={{ selected: index === step }}
                onPress={() => goTo(index)}
                hitSlop={8}
                style={[styles.dot, { width: index === step ? 24 : 7, backgroundColor: index === step ? colors.primary : colors.border }]}
              />
            ))}
          </View>
          <Text style={{ color: colors.mutedForeground, fontSize: 11, letterSpacing: 0.7 }}>{String(step + 1).padStart(2, '0')} <Text style={{ color: colors.border }}>/</Text> 03</Text>
        </View>
        <MotionProgress value={((step + 1) / slides.length) * 100} height={3} color={colors.primary} trackColor={colors.secondary} style={{ marginBottom: 15 }} accessibilityLabel={`Onboarding step ${step + 1} of ${slides.length}`} />
      </View>
      {error ? <Text accessibilityRole="alert" style={{ color: colors.destructive, marginBottom: 10 }}>{error}</Text> : null}
      <Action
        title={step === slides.length - 1 ? 'Finish & create account' : 'Continue'}
        icon="arrow-right"
        testID={step === slides.length - 1 ? 'onboarding-finish' : 'onboarding-continue'}
        onPress={() => step === slides.length - 1 ? void finish('/(auth)/register') : goTo(step + 1)}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Finish onboarding and sign in"
        testID="onboarding-sign-in"
        onPress={() => void finish('/(auth)/login')}
        style={({ pressed }) => [styles.signIn, { paddingBottom: Platform.OS === 'web' ? 34 : 8, opacity: pressed ? 0.65 : 1 }]}
      >
        <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Already buying with us? </Text>
        <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>Sign in</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { minHeight: 66, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  stepPill: { minHeight: 30, borderRadius: 15, paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, justifyContent: 'center' },
  photoCard: { width: '100%', borderWidth: 1, borderRadius: 24, overflow: 'hidden' },
  photo: { flex: 1, justifyContent: 'space-between', overflow: 'hidden', position: 'relative' },
  photoImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  photoTint: { ...StyleSheet.absoluteFill },
  photoTop: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', margin: 16, paddingHorizontal: 12, minHeight: 32, borderRadius: 16 },
  photoEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.1 },
  photoCopy: { margin: 10, borderRadius: 19, paddingHorizontal: 20, paddingTop: 17, paddingBottom: 16 },
  photoKicker: { fontSize: 10, lineHeight: 16, fontWeight: '700', letterSpacing: 1.6, marginBottom: 4 },
  title: { fontWeight: '700', letterSpacing: -0.5 },
  body: { fontSize: 14, lineHeight: 20, marginTop: 7 },
  photoDetail: { alignSelf: 'flex-start', borderTopWidth: StyleSheet.hairlineWidth, marginTop: 12, paddingTop: 9, paddingHorizontal: 2 },
  detailText: { fontSize: 9, fontWeight: '700', letterSpacing: 1.05 },
  controlsBlock: { marginBottom: 5 },
  controlTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 42, marginBottom: 10 },
  previousButton: { flexDirection: 'row', alignItems: 'center', gap: 7, minWidth: 66, minHeight: 42, justifyContent: 'flex-start' },
  dot: { height: 7, borderRadius: 4 },
  signIn: { minHeight: 50, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', paddingTop: 10 },
});
