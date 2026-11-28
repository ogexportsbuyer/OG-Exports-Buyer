import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  BUYER_PRODUCT_CATEGORY_TREE,
  buyerHomeCategories,
  buyerHomeCategoryLabel,
  buyerHomeCategoryProducts,
  buyerHomeMainProducts,
  buyerHomeProductKey,
  buyerProductFacetValues,
  buyerProductFilterCount,
  emptyBuyerProductFilters,
  filterBuyerProducts,
  filtersFromBuyerCategoryRoute,
  mergeBuyerProductCategories,
} from './buyer-product-filters.ts';

const products = [
  {
    id: 1,
    name: 'Premium Basmati Rice',
    category: { name: 'Rice' },
    origin: 'Pakistan',
    product_type: 'Raw',
    supplier_location: 'Punjab, Pakistan',
    min_order: '1 × 20ft Container (~25 MT)',
    available_supply_capacity_mt: '500 MT monthly',
    fob: '1360.00',
    currency: 'USD',
    incoterms: 'FOB Karachi',
    delivery_terms: ['FOB', 'CIF', 'CFR'],
    packaging_options: ['25 KG Bag', 'Private Label / OEM'],
    grade: 'Export Grade A+',
    certifications: ['Lab Tested', 'Halal Certified'],
    supplier_type: 'Direct Exporter',
    availability: 'Ready Stock',
    shipment_method: 'Sea',
    custom_packaging_available: true,
    verified_supplier: true,
    specs: [{ label: 'Grain Length', value: '8.3 mm Min' }],
  },
  {
    id: 2,
    name: 'Yellow Maize (Corn)',
    category: { name: 'Grains' },
    origin: 'Pakistan',
    product_type: 'Raw',
    min_order: '1 × 40ft Container (~27 MT)',
    fob: '295.00',
    currency: 'USD',
    incoterms: 'FOB Port Qasim',
    packaging_options: ['50 KG PP Bag'],
    certifications: ['Aflatoxin Test Report'],
    availability: 'Made to Order',
    shipment_method: 'Sea',
    specs: [{ label: 'Grade', value: 'A Grade - Animal Feed Quality' }],
  },
  {
    id: 3,
    name: 'Sesame Seeds',
    category: { name: 'Seeds & Oilseeds' },
    origin: 'Pakistan',
    moq: '1 × 20ft Container (~20 MT)',
    fob: '1680.00',
    currency: 'USD',
    incoterms: 'FOB Port Qasim',
    packaging_options: ['25 KG PP Bag', 'Private Label'],
    certifications: ['Halal Certified', 'Lab Tested'],
    specs: [{ label: 'Purity', value: '99.5% Min' }],
  },
];

test('the uploaded taxonomy is available with nested subcategories', () => {
  assert.equal(BUYER_PRODUCT_CATEGORY_TREE.length, 10);
  assert.equal(BUYER_PRODUCT_CATEGORY_TREE.find(item => item.name === 'Grains & Cereals').subcategories.includes('Maize / Corn'), true);
  assert.equal(BUYER_PRODUCT_CATEGORY_TREE.find(item => item.name === 'Agricultural Inputs').subcategories.includes('Organic Fertilizers'), true);
  assert.deepEqual(filtersFromBuyerCategoryRoute('Rice'), { category: 'Grains & Cereals', subcategory: 'Rice' });
});

test('catalogue categories merge without duplicating aliases from the backend', () => {
  const tree = mergeBuyerProductCategories([
    { name: 'Grains' },
    { name: 'Rice' },
    { name: 'Fresh Produce' },
    { name: 'New Catalogue Category' },
  ]);
  assert.equal(tree.filter(item => item.name === 'Grains & Cereals').length, 1);
  assert.equal(tree.filter(item => item.name === 'Fresh Produce').length, 1);
  assert.equal(tree.filter(item => item.name === 'New Catalogue Category').length, 1);
});

test('category and subcategory filters match the live catalogue naming variants', () => {
  const rice = { ...emptyBuyerProductFilters(), ...filtersFromBuyerCategoryRoute('Rice') };
  const grains = { ...emptyBuyerProductFilters(), category: 'Grains & Cereals', subcategory: 'Maize / Corn' };
  const seeds = { ...emptyBuyerProductFilters(), category: 'Seeds & Oilseeds', subcategory: 'Sesame Seeds' };
  assert.deepEqual(filterBuyerProducts(products, rice).map(product => product.name), ['Premium Basmati Rice']);
  assert.deepEqual(filterBuyerProducts(products, grains).map(product => product.name), ['Yellow Maize (Corn)']);
  assert.deepEqual(filterBuyerProducts(products, seeds).map(product => product.name), ['Sesame Seeds']);
});

test('homepage category rows prioritize Fresh, Grains, and Seeds while limiting real products', () => {
  const catalogue = [
    ...products,
    { id: 4, name: 'Premium Long Grain Rice', category: { name: 'Rice' }, fob: '1420' },
    { id: 5, name: 'Broken Basmati Rice', category: { name: 'Rice' }, fob: '980' },
    { id: 6, name: 'Black Sesame Seeds', category: { name: 'Seeds & Oilseeds' }, fob: '1750' },
    { id: 7, name: 'Fresh Kinnow', category: { name: 'Fresh Produce' }, fob: '900' },
  ];

  const sections = buyerHomeCategoryProducts(catalogue, [
    { name: 'Grains' },
    { name: 'Rice' },
    { name: 'Seeds & Oilseeds' },
    { name: 'Fresh Produce' },
    { name: 'Empty Catalogue Category' },
  ]);

  assert.deepEqual(sections.map(section => section.name), ['Fresh Produce', 'Grains & Cereals', 'Seeds & Oilseeds']);
  assert.deepEqual(sections[0].products.map(product => product.name), ['Fresh Kinnow']);
  assert.deepEqual(sections[1].products.map(product => product.name), ['Premium Basmati Rice', 'Yellow Maize (Corn)']);
  assert.deepEqual(sections[2].products.map(product => product.name), ['Sesame Seeds', 'Black Sesame Seeds']);
  assert.ok(sections.every(section => section.products.length <= 2));
  assert.deepEqual(buyerHomeCategories(catalogue, [
    { name: 'Grains' },
    { name: 'Seeds & Oilseeds' },
    { name: 'Fresh Produce' },
  ]).map(category => buyerHomeCategoryLabel(category.name)), ['Fresh', 'Grains', 'Seeds & Oilseeds']);
});

test('homepage main products are featured only and do not repeat in category rows', () => {
  const catalogue = [
    { ...products[0], featured: true },
    { ...products[1], featured: false },
    { ...products[2], featured: true },
    { id: 4, name: 'Fresh Kinnow', category: { name: 'Fresh Produce' }, featured: false },
    { ...products[0], featured: true },
  ];
  const mainProducts = buyerHomeMainProducts(catalogue);
  const mainProductKeys = new Set(mainProducts.map(buyerHomeProductKey));
  const sections = buyerHomeCategoryProducts(catalogue, [
    { name: 'Seeds & Oilseeds' },
    { name: 'Fresh Produce' },
    { name: 'Grains' },
  ], 2, mainProductKeys);
  const sectionProducts = sections.flatMap(section => section.products);

  assert.deepEqual(mainProducts.map(product => product.name), ['Premium Basmati Rice', 'Sesame Seeds']);
  assert.ok(sectionProducts.every(product => !mainProductKeys.has(buyerHomeProductKey(product))));
  assert.equal(new Set(sectionProducts.map(buyerHomeProductKey)).size, sectionProducts.length);
  assert.deepEqual(sections.map(section => section.name), ['Fresh Produce', 'Grains & Cereals']);
});

test('homepage category image representatives avoid repeating main and category-row products', () => {
  const catalogue = [
    { id: 1, name: 'Featured Wheat', category: { name: 'Grains' }, featured: true },
    { id: 2, name: 'Wheat Grade A', category: { name: 'Grains' } },
    { id: 3, name: 'Wheat Grade B', category: { name: 'Grains' } },
    { id: 4, name: 'Wheat Grade C', category: { name: 'Grains' } },
  ];
  const mainProducts = buyerHomeMainProducts(catalogue);
  const mainProductKeys = new Set(mainProducts.map(buyerHomeProductKey));
  const categorySections = buyerHomeCategoryProducts(catalogue, [{ name: 'Grains' }], 2, mainProductKeys);
  const displayedProductKeys = new Set([
    ...mainProductKeys,
    ...categorySections.flatMap(section => section.products.map(buyerHomeProductKey)),
  ]);
  const categoryImageSections = buyerHomeCategoryProducts(catalogue, [{ name: 'Grains' }], 1, displayedProductKeys);

  assert.deepEqual(categoryImageSections.flatMap(section => section.products.map(product => product.name)), ['Wheat Grade C']);
  assert.ok(categoryImageSections.flatMap(section => section.products).every(product => !displayedProductKeys.has(buyerHomeProductKey(product))));
});

test('trade, price, origin, MOQ, supply capacity, currency, and availability filters compose', () => {
  const filters = {
    ...emptyBuyerProductFilters(),
    origin: 'Pakistan',
    moqMinMt: '24',
    capacityMinMt: '400',
    priceMin: '1000',
    priceMax: '1500',
    currency: 'USD',
    tradeTerm: 'FOB',
    availability: 'Ready Stock',
  };
  assert.deepEqual(filterBuyerProducts(products, filters).map(product => product.name), ['Premium Basmati Rice']);
  assert.equal(buyerProductFilterCount(filters), 8);
});

test('certification, specification, grade, packaging, and supplier details filter saved data only', () => {
  const certification = { ...emptyBuyerProductFilters(), certification: 'Halal Certified' };
  const specification = { ...emptyBuyerProductFilters(), specification: '8.3 mm' };
  const grade = { ...emptyBuyerProductFilters(), qualityGrade: 'Export Grade A+' };
  const packaging = { ...emptyBuyerProductFilters(), privateLabelOnly: true };
  const supplier = { ...emptyBuyerProductFilters(), supplierType: 'Direct Exporter', verifiedSupplierOnly: true };
  assert.deepEqual(filterBuyerProducts(products, certification).map(product => product.name), ['Premium Basmati Rice', 'Sesame Seeds']);
  assert.deepEqual(filterBuyerProducts(products, specification).map(product => product.name), ['Premium Basmati Rice']);
  assert.deepEqual(filterBuyerProducts(products, grade).map(product => product.name), ['Premium Basmati Rice']);
  assert.deepEqual(filterBuyerProducts(products, packaging).map(product => product.name), ['Premium Basmati Rice', 'Sesame Seeds']);
  assert.deepEqual(filterBuyerProducts(products, supplier).map(product => product.name), ['Premium Basmati Rice']);
  assert.deepEqual(buyerProductFacetValues(products, 'shipmentMethod'), ['Sea']);
});

test('search includes product details while advanced unsupported fields do not invent matches', () => {
  assert.deepEqual(filterBuyerProducts(products, emptyBuyerProductFilters(), 'grain length').map(product => product.name), ['Premium Basmati Rice']);
  const missingSupplierLocation = { ...emptyBuyerProductFilters(), supplierLocation: 'Sindh' };
  assert.deepEqual(filterBuyerProducts(products, missingSupplierLocation), []);
});

test('the mobile catalogue exposes the complete filter sheet and active-filter controls', () => {
  const sheet = readFileSync(new URL('../components/BuyerProductFilterSheet.tsx', import.meta.url), 'utf8');
  const screen = readFileSync(new URL('../app/(buyer-tabs)/buyer-products.tsx', import.meta.url), 'utf8');
  for (const testId of [
    'buyer-filter-category',
    'buyer-filter-subcategory',
    'buyer-filter-origin',
    'buyer-filter-supplier-location',
    'buyer-filter-product-type',
    'buyer-filter-moq-min',
    'buyer-filter-capacity-min',
    'buyer-filter-price-min',
    'buyer-filter-currency',
    'buyer-filter-trade-term',
    'buyer-filter-packaging',
    'buyer-filter-quality-grade',
    'buyer-filter-specification',
    'buyer-filter-certification',
    'buyer-filter-supplier-type',
    'buyer-filter-availability',
    'buyer-filter-shipment-method',
    'buyer-filter-custom-packaging',
    'buyer-filter-private-label',
    'buyer-filter-verified-supplier',
  ]) assert.ok(sheet.includes(testId), `Missing filter control ${testId}`);
  assert.match(sheet, /Reset/);
  assert.match(sheet, /Show \{resultCount\} products/);
  assert.match(screen, /buyer-product-open-filters/);
  assert.match(screen, /buyer-product-clear-filters/);
});
