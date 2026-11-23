type Json = Record<string, unknown>;

function record(value: unknown): Json {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Json : {};
}

function first(row: Json, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

export function buyerKycStatusFromResponse(value: unknown): string {
  const response = record(value);
  const payload = record(response.data ?? response);
  const kyc = record(payload.kyc);
  const application = record(kyc.application);
  return first(application, ['status', 'verification_status'])
    || first(kyc, ['status', 'verification_status', 'application_status'])
    || first(payload, ['kyc_status', 'verification_status', 'identity_verification_status']);
}

const approvedStatuses = new Set([
  'approved',
  'verified',
  'admin_approved',
  'kyc_approved',
  'approved_by_admin',
  'admin_verified',
  'kyc_verified',
  'verified_by_admin',
]);

export function isBuyerKycApproved(value: unknown): boolean {
  const status = buyerKycStatusFromResponse(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return approvedStatuses.has(status);
}

export function buyerKycStatusLabel(value: unknown): string {
  const status = buyerKycStatusFromResponse(value);
  return status
    ? status.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase())
    : 'Not approved';
}
