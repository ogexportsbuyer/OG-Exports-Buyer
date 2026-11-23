import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

test('Android system bars blend with the branded screen while keeping readable controls', () => {
  const rootLayout = readFileSync(new URL('../app/_layout.tsx', import.meta.url), 'utf8');
  const config = JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8'));
  const navigationBarPlugin = config.expo.plugins.find(
    plugin => Array.isArray(plugin) && plugin[0] === 'expo-navigation-bar',
  );

  assert.match(rootLayout, /NativeStatusBar barStyle=\{isDarkStatusBar \? 'light-content' : 'dark-content'\} backgroundColor="transparent"/);
  assert.match(rootLayout, /<NavigationBar style=\{isDarkStatusBar \? 'dark' : 'light'\} \/>/);
  assert.match(rootLayout, /SystemUI\.setBackgroundColorAsync\(colors\.background\)/);
  assert.deepEqual(navigationBarPlugin, [
    'expo-navigation-bar',
    { enforceContrast: false, style: 'light' },
  ]);
});
