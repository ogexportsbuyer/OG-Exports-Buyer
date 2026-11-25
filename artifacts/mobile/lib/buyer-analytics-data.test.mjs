import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  analyticsMonthLabel,
  orderAnalyticsMonth,
  orderProductSummary,
  ordersForAnalyticsMonth,
} from './buyer-analytics-data.ts';

const screen = readFileSync(new URL('../app/buyer-analytics.tsx', import.meta.url), 'utf8');

test('monthly analytics matches actual order creation months and labels them clearly', () => {
  const orders = [
    { id: 12, created_at: '2026-11-25T18:00:00.000000Z' },
    { id: 13, placed_at: '2026-11-03T09:00:00Z' },
    { id: 14, created_at: '2026-10-30T23:00:00Z' },
    { id: 15, created_at: 'not-a-date' },
  ];

  assert.equal(orderAnalyticsMonth(orders[0]), '2026-11');
  assert.deepEqual(ordersForAnalyticsMonth(orders, '2026-11').map(order => order.id), [12, 13]);
  assert.deepEqual(ordersForAnalyticsMonth(orders, '2026-13'), []);
  assert.equal(analyticsMonthLabel('2026-11'), 'November 2026');
});

test('monthly transaction rows show the real products and provide an honest fallback', () => {
  assert.equal(orderProductSummary({
    items: [{ product_name: 'Yellow Maize' }, { product_name: 'Basmati Rice' }],
  }), 'Yellow Maize and 1 more product');
  assert.equal(orderProductSummary({ items: [] }), 'Product details in order');
});

test('analytics month and order rows open accessible order details', () => {
  assert.match(screen, /testID=\{`buyer-analytics-month-\$\{monthKey\}`\}/);
  assert.match(screen, /accessibilityState=\{\{ expanded: selected \}\}/);
  assert.match(screen, /testID=\{`buyer-analytics-order-\$\{orderId \|\| index\}`\}/);
  assert.match(screen, /router\.push\(`\/buyer-order\/\$\{orderId\}`\)/);
  assert.match(screen, /useGetBuyerOrders/);
});
