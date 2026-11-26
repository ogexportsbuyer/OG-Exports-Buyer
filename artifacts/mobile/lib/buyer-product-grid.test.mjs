import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const productScreen = readFileSync(new URL('../app/(buyer-tabs)/buyer-products.tsx', import.meta.url), 'utf8');
const productCard = readFileSync(new URL('../components/BuyerProductCard.tsx', import.meta.url), 'utf8');
const homeCatalog = readFileSync(new URL('../components/BuyerHomeCatalog.tsx', import.meta.url), 'utf8');
const repeatOrders = readFileSync(new URL('../app/buyer-repeat-orders.tsx', import.meta.url), 'utf8');

test('the Products page uses the same two-column card width as Home', () => {
  const homeWidth = homeCatalog.match(/Math\.min\(224, \(windowWidth - 54\) \/ 2\)/);
  const productsWidth = productScreen.match(/Math\.min\(224, \(windowWidth - 54\) \/ 2\)/);
  assert.ok(homeWidth, 'Home keeps its two-column card width formula');
  assert.ok(productsWidth, 'Products matches the Home card width formula');
  assert.match(productScreen, /testID="buyer-products-grid" style=\{\{ flexDirection: 'row', flexWrap: 'wrap', gap: 14/);
  assert.match(productScreen, /layout="grid"/);
  assert.match(productScreen, /width=\{productCardWidth\}/);
});

test('grid cards reduce image height while preserving product actions and detail layout', () => {
  assert.match(productCard, /layout\?: 'detailed' \| 'grid'/);
  assert.match(productCard, /layout = 'detailed'/);
  assert.match(productCard, /const imageHeight = compact \? Math\.min\(156, Math\.round\(\(width \?\? 172\) \* 0\.82\)\) : 190/);
  assert.match(productCard, /testID=\{`buyer-product-details-\$\{id\}`\}/);
  assert.match(productCard, /testID=\{`buyer-product-add-\$\{id\}`\}/);
  assert.match(repeatOrders, /<BuyerProductCard/);
  assert.doesNotMatch(repeatOrders, /layout="grid"/);
});
