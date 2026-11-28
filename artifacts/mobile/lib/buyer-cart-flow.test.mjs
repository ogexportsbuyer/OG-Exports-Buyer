import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  buildBuyerCheckoutNotes,
  buildBuyerOrderNotes,
  buyerCartItemMinimumQuantity,
  formatBuyerDeliveryDateInput,
  isFutureBuyerDeliveryDate,
  nextBuyerCartQuantity,
  parseBuyerCartQuantityInput,
} from './buyer-cart-flow.ts';

const cartScreen = readFileSync(new URL('../components/BuyerCheckoutFlow.tsx', import.meta.url), 'utf8');
const cartEditor = readFileSync(new URL('../components/BuyerCheckoutCartEditor.tsx', import.meta.url), 'utf8');
const quantityControl = readFileSync(new URL('../components/BuyerCartQuantityControl.tsx', import.meta.url), 'utf8');
const cartRoute = readFileSync(new URL('../components/BuyerCartScreen.tsx', import.meta.url), 'utf8');

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

test('typed cart quantity accepts whole numbers and clamps to the product MOQ', () => {
  assert.equal(parseBuyerCartQuantityInput('25', 10), 25);
  assert.equal(parseBuyerCartQuantityInput('3', 10), 10);
  assert.equal(parseBuyerCartQuantityInput('', 10), 10);
  assert.equal(parseBuyerCartQuantityInput('5.5', 1), 1);
  assert.equal(parseBuyerCartQuantityInput('9007199254740992', 1), 1);
});

test('cart keeps both step buttons around an editable numeric quantity input', () => {
  assert.match(quantityControl, /testID=\{`buyer-cart-decrease-\$\{itemId\}`\}/);
  assert.match(quantityControl, /testID=\{`buyer-cart-quantity-input-\$\{itemId\}`\}/);
  assert.match(quantityControl, /width: 72,[\s\S]*?height: 42/);
  assert.match(quantityControl, /keyboardType="number-pad"/);
  assert.match(quantityControl, /onBlur=\{\(\) => void commitQuantity\(draft\)\}/);
  assert.match(quantityControl, /testID=\{`buyer-cart-increase-\$\{itemId\}`\}/);
  assert.match(quantityControl, /parseBuyerCartQuantityInput\(value, minimumQuantity\)/);
  assert.match(cartEditor, /<BuyerCartQuantityControl/);
  assert.match(cartRoute, /BuyerCheckoutFlow cartMode/);
});

test('cart minimum order uses the product value and falls back to the cart item', () => {
  assert.equal(buyerCartItemMinimumQuantity({ product: { moq: '25 MT' }, moq: '10 MT' }), 25);
  assert.equal(buyerCartItemMinimumQuantity({ product: {}, moq: '5 cases' }), 5);
  assert.equal(buyerCartItemMinimumQuantity({ product: {} }), 1);
});

test('cart includes FOB prices, quote status, the web fee estimate and order placement', () => {
  assert.match(cartEditor, /BuyerProductPrice product=\{item\} compact/);
  assert.match(cartEditor, /formatFobPrice\(subtotal, cartCurrency\)/);
  assert.match(cartEditor, /Some products need a confirmed price\./);
  assert.match(cartEditor, /Documentation fee \(2%\)/);
  assert.match(cartEditor, /No payment is taken in this app\./);
  assert.match(cartScreen, /Estimated grand total/);
  assert.match(cartScreen, /testID="buyer-checkout-submit-order"/);
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

test('checkout notes retain the selected commercial payment term', () => {
  assert.equal(
    buildBuyerCheckoutNotes('  Keep products dry  ', '30% Advance + 70% BL'),
    'Keep products dry\n\nPayment term: 30% Advance + 70% BL',
  );
  assert.equal(buildBuyerCheckoutNotes('', 'LC at Sight'), 'Payment term: LC at Sight');
  assert.equal(
    buildBuyerCheckoutNotes('', [
      { productName: 'Basmati Rice', term: 'LC at Sight' },
      { productName: 'Sesame Seeds', term: 'SBLC' },
    ]),
    'Payment term for Basmati Rice: LC at Sight\n\nPayment term for Sesame Seeds: SBLC',
  );
});
