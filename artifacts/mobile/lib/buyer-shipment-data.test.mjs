import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buyerShipmentDetailRows,
  isShipmentInTransit,
  mapBuyerShipment,
  shipmentSearchText,
  shipmentStatusLabel,
  SHIPMENT_TIMELINE_STEPS,
} from './buyer-shipment-data.ts';

test('maps website shipment details and authenticated document routes', () => {
  const shipment = mapBuyerShipment({
    id: 84,
    order_id: 31,
    status: 'in_transit',
    current_milestone: 'Departed Origin',
    product_snapshot: 'Premium Basmati Rice',
    container: 'OGEX1234567',
    tracking_number: 'TRK-84',
    shipping_line: 'Ocean Line',
    vessel: 'MV Example',
    origin: 'Karachi Port',
    destination: 'Jebel Ali',
    etd: '2026-11-20',
    eta: '2026-12-04',
    order: { id: 31, order_number: 'OG-ORD-0031' },
    milestones: [{ id: 1, label: 'Departed Origin', occurred_at: '2026-11-20T08:00:00Z' }],
    trade_documents: [{
      id: 101,
      title: 'Bill of Lading',
      type: 'Shipping',
      mime: 'application/pdf',
      view_url: '/api/buyer/documents/101/view',
      download_url: '/api/buyer/documents/101/download',
    }],
  });

  assert.equal(shipment.statusLabel, 'In Transit');
  assert.equal(shipment.container, 'OGEX1234567');
  assert.equal(shipment.orderNumber, 'OG-ORD-0031');
  assert.equal(shipment.orderRecordId, '31');
  assert.equal(shipment.origin, 'Karachi Port');
  assert.equal(shipment.destination, 'Jebel Ali');
  assert.equal(shipment.etd, 'Nov 20, 2026');
  assert.equal(shipment.eta, 'Dec 4, 2026');
  assert.equal(shipment.timeline.length, SHIPMENT_TIMELINE_STEPS.length);
  assert.equal(shipment.timeline[4].active, true);
  assert.equal(shipment.timeline[4].date, 'Nov 20, 2026');
  assert.equal(shipment.documents[0].viewUrl, '/api/buyer/documents/101/view');
  assert.equal(shipment.documents[0].downloadUrl, '/api/buyer/documents/101/download');
  assert.equal(shipment.documents[0].extension, 'pdf');
  assert.equal(shipment.documents[0].status, 'available');
});

test('shows pending shipments, upcoming journey steps, and unrecognized real updates', () => {
  const shipment = mapBuyerShipment({
    id: 4,
    status: 'pending',
    current_milestone: 'Awaiting Booking',
    milestones: [{
      id: 9,
      label: 'Trade desk note',
      description: 'Booking is awaiting confirmation.',
      event_date: '2026-11-21',
    }],
    trade_documents: [{ id: 12, title: 'Draft packing list', status: 'pending' }],
  });

  assert.equal(shipment.statusLabel, 'Pending');
  assert.equal(shipment.timeline[0].active, true);
  assert.equal(shipment.timeline[0].date, 'In progress');
  assert.equal(shipment.timeline[1].done, false);
  assert.deepEqual(shipment.recentUpdates, [{
    id: '9',
    title: 'Trade desk note',
    date: 'Nov 21, 2026',
    description: 'Booking is awaiting confirmation.',
  }]);
  assert.equal(shipment.documents[0].status, 'pending');
  assert.equal(shipment.documents[0].downloadUrl, '/api/buyer/documents/12/download');
});

test('uses related order destination when shipment destination is absent and recognizes common field aliases', () => {
  const shipment = mapBuyerShipment({
    id: 21,
    status: 'booking_confirmed',
    destination: null,
    vessel_name: 'MV Buyer Route',
    shipping_company: 'Ocean Line',
    estimated_arrival_date: '2026-12-18',
    order: {
      id: 12,
      order_number: 'ORD-BUYER-12',
      destination_port: 'Arzew, Algeria',
    },
  });

  assert.equal(shipment.destination, 'Arzew, Algeria');
  assert.equal(shipment.vessel, 'MV Buyer Route');
  assert.equal(shipment.shippingLine, 'Ocean Line');
  assert.equal(shipment.eta, 'Dec 18, 2026');
});

test('shipment details omit unavailable placeholders and keep reported values', () => {
  const shipment = mapBuyerShipment({
    id: 22,
    container: null,
    order: { order_number: 'ORD-22', destination_port: 'Arzew, Algeria' },
    status: 'in_transit',
  });

  assert.deepEqual(buyerShipmentDetailRows(shipment), [
    { label: 'Order reference', value: 'ORD-22' },
    { label: 'Destination port', value: 'Arzew, Algeria' },
  ]);
});

test('marks every stage complete for delivered shipments and labels known statuses', () => {
  const shipment = mapBuyerShipment({ id: 5, status: 'delivered' });
  assert.equal(shipment.statusLabel, 'Delivered');
  assert.equal(shipment.progress, 100);
  assert.ok(shipment.timeline.every(step => step.done && !step.active));
  assert.equal(shipmentStatusLabel('booking_confirmed'), 'Loading');
  assert.equal(shipmentStatusLabel('arrived_destination'), 'Arrived');
  assert.equal(shipmentStatusLabel('in-transit'), 'In Transit');
});

test('search covers shipment references, route, product, vessel and line', () => {
  const shipment = mapBuyerShipment({
    id: 84,
    order: { order_number: 'OG-ORD-0031' },
    product_snapshot: 'Premium Basmati Rice',
    container: 'OGEX1234567',
    tracking_number: 'TRK-84',
    origin: 'Karachi',
    destination: 'Jebel Ali',
    shipping_line: 'Ocean Line',
    vessel: 'MV Example',
    status: 'arrived',
  });
  const haystack = shipmentSearchText(shipment);
  for (const term of ['og-ord-0031', 'ogex1234567', 'premium basmati rice', 'jebel ali', 'mv example', 'ocean line']) {
    assert.ok(haystack.includes(term));
  }
  assert.equal(isShipmentInTransit(shipment), true);
  assert.equal(isShipmentInTransit(mapBuyerShipment({ status: 'delivered' })), false);
});
