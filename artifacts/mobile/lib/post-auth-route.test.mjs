import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resolveAccountPostAuthHref,
  resolveBuyerPostAuthHref,
  resolvePostAuthHref,
  serializeRouteState,
} from './post-auth-route.ts';
import {
  buyerCartRouteAfterProductAdd,
  claimPendingBuyerProduct,
  pendingProductAuthReturnTo,
} from './buyer-auth-flow.ts';

test('keeps legacy deposit and withdrawal link context after sign-in', () => {
  assert.deepEqual(
    resolvePostAuthHref('/account/transaction/123?kind=deposit&page=4'),
    {
      pathname: '/account/transaction/[id]',
      params: { id: '123', kind: 'deposit', page: '4' },
    },
  );
  assert.deepEqual(
    resolvePostAuthHref('/account/transaction/456?kind=withdrawal'),
    {
      pathname: '/account/transaction/[id]',
      params: { id: '456', kind: 'withdrawal', page: undefined },
    },
  );
});

test('keeps the default wallet kind and investment position ID for saved links', () => {
  assert.deepEqual(
    resolvePostAuthHref('/account/transaction/987'),
    {
      pathname: '/account/transaction/[id]',
      params: { id: '987', kind: 'wallet', page: undefined },
    },
  );
  assert.deepEqual(
    resolvePostAuthHref('/position/789'),
    { pathname: '/position/[id]', params: { id: '789' } },
  );
});

test('serializes legacy transaction route query details for post-auth navigation', () => {
  const returnTo = serializeRouteState('/account/transaction/123', { kind: 'deposit', page: '2' });
  assert.deepEqual(resolvePostAuthHref(returnTo), {
    pathname: '/account/transaction/[id]',
    params: { id: '123', kind: 'deposit', page: '2' },
  });
});

test('returns buyer sign-in to the requested marketplace destination', () => {
  assert.equal(resolveBuyerPostAuthHref('/buyer-cart'), '/(buyer-tabs)/buyer-cart');
  assert.equal(resolveBuyerPostAuthHref('/buyer-products?search=rice'), '/(buyer-tabs)/buyer-products');
  assert.deepEqual(
    resolveBuyerPostAuthHref('/buyer-products?pendingProduct=42'),
    { pathname: '/(buyer-tabs)/buyer-products', params: { pendingProduct: '42' } },
  );
  assert.deepEqual(
    resolveBuyerPostAuthHref('/buyer-order/123'),
    { pathname: '/buyer-order/[id]', params: { id: '123' } },
  );
  assert.equal(resolveBuyerPostAuthHref('/account/messages'), '/account/messages');
});

test('uses a safe buyer home fallback for unknown post-auth routes', () => {
  assert.equal(resolveBuyerPostAuthHref('//external.example'), '/(buyer-tabs)/buyer-home');
  assert.equal(resolveBuyerPostAuthHref('/admin'), '/(buyer-tabs)/buyer-home');
});

test('buyer login and email verification keep the selected product through cart', () => {
  const returnTo = pendingProductAuthReturnTo(42);
  assert.equal(returnTo, '/buyer-products?pendingProduct=42');
  assert.deepEqual(resolveAccountPostAuthHref(['buyer'], returnTo), {
    pathname: '/(buyer-tabs)/buyer-products',
    params: { pendingProduct: '42' },
  });
  assert.equal(buyerCartRouteAfterProductAdd(true), '/(buyer-tabs)/buyer-cart');
  assert.equal(buyerCartRouteAfterProductAdd(false), null);
});

test('pending buyer product is claimed only once and invalid IDs are rejected', () => {
  const handled = { current: '' };
  assert.equal(claimPendingBuyerProduct('42', handled), '42');
  assert.equal(claimPendingBuyerProduct('42', handled), null);
  assert.equal(claimPendingBuyerProduct('43', handled), '43');
  assert.equal(claimPendingBuyerProduct('../42', handled), null);
  assert.equal(pendingProductAuthReturnTo(0), null);
  assert.equal(pendingProductAuthReturnTo(Number.MAX_SAFE_INTEGER + 1), null);
});

test('investor authentication still returns to investor tabs, not buyer cart', () => {
  assert.equal(resolveAccountPostAuthHref(['investor'], '/buyer-cart'), '/(tabs)');
  assert.equal(resolveAccountPostAuthHref(['buyer', 'investor'], '/buyer-cart'), '/(tabs)');
});
