import { formatAppDate } from './strings.ts';

export type BuyerDashboardRecord = Record<string, unknown>;

function asRecord(value: unknown): BuyerDashboardRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as BuyerDashboardRecord
    : {};
}

export function unwrapBuyerDashboardResponse(value: unknown): BuyerDashboardRecord {
  let current = asRecord(value);
  for (let depth = 0; depth < 2; depth += 1) {
    if (!Object.prototype.hasOwnProperty.call(current, 'data')) break;
    const nested = asRecord(current.data);
    if (!Object.keys(nested).length) return {};
    current = nested;
  }
  return current;
}

export function buyerUnreadNotificationCount(value: unknown): number {
  const response = asRecord(value);
  const data = asRecord(response.data);
  const rawCount = data.unread_count ?? response.unread_count;
  const count = typeof rawCount === 'number'
    ? rawCount
    : typeof rawCount === 'string' && rawCount.trim()
      ? Number(rawCount)
      : Number.NaN;
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
}

export function buyerDashboardErrorMessage(error: unknown): string {
  const response = asRecord(error);
  const status = typeof response.status === 'number' ? response.status : 0;

  if (status === 401) return 'Your sign-in session has expired. Sign in again to load your buyer dashboard.';
  if (status === 403) return 'This account cannot access buyer dashboard data. Sign in with your buyer account or contact OG Exports support.';
  if (status === 404) return 'The connected API does not have the buyer dashboard endpoint available. Contact OG Exports support.';
  if (status === 429) return 'The dashboard is receiving too many requests. Wait a moment and try again.';
  if (status >= 500) return `OG Exports could not load your dashboard right now (server error ${status}). Try again shortly.`;
  if (status >= 400) return `The dashboard request was rejected (error ${status}). Check your account and try again.`;

  return 'Your buyer overview could not be loaded. Check your connection and try again.';
}

export function buyerDashboardKycLabel(status: string | null | undefined): string {
  const value = (status ?? '').toLowerCase();
  if (value === 'approved') return '✓ KYC Verified';
  if (value === 'review') return 'KYC Under Review';
  if (value === 'rejected') return 'KYC Rejected';
  return 'KYC Unverified';
}

export type BuyerDashboardOrderStatus = {
  name: string;
  value: number;
  color: string;
  index: number;
};

export function mapBuyerDashboardOrderStatuses(value: unknown): BuyerDashboardOrderStatus[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    const status = asRecord(item);
    const rawCount = status.value ?? status.count;
    const count = typeof rawCount === 'number'
      ? rawCount
      : typeof rawCount === 'string' && rawCount.trim()
        ? Number(rawCount)
        : Number.NaN;
    if (!Number.isFinite(count) || count < 0) return [];
    const name = typeof status.name === 'string' && status.name.trim()
      ? status.name.trim()
      : typeof status.status === 'string' && status.status.trim()
        ? status.status.trim()
        : 'Order status';
    return [{
      name,
      value: count,
      color: typeof status.color === 'string' ? status.color : '',
      index,
    }];
  });
}

const buyerApprovalNotificationTypes = new Set([
  'kyc_approved',
  'kyc_rejected',
  'deposit_approved',
  'deposit_rejected',
  'withdrawal_approved',
  'withdrawal_rejected',
  'buyer_payment_approved',
  'buyer_payment_rejected',
  'buyer_payment_cancelled',
  'order_status',
  'quotation',
  'quotation_reply',
  'investment',
  'investment_approved',
]);

function notificationRows(value: unknown): BuyerDashboardRecord[] {
  let current: unknown = value;
  for (let depth = 0; depth < 3; depth += 1) {
    if (Array.isArray(current)) return current.map(asRecord);
    const envelope = asRecord(current);
    if (!Object.prototype.hasOwnProperty.call(envelope, 'data')) return [];
    current = envelope.data;
  }
  return Array.isArray(current) ? current.map(asRecord) : [];
}

function isReadNotification(notification: BuyerDashboardRecord): boolean {
  if (typeof notification.read_at === 'string' && notification.read_at.length > 0) return true;
  return [notification.read, notification.is_read].some(value =>
    value === true || value === 1 || value === '1' || (typeof value === 'string' && value.toLowerCase() === 'true'),
  );
}

export function recentBuyerApprovalNotifications(value: unknown): BuyerDashboardRecord[] {
  return notificationRows(value)
    .filter(notification => {
      const type = typeof notification.type === 'string' ? notification.type.toLowerCase() : '';
      return buyerApprovalNotificationTypes.has(type) && !isReadNotification(notification);
    })
    .slice(0, 5);
}

export function buyerDashboardAlertTime(value: unknown): string {
  if (typeof value !== 'string' || !value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  return formatAppDate(date);
}
