import { formatAppNumber } from './strings.ts';

export function formatFobPrice(value: number, currency = 'USD', unitOfMeasure?: string): string {
  const code = /^[A-Z]{3}$/.test(currency) ? currency : 'USD';
  const unit = unitOfMeasure?.trim();
  return `FOB · ${code} ${formatAppNumber(value, { maximumFractionDigits: 2 })}${unit ? ` / ${unit}` : ''}`;
}
