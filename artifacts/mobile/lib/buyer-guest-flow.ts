export type BuyerGuestCartEntry = {
  productId: number;
  quantity: number;
  product: Record<string, unknown>;
};

export type BuyerGuestRfqAttachment = {
  key: string;
  uri: string;
  name: string;
  mime: string;
  size: number;
};

export type BuyerGuestRfqDraft = {
  productId: string;
  quantity: string;
  packaging: string;
  countryId: string;
  portId: string;
  incoterm: string;
  paymentTerms: string;
  deliveryDate: string;
  notes: string;
  attachments: BuyerGuestRfqAttachment[];
};

export type BuyerGuestCheckoutDraft = {
  step: 1 | 2 | 3;
  countryId: number | null;
  portId: number | null;
  portSearch: string;
  incoterm: string;
  paymentTerms: string;
  deliveryDate: string;
  notes: string;
  paymentMethodCode: string;
  paymentFieldValues: Record<string, string>;
  selectedBankId: string;
  termsAccepted: boolean;
  resumeAction?: 'quote' | 'order';
};

export type BuyerGuestFlowSnapshot = {
  version: 1;
  cart: BuyerGuestCartEntry[];
  mergeTargets: Record<string, number> | null;
  mergeOwner: string | null;
  rfqDraft: BuyerGuestRfqDraft | null;
  checkoutDraft: BuyerGuestCheckoutDraft | null;
};

export const EMPTY_BUYER_GUEST_FLOW: BuyerGuestFlowSnapshot = {
  version: 1,
  cart: [],
  mergeTargets: null,
  mergeOwner: null,
  rfqDraft: null,
  checkoutDraft: null,
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function first(value: Record<string, unknown>, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const item = value[key];
    if (typeof item === 'string' && item.trim()) return item.trim();
    if (typeof item === 'number' && Number.isFinite(item)) return String(item);
  }
  return fallback;
}

function amount(value: Record<string, unknown>, keys: string[]): number | null {
  const raw = first(value, keys);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function productMinimumQuantity(product: Record<string, unknown>): number {
  const label = first(product, ['moq', 'min_order'], '1');
  const match = label.replace(/,/g, '').match(/\d+(?:\.\d+)?/);
  const parsed = match ? Number(match[0]) : 1;
  return Number.isFinite(parsed) && parsed > 0 ? Math.max(1, Math.ceil(parsed)) : 1;
}

export function isBuyerGuestFlowSnapshot(value: unknown): value is BuyerGuestFlowSnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const snapshot = value as Record<string, unknown>;
  return snapshot.version === 1 && Array.isArray(snapshot.cart);
}

export function buyerGuestCartRow(entry: BuyerGuestCartEntry): Record<string, unknown> {
  const product = record(entry.product);
  const basePrice = amount(product, ['fob', 'price']);
  const discountPercentage = Math.max(0, Math.min(99.99, amount(product, ['discount_percentage', 'discountPercent']) ?? 0));
  const salePrice = amount(product, ['discounted_unit_price', 'discounted_price'])
    ?? (basePrice !== null ? Math.round(basePrice * (1 - discountPercentage / 100) * 100) / 100 : null);
  const discountAmountPerUnit = amount(product, ['discount_amount_per_unit'])
    ?? (basePrice !== null && salePrice !== null ? Math.round(Math.max(0, basePrice - salePrice) * 100) / 100 : 0);
  return {
    id: `guest-${entry.productId}`,
    product_id: entry.productId,
    qty: entry.quantity,
    unit_price: salePrice ?? 0,
    list_unit_price: basePrice,
    discount_percentage: discountPercentage,
    discount_amount_per_unit: discountAmountPerUnit,
    unit_of_measure: first(product, ['unit_of_measure', 'unitOfMeasure'], 'MT'),
    currency: first(product, ['currency'], 'USD').toUpperCase(),
    product,
  };
}

export function buyerCartBadgeCount(
  guestItems: BuyerGuestCartEntry[],
  serverItems: unknown[],
  isSignedIn: boolean,
  mergeError: boolean,
): number {
  const guestProductIds = new Set(guestItems.map(item => String(item.productId)));
  const serverProductIds = new Set(serverItems.map(value => {
    const item = record(value);
    return first(item, ['product_id'], first(record(item.product), ['id']));
  }).filter(Boolean));

  if (guestProductIds.size === 0) return serverProductIds.size;
  if (isSignedIn && !mergeError) {
    return new Set([...guestProductIds, ...serverProductIds]).size;
  }

  return guestProductIds.size;
}

export function buildBuyerGuestCartMergeTargets(
  guestItems: BuyerGuestCartEntry[],
  serverItems: unknown[],
): Record<string, number> {
  const serverQuantities = new Map<string, number>();
  for (const value of serverItems) {
    const item = record(value);
    const productId = first(item, ['product_id'], first(record(item.product), ['id']));
    const quantity = amount(item, ['qty']) ?? 0;
    if (productId && quantity > 0) {
      serverQuantities.set(productId, (serverQuantities.get(productId) ?? 0) + quantity);
    }
  }

  return Object.fromEntries(guestItems.map(item => {
    const productId = String(item.productId);
    const quantity = Number.isFinite(item.quantity) && item.quantity > 0
      ? Math.ceil(item.quantity)
      : productMinimumQuantity(item.product);
    return [productId, (serverQuantities.get(productId) ?? 0) + quantity];
  }));
}
