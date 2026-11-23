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
