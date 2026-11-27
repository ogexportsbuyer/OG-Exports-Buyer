import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useIsFetching } from '@tanstack/react-query';
import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useColors } from '@/hooks/useColors';
import { useMotion } from '@/lib/motion';

const ROUTE_TRANSITION_MS = 420;
const SHOW_DELAY_MS = 90;
const HIDE_DELAY_MS = 180;

export function GlobalPageLoadingIndicator() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { reduceMotion } = useMotion();
  const pathname = usePathname();
  const progress = useRef(new Animated.Value(0)).current;
  const previousPath = useRef(pathname);
  const [routeLoading, setRouteLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const hasInitialPageFetch = useIsFetching({
    predicate: query => query.state.status === 'pending',
  }) > 0;

  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    setRouteLoading(true);
    const timer = setTimeout(() => setRouteLoading(false), ROUTE_TRANSITION_MS);
    return () => clearTimeout(timer);
  }, [pathname]);

  const shouldShow = routeLoading || hasInitialPageFetch;
  useEffect(() => {
    const timer = setTimeout(() => setVisible(shouldShow), shouldShow ? SHOW_DELAY_MS : HIDE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [shouldShow]);

  const rotation = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const shimmerOpacity = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.45, 1, 0.45],
  });

  useEffect(() => {
    if (!visible) {
      progress.stopAnimation();
      progress.setValue(0);
      return;
    }
    if (reduceMotion) {
      progress.setValue(0.36);
      return;
    }

    const animation = Animated.loop(Animated.timing(progress, {
      toValue: 1,
      duration: 1250,
      easing: Easing.linear,
      useNativeDriver: Platform.OS !== 'web',
    }));
    animation.start();
    return () => animation.stop();
  }, [progress, reduceMotion, visible]);

  if (!visible) return null;

  return (
    <View
      pointerEvents="none"
      accessibilityRole="progressbar"
      accessibilityLabel="Loading page"
      testID="global-page-loading-indicator"
      style={{
        position: 'absolute',
        top: insets.top,
        bottom: insets.bottom,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        elevation: 10,
      }}
    >
      <View
        testID="global-page-loading-content"
        style={{ alignItems: 'center' }}
      >
        <View
          style={{
            width: 70,
            height: 70,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 35,
          }}
        >
          <Animated.View
            testID="global-page-loading-spinner"
            style={{
              position: 'absolute',
              width: 58,
              height: 58,
              borderRadius: 29,
              borderWidth: 2,
              borderColor: colors.border,
              borderTopColor: colors.accent,
              borderRightColor: colors.accent,
              transform: [{ rotate: rotation }],
            }}
          />
          <View
            style={{
              width: 38,
              height: 38,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name="package" size={17} color={colors.primary} />
          </View>
          <Animated.View
            style={{
              position: 'absolute',
              top: 5,
              right: 12,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.accent,
              opacity: shimmerOpacity,
            }}
          />
        </View>
        <Text style={{ marginTop: 11, color: colors.foreground, fontSize: 12, fontWeight: '700', letterSpacing: 0.2 }}>
          Loading page
        </Text>
      </View>
    </View>
  );
}
