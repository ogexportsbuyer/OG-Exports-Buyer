import assert from 'node:assert/strict';
import test from 'node:test';
import { buyerCartItemMinimumQuantity, nextBuyerCartQuantity } from './buyer-cart-flow.ts';

test('buyer cart quantity never drops below the product minimum order', () => {
  assert.equal(nextBuyerCartQuantity(20, -1, 20), 20);
  assert.equal(nextBuyerCartQuantity(24, -1, 20), 23);
  assert.equal(nextBuyerCartQuantity(18, -1, 20), 20);
});

test('buyer cart quantity increases in whole units and normalizes invalid values', () => {
  assert.equal(nextBuyerCartQuantity(20, 1, 20), 21);
  assert.equal(nextBuyerCartQuantity(20.8, 1.5, 20.2), 21);
  assert.equal(nextBuyerCartQuantity(Number.NaN, Number.NaN, Number.NaN), 1);
});

test('cart minimum order uses the product value and falls back to the cart item', () => {
  assert.equal(buyerCartItemMinimumQuantity({ product: { moq: '25 MT' }, moq: '10 MT' }), 25);
  assert.equal(buyerCartItemMinimumQuantity({ product: {}, moq: '5 cases' }), 5);
  assert.equal(buyerCartItemMinimumQuantity({ product: {} }), 1);
});
