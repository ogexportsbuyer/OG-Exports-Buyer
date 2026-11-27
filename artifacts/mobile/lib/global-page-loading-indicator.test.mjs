import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { hasUiTranslation, translateUi } from './strings.ts';

const component = readFileSync(new URL('../components/GlobalPageLoadingIndicator.tsx', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../app/_layout.tsx', import.meta.url), 'utf8');

test('global top loader follows route transitions and initial page requests', () => {
  assert.match(component, /usePathname\(\)/);
  assert.match(component, /useIsFetching\(\{\s*predicate: query => query\.state\.status === 'pending'/);
  assert.match(component, /accessibilityRole="progressbar"/);
  assert.match(component, /pointerEvents="none"/);
  assert.match(component, /top: insets\.top/);
  assert.match(component, /backgroundColor: colors\.accent/);
});

test('root mounts the global loader inside the query and motion providers', () => {
  assert.match(layout, /<QueryClientProvider client=\{queryClient\}>[\s\S]*?<MotionProvider>[\s\S]*?<GlobalPageLoadingIndicator \/>/);
});

test('page loading accessibility label is translated in every app language', () => {
  for (const language of ['ur', 'ar', 'ru', 'zh-CN', 'fr', 'es', 'de']) {
    assert.ok(hasUiTranslation('Loading page', language));
    assert.notEqual(translateUi('Loading page', language), 'Loading page');
  }
});
