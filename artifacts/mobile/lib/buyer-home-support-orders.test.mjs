import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const home = readFileSync(new URL('../app/(buyer-tabs)/buyer-home.tsx', import.meta.url), 'utf8');
const catalog = readFileSync(new URL('../components/BuyerHomeCatalog.tsx', import.meta.url), 'utf8');

test('homepage keeps only the two newest active orders and links to all orders', () => {
  assert.match(home, /latestRecords\(activeOrders,\s*\['created_at', 'createdAt', 'placed_at', 'order_date'\],\s*2\)/);
  assert.match(home, /latestActiveOrders\.map\(order/);
  assert.doesNotMatch(home, /activeOrders\.slice\(0,\s*3\)/);
  assert.match(home, /<Text[^>]*>View all<\/Text>/);
  assert.match(home, /onPress=\{openOrders\}/);
});

test('branded support card is at the end of the homepage with email and WhatsApp actions', () => {
  const latestOrders = home.indexOf('latestActiveOrders.map(order');
  const supportCard = home.indexOf('testID="buyer-home-support-card"');

  assert.ok(latestOrders >= 0 && supportCard > latestOrders);
  assert.match(home, /useGetPublicInvestorAppSettings/);
  assert.match(home, /mailto:\$\{supportEmail\}/);
  assert.match(home, /https:\/\/wa\.me\/923032569000/);
  assert.match(home, /testID="buyer-home-email-support"/);
  assert.match(home, /testID="buyer-home-whatsapp-support"/);
  assert.doesNotMatch(catalog, /buyer-home-contact/);
});
