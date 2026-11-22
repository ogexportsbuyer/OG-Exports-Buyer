import { amount, first, list, record, type Json } from '@/lib/data';
import { formatFobPrice } from '@/lib/format-fob-price';
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
  return formatFobPrice(price, first(product, ['currency'], 'USD'));
}

export function displayOrderNumber(order: Json): string {
  return first(order, ['order_number', 'reference', 'id'], 'Order');
}
