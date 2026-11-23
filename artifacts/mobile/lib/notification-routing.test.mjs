import assert from 'node:assert/strict';
import test from 'node:test';
import { notificationHref } from './notification-routing.ts';

test('opens the exact quotation sent in a buyer notification', () => {
  assert.deepEqual(notificationHref({
    type: 'quotation',
    data: { href: '/buyer/quotations', quotation_id: 91, rfq_id: 37 },
  }), {
    pathname: '/buyer-quotation/[id]',
    params: { id: '91' },
  });
});

test('opens deep links from a tapped push payload with top-level record IDs', () => {
  assert.deepEqual(notificationHref({
    type: 'order_status',
    href: '/buyer/orders',
    order_id: '42',
  }), {
    pathname: '/buyer-order/[id]',
    params: { id: '42' },
  });
});

test('opens the related buyer RFQ when its admin update has no quotation yet', () => {
  assert.deepEqual(notificationHref({
    type: 'rfq_status',
    data: { href: '/buyer/rfqs', rfq_id: 37 },
  }), {
    pathname: '/buyer-rfq/[id]',
    params: { id: '37' },
  });
});

test('opens the order details for buyer order updates', () => {
  assert.deepEqual(notificationHref({
    type: 'order_status',
    data: { href: '/buyer/orders', order_id: 42 },
  }), {
    pathname: '/buyer-order/[id]',
    params: { id: '42' },
  });
});

test('routes payment, shipment, document, and support alerts to buyer sections', () => {
  assert.deepEqual(notificationHref({
    type: 'buyer_payment_approved',
    data: { href: '/buyer/payments', order_id: 42 },
  }), { pathname: '/buyer-trade-finance', params: { orderId: '42' } });
  assert.deepEqual(notificationHref({
    type: 'shipment_update',
    data: { href: '/buyer/shipments', shipment_id: 16 },
  }), { pathname: '/buyer-shipment/[id]', params: { id: '16' } });
  assert.equal(notificationHref({
    type: 'trade_document',
    data: { href: '/buyer/documents', document_id: 8 },
  }), '/buyer-documents');
  assert.equal(notificationHref({
    type: 'support_ticket',
    data: { href: '/buyer/messages', ticket_id: 6 },
  }), '/(buyer-tabs)/buyer-messages');
});
