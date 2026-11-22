export type ShipmentTimelineStep = {
  step: string;
  date: string;
  done: boolean;
  active: boolean;
  description: string;
};

export type ShipmentUpdate = {
  id: string;
  title: string;
  date: string;
  description: string;
};

export type ShipmentDocument = {
  id: string;
  title: string;
  type: string;
  status: 'available' | 'pending';
  viewUrl: string;
  downloadUrl: string;
  mimeType: string;
  extension: string;
};

export type BuyerShipmentView = {
  id: string;
  orderId: string;
  orderNumber: string;
  orderRecordId: string;
  container: string;
  trackingNumber: string;
  currentMilestone: string;
  shippingLine: string;
  vessel: string;
  origin: string;
  destination: string;
  etd: string;
  eta: string;
  statusRaw: string;
  statusLabel: string;
  progress: number;
  product: string;
  documents: ShipmentDocument[];
  timeline: ShipmentTimelineStep[];
  recentUpdates: ShipmentUpdate[];
};

export const SHIPMENT_TIMELINE_STEPS = [
  'Awaiting Booking',
  'Booking Confirmed',
  'Gate-In at Port',
  'Vessel Loaded',
  'Departed Origin',
  'In Transit',
  'Arrived Destination',
  'Customs Cleared',
  'Final Delivery',
] as const;

const MILESTONE_ORDER = [
  'awaiting booking',
  'booking confirmed',
  'gate-in at port',
  'vessel loaded',
  'departed origin',
  'in transit',
  'arrived destination',
  'customs cleared',
  'final delivery',
  'delivered',
];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function valueText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (value && typeof value === 'object') {
    const nested = asRecord(value);
    return valueText(nested.name ?? nested.title ?? nested.product_name ?? nested.label);
  }
  return '';
}

function fieldText(source: Record<string, unknown>, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const result = valueText(source[key]);
    if (result) return result;
  }
  return fallback;
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function normalizedWords(value: string): string {
  return value.toLowerCase().replace(/[_\s]+/g, ' ').replace(/[–—]/g, '-').trim();
}

export function normalizeShipmentStatus(value: string): string {
  return normalizedWords(value).replace(/\s+/g, '-');
}

export function shipmentStatusLabel(value: string): string {
  const normalized = normalizeShipmentStatus(value);
  if (!normalized || normalized === 'pending' || normalized === 'awaiting') return 'Pending';
  if (normalized.includes('deliver') || normalized === 'complete' || normalized === 'completed') return 'Delivered';
  if (normalized.includes('arriv')) return 'Arrived';
  if (normalized.includes('transit')) return 'In Transit';
  if (
    normalized.includes('load')
    || normalized.includes('book')
    || normalized.includes('confirm')
    || normalized.includes('gate-in')
  ) return 'Loading';
  return normalized.split('-').filter(Boolean).map(word => word[0]?.toUpperCase() + word.slice(1)).join(' ');
}

export function formatShipmentDate(value: string): string {
  if (!value) return '—';
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function milestoneRank(label: string): number {
  const key = normalizedWords(label);
  if (!key) return -1;
  const exact = MILESTONE_ORDER.indexOf(key);
  if (exact >= 0) return exact;

  const aliases: Array<[RegExp, number]> = [
    [/gate.?in|port entry/, 2],
    [/load(ed|ing)? (at )?port|vessel load/, 3],
    [/depart(ed|ure)/, 4],
    [/in transit|on water|at sea/, 5],
    [/arriv(ed|al)/, 6],
    [/customs|clear(ed|ance)/, 7],
    [/final delivery|delivered|delivery/, 8],
    [/booking confirmed|confirmed booking/, 1],
    [/awaiting booking|pending booking/, 0],
  ];
  const alias = aliases.find(([pattern]) => pattern.test(key));
  if (alias) return alias[1];
  return MILESTONE_ORDER.findIndex(step => step.includes(key) || key.includes(step));
}

function activeIndexFromStatus(status: string): number {
  if (status.includes('deliver')) return 8;
  if (status.includes('arriv')) return 6;
  if (status.includes('transit')) return 5;
  if (status.includes('load') || status.includes('book') || status.includes('confirm')) return 1;
  return 0;
}

function timelineFor(status: string, milestones: unknown[], currentMilestone: string): ShipmentTimelineStep[] {
  const events = new Map<number, { date: string; description: string }>();
  const updates: ShipmentUpdate[] = [];
  milestones.forEach((item, index) => {
    const milestone = asRecord(item);
    const title = fieldText(milestone, ['label', 'title', 'status'], 'Shipment update');
    const date = formatShipmentDate(fieldText(milestone, ['occurred_at', 'event_date', 'created_at', 'updated_at']));
    const description = fieldText(milestone, ['description', 'notes', 'note']);
    const rank = milestoneRank(title);
    if (rank >= 0 && rank < SHIPMENT_TIMELINE_STEPS.length) {
      if (!events.has(rank)) events.set(rank, { date, description });
    } else {
      updates.push({ id: fieldText(milestone, ['id'], String(index)), title, date, description });
    }
  });

  const statusKey = normalizeShipmentStatus(status);
  const currentRank = milestoneRank(currentMilestone);
  const activeIndex = currentRank >= 0 && currentRank < SHIPMENT_TIMELINE_STEPS.length
    ? currentRank
    : activeIndexFromStatus(statusKey);
  const delivered = statusKey.includes('deliver');

  return SHIPMENT_TIMELINE_STEPS.map((step, index) => {
    const event = events.get(index);
    const active = !delivered && index === activeIndex;
    const done = delivered || index < activeIndex;
    return {
      step,
      date: event?.date && event.date !== '—' ? event.date : active ? 'In progress' : '—',
      done,
      active,
      description: event?.description ?? '',
    };
  });
}

function shipmentProgress(status: string, currentMilestone: string, milestoneCount: number): number {
  const normalized = normalizeShipmentStatus(status);
  if (normalized.includes('deliver')) return 100;
  const rank = milestoneRank(currentMilestone);
  if (rank >= 0) return Math.min(95, Math.round(((rank + 1) / MILESTONE_ORDER.length) * 100));
  if (milestoneCount > 0) return Math.min(90, Math.round((milestoneCount / Math.max(milestoneCount + 1, 4)) * 100));
  if (normalized.includes('arriv')) return 85;
  if (normalized.includes('transit')) return 65;
  if (normalized.includes('load') || normalized.includes('book') || normalized.includes('confirm')) return 25;
  return 5;
}

function mapDocument(value: unknown, index: number): ShipmentDocument {
  const document = asRecord(value);
  const id = fieldText(document, ['id']);
  const type = fieldText(document, ['type', 'category'], 'Other');
  const title = fieldText(document, ['title', 'name'], id ? `Document #${id}` : type);
  const explicitView = fieldText(document, ['view_url']);
  const explicitDownload = fieldText(document, ['download_url']);
  const directUrl = fieldText(document, ['url']);
  const available = fieldText(document, ['status']).toLowerCase() !== 'pending';
  const usable = Boolean(explicitView || explicitDownload || directUrl || id);
  const documentPath = id ? `/api/buyer/documents/${encodeURIComponent(id)}` : '';
  const mimeType = fieldText(document, ['mime', 'mime_type', 'content_type'], 'application/octet-stream');
  const sourcePath = fieldText(document, ['file_name', 'original_filename', 'path', 'name'])
    || explicitDownload || explicitView || directUrl;
  const lastSegment = sourcePath.split(/[?#]/, 1)[0].split('/').pop() ?? '';
  const pathExtension = /\.[a-z0-9]{2,8}$/i.test(lastSegment) ? lastSegment.split('.').pop()?.toLowerCase() : '';
  const extension = pathExtension || (
    mimeType.includes('pdf') ? 'pdf'
      : mimeType.includes('png') ? 'png'
        : mimeType.includes('jpeg') ? 'jpg'
          : mimeType.includes('word') ? 'docx'
            : mimeType.includes('sheet') || mimeType.includes('excel') ? 'xlsx'
              : 'file'
  );

  return {
    id: id || `shipment-document-${index}`,
    title,
    type,
    status: available && usable ? 'available' : 'pending',
    viewUrl: explicitView || directUrl || (documentPath ? `${documentPath}/view` : ''),
    downloadUrl: explicitDownload || directUrl || (documentPath ? `${documentPath}/download` : ''),
    mimeType,
    extension,
  };
}

export function mapBuyerShipment(value: unknown): BuyerShipmentView {
  const shipment = asRecord(value);
  const order = asRecord(shipment.order);
  const milestones = list(shipment.milestones);
  const statusRaw = fieldText(shipment, ['status'], 'pending');
  const currentMilestone = fieldText(shipment, ['current_milestone', 'milestone']);
  const documents = list(shipment.trade_documents ?? shipment.tradeDocuments).map(mapDocument);
  const product = fieldText(shipment, ['product_snapshot', 'product_name', 'product'])
    || fieldText(order, ['product_snapshot', 'product_name', 'product'], 'Export shipment');
  const timeline = timelineFor(statusRaw, milestones, currentMilestone);
  const recentUpdates = milestones.flatMap((item, index) => {
    const milestone = asRecord(item);
    const title = fieldText(milestone, ['label', 'title', 'status'], 'Shipment update');
    if (milestoneRank(title) >= 0) return [];
    return [{
      id: fieldText(milestone, ['id'], String(index)),
      title,
      date: formatShipmentDate(fieldText(milestone, ['occurred_at', 'event_date', 'created_at', 'updated_at'])),
      description: fieldText(milestone, ['description', 'notes', 'note']),
    }];
  });

  return {
    id: fieldText(shipment, ['id']),
    orderId: fieldText(order, ['order_number'], fieldText(shipment, ['order_number', 'order_id'], '—')),
    orderNumber: fieldText(order, ['order_number'], fieldText(shipment, ['order_number', 'order_id'], '—')),
    orderRecordId: fieldText(order, ['id'], fieldText(shipment, ['order_id'])),
    container: fieldText(shipment, ['container', 'container_number', 'reference'], '—'),
    trackingNumber: fieldText(shipment, ['tracking_number', 'tracking_code']),
    currentMilestone,
    shippingLine: fieldText(shipment, ['shipping_line', 'carrier'], '—'),
    vessel: fieldText(shipment, ['vessel', 'vessel_name'], '—'),
    origin: fieldText(shipment, ['origin', 'origin_port'], '—'),
    destination: fieldText(shipment, ['destination', 'destination_port'], '—'),
    etd: formatShipmentDate(fieldText(shipment, ['etd', 'estimated_departure', 'departure_date'])),
    eta: formatShipmentDate(fieldText(shipment, ['eta', 'estimated_delivery', 'estimated_delivery_date'])),
    statusRaw,
    statusLabel: shipmentStatusLabel(statusRaw),
    progress: shipmentProgress(statusRaw, currentMilestone, milestones.length),
    product,
    documents,
    timeline,
    recentUpdates,
  };
}

export function shipmentSearchText(shipment: BuyerShipmentView): string {
  return [
    shipment.id,
    shipment.orderId,
    shipment.orderNumber,
    shipment.container,
    shipment.trackingNumber,
    shipment.product,
    shipment.origin,
    shipment.destination,
    shipment.shippingLine,
    shipment.vessel,
  ].join(' ').toLowerCase();
}

export function isShipmentInTransit(shipment: BuyerShipmentView): boolean {
  return shipment.statusLabel === 'In Transit' || shipment.statusLabel === 'Arrived';
}
