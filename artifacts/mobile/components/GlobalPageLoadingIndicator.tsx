import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, View, useWindowDimensions } from 'react-native';
import { useIsFetching } from '@tanstack/react-query';
import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const { width } = useWindowDimensions();
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

  useEffect(() => {
    if (!visible) {
      progress.stopAnimation();
      progress.setValue(0);
      return;
    }
    if (reduceMotion) {
      progress.setValue(0.5);
      return;
    }

    const animation = Animated.loop(Animated.timing(progress, {
      toValue: 1,
      duration: 1050,
      easing: Easing.linear,
      useNativeDriver: Platform.OS !== 'web',
    }));
    animation.start();
    return () => animation.stop();
  }, [progress, reduceMotion, visible]);

  if (!visible) return null;

  const segmentWidth = Math.max(76, width * 0.34);
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-segmentWidth, width],
  });

  return (
    <View
      pointerEvents="none"
      accessibilityRole="progressbar"
      accessibilityLabel="Loading page"
      testID="global-page-loading-indicator"
      style={{
        position: 'absolute',
        top: insets.top,
        left: 0,
        right: 0,
        height: 3,
        overflow: 'hidden',
        backgroundColor: colors.secondary,
        zIndex: 999,
        elevation: 10,
      }}
    >
      <Animated.View
        style={{
          width: segmentWidth,
          height: '100%',
          borderRadius: 3,
          backgroundColor: colors.accent,
          transform: [{ translateX }],
        }}
      />
    </View>
  );
}
