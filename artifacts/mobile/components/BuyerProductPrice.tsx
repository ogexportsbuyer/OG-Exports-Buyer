import React from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useColors } from '@/hooks/useColors';
import { buyerPriceDetails } from '@/lib/buyer-data';
import { formatFobPrice } from '@/lib/format-fob-price';
import type { Json } from '@/lib/data';

export function BuyerProductPrice({
  product,
  compact = false,
}: {
  product: Json;
  compact?: boolean;
}) {
  const colors = useColors();
  const price = buyerPriceDetails(product);

  if (price.salePrice === null || price.salePrice <= 0) {
    return (
      <Text numberOfLines={1} style={{ color: colors.primary, fontSize: compact ? 11 : 14, fontWeight: '800' }}>
        Request a quote
      </Text>
    );
  }

  const discounted = price.discountPercentage > 0 && price.discountAmountPerUnit > 0;
  const badgeFontSize = compact ? 8 : 9;

  return (
    <View style={{ gap: compact ? 3 : 5 }}>
      {discounted ? (
        <Animated.View
          entering={FadeInDown.duration(260)}
          accessibilityLabel={`${price.discountPercentage}% discount`}
          style={{
            alignSelf: 'flex-start',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.glassTintGold,
            backgroundColor: colors.glassTintGold,
            paddingHorizontal: compact ? 7 : 9,
            paddingVertical: compact ? 2 : 4,
          }}
        >
          <Text style={{ color: colors.accentText, fontSize: badgeFontSize, fontWeight: '900', letterSpacing: 0.25 }}>
            {price.discountPercentage}% OFF
          </Text>
        </Animated.View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: compact ? 4 : 6 }}>
        {discounted && price.basePrice !== null ? (
          <Text
            numberOfLines={1}
            style={{ color: colors.mutedForeground, fontSize: compact ? 8 : 10, textDecorationLine: 'line-through' }}
          >
            {formatFobPrice(price.basePrice, price.currency, price.unitOfMeasure)}
          </Text>
        ) : null}
        <Text
          numberOfLines={2}
          style={{ color: colors.primary, fontSize: compact ? 10 : 14, lineHeight: compact ? 14 : 19, fontWeight: '800' }}
        >
          {formatFobPrice(price.salePrice, price.currency, price.unitOfMeasure)}
        </Text>
      </View>
      {discounted ? (
        <Text style={{ color: colors.mutedForeground, fontSize: compact ? 8 : 10, fontWeight: '600' }}>
          Save {formatFobPrice(price.discountAmountPerUnit, price.currency)} per {price.unitOfMeasure}
        </Text>
      ) : null}
    </View>
  );
}
