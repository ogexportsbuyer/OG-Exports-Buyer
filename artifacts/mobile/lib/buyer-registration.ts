export type BuyerRegistrationFields = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type BuyerRegistrationError =
  | 'name_required'
  | 'email_required'
  | 'email_invalid'
  | 'password_weak'
  | 'password_mismatch';

export function validateBuyerRegistration(fields: BuyerRegistrationFields): BuyerRegistrationError | null {
  if (!fields.fullName.trim()) return 'name_required';
  const email = fields.email.trim();
  if (!email) return 'email_required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'email_invalid';
  const password = fields.password;
  const strongPassword = password.length >= 8
    && password.length <= 128
    && /[A-Z]/.test(password)
    && /[a-z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9\s]/.test(password);
  if (!strongPassword) return 'password_weak';
  if (password !== fields.confirmPassword) return 'password_mismatch';
  return null;
}

export function buyerRegistrationPayload(fields: BuyerRegistrationFields) {
  return {
    name: fields.fullName.trim(),
    email: fields.email.trim(),
    password: fields.password,
    password_confirmation: fields.confirmPassword,
    account_type: 'buyer' as const,
  };
}
