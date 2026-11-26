import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  areBuyerCompanyVerificationDocumentsComplete,
  nextBuyerCompanySetupTab,
} from './buyer-company-setup-flow.ts';

const app = readFileSync(new URL('../app/buyer-company.tsx', import.meta.url), 'utf8');

test('buyer company setup advances in the requested order', () => {
  assert.equal(nextBuyerCompanySetupTab('company'), 'verification');
  assert.equal(nextBuyerCompanySetupTab('verification'), 'contacts');
  assert.equal(nextBuyerCompanySetupTab('contacts'), 'preferences');
  assert.equal(nextBuyerCompanySetupTab('preferences'), null);
});

test('verification advances only when every requested document has a saved path', () => {
  assert.equal(areBuyerCompanyVerificationDocumentsComplete([]), false);
  assert.equal(areBuyerCompanyVerificationDocumentsComplete([
    { document: { path: 'upload/kyc/company-registration.pdf' } },
    { document: null },
  ]), false);
  assert.equal(areBuyerCompanyVerificationDocumentsComplete([
    { document: { path: 'upload/kyc/company-registration.pdf' } },
    { document: { path: 'upload/kyc/import-license.pdf' } },
  ]), true);
  assert.equal(areBuyerCompanyVerificationDocumentsComplete([
    { document: { path: '  ' } },
  ]), false);
});

test('the profile page wires automatic step changes to confirmed saves and compact upload controls', () => {
  assert.match(app, /await refreshCompany\(\);\s*setTab\(nextBuyerCompanySetupTab\('company'\) \?\? 'verification'\)/);
  assert.match(app, /!isComplete && hasCompletedVerification/);
  assert.match(app, /setTab\(nextBuyerCompanySetupTab\('verification'\) \?\? 'contacts'\)/);
  assert.match(app, /setTab\(nextBuyerCompanySetupTab\('contacts'\) \?\? 'preferences'\)/);
  assert.match(app, /testID=\{`buyer-company-upload-\$\{docType\}`\}/);
  assert.match(app, /title="Save & add another"/);
});
