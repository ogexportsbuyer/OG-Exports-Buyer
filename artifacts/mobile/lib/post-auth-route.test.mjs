import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  resolveAccountPostAuthHref,
  resolveBuyerPostAuthHref,
  hasBuyerAccountIdentity,
  hasBuyerRole,
  isBuyerAppRoute,
  resolvePostAuthHref,
  resolveUserPostAuthHref,
  buyerEntryDestination,
  serializeRouteState,
  isBuyerRoutePublicBeforeAuth,
} from './post-auth-route.ts';
import {
  buyerCartRouteAfterProductAdd,
  claimPendingBuyerProduct,
  pendingProductAuthReturnTo,
} from './buyer-auth-flow.ts';

test('keeps legacy deposit and withdrawal link context after sign-in', () => {
  assert.deepEqual(
    resolvePostAuthHref('/account/transaction/123?kind=deposit&page=4'),
    {
      pathname: '/account/transaction/[id]',
      params: { id: '123', kind: 'deposit', page: '4' },
    },
  );
  assert.deepEqual(
    resolvePostAuthHref('/account/transaction/456?kind=withdrawal'),
    {
      pathname: '/account/transaction/[id]',
      params: { id: '456', kind: 'withdrawal', page: undefined },
    },
  );
});

test('keeps the default wallet kind and investment position ID for saved links', () => {
  assert.deepEqual(
    resolvePostAuthHref('/account/transaction/987'),
    {
      pathname: '/account/transaction/[id]',
      params: { id: '987', kind: 'wallet', page: undefined },
    },
  );
  assert.deepEqual(
    resolvePostAuthHref('/position/789'),
    { pathname: '/position/[id]', params: { id: '789' } },
  );
});

test('serializes legacy transaction route query details for post-auth navigation', () => {
  const returnTo = serializeRouteState('/account/transaction/123', { kind: 'deposit', page: '2' });
  assert.deepEqual(resolvePostAuthHref(returnTo), {
    pathname: '/account/transaction/[id]',
    params: { id: '123', kind: 'deposit', page: '2' },
  });
});

test('returns buyer sign-in to the requested marketplace destination', () => {
  assert.equal(resolveBuyerPostAuthHref('/buyer-cart'), '/buyer-cart');
  assert.equal(resolveBuyerPostAuthHref('/buyer-orders'), '/buyer-orders');
  assert.equal(resolveBuyerPostAuthHref('/buyer-activity'), '/buyer-activity');
  assert.equal(isBuyerAppRoute('buyer-activity', '/buyer-activity'), true);
  assert.deepEqual(resolveBuyerPostAuthHref('/buyer-orders?view=quotations'), {
    pathname: '/buyer-orders',
    params: { view: 'quotations' },
  });
  assert.deepEqual(resolveBuyerPostAuthHref('/(buyer-tabs)/buyer-orders?view=rfqs'), {
    pathname: '/buyer-orders',
    params: { view: 'rfqs' },
  });
  assert.equal(resolveBuyerPostAuthHref('/buyer-products?search=rice'), '/(buyer-tabs)/buyer-products');
  assert.deepEqual(resolveBuyerPostAuthHref('/buyer-product/42'), {
    pathname: '/buyer-product/[id]',
    params: { id: '42' },
  });
  assert.deepEqual(resolveBuyerPostAuthHref('/buyer-rfq?mode=new&resumeAfterAuth=1&product_id=42'), {
    pathname: '/buyer-rfq',
    params: { mode: 'new', resumeAfterAuth: '1', product_id: '42' },
  });
  assert.deepEqual(resolveBuyerPostAuthHref('/buyer-checkout?resumeAction=order'), {
    pathname: '/buyer-checkout',
    params: { resumeAction: 'order' },
  });
  assert.deepEqual(resolveBuyerPostAuthHref('/buyer-checkout?resumeAction=quote'), {
    pathname: '/buyer-checkout',
    params: { resumeAction: 'quote' },
  });
  assert.deepEqual(
    resolveBuyerPostAuthHref('/buyer-products?pendingProduct=42'),
    { pathname: '/(buyer-tabs)/buyer-products', params: { pendingProduct: '42' } },
  );
  assert.deepEqual(
    resolveBuyerPostAuthHref('/buyer-order/123'),
    { pathname: '/buyer-order/[id]', params: { id: '123' } },
  );
  assert.deepEqual(
    resolveBuyerPostAuthHref('/buyer-quotation/456'),
    { pathname: '/buyer-quotation/[id]', params: { id: '456' } },
  );
  assert.equal(resolveBuyerPostAuthHref('/account/messages'), '/(buyer-tabs)/buyer-messages');
});

test('uses a safe buyer home fallback for unknown post-auth routes', () => {
  assert.equal(resolveBuyerPostAuthHref('//external.example'), '/(buyer-tabs)/buyer-home');
  assert.equal(resolveBuyerPostAuthHref('/admin'), '/(buyer-tabs)/buyer-home');
});

test('allows the buyer notifications screen to render its own sign-in gate', () => {
  assert.equal(isBuyerRoutePublicBeforeAuth('buyer-notifications'), true);
  assert.equal(isBuyerRoutePublicBeforeAuth('buyer-orders'), false);
  assert.equal(isBuyerRoutePublicBeforeAuth('buyer-checkout'), true);
  assert.equal(isBuyerRoutePublicBeforeAuth('buyer-rfq'), true);
  const rootLayout = readFileSync(new URL('../app/_layout.tsx', import.meta.url), 'utf8');
  assert.match(rootLayout, /Stack\.Screen name="buyer-notifications" options=\{\{ headerShown: false \}\}/);
});

test('routes first-time guests through onboarding and returning guests to the buyer home', () => {
  assert.equal(buyerEntryDestination(false), '/onboarding');
  assert.equal(buyerEntryDestination(true), '/(buyer-tabs)/buyer-home');
  assert.equal(isBuyerAppRoute('onboarding', '/onboarding'), true);
  assert.equal(isBuyerRoutePublicBeforeAuth('onboarding'), true);
  const entry = readFileSync(new URL('../app/index.tsx', import.meta.url), 'utf8');
  assert.match(entry, /buyerEntryDestination\(onboardingComplete\)/);
});

test('saved non-buyer sessions are cleared and continue to onboarding or the public buyer home', () => {
  const entry = readFileSync(new URL('../app/index.tsx', import.meta.url), 'utf8');
  const handoff = readFileSync(new URL('../components/BuyerSessionHandoff.tsx', import.meta.url), 'utf8');
  assert.match(entry, /token && hasBuyerAccount\(user\)/);
  assert.match(handoff, /logout\.mutateAsync\(undefined\)/);
  assert.match(handoff, /await signOut\(\)/);
  assert.match(handoff, /router\.replace\(buyerEntryDestination\(onboardingComplete\)\)/);
  assert.doesNotMatch(handoff, /Buyer account required|Sign out and continue|buyer-only-signout/);
});

test('buyer login and email verification keep the selected product through cart', () => {
  const returnTo = pendingProductAuthReturnTo(42);
  assert.equal(returnTo, '/buyer-products?pendingProduct=42');
  assert.deepEqual(resolveAccountPostAuthHref(['buyer'], returnTo), {
    pathname: '/(buyer-tabs)/buyer-products',
    params: { pendingProduct: '42' },
  });
  assert.equal(buyerCartRouteAfterProductAdd(true), '/buyer-cart');
  assert.equal(buyerCartRouteAfterProductAdd(false), null);
});

test('pending buyer product is claimed only once and invalid IDs are rejected', () => {
  const handled = { current: '' };
  assert.equal(claimPendingBuyerProduct('42', handled), '42');
  assert.equal(claimPendingBuyerProduct('42', handled), null);
  assert.equal(claimPendingBuyerProduct('43', handled), '43');
  assert.equal(claimPendingBuyerProduct('../42', handled), null);
  assert.equal(pendingProductAuthReturnTo(0), null);
  assert.equal(pendingProductAuthReturnTo(Number.MAX_SAFE_INTEGER + 1), null);
});

test('investor-only roles cannot route into investor tabs in the buyer app', () => {
  assert.equal(resolveAccountPostAuthHref(['investor'], '/buyer-cart'), '/(buyer-tabs)/buyer-home');
  assert.equal(resolveAccountPostAuthHref(['buyer', 'investor'], '/buyer-cart'), '/buyer-cart');
  assert.equal(hasBuyerRole(['investor']), false);
  assert.equal(hasBuyerRole([{ name: 'buyer' }]), true);
});

test('recognizes buyer account type when the API omits the roles array', () => {
  assert.equal(hasBuyerAccountIdentity({ account_type: 'buyer' }), true);
  assert.equal(hasBuyerAccountIdentity({ accountType: 'buyer' }), true);
  assert.equal(hasBuyerAccountIdentity({ account_type: 'investor' }), false);
  assert.equal(resolveUserPostAuthHref({ account_type: 'buyer' }, '/buyer-cart'), '/buyer-cart');
});

test('a returned non-buyer role takes precedence over a conflicting account type', () => {
  const user = { account_type: 'buyer', roles: ['investor'] };
  assert.equal(hasBuyerAccountIdentity(user), false);
  assert.equal(resolveUserPostAuthHref(user, '/buyer-cart'), '/(buyer-tabs)/buyer-home');
});

test('buyer app route allowlist blocks investor screens and permits buyer support', () => {
  assert.equal(isBuyerAppRoute('(buyer-tabs)', '/buyer-home'), true);
  assert.equal(isBuyerAppRoute('(auth)', '/login'), true);
  assert.equal(isBuyerAppRoute('buyer-checkout', '/buyer-checkout'), true);
  assert.equal(isBuyerAppRoute('buyer-cart', '/buyer-cart'), true);
  assert.equal(isBuyerAppRoute('buyer-product', '/buyer-product/42'), true);
  assert.equal(isBuyerAppRoute('account', '/account/notifications'), true);
  assert.equal(isBuyerAppRoute('(tabs)', '/'), false);
  assert.equal(isBuyerAppRoute('wallet', '/wallet/deposit'), false);
  assert.equal(isBuyerAppRoute('account', '/account/portfolio'), false);
  assert.equal(isBuyerAppRoute('buyer-system-settings', '/buyer-system-settings'), true);
  assert.equal(isBuyerAppRoute('buyer-notifications', '/buyer-notifications'), true);
  const profileRoutes = [
    '/buyer-analytics',
    '/buyer-profile-details',
    '/buyer-company',
    '/buyer-system-settings',
    '/buyer-security',
    '/buyer-notifications',
    '/buyer-repeat-orders',
    '/buyer-rfq',
    '/buyer-orders',
    '/buyer-shipments',
    '/buyer-documents',
    '/buyer-trade-finance',
  ];
  for (const path of profileRoutes) {
    const segment = path.slice(1);
    assert.equal(isBuyerAppRoute(segment, path), true, `${path} should stay inside the buyer app`);
    assert.equal(resolveBuyerPostAuthHref(path), path, `${path} should remain the post-login destination`);
  }
  assert.equal(resolveBuyerPostAuthHref('/buyer-overview'), '/(buyer-tabs)/dashboard');
  assert.equal(resolveBuyerPostAuthHref('/(buyer-tabs)/dashboard'), '/(buyer-tabs)/dashboard');
});

test('buyer return routes preserve system settings and notification destinations', () => {
  assert.equal(resolveBuyerPostAuthHref('/buyer-system-settings'), '/buyer-system-settings');
  assert.equal(resolveBuyerPostAuthHref('/buyer-notifications'), '/buyer-notifications');
  assert.equal(resolveBuyerPostAuthHref('/buyer-profile-details'), '/buyer-profile-details');
  assert.equal(resolveBuyerPostAuthHref('/buyer-company'), '/buyer-company');
  assert.deepEqual(resolveBuyerPostAuthHref('/buyer-rfq/421'), {
    pathname: '/buyer-rfq/[id]',
    params: { id: '421' },
  });
  assert.deepEqual(resolveBuyerPostAuthHref('/buyer-shipment/890'), {
    pathname: '/buyer-shipment/[id]',
    params: { id: '890' },
  });
});

test('buyer navigation uses Profile in both native and classic tab bars', () => {
  const layout = readFileSync(new URL('../app/(buyer-tabs)/_layout.tsx', import.meta.url), 'utf8');
  assert.match(layout, /\['buyer-profile', 'Profile'/);
  assert.match(layout, /NativeTabs\.Trigger\.Label>\{t\('Profile'\)\}/);
});

test('buyer selected tab uses orange-gold icon and label without a glass backdrop', () => {
  const layout = readFileSync(new URL('../app/(buyer-tabs)/_layout.tsx', import.meta.url), 'utf8');
  assert.match(layout, /function BuyerTabIcon/);
  assert.match(layout, /focused \? colors\.accent : colors\.mutedForeground/);
  assert.match(layout, /tabBarActiveTintColor: colors\.accent/);
  assert.match(layout, /selected: colors\.accent/);
  assert.doesNotMatch(layout, /selectedTabIconBackdrop/);
});

test('buyer bottom navigation places Dashboard before Messages and keeps home cart shortcut', () => {
  const layout = readFileSync(new URL('../app/(buyer-tabs)/_layout.tsx', import.meta.url), 'utf8');
  const home = readFileSync(new URL('../app/(buyer-tabs)/buyer-home.tsx', import.meta.url), 'utf8');
  const dashboardRoute = readFileSync(new URL('../app/(buyer-tabs)/dashboard.tsx', import.meta.url), 'utf8');
  const profile = readFileSync(new URL('../app/(buyer-tabs)/buyer-profile.tsx', import.meta.url), 'utf8');
  const rootLayout = readFileSync(new URL('../app/_layout.tsx', import.meta.url), 'utf8');
  const cartScreen = readFileSync(new URL('../components/BuyerCartScreen.tsx', import.meta.url), 'utf8');
  const homeHeader = readFileSync(new URL('../components/BuyerHomeHeader.tsx', import.meta.url), 'utf8');
  const dashboard = readFileSync(new URL('../app/buyer-overview.tsx', import.meta.url), 'utf8');
  assert.match(layout, /\['dashboard', 'Dashboard', 'bar-chart-2', 'chart\.bar', 'chart\.bar\.fill'\]/);
  assert.match(layout, /NativeTabs\.Trigger name="dashboard"/);
  assert.match(layout, /md=\{\{ default: 'bar_chart', selected: 'bar_chart' \}\}/);
  assert.match(layout, /Platform\.OS === 'ios' && !isDashboard/);
  assert.ok(layout.indexOf("['dashboard', 'Dashboard'") < layout.indexOf("['buyer-messages', 'Messages'"));
  assert.ok(layout.indexOf('NativeTabs.Trigger name="dashboard"') < layout.indexOf('NativeTabs.Trigger name="buyer-messages"'));
  assert.doesNotMatch(layout, /\['buyer-cart', 'Cart'/);
  assert.doesNotMatch(layout, /NativeTabs\.Trigger name="buyer-cart"/);
  assert.match(home, /onOpenCart=\{\(\) => router\.push\('\/buyer-cart'\)\}/);
  assert.match(rootLayout, /isBuyerRoutePublicBeforeAuth\(firstSegment\)/);
  assert.equal(isBuyerRoutePublicBeforeAuth('buyer-cart'), true);
  assert.doesNotMatch(cartScreen, /return <BuyerAuthGate/);
  assert.match(cartScreen, /buyerGuestCartRow/);
  assert.match(homeHeader, /<Feather name="shopping-cart" size=\{20\} color=\{colors\.accent\} \/>/);
  assert.match(rootLayout, /Stack\.Screen name="buyer-cart" options=\{\{ headerShown: false \}\}/);
  assert.match(profile, /\['Executive dashboard', '\/\(buyer-tabs\)\/dashboard'/);
  assert.match(dashboard, /if \(!isDashboardTab\) return <Redirect href="\/\(buyer-tabs\)\/dashboard" \/>/);
  assert.match(dashboard, /returnTo="\/\(buyer-tabs\)\/dashboard"/);
  assert.match(dashboardRoute, /export \{ default \} from '\.\.\/buyer-overview'/);
});

test('buyer Orders is a root-stack destination, not an untriggered tab route', () => {
  const rootLayout = readFileSync(new URL('../app/_layout.tsx', import.meta.url), 'utf8');
  const tabsLayout = readFileSync(new URL('../app/(buyer-tabs)/_layout.tsx', import.meta.url), 'utf8');
  const profile = readFileSync(new URL('../app/(buyer-tabs)/buyer-profile.tsx', import.meta.url), 'utf8');
  const orders = readFileSync(new URL('../app/buyer-orders.tsx', import.meta.url), 'utf8');
  assert.match(rootLayout, /Stack\.Screen name="buyer-orders" options=\{\{ headerShown: false \}\}/);
  assert.doesNotMatch(tabsLayout, /Tabs\.Screen name="buyer-orders"/);
  assert.match(profile, /\['Orders & quotations', '\/buyer-orders'/);
  assert.match(orders, /returnTo="\/buyer-orders"/);
});
