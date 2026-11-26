export function formatFobPrice(value: number, currency = 'USD', unitOfMeasure?: string): string {
  const code = /^[A-Z]{3}$/.test(currency) ? currency : 'USD';
  const unit = unitOfMeasure?.trim();
  return `FOB · ${code} ${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}${unit ? ` / ${unit}` : ''}`;
}
