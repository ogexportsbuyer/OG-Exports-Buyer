import { list, record } from '@/lib/data';

export function hasAccountRole(user: unknown, expectedRole: string): boolean {
  return list(record(user).roles).some(role => {
    if (typeof role === 'string') return role === expectedRole;
    return String(record(role).name ?? '') === expectedRole;
  });
}

export function isBuyerOnlyAccount(user: unknown): boolean {
  return hasAccountRole(user, 'buyer') && !hasAccountRole(user, 'investor');
}

export function homeRouteForAccount(user: unknown): '/(tabs)' | '/(buyer-tabs)/buyer-home' {
  return isBuyerOnlyAccount(user) ? '/(buyer-tabs)/buyer-home' : '/(tabs)';
}
