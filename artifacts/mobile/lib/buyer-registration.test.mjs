import assert from 'node:assert/strict';
import test from 'node:test';
import { buyerRegistrationPayload, validateBuyerRegistration } from './buyer-registration.ts';

const validFields = {
  fullName: '  Ayesha Khan  ',
  email: '  ayesha@example.com  ',
  password: 'Strong!Pass1',
  confirmPassword: 'Strong!Pass1',
};

test('buyer registration validates required name and email fields', () => {
  assert.equal(validateBuyerRegistration({ ...validFields, fullName: '  ' }), 'name_required');
  assert.equal(validateBuyerRegistration({ ...validFields, email: '  ' }), 'email_required');
  assert.equal(validateBuyerRegistration({ ...validFields, email: 'not-an-email' }), 'email_invalid');
});

test('buyer registration requires a strong matching password', () => {
  assert.equal(validateBuyerRegistration({ ...validFields, password: 'weak', confirmPassword: 'weak' }), 'password_weak');
  assert.equal(validateBuyerRegistration({ ...validFields, confirmPassword: 'Different!Pass2' }), 'password_mismatch');
  assert.equal(validateBuyerRegistration(validFields), null);
});

test('registration payload normalizes identity fields and always creates a buyer account', () => {
  assert.deepEqual(buyerRegistrationPayload(validFields), {
    name: 'Ayesha Khan',
    email: 'ayesha@example.com',
    password: 'Strong!Pass1',
    password_confirmation: 'Strong!Pass1',
    account_type: 'buyer',
  });
});
