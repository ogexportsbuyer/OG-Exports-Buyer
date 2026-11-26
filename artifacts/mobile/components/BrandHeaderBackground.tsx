import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';

/** Reuses the app's teal-to-gold ambient wash behind native page headers. */
export function BrandHeaderBackground() {
  const colors = useColors();
  return (
    <LinearGradient
      pointerEvents="none"
      accessible={false}
      colors={[colors.canvasWashTeal, colors.background, colors.canvasWashGold]}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  );
}
