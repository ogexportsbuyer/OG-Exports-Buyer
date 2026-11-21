import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildBuyerOrderNotes,
  buyerCartItemMinimumQuantity,
  formatBuyerDeliveryDateInput,
  isFutureBuyerDeliveryDate,
  nextBuyerCartQuantity,
} from './buyer-cart-flow.ts';

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

test('delivery date input formats digits and accepts only real future calendar dates', () => {
  assert.equal(formatBuyerDeliveryDateInput('20280517'), '2028-05-17');
  assert.equal(formatBuyerDeliveryDateInput('2028-0b5'), '2028-05');
  const now = new Date(2028, 4, 17, 16);
  assert.equal(isFutureBuyerDeliveryDate('2028-05-18', now), true);
  assert.equal(isFutureBuyerDeliveryDate('2028-05-17', now), false);
  assert.equal(isFutureBuyerDeliveryDate('2028-02-30', now), false);
  assert.equal(isFutureBuyerDeliveryDate('18/05/2028', now), false);
});

test('order notes retain buyer instructions and selected payment details', () => {
  assert.equal(
    buildBuyerOrderNotes('Handle as fragile', 'Pay to Bank A · IBAN XX00', ['Issuing bank: Example Bank']),
    'Handle as fragile\n\nPay to Bank A · IBAN XX00\nIssuing bank: Example Bank',
  );
  assert.equal(buildBuyerOrderNotes('  ', '', []), '');
});
