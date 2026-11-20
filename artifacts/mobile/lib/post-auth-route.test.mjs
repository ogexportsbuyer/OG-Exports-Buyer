import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveBuyerPostAuthHref, resolvePostAuthHref, serializeRouteState } from './post-auth-route.ts';

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
