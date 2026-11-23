import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveBuyerProductImageUrl } from './buyer-product-image.ts';

test('buyer cart product image paths resolve against the API origin', () => {
  assert.equal(
    resolveBuyerProductImageUrl('product_images/maize.jpg', 'https://api.example.test/api'),
    'https://api.example.test/product_images/maize.jpg',
  );
  assert.equal(
    resolveBuyerProductImageUrl('/storage/products/rice.jpg', 'https://api.example.test'),
    'https://api.example.test/storage/products/rice.jpg',
  );
  assert.equal(
    resolveBuyerProductImageUrl('uploads/products/sesame.jpg', 'https://api.example.test'),
    'https://api.example.test/storage/uploads/products/sesame.jpg',
  );
});

test('buyer cart image resolver preserves hosted image URLs and safely handles missing data', () => {
  assert.equal(
    resolveBuyerProductImageUrl('https://cdn.example.test/rice.jpg', 'https://api.example.test'),
    'https://cdn.example.test/rice.jpg',
  );
  assert.equal(
    resolveBuyerProductImageUrl('//cdn.example.test/rice.jpg', 'https://api.example.test'),
    'https://cdn.example.test/rice.jpg',
  );
  assert.equal(resolveBuyerProductImageUrl('product_images/rice.jpg', ''), '');
  assert.equal(resolveBuyerProductImageUrl('', 'https://api.example.test'), '');
});
