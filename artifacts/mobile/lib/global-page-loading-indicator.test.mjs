import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { hasUiTranslation, translateUi } from './strings.ts';

const component = readFileSync(new URL('../components/GlobalPageLoadingIndicator.tsx', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../app/_layout.tsx', import.meta.url), 'utf8');

test('global centered loader follows route transitions and initial page requests', () => {
  assert.match(component, /usePathname\(\)/);
  assert.match(component, /useIsFetching\(\{\s*predicate: query => query\.state\.status === 'pending'/);
  assert.match(component, /accessibilityRole="progressbar"/);
  assert.match(component, /pointerEvents="none"/);
  assert.match(component, /top: insets\.top/);
  assert.match(component, /bottom: insets\.bottom/);
  assert.match(component, /alignItems: 'center'/);
  assert.match(component, /justifyContent: 'center'/);
  assert.match(component, /borderTopColor: colors\.accent/);
  assert.match(component, /transform: \[\{ rotate: rotation \}\]/);
  assert.match(component, /reduceMotion/);
  assert.match(component, /testID="global-page-loading-card"/);
  assert.doesNotMatch(component, /segmentWidth|translateX|height: 3,/);
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
