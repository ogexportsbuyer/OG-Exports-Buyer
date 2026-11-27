import assert from 'node:assert/strict';
import test from 'node:test';
import { saveReceiptImageToGallery } from './receipt-gallery.ts';

test('a granted gallery write permission captures and saves the receipt image', async () => {
  const calls = [];
  const result = await saveReceiptImageToGallery(
    async () => { calls.push('capture'); return 'file:///tmp/receipt.png'; },
    {
      getPermission: async () => ({ granted: true, canAskAgain: true }),
      requestPermission: async () => { calls.push('request'); return { granted: true, canAskAgain: true }; },
      saveImage: async uri => { calls.push(`save:${uri}`); },
    },
  );

  assert.equal(result, 'saved');
  assert.deepEqual(calls, ['capture', 'save:file:///tmp/receipt.png']);
});

test('gallery permission is requested only after the user triggers image saving', async () => {
  const calls = [];
  const result = await saveReceiptImageToGallery(
    async () => { calls.push('capture'); return 'file:///tmp/receipt.png'; },
    {
      getPermission: async () => ({ granted: false, canAskAgain: true }),
      requestPermission: async () => { calls.push('request'); return { granted: true, canAskAgain: true }; },
      saveImage: async () => { calls.push('save'); },
    },
  );

  assert.equal(result, 'saved');
  assert.deepEqual(calls, ['request', 'capture', 'save']);
});

test('a denied gallery permission does not capture or save a receipt', async () => {
  const calls = [];
  const result = await saveReceiptImageToGallery(
    async () => { calls.push('capture'); return 'file:///tmp/receipt.png'; },
    {
      getPermission: async () => ({ granted: false, canAskAgain: true }),
      requestPermission: async () => ({ granted: false, canAskAgain: true }),
      saveImage: async () => { calls.push('save'); },
    },
  );

  assert.equal(result, 'permission-denied');
  assert.deepEqual(calls, []);
});

test('a permanently denied gallery permission is reported without retrying or saving', async () => {
  const result = await saveReceiptImageToGallery(
    async () => 'file:///tmp/receipt.png',
    {
      getPermission: async () => ({ granted: false, canAskAgain: false }),
      requestPermission: async () => { throw new Error('should not request twice'); },
      saveImage: async () => { throw new Error('should not save without permission'); },
    },
  );

  assert.equal(result, 'permission-blocked');
});

test('an empty capture path fails instead of showing a false saved state', async () => {
  await assert.rejects(
    saveReceiptImageToGallery(
      async () => '',
      {
        getPermission: async () => ({ granted: true, canAskAgain: true }),
        requestPermission: async () => ({ granted: true, canAskAgain: true }),
        saveImage: async () => assert.fail('empty capture must not be saved'),
      },
    ),
    /empty file path/,
  );
});
