import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appRoot = new URL('../app/', import.meta.url);
const componentRoot = new URL('../components/', import.meta.url);
const readApp = (path) => readFileSync(new URL(path, appRoot), 'utf8');

test('buyer quotation and repeat-order confirmations use the branded dialog', () => {
  const quotation = readApp('buyer-quotation/[id].tsx');
  const order = readApp('buyer-order/[id].tsx');

  assert.match(quotation, /<BrandedConfirmDialog/);
  assert.match(quotation, /Accepting confirms these quotation terms and creates an order/);
  assert.match(quotation, /busy=\{acceptQuotation\.isPending \|\| rejectQuotation\.isPending\}/);
  assert.doesNotMatch(quotation, /Alert\.alert/);

  assert.match(order, /<BrandedConfirmDialog/);
  assert.match(order, /This does not place an order or take payment/);
  assert.doesNotMatch(order, /Alert\.alert/);
});

test('buyer contact and device confirmations share the same branded treatment', () => {
  const company = readApp('buyer-company.tsx');
  const security = readApp('buyer-security.tsx');

  assert.match(company, /buyer-contact-remove-confirmation/);
  assert.match(company, /busy=\{deleteContact\.isPending\}/);
  assert.doesNotMatch(company, /Alert\.alert/);

  assert.match(security, /buyer-device-remove-confirmation/);
  assert.match(security, /buyer-other-devices-confirmation/);
  assert.doesNotMatch(security, /Alert\.alert/);
});

test('branded confirmation provides cancel, busy feedback, and themed glass styling', () => {
  const dialog = readFileSync(new URL('BrandedConfirmDialog.tsx', componentRoot), 'utf8');
  assert.match(dialog, /GlassPopupSurface/);
  assert.match(dialog, /busyLabel/);
  assert.match(dialog, /onRequestClose=\{dismiss\}/);
  assert.match(dialog, /onPress=\{onConfirm\}/);
  assert.match(dialog, /colors\.primary/);
});
