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

export function resolveBuyerProductImageUrl(imagePath: string, apiOrigin: string): string {
  const candidate = imagePath.trim();
  if (!candidate) return '';
  if (/^https?:\/\//i.test(candidate)) return candidate;
  if (candidate.startsWith('//')) return `https:${candidate}`;

  const origin = apiOrigin.trim().replace(/\/api\/?$/i, '').replace(/\/+$/, '');
  if (!origin) return '';

  const cleanPath = candidate.replace(/^\/+/, '');
  const storagePath = /^(?:uploads|products)\//i.test(cleanPath) && !/^storage\//i.test(cleanPath)
    ? `storage/${cleanPath}`
    : cleanPath;

  try {
    return new URL(storagePath, `${origin}/`).toString();
  } catch {
    return '';
  }
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

function productMediaPath(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  const media = objectValue(value);
  const type = firstText(media, ['type', 'mime_type', 'media_type']).toLowerCase();
  if (type && !type.includes('image') && type !== 'photo' && type !== 'gallery') return '';
  return firstText(media, ['url', 'image_url', 'imageUrl', 'image_path', 'path', 'src']);
}

export function buyerProductGalleryImages(product: Json, apiOrigin: string): string[] {
  const primary = firstText(product, ['image_url', 'imageUrl', 'image_path', 'imagePath']);
  const entries: { path: string; order: number; position: number }[] = [];
  let position = 0;

  for (const field of ['media', 'images', 'gallery_images', 'gallery', 'galleryPaths', 'galleryUrls']) {
    const collection = product[field];
    if (!Array.isArray(collection)) continue;
    collection.forEach((entry) => {
      const path = productMediaPath(entry);
      if (!path) return;
      const row = objectValue(entry);
      const rawOrder = row.sort_order ?? row.sortOrder;
      const order = typeof rawOrder === 'number' && Number.isFinite(rawOrder) ? rawOrder : position;
      entries.push({ path, order, position });
      position += 1;
    });
  }

  const mediaPaths = entries
    .sort((a, b) => a.order - b.order || a.position - b.position)
    .map((entry) => entry.path);
  return Array.from(new Set([primary, ...mediaPaths]
    .map((path) => resolveBuyerProductImageUrl(path, apiOrigin))
    .filter(Boolean)));
}

export function buyerProductReportDownloadPath(product: Json): string {
  const slug = firstText(product, ['slug']);
  if (slug) return `api/products/${encodeURIComponent(slug)}/lab-report`;
  return firstText(product, ['lab_report_url', 'labReportUrl', 'lab_report_path', 'labReportPath']);
}

export function buyerProductHasPdfReport(product: Json): boolean {
  const path = firstText(product, ['lab_report_path', 'labReportPath', 'lab_report_url', 'labReportUrl']);
  const cleanPath = path.split(/[?#]/, 1)[0];
  return cleanPath.toLowerCase().endsWith('.pdf');
}
