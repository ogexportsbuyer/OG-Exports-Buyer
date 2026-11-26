import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { Card } from '@/components/InvestorUI';
import { BuyerProductImage } from '@/components/BuyerProductImage';
import { BuyerProductPrice } from '@/components/BuyerProductPrice';
import { useColors } from '@/hooks/useColors';
import { amount, first, type Json } from '@/lib/data';
import { categoryName } from '@/lib/buyer-data';
import { buyerProductSpecs, buyerProductValues } from '@/lib/buyer-product-data';
import { motionHaptic } from '@/lib/motion';

type BuyerProductCardProps = {
  product: Json;
  added: boolean;
  adding: boolean;
  signedIn: boolean;
  favorite: boolean;
  layout?: 'detailed' | 'grid';
  width?: number;
  onOpenDetails: () => void;
  onAddToCart: () => void;
  onToggleFavorite: () => void;
};

function Tag({ label, tone = 'neutral', compact = false }: { label: string; tone?: 'neutral' | 'accent' | 'green'; compact?: boolean }) {
  const colors = useColors();
  const palette = tone === 'green'
    ? { background: colors.statusSuccessBackground, foreground: colors.statusSuccess, border: colors.statusSuccessBackground }
    : tone === 'accent'
      ? { background: colors.glassTintGold, foreground: colors.accentText, border: colors.glassTintGold }
      : { background: colors.secondary, foreground: colors.foreground, border: colors.border };

  return (
    <View style={{
      alignSelf: 'flex-start',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.background,
      paddingHorizontal: compact ? 7 : 9,
      paddingVertical: compact ? 3 : 5,
    }}>
      <Text numberOfLines={1} style={{ color: palette.foreground, fontSize: compact ? 8 : 10, lineHeight: compact ? 11 : 14, fontWeight: '700' }}>
        {label}
      </Text>
    </View>
  );
}

export function BuyerProductCard({
  product,
  added,
  adding,
  signedIn,
  favorite,
  layout = 'detailed',
  width,
  onOpenDetails,
  onAddToCart,
  onToggleFavorite,
}: BuyerProductCardProps) {
  const colors = useColors();
  const compact = layout === 'grid';
  const id = first(product, ['id'], 'product');
  const name = first(product, ['name'], 'Export product');
  const imageUrl = first(product, ['image_url', 'imageUrl']);
  const category = categoryName(product);
  const origin = first(product, ['origin']);
  const description = first(product, ['short_description', 'shortDescription', 'description']);
  const specs = buyerProductSpecs(product);
  const certifications = buyerProductValues(product, 'certifications');
  const paymentTerms = buyerProductValues(product, 'payment_terms');
  const deliveryTerms = buyerProductValues(product, 'delivery_terms');
  const packaging = buyerProductValues(product, 'packaging_options');
  const minimumOrder = first(product, ['moq', 'min_order']);
  const status = first(product, ['status']).toLowerCase();
  const approved = status === 'approved';
  const stock = amount(product, ['stock']);
  const imageHeight = compact ? Math.min(156, Math.round((width ?? 172) * 0.82)) : 190;

  return (
    <Card
      testID={`buyer-product-card-${id}`}
      style={{
        width,
        padding: 0,
        marginBottom: compact ? 0 : 16,
        borderRadius: compact ? colors.radius + 1 : 22,
        overflow: compact ? 'hidden' : 'visible',
      }}
    >
      <Pressable
        testID={`buyer-product-open-card-${id}`}
        accessible={false}
        onPress={() => {
          motionHaptic('micro');
          onOpenDetails();
        }}
        style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
      >
        <View style={{ height: imageHeight, overflow: 'hidden', backgroundColor: colors.secondary }}>
          <BuyerProductImage
            uri={imageUrl}
            label={`${name} product image`}
            fallbackLabel="OG Exports product"
            priority="low"
            style={{ width: '100%', height: '100%' }}
          />
          <View style={{ position: 'absolute', top: 12, left: 12 }}>
            <Tag label={category} tone="accent" compact={compact} />
          </View>
          {approved ? (
            <View style={{ position: 'absolute', top: 12, right: 12 }}>
              <Tag label={compact ? 'Approved' : 'OG approved'} tone="green" compact={compact} />
            </View>
          ) : null}
          <Pressable
            testID={`buyer-product-favorite-${id}`}
            accessibilityRole="button"
            accessibilityLabel={favorite ? `Remove ${name} from saved products` : `Save ${name}`}
            accessibilityState={{ selected: favorite }}
            onPress={(event) => {
              event.stopPropagation();
              onToggleFavorite();
            }}
            style={{ position: 'absolute', top: compact ? 44 : 49, right: 12, width: compact ? 32 : 36, height: compact ? 32 : 36, borderRadius: compact ? 16 : 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
          >
            <Feather name="heart" size={compact ? 15 : 17} color={favorite ? colors.accent : colors.mutedForeground} />
          </Pressable>
        </View>

      <View style={{ paddingHorizontal: compact ? 11 : 15, paddingTop: compact ? 11 : 15 }}>
        <Text numberOfLines={compact ? 2 : undefined} style={{ color: colors.foreground, fontSize: compact ? 13 : 19, lineHeight: compact ? 18 : 25, fontWeight: '800', minHeight: compact ? 36 : undefined }}>{name}</Text>
        {origin ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
            <Feather name="map-pin" size={compact ? 10 : 12} color={colors.mutedForeground} />
            <Text numberOfLines={1} style={{ color: colors.mutedForeground, fontSize: compact ? 9 : 11, flex: 1 }}>Origin: {origin}</Text>
          </View>
        ) : null}
        {!compact && description ? (
          <Text numberOfLines={2} style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18, marginTop: 10 }}>
            {description}
          </Text>
        ) : null}

        {!compact && specs.length ? (
          <View testID={`buyer-product-spec-preview-${id}`} style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, marginTop: 13, padding: 10, borderRadius: 14, backgroundColor: colors.secondary }}>
            {specs.slice(0, 4).map((spec, index) => (
              <View key={`${spec.label}-${index}`} style={{ width: '48%', minHeight: 48, justifyContent: 'center' }}>
                <Text numberOfLines={1} style={{ color: colors.mutedForeground, fontSize: 9 }}>{spec.label}</Text>
                <Text numberOfLines={2} style={{ color: colors.foreground, fontSize: 10, lineHeight: 14, fontWeight: '600', marginTop: 2 }}>{spec.value}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {!compact && certifications.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 11 }}>
            {certifications.slice(0, 2).map((certification, index) => (
              <Tag key={`${certification}-${index}`} label={certification} tone="green" />
            ))}
            {certifications.length > 2 ? <Tag label={`+${certifications.length - 2} more`} /> : null}
          </View>
        ) : null}

        {!compact ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 9 }}>
          {paymentTerms.slice(0, 2).map((term, index) => <Tag key={`payment-${term}-${index}`} label={term} />)}
          {deliveryTerms.slice(0, 2).map((term, index) => <Tag key={`delivery-${term}-${index}`} label={term} tone="accent" />)}
        </View> : null}

        {!compact && (packaging.length || minimumOrder || first(product, ['lead_time'])) ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 12 }}>
            <Feather name="package" size={13} color={colors.mutedForeground} style={{ marginTop: 2 }} />
            <Text style={{ flex: 1, color: colors.mutedForeground, fontSize: 10, lineHeight: 15 }}>
              {[minimumOrder, packaging.slice(0, 2).join(' · '), first(product, ['lead_time']) ? `Lead time ${first(product, ['lead_time'])}` : ''].filter(Boolean).join('  •  ')}
            </Text>
          </View>
        ) : null}

        {compact ? (
          <View style={{ marginTop: 9, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 8, fontWeight: '800', letterSpacing: 0.5 }}>FOB PRICE</Text>
            <View style={{ marginTop: 4 }}>
              <BuyerProductPrice product={product} compact />
            </View>
            {minimumOrder ? <Text numberOfLines={1} style={{ color: colors.mutedForeground, fontSize: 9, marginTop: 3 }}>MOQ: {minimumOrder}</Text> : null}
          </View>
        ) : (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 13, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 9, fontWeight: '700', letterSpacing: 0.6 }}>PRODUCT PRICE</Text>
            <View style={{ marginTop: 4 }}>
              <BuyerProductPrice product={product} />
            </View>
          </View>
          {minimumOrder ? (
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 9, fontWeight: '700', letterSpacing: 0.6 }}>MINIMUM ORDER</Text>
              <Text numberOfLines={2} style={{ color: colors.foreground, fontSize: 11, lineHeight: 15, fontWeight: '600', textAlign: 'right', marginTop: 3 }}>{minimumOrder}</Text>
            </View>
          ) : null}
          {stock !== null ? (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 9, fontWeight: '700', letterSpacing: 0.6 }}>STOCK</Text>
              <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: '700', marginTop: 3 }}>{stock}</Text>
            </View>
          ) : null}
        </View>
        )}

      </View>
      </Pressable>

      <View style={{ paddingHorizontal: compact ? 11 : 15, paddingBottom: compact ? 11 : 15 }}>
        <View style={{ flexDirection: 'row', gap: compact ? 6 : 9, marginTop: compact ? 10 : 14 }}>
          <Pressable
            testID={`buyer-product-details-${id}`}
            accessibilityRole="button"
            accessibilityLabel={`Open details for ${name}`}
            onPress={() => {
              motionHaptic('micro');
              onOpenDetails();
            }}
            style={({ pressed }) => ({
              minHeight: compact ? 38 : 44,
              flex: compact ? 0.78 : 0.85,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: compact ? 3 : 6,
              borderRadius: compact ? 11 : 13,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
              opacity: pressed ? 0.82 : 1,
            })}
          >
            <Text style={{ color: colors.foreground, fontSize: compact ? 9 : 11, fontWeight: '700' }}>Details</Text>
            <Feather name="chevron-right" size={compact ? 12 : 14} color={colors.foreground} />
          </Pressable>
          <Pressable
            testID={`buyer-product-add-${id}`}
            accessibilityRole="button"
            accessibilityHint={signedIn ? 'Adds this product to your buyer cart.' : 'Saves this product in your guest cart. Sign-in is only needed when submitting your order.'}
            accessibilityState={{ disabled: adding || added, busy: adding }}
            disabled={adding || added}
            onPress={onAddToCart}
            style={({ pressed }) => ({
              minHeight: compact ? 38 : 44,
              flex: compact ? 1.22 : 1.15,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: compact ? 4 : 7,
              borderRadius: compact ? 11 : 13,
              backgroundColor: colors.buttonBackground,
              opacity: adding || added ? 0.72 : pressed ? 0.86 : 1,
            })}
          >
            {adding ? <ActivityIndicator size="small" color={colors.buttonForeground} /> : (
              <Feather name={added ? 'check' : 'shopping-cart'} size={compact ? 12 : 14} color={colors.buttonForeground} />
            )}
            <Text numberOfLines={1} style={{ color: colors.buttonForeground, fontSize: compact ? 9 : 11, fontWeight: '700' }}>
              {adding ? 'Adding…' : added ? (compact ? 'Added' : 'Added to cart') : (compact ? 'Add' : 'Add to cart')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Card>
  );
}
