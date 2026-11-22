import React from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAppPreferences } from '@/context/AppPreferencesContext';
import { translateUi } from '@/lib/strings';
import { useMotion } from '@/lib/motion';
import { TabBarBehaviorProvider, useTabBarBehavior } from '@/context/TabBarBehaviorContext';
import { GlassLayers } from '@/components/GlassSurface';

const buyerTabs = [
  ['buyer-home', 'Home', 'home', 'house', 'house.fill'],
  ['buyer-products', 'Product', 'grid', 'square.grid.2x2', 'square.grid.2x2.fill'],
  ['dashboard', 'Dashboard', 'bar-chart-2', 'chart.bar', 'chart.bar.fill'],
  ['buyer-messages', 'Messages', 'message-circle', 'bubble.left.and.bubble.right', 'bubble.left.and.bubble.right.fill'],
  ['buyer-profile', 'Profile', 'user', 'person.crop.circle', 'person.crop.circle.fill'],
] as const;

type BuyerTab = typeof buyerTabs[number];

function BuyerTabIcon({
  focused,
  featherName,
  iosName,
  iosSelectedName,
  isDashboard,
}: {
  focused: boolean;
  featherName: BuyerTab[2];
  iosName: BuyerTab[3];
  iosSelectedName: BuyerTab[4];
  isDashboard: boolean;
}) {
  const colors = useColors();
  const iconColor = focused ? colors.accent : colors.mutedForeground;
  const icon = Platform.OS === 'ios' && !isDashboard
    ? <SymbolView name={focused ? iosSelectedName : iosName} tintColor={iconColor} size={22} />
    : <Feather name={featherName as React.ComponentProps<typeof Feather>['name']} size={21} color={iconColor} />;

  return <View style={styles.tabIconFrame}>{icon}</View>;
}

const styles = StyleSheet.create({
  tabIconFrame: {
    width: 44,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

function NativeLayout() {
  const colors = useColors();
  const { visible } = useTabBarBehavior();
  const { preferences } = useAppPreferences();
  const t = (value: string) => translateUi(value, preferences.language);
  return (
    <NativeTabs
      tintColor={colors.accent}
      iconColor={{ default: colors.mutedForeground, selected: colors.accent }}
      labelStyle={{ default: { color: colors.mutedForeground }, selected: { color: colors.accent, fontWeight: '600' } }}
      backgroundColor={colors.card}
      hidden={!visible}
      minimizeBehavior="never"
    >
      <NativeTabs.Trigger name="buyer-home"><NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} /><NativeTabs.Trigger.Label>{t('Home')}</NativeTabs.Trigger.Label></NativeTabs.Trigger>
      <NativeTabs.Trigger name="buyer-products"><NativeTabs.Trigger.Icon sf={{ default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }} /><NativeTabs.Trigger.Label>{t('Product')}</NativeTabs.Trigger.Label></NativeTabs.Trigger>
      <NativeTabs.Trigger name="dashboard"><NativeTabs.Trigger.Icon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} md={{ default: 'bar_chart', selected: 'bar_chart' }} /><NativeTabs.Trigger.Label>{t('Dashboard')}</NativeTabs.Trigger.Label></NativeTabs.Trigger>
      <NativeTabs.Trigger name="buyer-messages"><NativeTabs.Trigger.Icon sf={{ default: 'bubble.left.and.bubble.right', selected: 'bubble.left.and.bubble.right.fill' }} /><NativeTabs.Trigger.Label>{t('Messages')}</NativeTabs.Trigger.Label></NativeTabs.Trigger>
      <NativeTabs.Trigger name="buyer-profile"><NativeTabs.Trigger.Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} /><NativeTabs.Trigger.Label>{t('Profile')}</NativeTabs.Trigger.Label></NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicLayout() {
  const colors = useColors();
  const { preferences, resolvedAppearance } = useAppPreferences();
  const insets = useSafeAreaInsets();
  const { visible } = useTabBarBehavior();
  const { reduceMotion } = useMotion();
  const isWeb = Platform.OS === 'web';
  const isAndroid = Platform.OS === 'android';
  const translateY = React.useRef(new Animated.Value(0)).current;
  const opacity = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (reduceMotion) {
      translateY.setValue(visible ? 0 : 112);
      opacity.setValue(visible ? 1 : 0);
      return;
    }
    Animated.parallel([
      Animated.timing(translateY, { toValue: visible ? 0 : 112, duration: visible ? 240 : 190, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: visible ? 1 : 0, duration: visible ? 200 : 150, useNativeDriver: true }),
    ]).start();
  }, [opacity, reduceMotion, translateY, visible]);

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.mutedForeground,
      tabBarStyle: {
        position: 'absolute', left: 14, right: 14,
        bottom: isWeb ? 0 : isAndroid ? Math.max(insets.bottom - 4, 8) : Math.max(insets.bottom, 10),
        height: isWeb ? 84 : 70,
        paddingTop: isWeb ? 2 : 4,
        paddingBottom: isWeb ? 34 : 0,
        borderRadius: isAndroid ? 35 : 0,
        backgroundColor: 'transparent',
        borderWidth: isAndroid ? StyleSheet.hairlineWidth : 0,
        borderColor: colors.border,
        elevation: isAndroid ? 9 : 0,
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isAndroid ? 0.16 : 0.08,
        shadowRadius: isAndroid ? 16 : 12,
        opacity,
        transform: [{ translateY }],
      },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 1 },
      tabBarBackground: () => isAndroid
        ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: 35, overflow: 'hidden' }]}>
            <BlurView intensity={36} tint={resolvedAppearance} experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card, opacity: 0.8 }]} />
            <GlassLayers />
            <View style={[StyleSheet.absoluteFill, { borderRadius: 35, borderWidth: 1, borderColor: colors.border }]} />
          </View>
        : <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {Platform.OS === 'ios' ? <BlurView intensity={85} tint={resolvedAppearance} style={[StyleSheet.absoluteFill, { bottom: isWeb ? 34 : 0 }]} /> : null}
            <View style={[StyleSheet.absoluteFill, {
              bottom: isWeb ? 34 : 0,
              backgroundColor: colors.card,
              opacity: isWeb ? 1 : 0.84,
              borderWidth: 1,
              borderColor: colors.glassBorder,
              borderRadius: 30,
              overflow: 'hidden',
              ...(isWeb ? { boxShadow: `0 -6px 20px ${colors.shadow}` } : {}),
            }]}>
              <GlassLayers />
            </View>
          </View>,
    }}>
      {buyerTabs.map(([name, title, icon, ios, iosSelected]) => (
        <Tabs.Screen key={name} name={name} options={{
          title: translateUi(title, preferences.language),
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <BuyerTabIcon
              focused={focused}
              featherName={icon}
              iosName={ios}
              iosSelectedName={iosSelected}
              isDashboard={name === 'dashboard'}
            />
          ),
        }} />
      ))}
      <Tabs.Screen name="buyer-orders" options={{ href: null }} />
    </Tabs>
  );
}

export default function BuyerTabLayout() {
  return (
    <TabBarBehaviorProvider>
      {isLiquidGlassAvailable() ? <NativeLayout /> : <ClassicLayout />}
    </TabBarBehaviorProvider>
  );
}
