import assert from 'node:assert/strict';
import test from 'node:test';
import { buyerKycStatusFromResponse, buyerKycStatusLabel, isBuyerKycApproved } from './buyer-kyc-approval.ts';

test('only explicit buyer KYC approval or verification unlocks transfer IBAN', () => {
  for (const status of ['approved', 'verified', 'admin_approved', 'kyc_approved', 'approved_by_admin', 'admin_verified', 'kyc_verified', 'verified_by_admin']) {
    assert.equal(isBuyerKycApproved({ data: { kyc: { application: { status } } } }), true, status);
  }
});

test('pending, rejected, missing, and ambiguous statuses keep transfer IBAN locked', () => {
  for (const status of ['pending', 'under_review', 'submitted', 'rejected', 'not_verified', 'verification_in_progress']) {
    assert.equal(isBuyerKycApproved({ data: { kyc: { application: { status } } } }), false, status);
  }
  assert.equal(isBuyerKycApproved(undefined), false);
  assert.equal(isBuyerKycApproved({ data: { kyc: {} } }), false);
});

test('buyer KYC status accepts the company response status locations', () => {
  assert.equal(buyerKycStatusFromResponse({ data: { kyc: { status: 'verified' } } }), 'verified');
  assert.equal(buyerKycStatusFromResponse({ kyc_status: 'approved' }), 'approved');
  assert.equal(buyerKycStatusLabel({ data: { kyc: { application: { status: 'under_review' } } } }), 'Under Review');
  assert.equal(buyerKycStatusLabel({}), 'Not approved');
});

test('the Trade Finance bank-details view hides identifiers until KYC approval', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../app/buyer-trade-finance.tsx', import.meta.url), 'utf8');
  assert.match(source, /isBuyerKycApproved/);
  assert.match(source, /kycApproved && transferAccount/);
  assert.match(source, /transfer-iban-kyc-gate/);
  assert.match(source, /Current status:/);
});

test('Trade Finance exposes large copy icons for account title, transfer account, and SWIFT', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../app/buyer-trade-finance.tsx', import.meta.url), 'utf8');
  assert.match(source, /import \* as Clipboard from 'expo-clipboard'/);
  assert.match(source, /Clipboard\.setStringAsync\(value\)/);
  assert.match(source, /Feather name=\{copied \? 'check' : 'copy'\}/);
  assert.match(source, /width: 44,\s*height: 44/);
  assert.match(source, /copyLabel="Copy account title"/);
  assert.match(source, /copiedLabel="Account title copied"/);
  assert.match(source, /copyLabel=\{hasIban \? 'Copy IBAN' : 'Copy account number'\}/);
  assert.match(source, /copyLabel="Copy SWIFT \/ BIC"/);
  for (const field of ['account-title', 'transfer-account', 'swift']) {
    assert.ok(source.includes('copy-trade-bank-${index}-' + field), `missing copy control for ${field}`);
  }
});
