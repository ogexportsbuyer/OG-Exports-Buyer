export type BuyerRfqStatus = 'Pending' | 'Quoted' | 'Accepted' | 'Expired';

export type BuyerRfqDraft = {
  productId: string;
  quantity: string;
  packaging: string;
  countryId: string;
  portId: string;
  incoterm: string;
  paymentTerms: string;
  deliveryDate: string;
  notes: string;
};

export const BUYER_RFQ_PAYMENT_TERMS = [
  'LC at Sight',
  '100% Advance TT',
  '30% Advance + 70% BL',
  'SBLC',
] as const;

export const BUYER_RFQ_PACKAGING_OPTIONS = [
  '25 kg PP Bag',
  '50 kg Jute Bag',
  '1 MT Jumbo Bag',
  'Bulk',
  'Other (specify in notes)',
] as const;

export function parseBuyerRfqQuantity(value: string): number | null {
  const normalized = value.trim();
  if (!normalized || !/^\d+(?:\.\d+)?$/.test(normalized)) return null;
  const quantity = Number(normalized);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : null;
}

export function isFutureBuyerRfqDate(value: string, now = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return false;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return date > today;
}

export function formatBuyerRfqReference(id: string | number): string {
  const value = String(id).trim();
  return /^\d+$/.test(value) ? `RFQ-${value.padStart(6, '0')}` : value || 'RFQ';
}

export function resolveBuyerRfqAttachmentUrl(path: string, url: string, apiOrigin: string): string {
  const candidate = path.trim() || url.trim();
  if (!candidate) return '';
  if (/^https?:\/\//i.test(candidate)) return candidate;
  if (!apiOrigin.trim()) return '';
  const origin = apiOrigin.trim().replace(/\/api\/?$/i, '').replace(/\/+$/, '');
  const cleanPath = candidate.replace(/^\/+/, '');
  if (cleanPath.startsWith('storage/') || cleanPath.startsWith('upload/') || cleanPath.startsWith('downloads/') || cleanPath.startsWith('product_images/') || cleanPath.startsWith('investment_images/')) {
    return `${origin}/${cleanPath}`;
  }
  return `${origin}/storage/${cleanPath}`;
}

export function buyerRfqStatus(row: Record<string, unknown>): BuyerRfqStatus {
  const status = String(row.status ?? 'pending').toLowerCase().replace(/[\s_]+/g, '-');
  const quoteCount = Array.isArray(row.quotations) ? row.quotations.length : 0;
  if (status === 'accepted' || status === 'converted') return 'Accepted';
  if (status === 'expired') return 'Expired';
  if (status === 'quoted' || quoteCount > 0) return 'Quoted';
  return 'Pending';
}

export function buyerRfqDestination(row: Record<string, unknown>): string {
  const destination = typeof row.destination === 'string' ? row.destination.trim() : '';
  if (destination) return destination;
  const port = row.port && typeof row.port === 'object' ? row.port as Record<string, unknown> : {};
  const country = row.country && typeof row.country === 'object' ? row.country as Record<string, unknown> : {};
  return [port.name, country.name].filter((value): value is string => typeof value === 'string' && value.trim().length > 0).join(', ') || '—';
}

export function buyerRfqDraftFromRecord(row: Record<string, unknown>): BuyerRfqDraft {
  const product = row.product && typeof row.product === 'object' ? row.product as Record<string, unknown> : {};
  const quantity = String(row.qty ?? '').replace(/\s*MT\s*/i, '').trim();
  const deliveryDate = String(row.required_delivery_date ?? '').slice(0, 10);
  return {
    productId: String(row.product_id ?? product.id ?? ''),
    quantity: quantity === '—' ? '' : quantity,
    packaging: String(row.packaging ?? '25 kg PP Bag') || '25 kg PP Bag',
    countryId: String(row.country_id ?? ''),
    portId: String(row.port_id ?? ''),
    incoterm: String(row.incoterm ?? ''),
    paymentTerms: String(row.payment_terms ?? ''),
    deliveryDate: isFutureBuyerRfqDate(deliveryDate) ? deliveryDate : '',
    notes: String(row.notes ?? ''),
  };
}

export function filterBuyerRfqs(
  rows: Record<string, unknown>[],
  search: string,
  status: 'All' | BuyerRfqStatus,
): Record<string, unknown>[] {
  const query = search.trim().toLowerCase();
  return rows.filter(row => {
    const product = row.product && typeof row.product === 'object' ? row.product as Record<string, unknown> : {};
    const searchable = [
      row.id,
      row.reference,
      row.rfq_number,
      formatBuyerRfqReference(String(row.id ?? '')),
      row.product_name,
      product.name,
      row.destination,
      buyerRfqDestination(row),
    ].map(value => String(value ?? '').toLowerCase()).join(' ');
    return (!query || searchable.includes(query)) && (status === 'All' || buyerRfqStatus(row) === status);
  });
}
