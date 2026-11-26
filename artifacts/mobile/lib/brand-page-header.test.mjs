import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const rootLayout = readFileSync(new URL('../app/_layout.tsx', import.meta.url), 'utf8');
const headerBackground = readFileSync(new URL('../components/BrandHeaderBackground.tsx', import.meta.url), 'utf8');

test('profile option page headers inherit a visible teal-to-gold app wash', () => {
  assert.match(rootLayout, /headerStyle: \{ backgroundColor: colors\.glassTintTeal \}/);
  assert.match(rootLayout, /headerBackground: \(\) => <BrandHeaderBackground \/>/);
  assert.match(headerBackground, /colors=\{\[colors\.glassTintTeal, colors\.background, colors\.glassTintGold\]\}/);

  for (const route of ['buyer-profile-details', 'buyer-company', 'buyer-security', 'buyer-system-settings']) {
    assert.ok(rootLayout.includes(`<Stack.Screen name="${route}"`), `${route} remains on the shared header stack`);
  }
});
