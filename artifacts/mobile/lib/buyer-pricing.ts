type Json = Record<string, unknown>;

export type BuyerPriceDetails = {
  basePrice: number | null;
  salePrice: number | null;
  discountPercentage: number;
  discountAmountPerUnit: number;
  currency: string;
  unitOfMeasure: string;
};

export function shouldUsePublicCatalogFallback(isSignedIn: boolean, buyerCatalogFailed: boolean): boolean {
  return isSignedIn && buyerCatalogFailed;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function numeric(row: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return null;
}

function text(row: Record<string, unknown>, keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return fallback;
}

export function buyerPriceDetails(product: Json): BuyerPriceDetails {
  const row = record(product);
  const basePrice = numeric(row, ['list_unit_price', 'original_unit_price', 'fob', 'price']);
  const rawPercentage = numeric(row, ['discount_percentage', 'discountPercent']) ?? 0;
  const discountPercentage = Math.max(0, Math.min(99.99, rawPercentage));
  const suppliedSalePrice = numeric(row, ['unit_price', 'discounted_unit_price', 'discounted_price']);
  // Prices and savings are authoritative server snapshots. Never reconstruct a
  // discounted unit price on-device; undiscounted public list price is safe.
  const salePrice = suppliedSalePrice ?? (discountPercentage === 0 ? basePrice : null);
  const suppliedDiscount = numeric(row, ['discount_amount_per_unit', 'discount_amount']);
  const discountAmountPerUnit = suppliedDiscount ?? 0;

  return {
    basePrice,
    salePrice,
    discountPercentage,
    discountAmountPerUnit,
    currency: text(row, ['currency'], 'USD').toUpperCase(),
    unitOfMeasure: text(row, ['unit_of_measure', 'unitOfMeasure'], 'MT'),
  };
}
