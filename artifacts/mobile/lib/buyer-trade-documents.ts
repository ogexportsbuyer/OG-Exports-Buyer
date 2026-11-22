export const BUYER_DOCUMENT_CATEGORIES = [
  'Commercial',
  'Shipping',
  'Government',
  'Quality',
  'Insurance',
  'Finance',
] as const;

export type BuyerDocumentCategory = typeof BUYER_DOCUMENT_CATEGORIES[number] | 'Other';
export type BuyerDocumentSource = 'admin' | 'buyer' | 'unknown';

export type BuyerTradeDocument = {
  id: string;
  name: string;
  orderId: string;
  date: string;
  dateSort: number;
  category: BuyerDocumentCategory;
  rawType: string;
  sizeLabel: string;
  status: 'available' | 'pending';
  source: BuyerDocumentSource;
  mimeType: string;
  extension: string;
  downloadUrl: string;
  viewUrl: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
}

function field(source: Record<string, unknown>, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const result = text(source[key]);
    if (result) return result;
  }
  return fallback;
}

export function categoryForBuyerDocument(type: string): BuyerDocumentCategory {
  const value = type.toLowerCase();
  if (value.includes('invoice') || value.includes('packing')) return 'Commercial';
  if (value.includes('bill of lading') || value.includes('bl ') || value === 'bl' || value.includes('shipping')) return 'Shipping';
  if (value.includes('origin') || value.includes('phyto') || value.includes('fumig')) return 'Government';
  if (value.includes('coa') || value.includes('analysis') || value.includes('quality')) return 'Quality';
  if (value.includes('insur')) return 'Insurance';
  if (value.includes('lc') || value.includes('sblc') || value.includes('finance')) return 'Finance';
  return 'Other';
}

export function formatBuyerDocumentSize(bytes: number | null): string {
  if (bytes === null || !Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatBuyerDocumentDate(value: string): { label: string; sort: number } {
  if (!value) return { label: 'TBC', sort: 0 };
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { label: 'TBC', sort: 0 };
  return {
    label: parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    sort: parsed.getTime(),
  };
}

function extensionFrom(path: string, mimeType: string): string {
  const lastSegment = path.split(/[?#]/, 1)[0].split('/').pop() ?? '';
  const extension = /\.[a-z0-9]{2,8}$/i.test(lastSegment) ? lastSegment.split('.').pop()?.toLowerCase() : '';
  if (extension) return extension;
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('jpeg')) return 'jpg';
  if (mimeType.includes('word')) return 'docx';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'xlsx';
  return 'file';
}

export function mapBuyerTradeDocument(value: unknown): BuyerTradeDocument {
  const raw = asRecord(value);
  const id = field(raw, ['id']);
  const title = field(raw, ['title']);
  const rawType = field(raw, ['type']);
  const name = title || rawType || (id ? `Document #${id}` : 'Trade document');
  const orderNumber = field(raw, ['order_number']);
  const orderId = orderNumber
    || (field(raw, ['order_id']) ? `PO-${field(raw, ['order_id'])}` : '')
    || (field(raw, ['shipment_id']) ? `SHP-${field(raw, ['shipment_id'])}` : '—');
  const dateValue = field(raw, ['created_at']);
  const date = formatBuyerDocumentDate(dateValue);
  const mimeType = field(raw, ['mime', 'mime_type', 'content_type'], 'application/octet-stream');
  const path = field(raw, ['path', 'file_name', 'original_filename']);
  const numericSize = typeof raw.file_size === 'number' ? raw.file_size : null;
  const source = raw.source === 'admin' ? 'admin' : raw.source === 'buyer' ? 'buyer' : 'unknown';
  const status = raw.status === 'available' ? 'available' : 'pending';
  const safeId = id ? encodeURIComponent(id) : '';

  return {
    id,
    name,
    orderId,
    date: date.label,
    dateSort: date.sort,
    category: categoryForBuyerDocument(rawType),
    rawType: rawType || 'Other',
    sizeLabel: formatBuyerDocumentSize(numericSize),
    status,
    source,
    mimeType,
    extension: extensionFrom(path, mimeType),
    downloadUrl: safeId ? `/api/buyer/documents/${safeId}/download` : '',
    viewUrl: safeId ? `/api/buyer/documents/${safeId}/view` : '',
  };
}

export function buyerDocumentCategoryCounts(documents: BuyerTradeDocument[]): Record<typeof BUYER_DOCUMENT_CATEGORIES[number], number> {
  const counts = Object.fromEntries(BUYER_DOCUMENT_CATEGORIES.map(category => [category, 0])) as Record<typeof BUYER_DOCUMENT_CATEGORIES[number], number>;
  for (const document of documents) {
    if (document.source === 'admin' && document.category !== 'Other') counts[document.category] += 1;
  }
  return counts;
}

export function filterBuyerTradeDocuments(
  documents: BuyerTradeDocument[],
  options: { search?: string; category?: BuyerDocumentCategory | 'All'; starredOnly?: boolean; starred?: Set<string> },
): BuyerTradeDocument[] {
  const query = options.search?.trim().toLowerCase() ?? '';
  return documents.filter(document => {
    if (document.source !== 'admin') return false;
    if (options.category && options.category !== 'All' && document.category !== options.category) return false;
    if (options.starredOnly && !options.starred?.has(document.id)) return false;
    if (!query) return true;
    return `${document.name} ${document.orderId} ${document.rawType} ${document.id}`.toLowerCase().includes(query);
  });
}

export function sortBuyerTradeDocuments(documents: BuyerTradeDocument[]): BuyerTradeDocument[] {
  return [...documents].sort((a, b) => b.dateSort - a.dateSort);
}
