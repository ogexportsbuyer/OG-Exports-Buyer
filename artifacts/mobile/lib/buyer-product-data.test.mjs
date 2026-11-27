import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  buyerProductGalleryImages,
  buyerProductHasPdfReport,
  buyerProductReportDownloadPath,
  buyerProductSpecs,
  buyerProductValues,
  resolveBuyerProductImageUrl,
} from './buyer-product-data.ts';
import { formatFobPrice } from './format-fob-price.ts';
import { buyerPriceDetails } from './buyer-pricing.ts';

test('catalogue product prices display their FOB basis and quote-only products stay unpriced', () => {
  assert.equal(formatFobPrice(1680, 'PKR'), 'FOB · PKR 1,680');
  assert.equal(formatFobPrice(1680, 'invalid'), 'FOB · USD 1,680');
  assert.equal(formatFobPrice(1680, 'USD', 'kg'), 'FOB · USD 1,680 / kg');
  assert.deepEqual(buyerPriceDetails({
    fob: 100,
    discount_percentage: 15,
    unit_of_measure: 'kg',
  }), {
    basePrice: 100,
    salePrice: 85,
    discountPercentage: 15,
    discountAmountPerUnit: 15,
    currency: 'USD',
    unitOfMeasure: 'kg',
  });
  assert.deepEqual(buyerPriceDetails({
    fob: 100,
    list_unit_price: 100,
    unit_price: 85,
    discount_percentage: 15,
    discount_amount_per_unit: 15,
  }).salePrice, 85);
  const buyerData = readFileSync(new URL('./buyer-data.ts', import.meta.url), 'utf8');
  assert.match(buyerData, /formatFobPrice\(pricing\.salePrice, pricing\.currency, pricing\.unitOfMeasure\)/);
  assert.match(buyerData, /return 'Request a quote'/);
});

test('buyer product price surfaces consistently show the FOB basis', () => {
  const homeCatalog = readFileSync(new URL('../components/BuyerHomeCatalog.tsx', import.meta.url), 'utf8');
  const productCard = readFileSync(new URL('../components/BuyerProductCard.tsx', import.meta.url), 'utf8');
  const priceComponent = readFileSync(new URL('../components/BuyerProductPrice.tsx', import.meta.url), 'utf8');
  const productDetails = readFileSync(new URL('../app/buyer-product/[id].tsx', import.meta.url), 'utf8');
  const cart = readFileSync(new URL('../components/BuyerCartScreen.tsx', import.meta.url), 'utf8');
  const checkout = readFileSync(new URL('../app/buyer-checkout.tsx', import.meta.url), 'utf8');
  const quotation = readFileSync(new URL('../app/buyer-quotation/[id].tsx', import.meta.url), 'utf8');

  assert.match(homeCatalog, /displayPrice\(product\)/);
  assert.match(productCard, /PRODUCT PRICE/);
  assert.match(productCard, /BuyerProductPrice product=\{product\}/);
  assert.match(productDetails, /BuyerProductPrice product=\{product\}/);
  assert.match(priceComponent, /FadeInDown/);
  assert.match(priceComponent, /% OFF/);
  assert.match(cart, /BuyerProductPrice product=\{item\}/);
  assert.match(checkout, /formatFobPrice\(/);
  assert.match(quotation, /FOB unit price:/);
});

test('buyer homepage product sections use consistent premium spacing', () => {
  const homeCatalog = readFileSync(new URL('../components/BuyerHomeCatalog.tsx', import.meta.url), 'utf8');

  assert.match(homeCatalog, /const productGridCardWidth = Math\.min\(224, \(windowWidth - 54\) \/ 2\);/);
  assert.match(homeCatalog, /recommendationRow:\s*\{\s*flexDirection: 'row',\s*gap: 12,[\s\S]*?paddingBottom: 18,/);
  assert.match(homeCatalog, /productGrid:\s*\{\s*flexDirection: 'row',\s*flexWrap: 'wrap',\s*gap: 14,[\s\S]*?paddingBottom: 10,/);
  assert.match(homeCatalog, /categoryRow:\s*\{\s*flexDirection: 'row',\s*gap: 12,[\s\S]*?paddingBottom: 14,/);
  assert.match(homeCatalog, /styles\.sectionHeader, \{ marginTop: 8, marginBottom: 12 \}/);
  assert.match(homeCatalog, /styles\.sectionHeader, \{ marginTop: 12, marginBottom: 12 \}/);
  assert.match(homeCatalog, /marginTop: 14, marginBottom: 16/);
});

test('buyer homepage avoids a duplicate product grid and gives single-item categories landscape cards', () => {
  const homeCatalog = readFileSync(new URL('../components/BuyerHomeCatalog.tsx', import.meta.url), 'utf8');

  assert.match(homeCatalog, /filteredProducts\.slice\(0, 6\)/, 'the Products to explore row remains');
  assert.doesNotMatch(homeCatalog, /filteredProducts\.slice\(0,\s*8\)/, 'the second homepage-wide product grid is removed');
  assert.match(homeCatalog, /section\.products\.length === 1/);
  assert.match(homeCatalog, /const landscapeCardWidth = Math\.max\(0, Math\.min\(620, windowWidth - 40\)\)/);
  assert.match(homeCatalog, /layout=\{landscape \? 'landscape' : 'grid'\}/);
  assert.match(homeCatalog, /styles\.landscapeCard/);
  assert.match(homeCatalog, /Minimum order:/);
  assert.match(homeCatalog, /onSelectCategory\(section\.name\)/, 'category navigation stays connected');
});

test('product specs keep only complete label and value pairs', () => {
  assert.deepEqual(buyerProductSpecs({
    specs: [
      { label: 'Purity', value: '99.5% Min' },
      { label: 'Moisture', value: '6% Max' },
      { label: 'Missing value' },
      { value: 'No label' },
    ],
  }), [
    { label: 'Purity', value: '99.5% Min' },
    { label: 'Moisture', value: '6% Max' },
  ]);
});

test('product list fields support strings and server-provided objects', () => {
  assert.deepEqual(buyerProductValues({
    certifications: [
      'Lab Tested',
      { name: 'Phytosanitary' },
      { title: 'COA' },
      '',
      'Lab Tested',
    ],
  }, 'certifications'), ['Lab Tested', 'Phytosanitary', 'COA']);
});

test('product list fields accept delimited text and safely ignore absent data', () => {
  assert.deepEqual(buyerProductValues({ payment_terms: 'LC at Sight; TT, SBLC' }, 'payment_terms'), [
    'LC at Sight',
    'TT',
    'SBLC',
  ]);
  assert.deepEqual(buyerProductValues({}, 'packaging_options'), []);
});

test('product gallery shows every uploaded image, ordered and without duplicate cover photos', () => {
  const gallery = buyerProductGalleryImages({
    image_url: 'product_images/cover.jpg',
    media: [
      { url: 'product_images/photo-2.jpg', type: 'image', sort_order: 1 },
      { url: 'product_images/photo-1.jpg', type: 'image', sort_order: 0 },
      { url: 'product_images/video.mp4', type: 'video', sort_order: 2 },
      ...Array.from({ length: 12 }, (_, index) => ({
        url: `product_images/extra-${index}.jpg`,
        type: 'image',
        sort_order: index + 3,
      })),
    ],
  }, 'https://api.example.test');

  assert.equal(gallery.length, 15);
  assert.equal(gallery[0], 'https://api.example.test/product_images/cover.jpg');
  assert.equal(gallery[1], 'https://api.example.test/product_images/photo-1.jpg');
  assert.equal(gallery.includes('https://api.example.test/product_images/video.mp4'), false);
});

test('product gallery also reads the admin gallery path format', () => {
  assert.deepEqual(
    buyerProductGalleryImages({
      imagePath: 'product_images/cover.jpg',
      galleryPaths: ['product_images/side.jpg', 'product_images/detail.jpg'],
    }, 'https://api.example.test'),
    [
      'https://api.example.test/product_images/cover.jpg',
      'https://api.example.test/product_images/side.jpg',
      'https://api.example.test/product_images/detail.jpg',
    ],
  );
});

test('product report action uses the public PDF route and only accepts PDF reports', () => {
  assert.equal(
    buyerProductReportDownloadPath({ slug: 'premium-rice' }),
    'api/products/premium-rice/lab-report',
  );
  assert.equal(
    buyerProductReportDownloadPath({ lab_report_url: 'https://cdn.example.test/coa.pdf' }),
    'https://cdn.example.test/coa.pdf',
  );
  assert.equal(buyerProductHasPdfReport({ lab_report_path: 'downloads/reports/coa.PDF' }), true);
  assert.equal(buyerProductHasPdfReport({ lab_report_path: 'downloads/reports/coa.docx' }), false);
});

test('product image paths resolve to the API host for native image loading', () => {
  assert.equal(
    resolveBuyerProductImageUrl('product_images/maize.jpg', 'https://api.example.test/api'),
    'https://api.example.test/product_images/maize.jpg',
  );
  assert.equal(
    resolveBuyerProductImageUrl('uploads/products/rice.jpg', 'https://api.example.test'),
    'https://api.example.test/storage/uploads/products/rice.jpg',
  );
  assert.equal(resolveBuyerProductImageUrl('', 'https://api.example.test'), '');
});

test('all Buyer product photos use URL normalization, lazy requests, and disk caching', () => {
  const imageComponent = readFileSync(new URL('../components/BuyerProductImage.tsx', import.meta.url), 'utf8');
  const productSurfaces = [
    readFileSync(new URL('../components/BuyerProductCard.tsx', import.meta.url), 'utf8'),
    readFileSync(new URL('../components/BuyerHomeCatalog.tsx', import.meta.url), 'utf8'),
    readFileSync(new URL('../components/BuyerCartScreen.tsx', import.meta.url), 'utf8'),
    readFileSync(new URL('../app/buyer-product/[id].tsx', import.meta.url), 'utf8'),
  ];

  assert.match(imageComponent, /resolveBuyerProductImageUrl\(uri \?\? '', apiOrigin\)/);
  assert.match(imageComponent, /cachePolicy="memory-disk"/);
  assert.match(imageComponent, /loading="lazy"/);
  assert.match(imageComponent, /recyclingKey=\{imageUrl\}/);
  for (const surface of productSurfaces) {
    assert.match(surface, /BuyerProductImage/);
    assert.doesNotMatch(surface, /<Image\b/, 'product surfaces should share the cached remote-image component');
  }
});
