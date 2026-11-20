import { list, record } from '@/lib/data';
import { hasBuyerAccountIdentity, resolveUserPostAuthHref, type BuyerPostAuthHref } from '@/lib/post-auth-route';

export function hasAccountRole(user: unknown, expectedRole: string): boolean {
  return list(record(user).roles).some(role => {
    if (typeof role === 'string') return role === expectedRole;
    return String(record(role).name ?? '') === expectedRole;
  });
}

export function hasBuyerAccount(user: unknown): boolean {
  return hasBuyerAccountIdentity(user);
}

export function homeRouteForAccount(_user: unknown): '/(buyer-tabs)/buyer-home' {
  return '/(buyer-tabs)/buyer-home';
}

export function postAuthRouteForAccount(user: unknown, returnTo?: string | string[]): BuyerPostAuthHref {
  return resolveUserPostAuthHref(user, returnTo);
}
