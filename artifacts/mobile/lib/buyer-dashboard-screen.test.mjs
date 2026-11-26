import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const screen = readFileSync(new URL('../app/buyer-overview.tsx', import.meta.url), 'utf8');
const charts = readFileSync(new URL('../components/BuyerDashboardCharts.tsx', import.meta.url), 'utf8');
const strings = readFileSync(new URL('./strings.ts', import.meta.url), 'utf8');

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
  assert.match(screen, /totalPurchaseValue === null \? '—'/);
  assert.match(screen, /completedTradeValue === null \? '—'/);
  assert.match(screen, /processingTradeValue === null \? '—'/);
  assert.match(screen, /discountSavings === null \? '—'/);
  assert.match(screen, /Savings include only discounts recorded when an order was placed/);
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

test('dashboard prioritizes purchase value and preserves the recent activity preview', () => {
  const purchaseOverview = screen.indexOf('Purchase overview');
  const quickActions = screen.indexOf('Quick actions');
  const tradeActivity = screen.indexOf('Trade activity');
  const marketAlerts = screen.indexOf('Market alerts');

  assert.ok(purchaseOverview > -1 && purchaseOverview < quickActions);
  assert.ok(quickActions < tradeActivity && tradeActivity < marketAlerts);
  assert.match(screen, /activity\.slice\(0,\s*4\)/);
  assert.match(screen, /router\.push\('\/buyer-activity'\)/);
  assert.equal((screen.match(/buyer-dashboard-activity-view-all/g) ?? []).length, 1);
  assert.doesNotMatch(screen, /heroActions/);
});

test('dashboard opens with a professional localized heading and no profile hero card', () => {
  assert.match(screen, /BuyerAuthGate title="Trade overview"/);
  assert.match(screen, /Screen title="Trade overview" subtitle="Orders, shipments and quotes at a glance"/);
  assert.doesNotMatch(screen, /Good morning|Good afternoon|Good evening|Change profile photo|Member since|buyerDashboardKycLabel/);
});

test('new dashboard headings and purchase explanations have Urdu and Arabic translations', () => {
  for (const phrase of [
    'Trade overview',
    'Orders, shipments and quotes at a glance',
    'Purchase overview',
    'TOTAL PURCHASE VALUE',
    'Across non-cancelled orders',
    'In processing',
    'Discount saved',
    'Recorded at checkout',
    'Order snapshot',
    'Quick actions',
  ]) {
    assert.ok(strings.includes(`["${phrase}","`), `missing localized dashboard phrase: ${phrase}`);
  }
});
