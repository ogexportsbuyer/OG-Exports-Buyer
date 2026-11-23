import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buyerDashboardErrorMessage,
  buyerDashboardAlertTime,
  buyerDashboardKycLabel,
  buyerUnreadNotificationCount,
  mapBuyerDashboardOrderStatuses,
  recentBuyerApprovalNotifications,
  unwrapBuyerDashboardResponse,
} from './buyer-dashboard-data.ts';

test('accepts the Laravel dashboard envelope and nested client envelopes', () => {
  const dashboard = {
    kpis: { orders: 4 },
    orders_by_status: [{ name: 'Pending', value: 1 }],
  };

  assert.deepEqual(unwrapBuyerDashboardResponse(dashboard), dashboard);
  assert.deepEqual(unwrapBuyerDashboardResponse({ data: dashboard }), dashboard);
  assert.deepEqual(unwrapBuyerDashboardResponse({ data: { data: dashboard } }), dashboard);
});

test('keeps missing or invalid dashboard payloads empty instead of inventing metrics', () => {
  assert.deepEqual(unwrapBuyerDashboardResponse(null), {});
  assert.deepEqual(unwrapBuyerDashboardResponse({ data: null }), {});
  assert.deepEqual(unwrapBuyerDashboardResponse({ data: [] }), {});
});

test('reads the buyer notification unread count from the Laravel response envelope', () => {
  assert.equal(buyerUnreadNotificationCount({ data: { unread_count: 4 } }), 4);
  assert.equal(buyerUnreadNotificationCount({ unread_count: '2' }), 2);
  assert.equal(buyerUnreadNotificationCount({ data: { unread_count: -1 } }), 0);
  assert.equal(buyerUnreadNotificationCount({ data: {} }), 0);
});

test('explains dashboard authorization and server failures without exposing response bodies', () => {
  assert.match(buyerDashboardErrorMessage({ status: 401 }), /session has expired/i);
  assert.match(buyerDashboardErrorMessage({ status: 403 }), /buyer account/i);
  assert.match(buyerDashboardErrorMessage({ status: 404 }), /endpoint/i);
  assert.match(buyerDashboardErrorMessage({ status: 503 }), /server error 503/i);
  assert.match(buyerDashboardErrorMessage(new Error('Failed to fetch')), /connection/i);
});

test('matches website KYC labels and does not turn absent order counts into zero', () => {
  assert.equal(buyerDashboardKycLabel('approved'), '✓ KYC Verified');
  assert.equal(buyerDashboardKycLabel('review'), 'KYC Under Review');
  assert.equal(buyerDashboardKycLabel('rejected'), 'KYC Rejected');
  assert.equal(buyerDashboardKycLabel(undefined), 'KYC Unverified');
  assert.deepEqual(
    mapBuyerDashboardOrderStatuses([
      { name: 'Delivered', value: 0 },
      { name: 'Pending' },
      { name: 'Shipped', count: '3' },
      { name: 'Invalid', value: null },
    ]),
    [
      { name: 'Delivered', value: 0, color: '', index: 0 },
      { name: 'Shipped', value: 3, color: '', index: 2 },
    ],
  );
});

test('dashboard recent alerts match buyer website approval-alert filtering', () => {
  const rows = [
    { id: 1, type: 'quotation', read: false },
    { id: 2, type: 'shipment_update', read: false },
    { id: 3, type: 'order_status', is_read: '0' },
    { id: 4, type: 'buyer_payment_approved', read_at: '2026-01-01T00:00:00Z' },
  ];
  assert.deepEqual(
    recentBuyerApprovalNotifications({ data: { data: rows } }).map(item => item.id),
    [1, 3],
  );
  assert.deepEqual(recentBuyerApprovalNotifications(rows).map(item => item.id), [1, 3]);
});

test('formats dashboard alert times with the website relative-time labels', () => {
  assert.equal(buyerDashboardAlertTime(new Date().toISOString()), 'Just now');
  assert.equal(buyerDashboardAlertTime('not-a-date'), '—');
  assert.equal(buyerDashboardAlertTime(undefined), '—');
});
