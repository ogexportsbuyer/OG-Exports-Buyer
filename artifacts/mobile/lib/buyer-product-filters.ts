type Json = Record<string, unknown>;

function record(value: unknown): Json {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Json : {};
}

function first(row: Json, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function amount(row: Json, keys: string[]): number | null {
  for (const key of keys) {
    const value = readValue(row, key);
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return null;
}

function list(value: unknown): Json[] {
  return Array.isArray(value) ? value.map(record) : [];
}

function readValue(row: Json, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => record(value)[key], row);
}

function categoryName(product: Json): string {
  const category = product.category;
  if (typeof category === 'string' && category.trim()) return category.trim();
  return first(record(category), ['name']) || first(product, ['category_name', 'subcategory', 'sub_category']) || 'General';
}

export type BuyerProductCategory = { name: string; subcategories: string[] };

export const BUYER_PRODUCT_CATEGORY_TREE: BuyerProductCategory[] = [
  { name: 'Fresh Produce', subcategories: ['Fresh Fruits', 'Fresh Vegetables', 'Fresh Herbs', 'Fresh Tubers & Roots', 'Fresh Spices'] },
  { name: 'Grains & Cereals', subcategories: ['Rice', 'Wheat', 'Maize / Corn', 'Barley', 'Sorghum', 'Millet', 'Other Cereals'] },
  { name: 'Processed Foods', subcategories: ['Rice Products', 'Flour & Milling Products', 'Starches', 'Frozen Foods', 'Dried Foods', 'Canned & Preserved Foods', 'Ready-to-Cook Foods', 'Food Ingredients'] },
  { name: 'Seeds & Oilseeds', subcategories: ['Sesame Seeds', 'Sunflower Seeds', 'Mustard Seeds', 'Flaxseeds', 'Pumpkin Seeds', 'Chia Seeds', 'Other Oilseeds'] },
  { name: 'Edible Oils & Fats', subcategories: ['Sunflower Oil', 'Soybean Oil', 'Palm Oil', 'Canola Oil', 'Mustard Oil', 'Sesame Oil', 'Other Vegetable Oils'] },
  { name: 'Spices, Herbs & Condiments', subcategories: ['Whole Spices', 'Ground Spices', 'Chili Products', 'Turmeric', 'Coriander', 'Natural Herbs', 'Salt & Mineral Salts'] },
  { name: 'Animal Feed & Fodder', subcategories: ['Animal Feed', 'Poultry Feed', 'Cattle Feed', 'Feed Ingredients', 'Silage', 'Fodder & Hay', 'Feed Supplements'] },
  { name: 'Natural & Woven Products', subcategories: ['Reed Mats', 'Bamboo Products', 'Woven Mats', 'Natural Fiber Products', 'Handcrafted Products', 'Agricultural Fiber Products'] },
  { name: 'Industrial & Manufactured Goods', subcategories: ['Packaging Materials', 'Jute Products', 'Woven Sacks & Bags', 'Industrial Raw Materials', 'Construction Materials', 'Household Products', 'Other Manufactured Goods'] },
  { name: 'Agricultural Inputs', subcategories: ['Planting Seeds', 'Crop Protection Products', 'Organic Fertilizers', 'Agricultural Fertilizers', 'Soil Conditioners', 'Other Farm Inputs'] },
];

const CATEGORY_ALIASES: Record<string, string[]> = {
  'Fresh Produce': ['fresh produce', 'fresh fruit', 'fresh vegetable', 'fresh herb', 'fresh tuber', 'fresh root', 'fresh spice'],
  'Grains & Cereals': ['grain', 'cereal', 'rice', 'wheat', 'maize', 'corn', 'barley', 'sorghum', 'millet'],
  'Processed Foods': ['processed food', 'rice product', 'flour', 'milling', 'starch', 'frozen food', 'dried food', 'canned food', 'ready to cook', 'food ingredient'],
  'Seeds & Oilseeds': ['seed', 'oilseed'],
  'Edible Oils & Fats': ['edible oil', 'vegetable oil', 'oil and fat'],
  'Spices, Herbs & Condiments': ['spice', 'herb', 'condiment', 'turmeric', 'coriander', 'chili', 'salt'],
  'Animal Feed & Fodder': ['animal feed', 'poultry feed', 'cattle feed', 'fodder', 'silage', 'feed supplement'],
  'Natural & Woven Products': ['reed mat', 'bamboo', 'woven', 'natural fiber', 'handcrafted', 'agricultural fiber'],
  'Industrial & Manufactured Goods': ['industrial', 'manufactured', 'packaging material', 'jute', 'sack', 'construction material', 'household product'],
  'Agricultural Inputs': ['planting seed', 'crop protection', 'fertilizer', 'soil conditioner', 'farm input'],
};

const SUBCATEGORY_ALIASES: Record<string, string[]> = {
  'Maize / Corn': ['maize', 'corn'],
  'Fresh Tubers & Roots': ['tuber', 'root', 'potato', 'yam'],
  'Other Cereals': ['other cereal', 'barley', 'sorghum', 'millet'],
  'Other Oilseeds': ['other oilseed'],
  'Other Vegetable Oils': ['other vegetable oil'],
  'Salt & Mineral Salts': ['salt', 'mineral salt'],
  'Fodder & Hay': ['fodder', 'hay'],
  'Natural Fiber Products': ['natural fiber', 'natural fibre'],
  'Agricultural Fiber Products': ['agricultural fiber', 'agricultural fibre'],
};

export type BuyerProductFilterState = {
  category: string;
  subcategory: string;
  productType: string;
  origin: string;
  supplierLocation: string;
  moqMinMt: string;
  capacityMinMt: string;
  capacityMaxMt: string;
  priceMin: string;
  priceMax: string;
  currency: string;
  tradeTerm: string;
  packaging: string;
  qualityGrade: string;
  specification: string;
  certification: string;
  supplierType: string;
  availability: string;
  shipmentMethod: string;
  customPackagingOnly: boolean;
  privateLabelOnly: boolean;
  verifiedSupplierOnly: boolean;
};

export function emptyBuyerProductFilters(): BuyerProductFilterState {
  return {
    category: '',
    subcategory: '',
    productType: '',
    origin: '',
    supplierLocation: '',
    moqMinMt: '',
    capacityMinMt: '',
    capacityMaxMt: '',
    priceMin: '',
    priceMax: '',
    currency: '',
    tradeTerm: '',
    packaging: '',
    qualityGrade: '',
    specification: '',
    certification: '',
    supplierType: '',
    availability: '',
    shipmentMethod: '',
    customPackagingOnly: false,
    privateLabelOnly: false,
    verifiedSupplierOnly: false,
  };
}

const CATEGORY_API_ALIASES: Record<string, string> = {
  'processed food': 'Processed Foods',
  grains: 'Grains & Cereals',
  rice: 'Grains & Cereals',
};

export function mergeBuyerProductCategories(apiCategories: Json[]): BuyerProductCategory[] {
  const result = BUYER_PRODUCT_CATEGORY_TREE.map(item => ({ ...item, subcategories: [...item.subcategories] }));
  for (const category of apiCategories) {
    const name = first(category, ['name']);
    if (!name) continue;
    const canonical = CATEGORY_API_ALIASES[name.trim().toLowerCase()] ?? name;
    const knownParent = result.some(item => item.name.toLowerCase() === canonical.toLowerCase());
    const knownSubcategory = result.some(item => item.subcategories.some(child => child.toLowerCase() === name.toLowerCase()));
    if (!knownParent && !knownSubcategory) result.push({ name, subcategories: [] });
  }
  return result;
}

export function filtersFromBuyerCategoryRoute(value: string): Pick<BuyerProductFilterState, 'category' | 'subcategory'> {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === 'all' || normalized === 'all products' || normalized === 'all categories') {
    return { category: '', subcategory: '' };
  }
  const apiAlias = CATEGORY_API_ALIASES[normalized];
  for (const category of BUYER_PRODUCT_CATEGORY_TREE) {
    const subcategory = category.subcategories.find(child => child.toLowerCase() === normalized);
    if (subcategory) return { category: category.name, subcategory };
  }
  for (const category of BUYER_PRODUCT_CATEGORY_TREE) {
    if (category.name.toLowerCase() === normalized || category.name === apiAlias) {
      return { category: category.name, subcategory: '' };
    }
  }
  return { category: apiAlias ?? value, subcategory: '' };
}

function normalized(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function fieldValues(product: Json, keys: string[]): string[] {
  const result: string[] = [];
  for (const key of keys) {
    const value = readValue(product, key);
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string' && item.trim()) result.push(item.trim());
        else {
          const name = first(record(item), ['name', 'label', 'value']);
          if (name) result.push(name);
        }
      }
    } else if (typeof value === 'string' && value.trim()) {
      result.push(value.trim());
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      result.push(String(value));
    } else {
      const name = first(record(value), ['name', 'label', 'value']);
      if (name) result.push(name);
    }
  }
  return Array.from(new Set(result));
}

function specs(product: Json): string[] {
  return list(record(product).specs ?? record(product).specifications)
    .map(item => `${first(item, ['label', 'name', 'key'])} ${first(item, ['value'])}`.trim())
    .filter(Boolean);
}

function categoryFields(product: Json): string[] {
  const category = record(product).category;
  return [
    categoryName(product),
    ...fieldValues(product, ['category_name', 'subcategory', 'sub_category', 'subcategory_name']),
    ...fieldValues(record(category), ['name']),
  ].filter(Boolean);
}

function productText(product: Json): string {
  return [
    first(product, ['name']),
    first(product, ['short_description', 'shortDescription']),
    first(product, ['description']),
    first(product, ['sku']),
    ...categoryFields(product),
    ...fieldValues(product, ['product_type', 'type', 'origin', 'supplier_location', 'supplier_location_name', 'supplier.location', 'supplier.country', 'supplier.city', 'supplier.type']),
    ...fieldValues(product, ['certifications', 'packaging_options', 'incoterms', 'trade_terms', 'delivery_terms']),
    ...specs(product),
  ].join(' ').toLowerCase();
}

function matchesAny(value: string, candidates: string[], aliases: string[] = []): boolean {
  const text = normalized(value);
  const choices = [...candidates, ...aliases].map(normalized).filter(Boolean);
  return choices.some(candidate => text.includes(candidate) || candidate.includes(text));
}

function matchesCategory(product: Json, category: string, subcategory: string): boolean {
  const categoryValues = categoryFields(product);
  const declaredCategory = normalized(categoryValues[0] ?? '');
  const text = productText(product);
  const parentAliases = CATEGORY_ALIASES[category] ?? [category];
  const parentMatched = !category
    || matchesAny(declaredCategory, [category], parentAliases)
    || (!declaredCategory || declaredCategory === 'general') && matchesAny(text, [category], parentAliases);
  if (!parentMatched) return false;
  if (!subcategory) return true;
  const childAliases = SUBCATEGORY_ALIASES[subcategory] ?? [subcategory];
  return matchesAny(text, [subcategory], childAliases);
}

function numericInput(value: string): number | null {
  const normalizedValue = value.trim().replace(/,/g, '');
  if (!normalizedValue) return null;
  const parsed = Number(normalizedValue);
  return Number.isFinite(parsed) ? parsed : null;
}

function numericQuantity(product: Json, keys: string[]): number | null {
  const direct = amount(product, keys);
  if (direct !== null) return direct;
  for (const value of fieldValues(product, keys)) {
    const match = value.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
    if (match) return Number(match[0]);
  }
  return null;
}

function approximateMetricTons(value: string): number | null {
  const match = value.replace(/,/g, '').match(/(?:~|about|approx(?:imately)?\s*)?\s*(\d+(?:\.\d+)?)\s*(?:mt|metric\s*tons?)/i);
  return match ? Number(match[1]) : null;
}

function fieldBoolean(product: Json, keys: string[]): boolean | null {
  for (const key of keys) {
    const value = readValue(product, key);
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number' && (value === 0 || value === 1)) return value === 1;
    if (typeof value === 'string') {
      const text = value.trim().toLowerCase();
      if (['1', 'true', 'yes', 'available', 'verified', 'ready'].includes(text)) return true;
      if (['0', 'false', 'no', 'unavailable', 'unverified', 'not ready'].includes(text)) return false;
    }
  }
  return null;
}

function productAvailability(product: Json): string[] {
  const values = fieldValues(product, ['availability', 'availability_status', 'stock_status', 'order_availability']);
  const result = [...values];
  const readyStock = fieldBoolean(product, ['ready_stock', 'in_stock', 'is_available', 'supplier.ready_stock']);
  const stock = amount(product, ['stock', 'available_stock', 'supplier.available_stock']);
  if (readyStock === true || (readyStock === null && stock !== null && stock > 0)) result.push('Ready Stock');
  if (fieldBoolean(product, ['made_to_order', 'is_made_to_order']) === true || values.some(value => /made[\s-]*to[\s-]*order/i.test(value))) {
    result.push('Made to Order');
  }
  return result;
}

export type BuyerProductFacet =
  | 'productType'
  | 'origin'
  | 'supplierLocation'
  | 'currency'
  | 'tradeTerm'
  | 'packaging'
  | 'qualityGrade'
  | 'certification'
  | 'supplierType'
  | 'availability'
  | 'shipmentMethod';

export function buyerProductFacetValues(products: Json[], facet: BuyerProductFacet): string[] {
  const values = products.flatMap(product => {
    switch (facet) {
      case 'productType':
        return fieldValues(product, ['product_type', 'productType', 'type_of_product']);
      case 'origin':
        return fieldValues(product, ['origin', 'country_of_origin', 'origin_country']);
      case 'supplierLocation':
        return fieldValues(product, ['supplier_location', 'supplier_location_name', 'supplier_country', 'supplier_city', 'supplier.location', 'supplier.country', 'supplier.city', 'supplier.address', 'company.country', 'company.city']);
      case 'currency':
        return fieldValues(product, ['currency']);
      case 'tradeTerm':
        return fieldValues(product, ['incoterms', 'incoterm', 'trade_terms', 'delivery_terms']);
      case 'packaging':
        return fieldValues(product, ['packaging_options', 'packaging_type', 'packaging']);
      case 'qualityGrade':
        return [
          ...fieldValues(product, ['quality_grade', 'grade']),
          ...specs(product).filter(value => /\bgrade\b/i.test(value)).map(value => value.replace(/^.*?\bgrade\b\s*/i, '')),
        ];
      case 'certification':
        return fieldValues(product, ['certifications', 'standards', 'quality_certifications']);
      case 'supplierType':
        return fieldValues(product, ['supplier_type', 'seller_type', 'supplier.supplier_type', 'supplier.type']);
      case 'availability':
        return productAvailability(product);
      case 'shipmentMethod':
        return fieldValues(product, ['shipment_method', 'shipping_method', 'transport_mode']);
    }
  }).filter(Boolean);
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

export function buyerProductFilterCount(filters: BuyerProductFilterState): number {
  const values = Object.values(filters);
  return values.filter(value => typeof value === 'boolean' ? value : Boolean(value.trim())).length;
}

export function filterBuyerProducts(products: Json[], filters: BuyerProductFilterState, search = ''): Json[] {
  const term = search.trim().toLowerCase();
  const minMoq = numericInput(filters.moqMinMt);
  const minCapacity = numericInput(filters.capacityMinMt);
  const maxCapacity = numericInput(filters.capacityMaxMt);
  const minPrice = numericInput(filters.priceMin);
  const maxPrice = numericInput(filters.priceMax);
  const specTerm = filters.specification.trim().toLowerCase();
  const locationTerm = filters.supplierLocation.trim().toLowerCase();
  return products.filter(product => {
    if (!matchesCategory(product, filters.category, filters.subcategory)) return false;
    if (term && !productText(product).includes(term)) return false;
    if (filters.productType && !matchesAny(fieldValues(product, ['product_type', 'productType', 'type_of_product']).join(' '), [filters.productType])) return false;
    if (filters.origin && !fieldValues(product, ['origin', 'country_of_origin', 'origin_country']).some(value => normalized(value) === normalized(filters.origin))) return false;
    if (locationTerm && !fieldValues(product, ['supplier_location', 'supplier_location_name', 'supplier_country', 'supplier_city', 'supplier.location', 'supplier.country', 'supplier.city', 'supplier.address', 'company.country', 'company.city']).join(' ').toLowerCase().includes(locationTerm)) return false;
    const moq = approximateMetricTons(fieldValues(product, ['min_order', 'minimum_order', 'moq']).join(' '));
    if (minMoq !== null && (moq === null || moq < minMoq)) return false;
    const capacity = numericQuantity(product, ['available_supply_capacity_mt', 'available_supply_capacity', 'supply_capacity_mt', 'supply_capacity', 'monthly_capacity_mt', 'supplier.available_supply_capacity_mt', 'supplier.available_supply_capacity', 'supplier.monthly_capacity_mt']);
    if (minCapacity !== null && (capacity === null || capacity < minCapacity)) return false;
    if (maxCapacity !== null && (capacity === null || capacity > maxCapacity)) return false;
    const price = amount(product, ['fob', 'price']);
    if (minPrice !== null && (price === null || price < minPrice)) return false;
    if (maxPrice !== null && (price === null || price > maxPrice)) return false;
    if (filters.currency && !fieldValues(product, ['currency']).some(value => normalized(value) === normalized(filters.currency))) return false;
    if (filters.tradeTerm && !fieldValues(product, ['incoterms', 'incoterm', 'trade_terms', 'delivery_terms']).some(value => normalized(value).includes(normalized(filters.tradeTerm)))) return false;
    if (filters.packaging && !fieldValues(product, ['packaging_options', 'packaging_type', 'packaging']).some(value => normalized(value).includes(normalized(filters.packaging)))) return false;
    if (filters.qualityGrade) {
      const grades = [...fieldValues(product, ['quality_grade', 'grade']), ...specs(product).filter(value => /\bgrade\b/i.test(value))];
      if (!grades.some(value => normalized(value).includes(normalized(filters.qualityGrade)))) return false;
    }
    if (specTerm && !specs(product).join(' ').toLowerCase().includes(specTerm)) return false;
    if (filters.certification && !fieldValues(product, ['certifications', 'standards', 'quality_certifications']).some(value => normalized(value).includes(normalized(filters.certification)))) return false;
    if (filters.supplierType && !fieldValues(product, ['supplier_type', 'seller_type', 'supplier.supplier_type', 'supplier.type']).some(value => normalized(value).includes(normalized(filters.supplierType)))) return false;
    if (filters.availability && !productAvailability(product).some(value => normalized(value).includes(normalized(filters.availability)))) return false;
    if (filters.shipmentMethod && !fieldValues(product, ['shipment_method', 'shipping_method', 'transport_mode']).some(value => normalized(value).includes(normalized(filters.shipmentMethod)))) return false;
    const packages = fieldValues(product, ['packaging_options', 'packaging_type', 'packaging']).join(' ').toLowerCase();
    if (filters.customPackagingOnly && fieldBoolean(product, ['custom_packaging_available', 'custom_packaging']) !== true && !/custom(?:ized)? packaging/i.test(packages)) return false;
    if (filters.privateLabelOnly && fieldBoolean(product, ['private_label_available', 'private_label']) !== true && !/private[\s-]*label|oem/i.test(packages)) return false;
    if (filters.verifiedSupplierOnly && fieldBoolean(product, ['verified_supplier', 'supplier_verified', 'is_supplier_verified', 'supplier.verified', 'supplier.is_verified']) !== true) return false;
    return true;
  });
}

