import { first, record, type Json } from '@/lib/data';
import { productMinimumQuantity } from '@/lib/buyer-data';

export function buyerCartItemMinimumQuantity(item: Json): number {
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
