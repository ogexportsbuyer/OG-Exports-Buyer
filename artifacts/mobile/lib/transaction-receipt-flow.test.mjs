import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { hasUiTranslation, translateUi } from './strings.ts';

test('receipt preview actions are translated in every supported app language', () => {
  for (const language of ['ur', 'ar', 'ru', 'zh-CN', 'fr', 'es', 'de']) {
    assert.ok(hasUiTranslation('View receipt', language));
    assert.ok(hasUiTranslation('Save to Gallery', language));
    assert.ok(hasUiTranslation('Receipt image saved to your gallery.', language));
    assert.notEqual(translateUi('View receipt', language), 'View receipt');
    assert.notEqual(translateUi('Save to Gallery', language), 'Save to Gallery');
    assert.notEqual(translateUi('Receipt image saved to your gallery.', language), 'Receipt image saved to your gallery.');
  }
});

test('all transaction receipt entry points open the shared in-app preview, not a PDF automatically', () => {
  const paths = [
    '../app/account/transactions.tsx',
    '../app/account/transaction/[id].tsx',
    '../app/wallet/deposit.tsx',
    '../app/wallet/withdraw.tsx',
    '../app/project/[id].tsx',
  ];

  for (const path of paths) {
    const source = readFileSync(new URL(path, import.meta.url), 'utf8');
    assert.match(source, /TransactionReceiptPreview/, `${path} mounts the shared receipt view`);
    assert.doesNotMatch(source, /saveTransactionReceipt/, `${path} does not jump directly to PDF sharing`);
  }
});
