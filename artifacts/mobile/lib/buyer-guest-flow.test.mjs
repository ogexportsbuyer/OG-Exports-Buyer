import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  buyerCartBadgeCount,
  buildBuyerGuestCartMergeTargets,
  buyerGuestCartRow,
  isBuyerGuestFlowSnapshot,
} from './buyer-guest-flow.ts';

test('guest cart rows retain product details, images, FOB price and MOQ quantity', () => {
  const entry = {
    productId: 42,
    quantity: 20,
    product: {
      id: 42,
      name: 'Premium Rice',
      image_url: 'https://cdn.example.test/rice.jpg',
      price: '1360.00',
      moq: '20 MT',
    },
  };
  assert.deepEqual(buyerGuestCartRow(entry), {
    id: 'guest-42',
    product_id: 42,
    qty: 20,
    unit_price: 1360,
    product: entry.product,
  });
});

test('home cart badge counts distinct products rather than quantities', () => {
  const guestItems = [
    { productId: 42, quantity: 20, product: {} },
    { productId: 43, quantity: 5, product: {} },
  ];

  assert.equal(buyerCartBadgeCount(guestItems, [], false, false), 2);
  assert.equal(buyerCartBadgeCount(
    guestItems,
    [{ product_id: 42, qty: 10 }, { product_id: 44, qty: 3 }],
    true,
    false,
  ), 3);
  assert.equal(buyerCartBadgeCount(
    guestItems,
    [{ product_id: 42, qty: 10 }, { product_id: 44, qty: 3 }],
    true,
    true,
  ), 2);
  assert.equal(buyerCartBadgeCount(
    [],
    [{ product_id: 42, qty: 100 }, { product_id: 42, qty: 5 }, { product_id: 44, qty: 1 }],
    true,
    false,
  ), 2);
});

test('guest cart merge targets add server quantities once for each product', () => {
  assert.deepEqual(
    buildBuyerGuestCartMergeTargets([
      { productId: 42, quantity: 20, product: { moq: '20 MT' } },
      { productId: 43, quantity: 5, product: { moq: '5 MT' } },
    ], [
      { product_id: 42, qty: 10 },
      { product_id: 42, qty: 2 },
    ]),
    { '42': 32, '43': 5 },
  );
});

test('guest flow snapshots accept only the supported storage version', () => {
  assert.equal(isBuyerGuestFlowSnapshot({ version: 1, cart: [] }), true);
  assert.equal(isBuyerGuestFlowSnapshot({ version: 2, cart: [] }), false);
  assert.equal(isBuyerGuestFlowSnapshot({ version: 1, cart: {} }), false);
});

test('final RFQ and checkout actions preserve guest drafts before opening sign-in', () => {
  const rfq = readFileSync(new URL('../components/BuyerRfqForm.tsx', import.meta.url), 'utf8');
  const checkout = readFileSync(new URL('../app/buyer-checkout.tsx', import.meta.url), 'utf8');
  const flow = readFileSync(new URL('../context/BuyerGuestFlowContext.tsx', import.meta.url), 'utf8');
  assert.match(rfq, /returnTo: '\/buyer-rfq\?mode=new&resumeAfterAuth=1'/);
  assert.match(rfq, /saveRfqDraft\(draft\)/);
  assert.match(rfq, /resumeAfterAuth/);
  assert.match(checkout, /resumeAction=\$\{action\}/);
  assert.match(checkout, /saveCheckoutDraft\(guestCheckoutDraft\(action\)\)/);
  assert.match(checkout, /attemptedResume\.current = resumeAction/);
  assert.match(flow, /replace: true/);
});
