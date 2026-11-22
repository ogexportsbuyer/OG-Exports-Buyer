export function formatFobPrice(value: number, currency = 'USD'): string {
  const code = /^[A-Z]{3}$/.test(currency) ? currency : 'USD';
  return `FOB · ${code} ${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}
