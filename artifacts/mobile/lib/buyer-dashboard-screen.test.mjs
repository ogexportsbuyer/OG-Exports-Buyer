import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const screen = readFileSync(new URL('../app/buyer-overview.tsx', import.meta.url), 'utf8');
const charts = readFileSync(new URL('../components/BuyerDashboardCharts.tsx', import.meta.url), 'utf8');

test('buyer dashboard has explicit loading, failure, and manual retry states', () => {
  assert.match(screen, /query\.isLoading\s*\?\s*<LoadingCard/);
  assert.match(screen, /query\.isError\s*\?\s*<ErrorState message=\{buyerDashboardErrorMessage\(query\.error\)\}/);
  assert.match(screen, /onRetry=\{\(\) => void query\.refetch\(\)\}/);
  assert.match(screen, /retry:\s*1/);
  assert.match(screen, /refetchOnReconnect:\s*true/);
  assert.match(screen, /notificationsQuery\.isError/);
  assert.match(screen, /buyer-dashboard-alerts-retry/);
});

test('partial and empty API data stays explicit rather than becoming invented metrics', () => {
  assert.match(screen, /spendTotal === null \? '—'/);
  assert.match(screen, /completion === null \? '—'/);
  assert.match(screen, /Profile completion is not available yet/);
  assert.match(screen, /Trust score is not available yet/);
  assert.match(screen, /Shipment progress unavailable/);
  assert.match(screen, /No upcoming deliveries/);
  assert.match(screen, /No active alerts/);
  assert.match(charts, /rows\.length \? total : '—'/);
  assert.match(charts, /Status details are not available/);
});

test('dashboard actions include the buyer orders, quotations, RFQ, shipment and document routes', () => {
  for (const route of [
    '/buyer-rfq?mode=new',
    '/buyer-orders',
    '/buyer-orders?view=quotations',
    '/buyer-shipments',
    '/buyer-documents',
    '/(buyer-tabs)/buyer-products',
    '/buyer-trade-finance',
  ]) {
    assert.ok(screen.includes(route), `missing dashboard route: ${route}`);
  }
});
