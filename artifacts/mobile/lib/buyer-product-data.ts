import type { Json } from './data.ts';

export type BuyerProductSpec = {
  label: string;
  value: string;
};

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function textValue(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function firstText(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = textValue(row[key]);
    if (value) return value;
  }
  return '';
}

export function buyerProductSpecs(product: Json): BuyerProductSpec[] {
  const raw = product.specs;
  if (!Array.isArray(raw)) return [];

  return raw.map((item) => {
    const spec = objectValue(item);
    return {
      label: firstText(spec, ['label', 'name', 'key', 'parameter']),
      value: firstText(spec, ['value', 'description', 'text']),
    };
  }).filter((spec) => spec.label && spec.value);
}

export function buyerProductValues(product: Json, field: string): string[] {
  const raw = product[field];
  const values = Array.isArray(raw)
    ? raw.map((item) => {
      if (typeof item === 'string' || typeof item === 'number') return textValue(item);
      return firstText(objectValue(item), ['label', 'name', 'title', 'value', 'term', 'code']);
    })
    : typeof raw === 'string'
      ? raw.split(/[,\n;|]/)
      : [];

  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}
