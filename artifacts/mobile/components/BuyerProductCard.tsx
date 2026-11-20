import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { Card } from '@/components/InvestorUI';
import { useColors } from '@/hooks/useColors';
import { amount, first, type Json } from '@/lib/data';
import { categoryName, displayPrice } from '@/lib/buyer-data';
import { buyerProductSpecs, buyerProductValues } from '@/lib/buyer-product-data';
import { motionHaptic } from '@/lib/motion';

type BuyerProductCardProps = {
  product: Json;
  expanded: boolean;
  added: boolean;
  adding: boolean;
  signedIn: boolean;
  favorite: boolean;
  onToggleDetails: () => void;
  onAddToCart: () => void;
  onToggleFavorite: () => void;
};

function Tag({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'accent' | 'green' }) {
  const colors = useColors();
  const palette = tone === 'green'
    ? { background: colors.statusSuccessBackground, foreground: colors.statusSuccess, border: colors.statusSuccessBackground }
    : tone === 'accent'
      ? { background: colors.glassTintGold, foreground: colors.accent, border: colors.glassTintGold }
      : { background: colors.secondary, foreground: colors.foreground, border: colors.border };

  return (
    <View style={{
      alignSelf: 'flex-start',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.background,
      paddingHorizontal: 9,
      paddingVertical: 5,
    }}>
      <Text numberOfLines={1} style={{ color: palette.foreground, fontSize: 10, lineHeight: 14, fontWeight: '700' }}>
        {label}
      </Text>
    </View>
  );
}

function ValueGroup({ title, values }: { title: string; values: string[] }) {
  const colors = useColors();
  if (!values.length) return null;

  return (
    <View style={{ marginTop: 14 }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>
        {title}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
        {values.map((value, index) => <Tag key={`${value}-${index}`} label={value} />)}
      </View>
    </View>
  );
}

function DetailValue({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Text style={{ flex: 1, color: colors.mutedForeground, fontSize: 12 }}>{label}</Text>
      <Text style={{ flex: 1.2, color: colors.foreground, fontSize: 12, fontWeight: '600', textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

export function BuyerProductCard({
  product,
  expanded,
  added,
  adding,
  signedIn,
  favorite,
  onToggleDetails,
  onAddToCart,
  onToggleFavorite,
}: BuyerProductCardProps) {
  const colors = useColors();
  const [imageFailed, setImageFailed] = useState(false);
  const id = first(product, ['id'], 'product');
  const name = first(product, ['name'], 'Export product');
  const imageUrl = first(product, ['image_url', 'imageUrl']);
  const category = categoryName(product);
  const origin = first(product, ['origin']);
  const description = first(product, ['short_description', 'shortDescription', 'description']);
  const fullDescription = first(product, ['description'], description);
  const specs = buyerProductSpecs(product);
  const certifications = buyerProductValues(product, 'certifications');
  const paymentTerms = buyerProductValues(product, 'payment_terms');
  const deliveryTerms = buyerProductValues(product, 'delivery_terms');
  const packaging = buyerProductValues(product, 'packaging_options');
  const exportMarkets = buyerProductValues(product, 'export_markets');
  const minimumOrder = first(product, ['moq', 'min_order']);
  const status = first(product, ['status']).toLowerCase();
  const approved = status === 'approved';
  const stock = amount(product, ['stock']);

  return (
    <Card testID={`buyer-product-card-${id}`} style={{ padding: 0, marginBottom: 16, borderRadius: 22 }}>
      <View style={{ height: 190, overflow: 'hidden', backgroundColor: colors.secondary }}>
        {imageUrl && !imageFailed ? (
          <Image
            source={{ uri: imageUrl }}
            accessibilityLabel={`${name} product image`}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lightGreen }}>
            <Feather name="package" size={40} color={colors.primary} />
            <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 8 }}>OG Exports product</Text>
          </View>
        )}
        <View style={{ position: 'absolute', top: 12, left: 12 }}>
          <Tag label={category} tone="accent" />
        </View>
        {approved ? (
          <View style={{ position: 'absolute', top: 12, right: 12 }}>
            <Tag label="OG approved" tone="green" />
          </View>
        ) : null}
        <Pressable
          testID={`buyer-product-favorite-${id}`}
          accessibilityRole="button"
          accessibilityLabel={favorite ? `Remove ${name} from saved products` : `Save ${name}`}
          accessibilityState={{ selected: favorite }}
          onPress={onToggleFavorite}
          style={{ position: 'absolute', top: 49, right: 12, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
        >
          <Feather name="heart" size={17} color={favorite ? colors.accent : colors.mutedForeground} />
        </Pressable>
      </View>

      <View style={{ padding: 15 }}>
        <Text style={{ color: colors.foreground, fontSize: 19, lineHeight: 25, fontWeight: '800' }}>{name}</Text>
        {origin ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
            <Feather name="map-pin" size={12} color={colors.mutedForeground} />
            <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Origin: {origin}</Text>
          </View>
        ) : null}
        {description ? (
          <Text numberOfLines={expanded ? undefined : 2} style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18, marginTop: 10 }}>
            {description}
          </Text>
        ) : null}

        {specs.length ? (
          <View testID={`buyer-product-spec-preview-${id}`} style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, marginTop: 13, padding: 10, borderRadius: 14, backgroundColor: colors.secondary }}>
            {specs.slice(0, 4).map((spec, index) => (
              <View key={`${spec.label}-${index}`} style={{ width: '48%', minHeight: 48, justifyContent: 'center' }}>
                <Text numberOfLines={1} style={{ color: colors.mutedForeground, fontSize: 9 }}>{spec.label}</Text>
                <Text numberOfLines={2} style={{ color: colors.foreground, fontSize: 10, lineHeight: 14, fontWeight: '600', marginTop: 2 }}>{spec.value}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {certifications.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 11 }}>
            {certifications.slice(0, 2).map((certification, index) => (
              <Tag key={`${certification}-${index}`} label={certification} tone="green" />
            ))}
            {certifications.length > 2 ? <Tag label={`+${certifications.length - 2} more`} /> : null}
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 9 }}>
          {paymentTerms.slice(0, 2).map((term, index) => <Tag key={`payment-${term}-${index}`} label={term} />)}
          {deliveryTerms.slice(0, 2).map((term, index) => <Tag key={`delivery-${term}-${index}`} label={term} tone="accent" />)}
        </View>

        {(packaging.length || minimumOrder || first(product, ['lead_time'])) ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 12 }}>
            <Feather name="package" size={13} color={colors.mutedForeground} style={{ marginTop: 2 }} />
            <Text style={{ flex: 1, color: colors.mutedForeground, fontSize: 10, lineHeight: 15 }}>
              {[minimumOrder, packaging.slice(0, 2).join(' · '), first(product, ['lead_time']) ? `Lead time ${first(product, ['lead_time'])}` : ''].filter(Boolean).join('  •  ')}
            </Text>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 13, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 9, fontWeight: '700', letterSpacing: 0.6 }}>FOB PRICE</Text>
            <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '800', marginTop: 3 }}>{displayPrice(product)}</Text>
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

        {expanded ? (
          <View testID={`buyer-product-full-details-${id}`} style={{ marginTop: 15, paddingTop: 13, borderTopWidth: 1, borderTopColor: colors.border }}>
            {fullDescription ? (
              <>
                <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '800' }}>Product overview</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 19, marginTop: 7 }}>{fullDescription}</Text>
              </>
            ) : null}

            {specs.length ? (
              <View style={{ marginTop: 15 }}>
                <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '800', marginBottom: 6 }}>Complete specifications</Text>
                {specs.map((spec, index) => (
                  <DetailValue key={`${spec.label}-${index}`} label={spec.label} value={spec.value} />
                ))}
              </View>
            ) : null}

            <ValueGroup title="Certifications" values={certifications} />
            <ValueGroup title="Payment terms" values={paymentTerms} />
            <ValueGroup title="Delivery terms" values={deliveryTerms} />
            <ValueGroup title="Packaging options" values={packaging} />
            <ValueGroup title="Active export markets" values={exportMarkets} />

            {[
              ['HS code', first(product, ['hs_code'])],
              ['Shelf life', first(product, ['shelf_life'])],
              ['Storage', first(product, ['storage_instructions'])],
            ].filter(([, value]) => value).length ? (
              <View style={{ marginTop: 14 }}>
                {[
                  ['HS code', first(product, ['hs_code'])],
                  ['Shelf life', first(product, ['shelf_life'])],
                  ['Storage', first(product, ['storage_instructions'])],
                ].filter(([, value]) => value).map(([label, value]) => (
                  <DetailValue key={label} label={label} value={value} />
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 9, marginTop: 14 }}>
          <Pressable
            testID={`buyer-product-details-${id}`}
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            onPress={() => {
              motionHaptic('micro');
              onToggleDetails();
            }}
            style={({ pressed }) => ({
              minHeight: 44,
              flex: 0.85,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              borderRadius: 13,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
              opacity: pressed ? 0.82 : 1,
            })}
          >
            <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: '700' }}>{expanded ? 'Hide details' : 'Details'}</Text>
            <Feather name={expanded ? 'chevron-up' : 'chevron-right'} size={14} color={colors.foreground} />
          </Pressable>
          <Pressable
            testID={`buyer-product-add-${id}`}
            accessibilityRole="button"
            accessibilityState={{ disabled: adding || added, busy: adding }}
            disabled={adding || added}
            onPress={onAddToCart}
            style={({ pressed }) => ({
              minHeight: 44,
              flex: 1.15,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              borderRadius: 13,
              backgroundColor: colors.buttonBackground,
              opacity: adding || added ? 0.72 : pressed ? 0.86 : 1,
            })}
          >
            {adding ? <ActivityIndicator size="small" color={colors.buttonForeground} /> : (
              <Feather name={added ? 'check' : 'shopping-cart'} size={14} color={colors.buttonForeground} />
            )}
            <Text numberOfLines={1} style={{ color: colors.buttonForeground, fontSize: 11, fontWeight: '700' }}>
              {adding ? 'Adding…' : added ? 'Added to cart' : signedIn ? 'Add to cart' : 'Sign in to add'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Card>
  );
}
