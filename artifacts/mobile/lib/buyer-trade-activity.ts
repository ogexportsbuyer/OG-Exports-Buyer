export type BuyerActivityRecord = Record<string, unknown>;

export type BuyerActivitySources = {
  orders: BuyerActivityRecord[];
  rfqs: BuyerActivityRecord[];
  quotations: BuyerActivityRecord[];
  shipments: BuyerActivityRecord[];
  documents: BuyerActivityRecord[];
};

export type BuyerTradeActivityItem = {
  id: string;
  source: keyof BuyerActivitySources;
  title: string;
  description: string;
  timestamp: string | null;
  icon: 'shopping-bag' | 'file-plus' | 'file-text' | 'truck' | 'folder';
  route: string;
};

const sourceKeys: Array<keyof BuyerActivitySources> = ['orders', 'rfqs', 'quotations', 'shipments', 'documents'];

function asRecord(value: unknown): BuyerActivityRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as BuyerActivityRecord
    : {};
}

function valueText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function firstText(row: BuyerActivityRecord, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = valueText(row[key]);
    if (value) return value;
  }
  return fallback;
}

function nestedText(row: BuyerActivityRecord, parent: string, keys: string[], fallback = ''): string {
  return firstText(asRecord(row[parent]), keys, fallback);
}

function activityTimestamp(row: BuyerActivityRecord, keys: string[]): string | null {
  const value = firstText(row, keys);
  return value && Number.isFinite(Date.parse(value)) ? value : null;
}

function prettyStatus(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

function routeFor(source: keyof BuyerActivitySources, id: string): string {
  const numericId = /^\d+$/.test(id) && Number(id) > 0;
  if (source === 'orders') return numericId ? `/buyer-order/${id}` : '/buyer-orders';
  if (source === 'rfqs') return numericId ? `/buyer-rfq/${id}` : '/buyer-rfq';
  if (source === 'quotations') return numericId ? `/buyer-quotation/${id}` : '/buyer-orders?view=quotations';
  if (source === 'shipments') return numericId ? `/buyer-shipment/${id}` : '/buyer-shipments';
  return '/buyer-documents';
}

function mapActivity(
  source: keyof BuyerActivitySources,
  row: BuyerActivityRecord,
  index: number,
): BuyerTradeActivityItem {
  const rawId = firstText(row, ['id', 'reference', 'order_number', 'rfq_number'], `${source}-${index + 1}`);
  const status = prettyStatus(firstText(row, ['status'], ''));
  const product = firstText(row, ['product_name'], nestedText(row, 'product', ['name'], nestedText(row, 'rfq', ['product_name'], 'Product')));

  if (source === 'rfqs') {
    const quantity = firstText(row, ['qty', 'qty_mt', 'quantity']);
    return {
      id: `rfq-${rawId}`,
      source,
      title: 'RFQ Submitted',
      description: [`RFQ #${rawId}`, quantity ? `Quantity ${quantity}` : '', product].filter(Boolean).join(' · '),
      timestamp: activityTimestamp(row, ['submitted_at', 'created_at']),
      icon: 'file-plus',
      route: routeFor(source, firstText(row, ['id'], rawId)),
    };
  }

  if (source === 'quotations') {
    const reference = /^\d+$/.test(rawId) ? `QT-${rawId}` : rawId;
    const accepted = firstText(row, ['status']).toLowerCase() === 'accepted';
    return {
      id: `quotation-${rawId}`,
      source,
      title: accepted ? 'Quotation Accepted' : 'Quote Received',
      description: [reference, product, status].filter(Boolean).join(' · '),
      timestamp: activityTimestamp(row, ['issued_at', 'created_at']),
      icon: 'file-text',
      route: routeFor(source, firstText(row, ['id'], rawId)),
    };
  }

  if (source === 'orders') {
    const orderNumber = firstText(row, ['order_number', 'reference'], `PO-${rawId}`);
    const title = status.toLowerCase() === 'delivered'
      ? 'Order Delivered'
      : status.toLowerCase() === 'cancelled'
        ? 'Order Cancelled'
        : 'Order Confirmed';
    return {
      id: `order-${rawId}`,
      source,
      title,
      description: [orderNumber, product !== 'Product' ? product : '', status].filter(Boolean).join(' · '),
      timestamp: activityTimestamp(row, ['placed_at', 'created_at']),
      icon: 'shopping-bag',
      route: routeFor(source, firstText(row, ['id'], rawId)),
    };
  }

  if (source === 'shipments') {
    const reference = firstText(row, ['container', 'container_number', 'reference', 'shipment_number'], `SHP-${rawId}`);
    const route = [firstText(row, ['origin']), firstText(row, ['destination'])].filter(Boolean).join(' → ');
    return {
      id: `shipment-${rawId}`,
      source,
      title: 'Shipment Update',
      description: [reference, route, status].filter(Boolean).join(' · '),
      timestamp: activityTimestamp(row, ['updated_at', 'created_at']),
      icon: 'truck',
      route: routeFor(source, firstText(row, ['id'], rawId)),
    };
  }

  const documentTitle = firstText(row, ['title', 'name'], `Document #${rawId}`);
  const documentType = firstText(row, ['type']);
  return {
    id: `document-${rawId}`,
    source,
    title: 'Document Uploaded',
    description: [documentType, documentTitle].filter(Boolean).join(' · '),
    timestamp: activityTimestamp(row, ['created_at']),
    icon: 'folder',
    route: routeFor(source, firstText(row, ['id'], rawId)),
  };
}

export function buildBuyerTradeActivity(sources: BuyerActivitySources): BuyerTradeActivityItem[] {
  return sourceKeys
    .flatMap(source => sources[source].map((row, index) => mapActivity(source, row, index)))
    .sort((a, b) => {
      const aTime = a.timestamp ? Date.parse(a.timestamp) : Number.NEGATIVE_INFINITY;
      const bTime = b.timestamp ? Date.parse(b.timestamp) : Number.NEGATIVE_INFINITY;
      return bTime - aTime || a.id.localeCompare(b.id);
    });
}

export function mergeBuyerActivitySources(
  current: BuyerActivitySources,
  next: BuyerActivitySources,
): BuyerActivitySources {
  return sourceKeys.reduce((merged, source) => {
    const seen = new Set<string>();
    merged[source] = [...current[source], ...next[source]].filter(row => {
      const key = firstText(row, ['id', 'uuid', 'reference', 'order_number', 'rfq_number']) || JSON.stringify(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return merged;
  }, { orders: [], rfqs: [], quotations: [], shipments: [], documents: [] } as BuyerActivitySources);
}

export function buyerActivityHasMore(
  responses: Partial<Record<keyof BuyerActivitySources, unknown>>,
  currentSources: BuyerActivitySources,
  perPage: number,
): boolean {
  return sourceKeys.some(source => {
    const response = asRecord(responses[source]);
    const meta = asRecord(response.meta);
    const currentPage = Number(response.current_page ?? meta.current_page);
    const lastPage = Number(response.last_page ?? meta.last_page);
    if (Number.isFinite(currentPage) && Number.isFinite(lastPage) && lastPage > 0) {
      return currentPage < lastPage;
    }
    return currentSources[source].length >= perPage;
  });
}

export function formatBuyerActivityDateTime(value: string | null, locale?: string): string {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Date unavailable';
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
