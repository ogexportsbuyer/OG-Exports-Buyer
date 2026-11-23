import React, { useMemo, useState } from 'react';
import { Modal, Pressable, View, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocalizedText as Text, LocalizedTextInput as TextInput } from '@/components/LocalizedText';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { GlassPopupSurface } from '@/components/GlassPopupSurface';
import { useColors } from '@/hooks/useColors';
import {
  buyerProductFacetValues,
  buyerProductFilterCount,
  emptyBuyerProductFilters,
  filterBuyerProducts,
  mergeBuyerProductCategories,
  type BuyerProductCategory,
  type BuyerProductFacet,
  type BuyerProductFilterState,
} from '@/lib/buyer-product-filters';
import { type Json } from '@/lib/data';

const PRODUCT_TYPES = ['Raw', 'Processed', 'Semi-Processed', 'Finished'];
const SUPPLIER_TYPES = ['Manufacturer', 'Producer', 'Direct Exporter'];
const SHIPMENT_METHODS = ['Sea', 'Air', 'Land'];
const AVAILABILITY_OPTIONS = ['Ready Stock', 'Made to Order'];
const TRADE_TERMS = ['FOB', 'CIF', 'CFR', 'EXW'];

type Props = {
  visible: boolean;
  products: Json[];
  apiCategories: Json[];
  search: string;
  initialFilters: BuyerProductFilterState;
  onClose: () => void;
  onApply: (filters: BuyerProductFilterState) => void;
};

function SectionTitle({ icon, title, detail }: { icon: React.ComponentProps<typeof Feather>['name']; title: string; detail?: string }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 12, marginTop: 2 }}>
      <View style={{ width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lightGreen }}>
        <Feather name={icon} size={14} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '800' }}>{title}</Text>
        {detail ? <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 2 }}>{detail}</Text> : null}
      </View>
    </View>
  );
}

function ChoiceGroup({
  label,
  options,
  value,
  onChange,
  testID,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  testID: string;
}) {
  const colors = useColors();
  if (options.length === 0) return null;
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: '700', marginBottom: 7 }}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
        <Pressable
          testID={`${testID}-any`}
          accessibilityRole="radio"
          accessibilityState={{ checked: !value }}
          onPress={() => onChange('')}
          style={{
            minHeight: 33,
            justifyContent: 'center',
            borderRadius: 17,
            borderWidth: 1,
            borderColor: !value ? colors.primary : colors.border,
            paddingHorizontal: 12,
            backgroundColor: !value ? colors.lightGreen : colors.card,
          }}
        >
          <Text style={{ color: !value ? colors.primary : colors.mutedForeground, fontSize: 10, fontWeight: '700' }}>Any</Text>
        </Pressable>
        {options.map(option => {
          const selected = value === option;
          return (
            <Pressable
              key={option}
              testID={`${testID}-${option.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => onChange(selected ? '' : option)}
              style={{
                minHeight: 33,
                justifyContent: 'center',
                borderRadius: 17,
                borderWidth: 1,
                borderColor: selected ? colors.primary : colors.border,
                paddingHorizontal: 12,
                backgroundColor: selected ? colors.lightGreen : colors.card,
              }}
            >
              <Text numberOfLines={1} style={{ color: selected ? colors.primary : colors.foreground, fontSize: 10, fontWeight: selected ? '800' : '600' }}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function RangeInput({
  label,
  value,
  onChangeText,
  placeholder,
  testID,
  prefix,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  testID: string;
  prefix?: string;
}) {
  const colors = useColors();
  return (
    <View style={{ flex: 1, gap: 5 }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 9, fontWeight: '700' }}>{label}</Text>
      <View style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 10 }}>
        {prefix ? <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: '700', marginRight: 4 }}>{prefix}</Text> : null}
        <TextInput
          testID={testID}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType="decimal-pad"
          autoCorrect={false}
          style={{ flex: 1, minHeight: 42, color: colors.foreground, fontSize: 12, outlineWidth: 0 }}
        />
      </View>
    </View>
  );
}

function TextFilter({
  label,
  value,
  onChangeText,
  placeholder,
  testID,
  icon,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  testID: string;
  icon: React.ComponentProps<typeof Feather>['name'];
}) {
  const colors = useColors();
  return (
    <View style={{ gap: 6, marginBottom: 14 }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: '700' }}>{label}</Text>
      <View style={{ minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 11 }}>
        <Feather name={icon} size={14} color={colors.mutedForeground} />
        <TextInput
          testID={testID}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
          autoCorrect={false}
          style={{ flex: 1, minHeight: 44, color: colors.foreground, fontSize: 12, outlineWidth: 0 }}
        />
        {value ? (
          <Pressable accessibilityRole="button" accessibilityLabel={`Clear ${label}`} onPress={() => onChangeText('')} hitSlop={8}>
            <Feather name="x-circle" size={15} color={colors.mutedForeground} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function AvailabilitySwitch({
  label,
  detail,
  value,
  onChange,
  testID,
}: {
  label: string;
  detail: string;
  value: boolean;
  onChange: (value: boolean) => void;
  testID: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={({ pressed }) => ({
        minHeight: 54,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        opacity: pressed ? 0.78 : 1,
      })}
    >
      <View style={{ width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: value ? colors.lightGreen : colors.secondary }}>
        <Feather name={value ? 'check' : 'minus'} size={14} color={value ? colors.primary : colors.mutedForeground} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: '700' }}>{label}</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 9, marginTop: 2 }}>{detail}</Text>
      </View>
      <View style={{ width: 38, height: 22, borderRadius: 11, justifyContent: 'center', paddingHorizontal: 3, backgroundColor: value ? colors.primary : colors.border }}>
        <View style={{ alignSelf: value ? 'flex-end' : 'flex-start', width: 16, height: 16, borderRadius: 8, backgroundColor: colors.card }} />
      </View>
    </Pressable>
  );
}

function categoryIsSelected(category: BuyerProductCategory, value: string) {
  return category.name === value;
}

export function BuyerProductFilterSheet({ visible, products, apiCategories, search, initialFilters, onClose, onApply }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [filters, setFilters] = useState<BuyerProductFilterState>(() => ({ ...initialFilters }));
  const categoryTree = useMemo(() => mergeBuyerProductCategories(apiCategories), [apiCategories]);
  const selectedCategory = categoryTree.find(item => item.name === filters.category);
  const resultCount = filterBuyerProducts(products, filters, search).length;
  const activeCount = buyerProductFilterCount(filters);
  const facets = (facet: BuyerProductFacet) => buyerProductFacetValues(products, facet);

  function update<K extends keyof BuyerProductFilterState>(key: K, value: BuyerProductFilterState[K]) {
    setFilters(current => ({ ...current, [key]: value }));
  }

  function selectCategory(value: string) {
    setFilters(current => ({ ...current, category: value, subcategory: '' }));
  }

  function selectSubcategory(value: string) {
    update('subcategory', value);
  }

  const body = (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 3, paddingBottom: 18 }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      bottomOffset={82}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ padding: 14, marginBottom: 12, borderRadius: 17, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
        <SectionTitle icon="grid" title="Product category" detail="Choose a category, then narrow it to a subcategory." />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
          <Pressable
            testID="buyer-filter-category-all"
            accessibilityRole="radio"
            accessibilityState={{ checked: !filters.category }}
            onPress={() => selectCategory('')}
            style={{ width: '48%', minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 12, borderWidth: 1, borderColor: !filters.category ? colors.primary : colors.border, backgroundColor: !filters.category ? colors.lightGreen : colors.card, paddingHorizontal: 10 }}
          >
            <Feather name="layers" size={13} color={!filters.category ? colors.primary : colors.mutedForeground} />
            <Text style={{ flex: 1, color: !filters.category ? colors.primary : colors.foreground, fontSize: 10, fontWeight: '700' }}>All Products</Text>
          </Pressable>
          {categoryTree.map(category => {
            const selected = categoryIsSelected(category, filters.category);
            return (
              <Pressable
                key={category.name}
                testID={`buyer-filter-category-${category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => selectCategory(selected ? '' : category.name)}
                style={{ width: '48%', minHeight: 42, justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.lightGreen : colors.card, paddingHorizontal: 10 }}
              >
                <Text numberOfLines={2} style={{ color: selected ? colors.primary : colors.foreground, fontSize: 10, lineHeight: 14, fontWeight: selected ? '800' : '600' }}>
                  {category.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {selectedCategory ? (
          <View style={{ marginTop: 13 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: '700', marginBottom: 7 }}>SUBCATEGORY</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
              <Pressable
                testID="buyer-filter-subcategory-all"
                accessibilityRole="radio"
                accessibilityState={{ checked: !filters.subcategory }}
                onPress={() => selectSubcategory('')}
                style={{ minHeight: 32, justifyContent: 'center', borderRadius: 16, borderWidth: 1, borderColor: !filters.subcategory ? colors.primary : colors.border, backgroundColor: !filters.subcategory ? colors.lightGreen : colors.card, paddingHorizontal: 11 }}
              >
                <Text style={{ color: !filters.subcategory ? colors.primary : colors.foreground, fontSize: 9, fontWeight: '700' }}>All in category</Text>
              </Pressable>
              {selectedCategory.subcategories.map(subcategory => {
                const active = filters.subcategory === subcategory;
                return (
                  <Pressable
                    key={subcategory}
                    testID={`buyer-filter-subcategory-${subcategory.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    onPress={() => selectSubcategory(active ? '' : subcategory)}
                    style={{ minHeight: 32, justifyContent: 'center', borderRadius: 16, borderWidth: 1, borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.lightGreen : colors.card, paddingHorizontal: 11 }}
                  >
                    <Text style={{ color: active ? colors.primary : colors.foreground, fontSize: 9, fontWeight: active ? '800' : '600' }}>{subcategory}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>

      <View style={{ padding: 14, marginBottom: 12, borderRadius: 17, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
        <SectionTitle icon="map-pin" title="Origin & supplier" detail="Filter by source country, supplier location and product type." />
        <ChoiceGroup label="COUNTRY OF ORIGIN" options={facets('origin')} value={filters.origin} onChange={value => update('origin', value)} testID="buyer-filter-origin" />
        <TextFilter label="SUPPLIER LOCATION" value={filters.supplierLocation} onChangeText={value => update('supplierLocation', value)} placeholder="City, region or country" testID="buyer-filter-supplier-location" icon="map" />
        <ChoiceGroup label="PRODUCT TYPE" options={Array.from(new Set([...PRODUCT_TYPES, ...facets('productType')]))} value={filters.productType} onChange={value => update('productType', value)} testID="buyer-filter-product-type" />
        <ChoiceGroup label="SUPPLIER TYPE" options={Array.from(new Set([...SUPPLIER_TYPES, ...facets('supplierType')]))} value={filters.supplierType} onChange={value => update('supplierType', value)} testID="buyer-filter-supplier-type" />
      </View>

      <View style={{ padding: 14, marginBottom: 12, borderRadius: 17, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
        <SectionTitle icon="package" title="Order size & supply" detail="Set minimum order and available capacity in metric tons." />
        <RangeInput label="MINIMUM ORDER (MT)" value={filters.moqMinMt} onChangeText={value => update('moqMinMt', value)} placeholder="e.g. 20" testID="buyer-filter-moq-min" />
        <View style={{ flexDirection: 'row', gap: 9, marginBottom: 13 }}>
          <RangeInput label="CAPACITY FROM (MT)" value={filters.capacityMinMt} onChangeText={value => update('capacityMinMt', value)} placeholder="No minimum" testID="buyer-filter-capacity-min" />
          <RangeInput label="CAPACITY TO (MT)" value={filters.capacityMaxMt} onChangeText={value => update('capacityMaxMt', value)} placeholder="No maximum" testID="buyer-filter-capacity-max" />
        </View>
        <ChoiceGroup label="AVAILABILITY" options={Array.from(new Set([...AVAILABILITY_OPTIONS, ...facets('availability')]))} value={filters.availability} onChange={value => update('availability', value)} testID="buyer-filter-availability" />
      </View>

      <View style={{ padding: 14, marginBottom: 12, borderRadius: 17, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
        <SectionTitle icon="dollar-sign" title="Price & trade terms" detail="FOB price range and supported delivery terms." />
        <View style={{ flexDirection: 'row', gap: 9, marginBottom: 13 }}>
          <RangeInput label="FOB PRICE FROM" value={filters.priceMin} onChangeText={value => update('priceMin', value)} placeholder="Minimum" testID="buyer-filter-price-min" prefix={filters.currency} />
          <RangeInput label="FOB PRICE TO" value={filters.priceMax} onChangeText={value => update('priceMax', value)} placeholder="Maximum" testID="buyer-filter-price-max" prefix={filters.currency} />
        </View>
        <ChoiceGroup label="CURRENCY" options={facets('currency')} value={filters.currency} onChange={value => update('currency', value)} testID="buyer-filter-currency" />
        <ChoiceGroup label="TRADE TERMS" options={Array.from(new Set([...TRADE_TERMS, ...facets('tradeTerm')]))} value={filters.tradeTerm} onChange={value => update('tradeTerm', value)} testID="buyer-filter-trade-term" />
      </View>

      <View style={{ padding: 14, marginBottom: 12, borderRadius: 17, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
        <SectionTitle icon="check-circle" title="Quality & packaging" detail="Match documented grades, specifications and certifications." />
        <ChoiceGroup label="PACKAGING TYPE" options={facets('packaging')} value={filters.packaging} onChange={value => update('packaging', value)} testID="buyer-filter-packaging" />
        <ChoiceGroup label="QUALITY GRADE" options={facets('qualityGrade')} value={filters.qualityGrade} onChange={value => update('qualityGrade', value)} testID="buyer-filter-quality-grade" />
        <TextFilter label="PRODUCT SPECIFICATIONS" value={filters.specification} onChangeText={value => update('specification', value)} placeholder="Search a specification" testID="buyer-filter-specification" icon="sliders" />
        <ChoiceGroup label="CERTIFICATIONS & STANDARDS" options={facets('certification')} value={filters.certification} onChange={value => update('certification', value)} testID="buyer-filter-certification" />
        <AvailabilitySwitch label="Custom packaging" detail="Show products with a custom packaging option." value={filters.customPackagingOnly} onChange={value => update('customPackagingOnly', value)} testID="buyer-filter-custom-packaging" />
        <AvailabilitySwitch label="Private label" detail="Show products with a private-label or OEM option." value={filters.privateLabelOnly} onChange={value => update('privateLabelOnly', value)} testID="buyer-filter-private-label" />
      </View>

      <View style={{ padding: 14, marginBottom: 14, borderRadius: 17, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
        <SectionTitle icon="truck" title="Delivery & verification" detail="Choose a shipment method and verified suppliers." />
        <ChoiceGroup label="SHIPMENT METHOD" options={Array.from(new Set([...SHIPMENT_METHODS, ...facets('shipmentMethod')]))} value={filters.shipmentMethod} onChange={value => update('shipmentMethod', value)} testID="buyer-filter-shipment-method" />
        <AvailabilitySwitch label="Verified supplier only" detail="Requires a supplier verification flag from the catalogue." value={filters.verifiedSupplierOnly} onChange={value => update('verifiedSupplierOnly', value)} testID="buyer-filter-verified-supplier" />
      </View>
    </KeyboardAwareScrollViewCompat>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close product filters"
          onPress={onClose}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.shadowColor, opacity: 0.48 }}
        />
        <GlassPopupSurface
          testID="buyer-product-filter-sheet"
          style={{
            height: Math.min(height * 0.92, 850),
            paddingTop: 8,
            paddingBottom: Math.max(insets.bottom, 12),
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderTopWidth: 1,
            borderColor: colors.glassBorder,
          }}
        >
          <View style={{ alignItems: 'center', paddingBottom: 10 }}>
            <View style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: colors.accent }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.3 }}>OG EXPORTS CATALOGUE</Text>
              <Text style={{ color: colors.foreground, fontSize: 21, fontWeight: '800', marginTop: 3 }}>Refine your search</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 3 }}>20 trade filters · only saved catalogue details are matched</Text>
            </View>
            <Pressable testID="buyer-product-filter-close" accessibilityRole="button" accessibilityLabel="Close product filters" onPress={onClose} hitSlop={10} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
          {body}
          <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 17, paddingTop: 11, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card }}>
            <Pressable
              testID="buyer-product-filter-reset"
              accessibilityRole="button"
              onPress={() => setFilters(emptyBuyerProductFilters())}
              style={{ minHeight: 48, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.secondary }}
            >
              <Feather name="rotate-ccw" size={14} color={colors.mutedForeground} />
              <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: '800' }}>Reset{activeCount ? ` · ${activeCount}` : ''}</Text>
            </Pressable>
            <Pressable
              testID="buyer-product-filter-apply"
              accessibilityRole="button"
              onPress={() => onApply(filters)}
              style={({ pressed }) => ({ minHeight: 48, flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, backgroundColor: colors.primary, opacity: pressed ? 0.84 : 1 })}
            >
              <Text style={{ color: colors.primaryForeground, fontSize: 11, fontWeight: '900' }}>Show {resultCount} products</Text>
              <Feather name="arrow-right" size={14} color={colors.primaryForeground} />
            </Pressable>
          </View>
        </GlassPopupSurface>
      </View>
    </Modal>
  );
}

