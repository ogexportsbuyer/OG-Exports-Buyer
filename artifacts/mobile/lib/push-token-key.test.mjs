import assert from 'node:assert/strict';
import test from 'node:test';
import { buyerPushTokenSecureStoreKey, pushTokenSecureStoreKey } from './push-token-key.ts';

test('push-token SecureStore keys use only platform-supported characters', () => {
  const key = pushTokenSecureStoreKey('investor:42 / mobile');
  assert.match(key, /^[A-Za-z0-9._-]+$/);
});

test('push-token SecureStore keys stay scoped to distinct accounts', () => {
  assert.notEqual(pushTokenSecureStoreKey('user:1'), pushTokenSecureStoreKey('user_1'));
});

test('push-token SecureStore keys reject an empty account ID', () => {
  assert.throws(() => pushTokenSecureStoreKey('  '), /signed-in account/);
});

test('buyer push-token SecureStore keys stay separate from investor tokens', () => {
  const buyerKey = buyerPushTokenSecureStoreKey('user:42 / mobile');
  assert.match(buyerKey, /^[A-Za-z0-9._-]+$/);
  assert.notEqual(buyerKey, pushTokenSecureStoreKey('user:42 / mobile'));
});
