import { formatAppDate } from './strings.ts';

export function isInvestorNotificationUnread(notification: Record<string, unknown>): boolean {
  const readAt = notification.read_at;
  if ((typeof readAt === 'string' && readAt.trim().length > 0) || (typeof readAt === 'number' && readAt > 0)) {
    return false;
  }

  const readFlags = [notification.is_read, notification.read, notification.isRead];
  const markedRead = readFlags.some(value => {
    if (value === true || value === 1) return true;
    if (typeof value !== 'string') return false;
    return ['true', '1', 'yes', 'read'].includes(value.trim().toLowerCase());
  });

  return !markedRead;
}

export function formatNotificationTimestamp(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return trimmed;

  try {
    return formatAppDate(date, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return trimmed;
  }
}
