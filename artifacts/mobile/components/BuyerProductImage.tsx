import React, { useState } from 'react';
import { Image as ExpoImage } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { resolveBuyerProductImageUrl } from '@/lib/buyer-product-data';

type BuyerProductImageProps = {
  uri?: string | null;
  label: string;
  style: StyleProp<ViewStyle>;
  priority?: 'low' | 'normal' | 'high';
  fallbackIcon?: 'package' | 'grid';
  fallbackLabel?: string;
  testID?: string;
};

/**
 * Displays public catalogue photos from their API/CDN URL and reuses Expo's
 * memory/disk cache so revisiting products avoids downloading the same image.
 */
export function BuyerProductImage({
  uri,
  label,
  style,
  priority = 'low',
  fallbackIcon = 'package',
  fallbackLabel,
  testID,
}: BuyerProductImageProps) {
  const colors = useColors();
  const { apiOrigin } = useAuth();
  const imageUrl = resolveBuyerProductImageUrl(uri ?? '', apiOrigin);
  const [loadedUrl, setLoadedUrl] = useState('');
  const [failedUrl, setFailedUrl] = useState('');
  const hasLoaded = imageUrl !== '' && loadedUrl === imageUrl;
  const hasFailed = imageUrl !== '' && failedUrl === imageUrl;
  const showImage = imageUrl !== '' && !hasFailed;

  return (
    <View
      testID={testID}
      accessible={false}
      pointerEvents="none"
      style={[style, { overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary }]}
    >
      {showImage ? (
        <ExpoImage
          source={{ uri: imageUrl }}
          accessibilityLabel={label}
          alt={label}
          contentFit="cover"
          cachePolicy="memory-disk"
          priority={priority}
          loading="lazy"
          transition={140}
          recyclingKey={imageUrl}
          onLoad={() => setLoadedUrl(imageUrl)}
          onError={() => setFailedUrl(imageUrl)}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {!hasLoaded || !showImage ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lightGreen }]}
        >
          <Feather name={fallbackIcon} size={25} color={colors.primary} />
          {fallbackLabel && (!imageUrl || hasFailed) ? (
            <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 7, textAlign: 'center' }}>
              {fallbackLabel}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
