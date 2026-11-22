type TransactionHref = {
  pathname: '/account/transactions';
  params: {
    tab?: 'Wallet' | 'Deposits' | 'Investments' | 'Withdrawals' | 'Distributions';
    search?: string;
    selected?: string;
  };
};

export type PostAuthHref =
  | '/(tabs)'
  | '/search'
  | '/account/notifications'
  | '/account/kyc'
  | '/wallet/deposit'
  | '/wallet/withdraw'
  | '/account/reports'
  | '/account/messages'
  | '/account/portfolio'
  | '/account/security'
  | '/account/settings'
  | '/buyer-notifications'
  | '/(tabs)/opportunities'
  | '/(tabs)/portfolio'
  | '/(tabs)/wallet'
  | { pathname: '/project/[id]'; params: { id: string } }
  | { pathname: '/position/[id]'; params: { id: string } }
  | { pathname: '/account/transaction/[id]'; params: { id: string; kind?: 'deposit' | 'withdrawal' | 'wallet'; page?: string } }
  | TransactionHref;

export type BuyerPostAuthHref =
  | '/(buyer-tabs)/buyer-home'
  | '/(buyer-tabs)/buyer-products'
  | '/buyer-cart'
  | '/(buyer-tabs)/dashboard'
  | '/(buyer-tabs)/buyer-orders'
  | '/(buyer-tabs)/buyer-messages'
  | '/(buyer-tabs)/buyer-profile'
  | '/buyer-notifications'
  | '/buyer-system-settings'
  | '/buyer-profile-details'
  | '/buyer-company'
  | '/buyer-security'
  | '/buyer-overview'
  | '/buyer-analytics'
  | '/buyer-repeat-orders'
  | '/buyer-rfq'
  | '/buyer-shipments'
  | '/buyer-documents'
  | '/buyer-trade-finance'
  | '/buyer-checkout'
  | '/account/messages'
  | '/account/notifications'
  | { pathname: '/(buyer-tabs)/buyer-products'; params: { pendingProduct: string } }
  | { pathname: '/buyer-product/[id]'; params: { id: string } }
  | { pathname: '/buyer-rfq/[id]'; params: { id: string } }
  | { pathname: '/buyer-order/[id]'; params: { id: string } }
  | { pathname: '/buyer-quotation/[id]'; params: { id: string } }
  | { pathname: '/buyer-shipment/[id]'; params: { id: string } };

export function resolveBuyerPostAuthHref(returnTo?: string | string[]): BuyerPostAuthHref {
  const value = Array.isArray(returnTo) ? returnTo[0] : returnTo;
  const path = value?.split('?', 1)[0] ?? '';
  const productId = path.match(/^\/buyer-product\/(\d+)\/?$/)?.[1];
  if (productId && Number(productId) > 0) {
    return { pathname: '/buyer-product/[id]', params: { id: productId } };
  }
  const orderId = path.match(/^\/buyer-order\/(\d+)\/?$/)?.[1];
  if (orderId && Number(orderId) > 0) {
    return { pathname: '/buyer-order/[id]', params: { id: orderId } };
  }
  const rfqId = validId(path.match(/^\/buyer-rfq\/([^/]+)\/?$/)?.[1] ?? '');
  if (rfqId) {
    return { pathname: '/buyer-rfq/[id]', params: { id: rfqId } };
  }
  const quotationId = path.match(/^\/buyer-quotation\/(\d+)\/?$/)?.[1];
  if (quotationId && Number(quotationId) > 0) {
    return { pathname: '/buyer-quotation/[id]', params: { id: quotationId } };
  }
  const shipmentId = validId(path.match(/^\/buyer-shipment\/([^/]+)\/?$/)?.[1] ?? '');
  if (shipmentId) {
    return { pathname: '/buyer-shipment/[id]', params: { id: shipmentId } };
  }
  const query = value?.split('?', 2)[1] ?? '';
  const pendingProduct = queryValue(query, 'pendingProduct');
  if (['/buyer-products', '/(buyer-tabs)/buyer-products'].includes(path)
    && /^\d+$/.test(pendingProduct)
    && Number(pendingProduct) > 0) {
    return { pathname: '/(buyer-tabs)/buyer-products', params: { pendingProduct } };
  }
  const buyerRoutes: Record<string, BuyerPostAuthHref> = {
    '/buyer-home': '/(buyer-tabs)/buyer-home',
    '/(buyer-tabs)/buyer-home': '/(buyer-tabs)/buyer-home',
    '/buyer-products': '/(buyer-tabs)/buyer-products',
    '/(buyer-tabs)/buyer-products': '/(buyer-tabs)/buyer-products',
    '/buyer-cart': '/buyer-cart',
    '/(buyer-tabs)/buyer-cart': '/buyer-cart',
    '/dashboard': '/(buyer-tabs)/dashboard',
    '/(buyer-tabs)/dashboard': '/(buyer-tabs)/dashboard',
    '/buyer-orders': '/(buyer-tabs)/buyer-orders',
    '/(buyer-tabs)/buyer-orders': '/(buyer-tabs)/buyer-orders',
    '/buyer-messages': '/(buyer-tabs)/buyer-messages',
    '/(buyer-tabs)/buyer-messages': '/(buyer-tabs)/buyer-messages',
    '/buyer-profile': '/(buyer-tabs)/buyer-profile',
    '/(buyer-tabs)/buyer-profile': '/(buyer-tabs)/buyer-profile',
    '/buyer-notifications': '/buyer-notifications',
    '/buyer-system-settings': '/buyer-system-settings',
    '/buyer-profile-details': '/buyer-profile-details',
    '/buyer-company': '/buyer-company',
    '/buyer-security': '/buyer-security',
    '/buyer-overview': '/(buyer-tabs)/dashboard',
    '/buyer-analytics': '/buyer-analytics',
    '/buyer-repeat-orders': '/buyer-repeat-orders',
    '/buyer-rfq': '/buyer-rfq',
    '/buyer-shipments': '/buyer-shipments',
    '/buyer-documents': '/buyer-documents',
    '/buyer-trade-finance': '/buyer-trade-finance',
    '/buyer-checkout': '/buyer-checkout',
    '/account/messages': '/(buyer-tabs)/buyer-messages',
    '/account/notifications': '/account/notifications',
  };
  return buyerRoutes[path] ?? '/(buyer-tabs)/buyer-home';
}

export function resolveAccountPostAuthHref(
  roles: unknown,
  returnTo?: string | string[],
): BuyerPostAuthHref {
  return hasBuyerRole(roles) ? resolveBuyerPostAuthHref(returnTo) : '/(buyer-tabs)/buyer-home';
}

export function hasBuyerAccountIdentity(user: unknown): boolean {
  if (user === null || typeof user !== 'object' || Array.isArray(user)) return false;
  const value = user as Record<string, unknown>;
  const roles = Array.isArray(value.roles) ? value.roles : [];
  if (roles.length > 0) return hasBuyerRole(roles);

  const accountType = String(value.account_type ?? value.accountType ?? '').trim().toLowerCase();
  return accountType === 'buyer';
}

export function resolveUserPostAuthHref(
  user: unknown,
  returnTo?: string | string[],
): BuyerPostAuthHref {
  return hasBuyerAccountIdentity(user) ? resolveBuyerPostAuthHref(returnTo) : '/(buyer-tabs)/buyer-home';
}

export function hasBuyerRole(roles: unknown): boolean {
  const roleList = Array.isArray(roles) ? roles : [];
  return roleList.some(role => {
    if (typeof role === 'string') return role === 'buyer';
    return String((role as { name?: unknown } | null)?.name ?? '') === 'buyer';
  });
}

export function isBuyerAppRoute(firstSegment: string, pathname: string): boolean {
  const buyerSegments = new Set([
    '',
    'index',
    '(auth)',
    '(buyer-tabs)',
    'buyer-cart',
    'buyer-checkout',
    'buyer-product',
    'buyer-order',
    'buyer-quotation',
    'buyer-rfq',
    'buyer-shipment',
    'buyer-notifications',
    'buyer-system-settings',
    'buyer-profile-details',
    'buyer-company',
    'buyer-security',
    'buyer-overview',
    'buyer-analytics',
    'buyer-repeat-orders',
    'buyer-shipments',
    'buyer-documents',
    'buyer-trade-finance',
    'forgot-password',
    'lock',
  ]);
  if (buyerSegments.has(firstSegment)) return true;
  return firstSegment === 'account'
    && ['/account/messages', '/account/notifications'].includes(pathname);
}

function decode(value: string) {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch {
    return value;
  }
}

function queryValue(query: string, key: string) {
  const pair = query.split('&').find(entry => entry.split('=')[0] === encodeURIComponent(key));
  return pair ? decode(pair.slice(pair.indexOf('=') + 1)) : '';
}

function validId(value: string) {
  return value && value !== '.' && value !== '..' && !/[/?#\\\u0000-\u001f]/.test(value) ? value : '';
}

export function serializeRouteState(pathname: string, params: Record<string, string | string[] | undefined>) {
  const query = Object.entries(params).flatMap(([key, value]) => {
    const values = Array.isArray(value) ? value : value == null ? [] : [value];
    return values.map(item => `${encodeURIComponent(key)}=${encodeURIComponent(item)}`);
  });
  return `${pathname}${query.length ? `?${query.join('&')}` : ''}`;
}

export function resolvePostAuthHref(returnTo?: string | string[]): PostAuthHref {
  const value = Array.isArray(returnTo) ? returnTo[0] : returnTo;
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/(tabs)';

  const [pathname, query = ''] = value.split('?', 2);
  const projectMatch = pathname.match(/^\/project\/([^/]+)\/?$/);
  const projectId = validId(decode(projectMatch?.[1] ?? (pathname === '/project/[id]' ? queryValue(query, 'id') : '')));
  if (projectId) return { pathname: '/project/[id]', params: { id: projectId } };

  const positionMatch = pathname.match(/^\/position\/([^/]+)\/?$/);
  const positionId = validId(decode(positionMatch?.[1] ?? (pathname === '/position/[id]' ? queryValue(query, 'id') : '')));
  if (positionId) return { pathname: '/position/[id]', params: { id: positionId } };

  const transactionMatch = pathname.match(/^\/account\/transaction\/([^/]+)\/?$/);
  const transactionId = validId(decode(transactionMatch?.[1] ?? ''));
  if (/^\d+$/.test(transactionId)) {
    const kind = queryValue(query, 'kind');
    const page = queryValue(query, 'page');
    return {
      pathname: '/account/transaction/[id]',
      params: {
        id: transactionId,
        kind: ['deposit', 'withdrawal', 'wallet'].includes(kind)
          ? kind as 'deposit' | 'withdrawal' | 'wallet'
          : 'wallet',
        page: /^\d+$/.test(page) ? page : undefined,
      },
    };
  }

  if (pathname === '/account/transactions') {
    const tab = queryValue(query, 'tab');
    return {
      pathname: '/account/transactions',
      params: {
        tab: ['Deposits', 'Investments', 'Withdrawals', 'Distributions'].includes(tab)
          ? tab as TransactionHref['params']['tab']
          : 'Wallet',
        search: queryValue(query, 'search') || undefined,
        selected: queryValue(query, 'selected') || undefined,
      },
    };
  }

  const staticRoutes: Record<string, Exclude<PostAuthHref, TransactionHref | { pathname: '/project/[id]'; params: { id: string } } | { pathname: '/position/[id]'; params: { id: string } } | { pathname: '/account/transaction/[id]'; params: { id: string } }>> = {
    '/': '/(tabs)',
    '/(tabs)': '/(tabs)',
    '/(tabs)/index': '/(tabs)',
    '/search': '/search',
    '/account/notifications': '/account/notifications',
    '/account/kyc': '/account/kyc',
    '/wallet/deposit': '/wallet/deposit',
    '/wallet/withdraw': '/wallet/withdraw',
    '/account/reports': '/account/reports',
    '/account/messages': '/account/messages',
    '/account/portfolio': '/account/portfolio',
    '/account/security': '/account/security',
    '/account/settings': '/account/settings',
    '/(tabs)/opportunities': '/(tabs)/opportunities',
    '/opportunities': '/(tabs)/opportunities',
    '/(tabs)/portfolio': '/(tabs)/portfolio',
    '/portfolio': '/(tabs)/portfolio',
    '/(tabs)/wallet': '/(tabs)/wallet',
    '/wallet': '/(tabs)/wallet',
  };
  return staticRoutes[pathname] ?? '/(tabs)';
}
