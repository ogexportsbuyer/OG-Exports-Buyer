import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';

/** Keeps native page headers visibly blended into the app's teal-to-gold wash. */
export function BrandHeaderBackground() {
  const colors = useColors();
  return (
    <LinearGradient
      pointerEvents="none"
      accessible={false}
      colors={[colors.glassTintTeal, colors.background, colors.glassTintGold]}
      locations={[0, 0.48, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  );
}
