import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appRoot = new URL('../', import.meta.url);

function source(path) {
  return readFileSync(new URL(path, appRoot), 'utf8');
}

test('app alerts use the shared OG-branded popup instead of native alert sheets', () => {
  const provider = source('components/BrandedAlertProvider.tsx');
  const dialog = source('components/BrandedAlertDialog.tsx');
  const layout = source('app/_layout.tsx');
  const strings = source('lib/strings.ts');

  assert.match(layout, /<BrandedAlertProvider>/);
  assert.match(provider, /<BrandedAlertDialog/);
  assert.match(dialog, /GlassPopupSurface/);
  assert.match(dialog, /OG EXPORTS · BUYER ALERT/);
  assert.doesNotMatch(strings, /NativeAlert|localizedAlert/);
});

test('app alert call sites use the branded dialog provider', () => {
  const callSites = [
    'components/BuyerPushNotificationSettings.tsx',
    'components/BuyerSupportChatExperience.tsx',
    'components/TransactionPasswordSettingsCard.tsx',
    'app/account/settings.tsx',
    'app/account/reports.tsx',
    'app/account/legal/[section].tsx',
  ];

  for (const path of callSites) {
    const content = source(path);
    assert.match(content, /useBrandedAlert/);
    assert.doesNotMatch(content, /Alert\.alert|localizedAlert/);
  }
});

test('buyer chat language selector uses a branded glass popup', () => {
  const panel = source('components/BuyerSupportChatPanel.tsx');
  assert.match(panel, /<GlassPopupSurface/);
  assert.match(panel, /OG EXPORTS · CHAT/);
  assert.match(panel, /Close language selector/);
});

test('custom app modals share the branded glass surface', () => {
  const modalFiles = [
    'app/account/messages.tsx',
    'app/(tabs)/index.tsx',
    'app/(tabs)/opportunities.tsx',
    'app/wallet/deposit.tsx',
    'components/BrandedConfirmDialog.tsx',
    'components/BuyerDeliveryDatePicker.tsx',
    'components/BuyerProductFilterSheet.tsx',
    'components/BuyerRfqPicker.tsx',
    'components/BuyerSupportChatPanel.tsx',
    'components/CountryPicker.tsx',
    'components/DateOfBirthPicker.tsx',
    'components/ErrorFallback.tsx',
    'components/InvestorUI.tsx',
    'components/TransactionPasswordResetModal.tsx',
  ];

  for (const path of modalFiles) {
    const content = source(path);
    if (/<Modal\b/.test(content)) {
      assert.match(content, /GlassPopupSurface/, `${path} should use the shared branded glass popup surface`);
    }
  }
});
