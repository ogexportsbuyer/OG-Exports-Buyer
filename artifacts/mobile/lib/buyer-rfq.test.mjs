import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BUYER_RFQ_PACKAGING_OPTIONS,
  BUYER_RFQ_PAYMENT_TERMS,
  buyerRfqDestination,
  buyerRfqDraftFromRecord,
  buyerRfqStatus,
  filterBuyerRfqs,
  formatBuyerRfqReference,
  isFutureBuyerRfqDate,
  parseBuyerRfqQuantity,
  resolveBuyerRfqAttachmentUrl,
} from './buyer-rfq.ts';

test('RFQ quantity accepts only positive numeric metric tonnes', () => {
  assert.equal(parseBuyerRfqQuantity('25'), 25);
  assert.equal(parseBuyerRfqQuantity('0.75'), 0.75);
  assert.equal(parseBuyerRfqQuantity('0'), null);
  assert.equal(parseBuyerRfqQuantity('-2'), null);
  assert.equal(parseBuyerRfqQuantity('25 MT'), null);
  assert.equal(parseBuyerRfqQuantity('25abc'), null);
});

test('RFQ delivery dates require a real calendar date after today', () => {
  const today = new Date(2026, 4, 10, 12);
  assert.equal(isFutureBuyerRfqDate('2026-05-11', today), true);
  assert.equal(isFutureBuyerRfqDate('2026-05-10', today), false);
  assert.equal(isFutureBuyerRfqDate('2026-02-30', today), false);
  assert.equal(isFutureBuyerRfqDate('11/05/2026', today), false);
});

test('RFQ references use the dashboard numbering format', () => {
  assert.equal(formatBuyerRfqReference(42), 'RFQ-000042');
  assert.equal(formatBuyerRfqReference('000042'), 'RFQ-000042');
});

test('RFQ attachment links resolve uploaded paths against the API origin', () => {
  assert.equal(resolveBuyerRfqAttachmentUrl('rfq-attachments/coa.pdf', '', 'https://api.example.test'), 'https://api.example.test/storage/rfq-attachments/coa.pdf');
  assert.equal(resolveBuyerRfqAttachmentUrl('storage/rfq-attachments/coa.pdf', '', 'https://api.example.test/api'), 'https://api.example.test/storage/rfq-attachments/coa.pdf');
  assert.equal(resolveBuyerRfqAttachmentUrl('', 'https://cdn.example.test/coa.pdf', 'https://api.example.test'), 'https://cdn.example.test/coa.pdf');
  assert.equal(resolveBuyerRfqAttachmentUrl('', '', 'https://api.example.test'), '');
});

test('status labels match dashboard states and infer quotes from responses', () => {
  assert.equal(buyerRfqStatus({ status: 'pending' }), 'Pending');
  assert.equal(buyerRfqStatus({ status: 'quoted' }), 'Quoted');
  assert.equal(buyerRfqStatus({ status: 'pending', quotations: [{ id: 1 }] }), 'Quoted');
  assert.equal(buyerRfqStatus({ status: 'converted' }), 'Accepted');
  assert.equal(buyerRfqStatus({ status: 'expired' }), 'Expired');
});

test('search and status filters cover references, products, and destinations', () => {
  const rows = [
    { id: 12, product_name: 'Yellow Maize', status: 'pending', destination: 'Jebel Ali' },
    { id: 13, product_name: 'Basmati Rice', status: 'expired', destination: 'Karachi' },
  ];
  assert.deepEqual(filterBuyerRfqs(rows, 'maize', 'All'), [rows[0]]);
  assert.deepEqual(filterBuyerRfqs(rows, 'RFQ-000013', 'Expired'), [rows[1]]);
  assert.deepEqual(filterBuyerRfqs(rows, 'Karachi', 'Pending'), []);
});

test('expired requests populate the dashboard resubmit fields', () => {
  const draft = buyerRfqDraftFromRecord({
    product_id: 7,
    qty: '25 MT',
    packaging: '50 kg Jute Bag',
    country_id: 8,
    port_id: 9,
    incoterm: 'CIF',
    payment_terms: 'LC at Sight',
    required_delivery_date: '2027-01-02T00:00:00Z',
    notes: 'Halal certificate required',
  });
  assert.deepEqual(draft, {
    productId: '7',
    quantity: '25',
    packaging: '50 kg Jute Bag',
    countryId: '8',
    portId: '9',
    incoterm: 'CIF',
    paymentTerms: 'LC at Sight',
    deliveryDate: '2027-01-02',
    notes: 'Halal certificate required',
  });
  assert.deepEqual(BUYER_RFQ_PACKAGING_OPTIONS, ['25 kg PP Bag', '50 kg Jute Bag', '1 MT Jumbo Bag', 'Bulk', 'Other (specify in notes)']);
  assert.deepEqual(BUYER_RFQ_PAYMENT_TERMS, ['LC at Sight', '100% Advance TT', '30% Advance + 70% BL', 'SBLC']);
});

test('RFQ destination uses country and port names if destination text is absent', () => {
  assert.equal(buyerRfqDestination({ port: { name: 'Jebel Ali' }, country: { name: 'United Arab Emirates' } }), 'Jebel Ali, United Arab Emirates');
});
