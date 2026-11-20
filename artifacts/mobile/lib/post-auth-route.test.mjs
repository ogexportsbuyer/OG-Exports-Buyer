import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resolveAccountPostAuthHref,
  resolveBuyerPostAuthHref,
  hasBuyerAccountIdentity,
  hasBuyerRole,
  isBuyerAppRoute,
  resolvePostAuthHref,
  resolveUserPostAuthHref,
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
  assert.deepEqual(
    resolveBuyerPostAuthHref('/buyer-quotation/456'),
    { pathname: '/buyer-quotation/[id]', params: { id: '456' } },
  );
  assert.equal(resolveBuyerPostAuthHref('/account/messages'), '/(buyer-tabs)/buyer-messages');
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

test('investor-only roles cannot route into investor tabs in the buyer app', () => {
  assert.equal(resolveAccountPostAuthHref(['investor'], '/buyer-cart'), '/(buyer-tabs)/buyer-home');
  assert.equal(resolveAccountPostAuthHref(['buyer', 'investor'], '/buyer-cart'), '/(buyer-tabs)/buyer-cart');
  assert.equal(hasBuyerRole(['investor']), false);
  assert.equal(hasBuyerRole([{ name: 'buyer' }]), true);
});

test('recognizes buyer account type when the API omits the roles array', () => {
  assert.equal(hasBuyerAccountIdentity({ account_type: 'buyer' }), true);
  assert.equal(hasBuyerAccountIdentity({ accountType: 'buyer' }), true);
  assert.equal(hasBuyerAccountIdentity({ account_type: 'investor' }), false);
  assert.equal(resolveUserPostAuthHref({ account_type: 'buyer' }, '/buyer-cart'), '/(buyer-tabs)/buyer-cart');
});

test('a returned non-buyer role takes precedence over a conflicting account type', () => {
  const user = { account_type: 'buyer', roles: ['investor'] };
  assert.equal(hasBuyerAccountIdentity(user), false);
  assert.equal(resolveUserPostAuthHref(user, '/buyer-cart'), '/(buyer-tabs)/buyer-home');
});

test('buyer app route allowlist blocks investor screens and permits buyer support', () => {
  assert.equal(isBuyerAppRoute('(buyer-tabs)', '/buyer-home'), true);
  assert.equal(isBuyerAppRoute('(auth)', '/login'), true);
  assert.equal(isBuyerAppRoute('buyer-checkout', '/buyer-checkout'), true);
  assert.equal(isBuyerAppRoute('account', '/account/notifications'), true);
  assert.equal(isBuyerAppRoute('(tabs)', '/'), false);
  assert.equal(isBuyerAppRoute('wallet', '/wallet/deposit'), false);
  assert.equal(isBuyerAppRoute('account', '/account/portfolio'), false);
  assert.equal(isBuyerAppRoute('buyer-system-settings', '/buyer-system-settings'), true);
  assert.equal(isBuyerAppRoute('buyer-notifications', '/buyer-notifications'), true);
  for (const route of [
    'buyer-profile-details',
    'buyer-company',
    'buyer-security',
    'buyer-overview',
    'buyer-analytics',
    'buyer-repeat-orders',
    'buyer-rfq',
    'buyer-shipments',
    'buyer-documents',
    'buyer-trade-finance',
  ]) {
    assert.equal(isBuyerAppRoute(route, `/${route}`), true, `${route} should stay inside the buyer app`);
  }
});

test('buyer return routes preserve system settings and notification destinations', () => {
  assert.equal(resolveBuyerPostAuthHref('/buyer-system-settings'), '/buyer-system-settings');
  assert.equal(resolveBuyerPostAuthHref('/buyer-notifications'), '/buyer-notifications');
  assert.equal(resolveBuyerPostAuthHref('/buyer-profile-details'), '/buyer-profile-details');
  assert.equal(resolveBuyerPostAuthHref('/buyer-company'), '/buyer-company');
  assert.deepEqual(resolveBuyerPostAuthHref('/buyer-rfq/421'), {
    pathname: '/buyer-rfq/[id]',
    params: { id: '421' },
  });
  assert.deepEqual(resolveBuyerPostAuthHref('/buyer-shipment/890'), {
    pathname: '/buyer-shipment/[id]',
    params: { id: '890' },
  });
});
