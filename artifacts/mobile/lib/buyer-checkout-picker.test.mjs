import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  buyerDeliveryCalendarDays,
  buyerDeliveryDateKey,
  isFutureBuyerDeliveryDate,
  parseBuyerDeliveryDate,
} from './buyer-cart-flow.ts';

const checkoutScreen = readFileSync(new URL('../components/BuyerCheckoutFlow.tsx', import.meta.url), 'utf8');
const datePicker = readFileSync(new URL('../components/BuyerDeliveryDatePicker.tsx', import.meta.url), 'utf8');

test('delivery calendar creates the right month grid, including leap days', () => {
  const february = buyerDeliveryCalendarDays(2028, 1);
  assert.deepEqual(february.slice(0, 2), [null, null]);
  assert.equal(february[2], 1);
  assert.equal(february.at(-1), 29);
  assert.equal(february.filter(day => day !== null).length, 29);
  assert.equal(buyerDeliveryDateKey(2028, 1, 29), '2028-02-29');
  assert.equal(parseBuyerDeliveryDate('2028-02-29')?.getDate(), 29);
  assert.equal(parseBuyerDeliveryDate('2028-02-30'), null);
});

test('delivery calendar only allows dates after today', () => {
  const now = new Date(2028, 4, 17, 12);
  assert.equal(isFutureBuyerDeliveryDate('2028-05-17', now), false);
  assert.equal(isFutureBuyerDeliveryDate('2028-05-18', now), true);
  assert.match(datePicker, /disabled=\{!future\}/);
  assert.match(datePicker, /disabled=\{!isFutureBuyerDeliveryDate\(draft\)\}/);
});

test('checkout uses branded searchable pickers for ports and delivery terms', () => {
  assert.match(checkoutScreen, /label="Destination country"/);
  assert.match(checkoutScreen, /label="Destination port"/);
  assert.match(checkoutScreen, /keywords: first\(port, \['unlocode'\]\)/);
  assert.match(checkoutScreen, /label="Delivery term"/);
  assert.match(checkoutScreen, /buyerCartPaymentTerms\(cartItems\)/);
  assert.match(checkoutScreen, /product\.terms\.map\(value => \(\{ value, label: value \}\)\)/);
  assert.match(checkoutScreen, /testID=\{`buyer-checkout-payment-term-\$\{product\.key\}`\}/);
  assert.match(checkoutScreen, /paymentTermsByItem\[product\.key\]/);
  assert.match(checkoutScreen, /buildBuyerCheckoutNotes\(notes, selectedProductPaymentTerms\)/);
  assert.doesNotMatch(checkoutScreen, /BUYER_RFQ_PAYMENT_TERMS/);
  assert.match(checkoutScreen, /<BuyerDeliveryDatePicker/);
  assert.doesNotMatch(checkoutScreen, /label="Search port"/);
});
