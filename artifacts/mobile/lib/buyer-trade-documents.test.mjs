import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buyerDocumentCategoryCounts,
  categoryForBuyerDocument,
  filterBuyerTradeDocuments,
  formatBuyerDocumentSize,
  mapBuyerTradeDocument,
  sortBuyerTradeDocuments,
} from './buyer-trade-documents.ts';

test('classifies the six website document categories and keeps other types searchable', () => {
  assert.equal(categoryForBuyerDocument('Commercial Invoice'), 'Commercial');
  assert.equal(categoryForBuyerDocument('Bill of Lading'), 'Shipping');
  assert.equal(categoryForBuyerDocument('Phytosanitary Certificate'), 'Government');
  assert.equal(categoryForBuyerDocument('Certificate of Analysis'), 'Quality');
  assert.equal(categoryForBuyerDocument('Cargo Insurance'), 'Insurance');
  assert.equal(categoryForBuyerDocument('Standby LC'), 'Finance');
  assert.equal(categoryForBuyerDocument('Unknown memo'), 'Other');
});

test('maps only explicit source and availability states safely', () => {
  const document = mapBuyerTradeDocument({
    id: 42,
    source: 'admin',
    status: 'available',
    title: 'Commercial Invoice',
    type: 'Invoice',
    order_id: 19,
    mime: 'application/pdf',
    path: 'private/invoice.pdf',
    file_size: 2 * 1024 * 1024,
    created_at: '2026-11-20T10:00:00Z',
  });

  assert.equal(document.source, 'admin');
  assert.equal(document.status, 'available');
  assert.equal(document.orderId, 'PO-19');
  assert.equal(document.category, 'Commercial');
  assert.equal(document.sizeLabel, '2.0 MB');
  assert.equal(document.extension, 'pdf');
  assert.equal(document.downloadUrl, '/api/buyer/documents/42/download');
  assert.equal(document.viewUrl, '/api/buyer/documents/42/view');
  assert.equal(mapBuyerTradeDocument({ id: 43, source: 'buyer', status: 'available' }).source, 'buyer');
  assert.equal(mapBuyerTradeDocument({ id: 44 }).source, 'unknown');
  assert.equal(mapBuyerTradeDocument({ id: 45, source: 'admin' }).status, 'pending');
});

test('counts only OG Exports categories, not buyer uploads or uncategorized records', () => {
  const docs = [
    mapBuyerTradeDocument({ id: 1, source: 'admin', type: 'Invoice', status: 'available' }),
    mapBuyerTradeDocument({ id: 2, source: 'admin', type: 'Bill of Lading', status: 'pending' }),
    mapBuyerTradeDocument({ id: 3, source: 'buyer', type: 'Invoice', status: 'available' }),
    mapBuyerTradeDocument({ id: 4, source: 'admin', type: 'Miscellaneous', status: 'available' }),
  ];
  assert.deepEqual(buyerDocumentCategoryCounts(docs), {
    Commercial: 1,
    Shipping: 1,
    Government: 0,
    Quality: 0,
    Insurance: 0,
    Finance: 0,
  });
});

test('search, category and starred filters combine without exposing buyer-uploaded files', () => {
  const docs = [
    mapBuyerTradeDocument({ id: 1, source: 'admin', status: 'available', type: 'Invoice', title: 'Rice invoice', order_number: 'OG-41' }),
    mapBuyerTradeDocument({ id: 2, source: 'admin', status: 'pending', type: 'Shipping', title: 'Bill of Lading', shipment_id: 77 }),
    mapBuyerTradeDocument({ id: 3, source: 'buyer', status: 'available', type: 'Invoice', title: 'My upload' }),
  ];
  const starred = new Set(['1', '3']);
  assert.deepEqual(filterBuyerTradeDocuments(docs, { search: 'OG-41' }).map(doc => doc.id), ['1']);
  assert.deepEqual(filterBuyerTradeDocuments(docs, { category: 'Shipping' }).map(doc => doc.id), ['2']);
  assert.deepEqual(filterBuyerTradeDocuments(docs, { starredOnly: true, starred }).map(doc => doc.id), ['1']);
});

test('orders newest files first and formats unknown or small sizes clearly', () => {
  const docs = sortBuyerTradeDocuments([
    mapBuyerTradeDocument({ id: 1, source: 'admin', created_at: '2026-01-01T00:00:00Z' }),
    mapBuyerTradeDocument({ id: 2, source: 'admin', created_at: '2026-11-20T00:00:00Z' }),
  ]);
  assert.deepEqual(docs.map(doc => doc.id), ['2', '1']);
  assert.equal(formatBuyerDocumentSize(null), '—');
  assert.equal(formatBuyerDocumentSize(420), '420 B');
  assert.equal(formatBuyerDocumentSize(2048), '2 KB');
});
