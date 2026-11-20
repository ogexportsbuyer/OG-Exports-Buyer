import { amount, first, list, record, type Json } from '@/lib/data';
export { productMinimumQuantity } from '@/lib/buyer-cart-flow';

export function rowsFromResponse(response: unknown): Json[] {
  return list(record(response).data);
}

export function categoryName(product: Json): string {
  const value = product.category;
  return typeof value === 'string' ? value : first(record(value), ['name'], 'General');
}

export function displayPrice(product: Json): string {
  const price = amount(product, ['fob', 'price']);
  if (price === null || price <= 0) return 'Request a quote';
  return `${first(product, ['currency'], 'USD')} ${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

export function displayOrderNumber(order: Json): string {
  return first(order, ['order_number', 'reference', 'id'], 'Order');
}
