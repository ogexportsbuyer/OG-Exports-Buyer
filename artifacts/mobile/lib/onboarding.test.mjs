import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const onboarding = readFileSync(new URL('../app/onboarding.tsx', import.meta.url), 'utf8');
const authContext = readFileSync(new URL('../context/AuthContext.tsx', import.meta.url), 'utf8');
const entryScreen = readFileSync(new URL('../app/index.tsx', import.meta.url), 'utf8');

test('buyer onboarding has exactly three truthful buyer-focused slides', () => {
  const slides = onboarding.match(/const slides = \[([\s\S]*?)\n\];/)?.[1];
  assert.ok(slides, 'the onboarding slide list exists');
  assert.equal((slides.match(/image: require\(/g) ?? []).length, 3);
  for (const copy of [
    'A clearer way to source.',
    'Decide with clear details.',
    'Stay in step with every order.',
    'LIVE CATALOGUE  ·  ORIGIN  ·  SPECS',
    'RFQ  ·  QUOTATION  ·  TRADE TERMS',
    'ORDERS  ·  DOCUMENTS  ·  SHIPMENTS',
    '../assets/onboarding/sesame-4k.jpg',
    '../assets/onboarding/maize-4k.jpg',
    '../assets/onboarding/rice-4k.jpg',
  ]) assert.ok(slides.includes(copy), `buyer onboarding includes ${copy}`);
  assert.doesNotMatch(slides, /investor|investment|wallet|portfolio|guaranteed|risk.free/i);
  assert.doesNotMatch(onboarding, /IllustrationLayer|react-native-svg|ImageBackground/i);
});

test('onboarding offers accessible navigation, page progress, sign-in, and account creation', () => {
  for (const testID of [
    'Image',
    'source={slide.image}',
    'onboarding-illustration-${step + 1}',
    'onboarding-back',
    'onboarding-page-${index + 1}',
    'onboarding-continue',
    'onboarding-finish',
    'onboarding-sign-in',
  ]) assert.ok(onboarding.includes(testID), `missing onboarding control ${testID}`);
  assert.match(onboarding, /accessibilityRole="tablist"/);
  assert.match(onboarding, /accessibilityLabel="Previous onboarding page"/);
  assert.match(onboarding, /accessibilityRole="header"/);
  assert.match(onboarding, /slide\.title/);
  assert.match(onboarding, /slide\.body/);
  assert.match(onboarding, /finish\('\/\(auth\)\/register'\)/);
  assert.match(onboarding, /finish\('\/\(auth\)\/login'\)/);
  assert.match(onboarding, /useMotion\(\)/);
  assert.match(onboarding, /completeOnboarding\(\)/);
});

test('first-run splash routing honors the persisted onboarding completion state', () => {
  assert.match(entryScreen, /buyerEntryDestination\(onboardingComplete\)/);
  assert.match(authContext, /AsyncStorage\.getItem\(ONBOARDING_KEY\)/);
  assert.match(authContext, /AsyncStorage\.setItem\(ONBOARDING_KEY, 'complete'\)/);
});
