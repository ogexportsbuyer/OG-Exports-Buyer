import assert from 'node:assert/strict';
import test from 'node:test';
import { buyerProductSpecs, buyerProductValues } from './buyer-product-data.ts';

test('product specs keep only complete label and value pairs', () => {
  assert.deepEqual(buyerProductSpecs({
    specs: [
      { label: 'Purity', value: '99.5% Min' },
      { label: 'Moisture', value: '6% Max' },
      { label: 'Missing value' },
      { value: 'No label' },
    ],
  }), [
    { label: 'Purity', value: '99.5% Min' },
    { label: 'Moisture', value: '6% Max' },
  ]);
});

test('product list fields support strings and server-provided objects', () => {
  assert.deepEqual(buyerProductValues({
    certifications: [
      'Lab Tested',
      { name: 'Phytosanitary' },
      { title: 'COA' },
      '',
      'Lab Tested',
    ],
  }, 'certifications'), ['Lab Tested', 'Phytosanitary', 'COA']);
});

test('product list fields accept delimited text and safely ignore absent data', () => {
  assert.deepEqual(buyerProductValues({ payment_terms: 'LC at Sight; TT, SBLC' }, 'payment_terms'), [
    'LC at Sight',
    'TT',
    'SBLC',
  ]);
  assert.deepEqual(buyerProductValues({}, 'packaging_options'), []);
});
