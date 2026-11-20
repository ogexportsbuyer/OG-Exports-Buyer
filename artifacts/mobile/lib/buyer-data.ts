import { amount, first, list, record, type Json } from '@/lib/data';

export function rowsFromResponse(response: unknown): Json[] {
  return list(record(response).data);
}

export function categoryName(product: Json): string {
  const value = product.category;
  return typeof value === 'string' ? value : first(record(value), ['name'], 'General');
}

export function productMinimumQuantity(product: Json): number {
  const label = first(product, ['moq', 'min_order'], '1');
  const match = label.replace(/,/g, '').match(/\d+(?:\.\d+)?/);
  const parsed = match ? Number(match[0]) : 1;
  return Number.isFinite(parsed) && parsed > 0 ? Math.max(1, Math.ceil(parsed)) : 1;
}

export function displayPrice(product: Json): string {
  const price = amount(product, ['fob', 'price']);
  if (price === null || price <= 0) return 'Request a quote';
  return `${first(product, ['currency'], 'USD')} ${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

export function displayOrderNumber(order: Json): string {
  return first(order, ['order_number', 'reference', 'id'], 'Order');
}
