type Json = Record<string, unknown>;

function record(value: unknown): Json {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Json
    : {};
}

function first(source: Json, keys: string[]): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return '';
}

export function orderAnalyticsMonth(order: unknown): string {
  const createdAt = first(record(order), ['created_at', 'placed_at']);
  const match = /^(\d{4}-\d{2})/.exec(createdAt);
  return match?.[1] ?? '';
}

export function ordersForAnalyticsMonth(orders: Json[], month: string): Json[] {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return [];
  return orders.filter(order => orderAnalyticsMonth(order) === month);
}

export function analyticsMonthLabel(month: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return month;
  return new Date(Number(match[1]), Number(match[2]) - 1, 1)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function orderProductSummary(order: Json): string {
  const items = Array.isArray(order.items) ? order.items.map(record) : [];
  const names = items
    .map(item => first(item, ['product_name']) || first(record(item.product), ['name']))
    .filter(Boolean);
  if (names.length === 0) return 'Product details in order';
  if (names.length === 1) return names[0];
  return `${names[0]} and ${names.length - 1} more ${names.length === 2 ? 'product' : 'products'}`;
}
