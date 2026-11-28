import { formatAppDate } from './strings.ts';

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

export function parseBuyerCartQuantityInput(value: string, minimumQuantity: number): number {
  const minimum = Number.isFinite(minimumQuantity) && minimumQuantity > 0
    ? Math.max(1, Math.ceil(minimumQuantity))
    : 1;
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) return minimum;
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) ? Math.max(minimum, parsed) : minimum;
}

export function formatBuyerDeliveryDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

export function buyerDeliveryCalendarDays(year: number, monthIndex: number): Array<number | null> {
  if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) return [];
  const offset = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  return [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
}

export function buyerDeliveryDateKey(year: number, monthIndex: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function parseBuyerDeliveryDate(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year
    || parsed.getMonth() !== month - 1
    || parsed.getDate() !== day
  ) return null;
  return parsed;
}

export function formatBuyerDeliveryDateLabel(value: string): string {
  const date = parseBuyerDeliveryDate(value);
  return date
    ? formatAppDate(date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : '';
}

export function isFutureBuyerDeliveryDate(value: string, now = new Date()): boolean {
  const selected = parseBuyerDeliveryDate(value);
  if (!selected) return false;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return selected.getTime() > today.getTime();
}

export function buildBuyerCheckoutNotes(
  notes: string,
  paymentTerms: string | Array<{ productName: string; term: string }>,
): string {
  const paymentTermLines = typeof paymentTerms === 'string'
    ? (paymentTerms.trim() ? [`Payment term: ${paymentTerms.trim()}`] : [])
    : paymentTerms.map(({ productName, term }) => {
      const normalizedTerm = term.trim();
      if (!normalizedTerm) return '';
      const normalizedProductName = productName.trim();
      return normalizedProductName
        ? `Payment term for ${normalizedProductName}: ${normalizedTerm}`
        : `Payment term: ${normalizedTerm}`;
    }).filter(Boolean);
  return [notes.trim(), ...paymentTermLines].filter(Boolean).join('\n\n');
}

export function buildBuyerOrderNotes(
  notes: string,
  bankDetails: string,
  paymentDetails: string[],
): string {
  const paymentLines = [bankDetails.trim(), ...paymentDetails.map(value => value.trim())].filter(Boolean);
  return [notes.trim(), paymentLines.join('\n')].filter(Boolean).join('\n\n');
}
