export type BuyerCartRecord = Record<string, unknown>;

function record(value: unknown): BuyerCartRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as BuyerCartRecord
    : {};
}

function first(row: BuyerCartRecord, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return fallback;
}

export function productMinimumQuantity(product: BuyerCartRecord): number {
  const label = first(product, ['moq', 'min_order'], '1');
  const match = label.replace(/,/g, '').match(/\d+(?:\.\d+)?/);
  const parsed = match ? Number(match[0]) : 1;
  return Number.isFinite(parsed) && parsed > 0 ? Math.max(1, Math.ceil(parsed)) : 1;
}

export function buyerCartItemMinimumQuantity(item: BuyerCartRecord): number {
  const product = record(item.product);
  const minimumOrder = first(product, ['moq', 'min_order'], first(item, ['moq', 'min_order'], '1'));
  return productMinimumQuantity({ ...product, moq: minimumOrder });
}

export function nextBuyerCartQuantity(currentQuantity: number, delta: number, minimumQuantity: number): number {
  const minimum = Number.isFinite(minimumQuantity) && minimumQuantity > 0
    ? Math.max(1, Math.ceil(minimumQuantity))
    : 1;
  const current = Number.isFinite(currentQuantity) ? Math.floor(currentQuantity) : minimum;
  const step = Number.isFinite(delta) ? Math.trunc(delta) : 0;
  return Math.max(minimum, current + step);
}
