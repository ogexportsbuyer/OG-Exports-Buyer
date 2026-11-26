import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  buildBuyerTradeActivity,
  buyerActivityHasMore,
  formatBuyerActivityDateTime,
  mergeBuyerActivitySources,
} from './buyer-trade-activity.ts';

const emptySources = {
  orders: [],
  rfqs: [],
  quotations: [],
  shipments: [],
  documents: [],
};

test('combines all buyer trade sources in newest-first order with real timestamps', () => {
  const activity = buildBuyerTradeActivity({
    ...emptySources,
    orders: [{ id: 12, order_number: 'PO-12', status: 'delivered', placed_at: '2026-11-26T11:00:00Z' }],
    rfqs: [{ id: 7, product_name: 'Maize', qty: '10 MT', created_at: '2026-11-26T10:00:00Z' }],
    quotations: [{ id: 4, product_name: 'Sesame', status: 'accepted', issued_at: '2026-11-26T09:00:00Z' }],
    shipments: [{ id: 3, container: 'CONT-3', origin: 'Karachi', destination: 'Dubai', status: 'in_transit', updated_at: '2026-11-26T08:00:00Z' }],
    documents: [{ id: 2, type: 'Bill of Lading', title: 'BL-2', created_at: '2026-11-26T07:00:00Z' }],
  });

  assert.deepEqual(activity.map(item => item.source), ['orders', 'rfqs', 'quotations', 'shipments', 'documents']);
  assert.equal(activity[0].title, 'Order Delivered');
  assert.equal(activity[1].route, '/buyer-rfq/7');
  assert.equal(activity[2].title, 'Quotation Accepted');
  assert.match(activity[3].description, /Karachi → Dubai/);
  assert.equal(activity[4].route, '/buyer-documents');
  assert.equal(activity[0].timestamp, '2026-11-26T11:00:00Z');
});

test('formats a full localizable date and time and handles missing timestamps', () => {
  const formatted = formatBuyerActivityDateTime('2026-11-26T10:15:00Z', 'en-US');
  assert.match(formatted, /Nov 26, 2026/);
  assert.match(formatted, /10:15 AM/);
  assert.equal(formatBuyerActivityDateTime(null), 'Date unavailable');
});

test('paginates every activity source and merges pages without duplicate records', () => {
  const hasNextPage = buyerActivityHasMore(
    { orders: { current_page: 1, last_page: 2 }, rfqs: { current_page: 1, last_page: 1 } },
    emptySources,
    50,
  );
  assert.equal(hasNextPage, true);
  assert.equal(buyerActivityHasMore({ orders: { current_page: 2, last_page: 2 } }, emptySources, 50), false);
  assert.equal(buyerActivityHasMore({}, { ...emptySources, shipments: Array(50).fill({ id: 1 }) }, 50), true);

  const merged = mergeBuyerActivitySources(
    { ...emptySources, orders: [{ id: 1, order_number: 'PO-1' }] },
    { ...emptySources, orders: [{ id: 1, order_number: 'PO-1' }, { id: 2, order_number: 'PO-2' }] },
  );
  assert.deepEqual(merged.orders.map(row => row.id), [1, 2]);
});

test('dashboard previews four activities and offers a dedicated full-history route', () => {
  const dashboard = readFileSync(new URL('../app/buyer-overview.tsx', import.meta.url), 'utf8');
  const rootLayout = readFileSync(new URL('../app/_layout.tsx', import.meta.url), 'utf8');
  const activityScreen = readFileSync(new URL('../app/buyer-activity.tsx', import.meta.url), 'utf8');
  assert.match(dashboard, /activity\.slice\(0, 4\)/);
  assert.match(dashboard, /buyer-dashboard-activity-view-all/);
  assert.match(dashboard, /router\.push\('\/buyer-activity'\)/);
  assert.match(rootLayout, /Stack\.Screen name="buyer-activity" options=\{\{ title: t\('Trade activity'\) \}\}/);
  for (const hook of ['useGetBuyerOrders', 'useGetBuyerRfqs', 'useGetBuyerQuotations', 'useGetBuyerShipments', 'useGetBuyerDocuments']) {
    assert.match(activityScreen, new RegExp(hook));
  }
  assert.match(activityScreen, /formatBuyerActivityDateTime\(item\.timestamp, dateLocale\)/);
  assert.match(activityScreen, /buyer-trade-activity-load-older/);
});
