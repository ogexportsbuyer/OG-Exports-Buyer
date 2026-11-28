import React from 'react';
import * as RNWeb from 'react-native-web';
import {
  ArrowRight,
  Check,
  ChevronRight,
  Grid2X2,
  Minus,
  Package,
  Plus,
  RefreshCw,
  ShoppingCart,
  Trash2,
  WifiOff,
  AlertCircle,
} from 'lucide-react';

const web = RNWeb as any;
export const Pressable = web.Pressable as React.ComponentType<any>;
export const TextInput = web.TextInput as React.ComponentType<any>;
export const View = web.View as React.ComponentType<any>;
export const LocalizedText = web.Text as React.ComponentType<any>;
const Text = LocalizedText;

const iconMap = {
  'arrow-right': ArrowRight,
  check: Check,
  'chevron-right': ChevronRight,
  grid: Grid2X2,
  minus: Minus,
  package: Package,
  plus: Plus,
  'refresh-cw': RefreshCw,
  'shopping-cart': ShoppingCart,
  'trash-2': Trash2,
  'wifi-off': WifiOff,
  'alert-circle': AlertCircle,
};

export const Feather = Object.assign(
  function FeatherIcon({ name, size = 18, color = 'currentColor' }: { name: keyof typeof iconMap; size?: number; color?: string }) {
    const Icon = iconMap[name];
    return <Icon size={size} color={color} strokeWidth={1.8} aria-hidden />;
  },
  { glyphMap: Object.fromEntries(Object.keys(iconMap).map(name => [name, 1])) },
);

const palette = {
  background: '#F8F7F3',
  foreground: '#283833',
  card: '#FDFDFB',
  primary: '#0A3335',
  primaryForeground: '#F9F8F6',
  buttonBackground: '#0A3335',
  buttonForeground: '#F9F8F6',
  secondary: '#EFEDE6',
  mutedForeground: '#40534C',
  lightGreen: '#E3EEEC',
  accentText: '#0A3335',
  accentSurface: '#F0B43D',
  destructive: '#DC2828',
  destructiveForeground: '#FFFFFF',
  border: '#DFDDD7',
  glassFill: 'rgba(255, 249, 234, 0.82)',
  glassTintTeal: 'rgba(211, 233, 227, 0.58)',
  glassTintGold: 'rgba(249, 224, 173, 0.54)',
  glassBorder: 'rgba(255, 252, 239, 0.94)',
  glassShadow: 'rgba(100, 75, 28, 0.12)',
};

export function useColors() {
  return { ...palette, radius: 12 };
}

export function useAuth() {
  return { token: null, apiOrigin: 'https://api.ogexports.co' };
}

const products = [
  {
    id: 'preview-rice',
    qty: 1,
    unit_price: 1360,
    product: {
      name: 'Premium Basmati Rice',
      origin: 'Pakistan',
      image_url: 'https://api.ogexports.co/product_images/premium-basmati-rice-1788251454-0-dj9bd7.png',
      price: 1360,
      currency: 'USD',
      unit_of_measure: 'MT',
      moq: '1 MT',
    },
  },
  {
    id: 'preview-sesame',
    qty: 1,
    unit_price: 1680,
    product: {
      name: 'Sesame Seeds',
      origin: 'Pakistan',
      image_url: 'https://api.ogexports.co/product_images/sesame-seeds-1788251385-0-apy2t5.png',
      price: 1680,
      currency: 'USD',
      unit_of_measure: 'MT',
      moq: '1 MT',
    },
  },
  {
    id: 'preview-maize',
    qty: 1,
    unit_price: 295,
    product: {
      name: 'Yellow Maize',
      origin: 'Pakistan',
      image_url: 'https://api.ogexports.co/product_images/yellow-maize-corn-1788251429-0-q5nyov.png',
      price: 295,
      currency: 'USD',
      unit_of_measure: 'MT',
      moq: '1 MT',
    },
  },
];

export function useGetBuyerCart(_options?: unknown) {
  return { data: { data: { currency: 'USD', items: products } }, isLoading: false, isError: false, error: undefined, refetch: () => undefined };
}

export function useUpdateBuyerCartItem() {
  return { isPending: false, mutateAsync: async (_input?: unknown) => undefined };
}

export function useRemoveBuyerCartItem() {
  return { isPending: false, mutateAsync: async (_input?: unknown) => undefined };
}

export const getGetBuyerCartQueryKey = () => ['preview', 'buyer-cart'];
export function useQueryClient() {
  return { invalidateQueries: async (_input?: unknown) => undefined, refetchQueries: async (_input?: unknown) => undefined };
}

export function useBuyerGuestFlow() {
  return {
    ready: true,
    cart: [] as Array<{ productId: string; quantity: number }>,
    mergeError: null,
    isMergingCart: false,
    mergeGuestCart: async () => true,
    setGuestQuantity: async (_productId?: number, _quantity?: number) => undefined,
    removeGuestProduct: async (_productId?: number) => undefined,
    clearGuestCart: async () => undefined,
  };
}

export const router = { push: (_destination: unknown) => undefined };

export function amount(row: Record<string, any>, keys: string[]): number | null {
  for (const key of keys) {
    const value = Number(row?.[key]);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

export function first(row: Record<string, any>, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = row?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return fallback;
}

export function list(value: unknown): Array<Record<string, any>> {
  return Array.isArray(value) ? value as Array<Record<string, any>> : [];
}

export function record(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
}

export function messageOf(error: unknown) {
  return error instanceof Error ? error.message : 'Unable to update your cart.';
}

export function buyerCartItemMinimumQuantity(item: Record<string, any>) {
  const raw = first(record(item.product), ['moq'], first(item, ['moq'], '1'));
  const parsed = Number(raw.match(/\d+(?:\.\d+)?/)?.[0] ?? 1);
  return Number.isFinite(parsed) && parsed > 0 ? Math.ceil(parsed) : 1;
}

export function nextBuyerCartQuantity(current: number, delta: number, minimum: number) {
  return Math.max(minimum, Math.floor(current) + Math.trunc(delta));
}

export function parseBuyerCartQuantityInput(value: string, minimum: number) {
  const parsed = Number(value);
  return /^\d+$/.test(value) && Number.isSafeInteger(parsed) ? Math.max(minimum, parsed) : minimum;
}

export function buyerGuestCartRow(entry: Record<string, any>) {
  return entry;
}

export function formatFobPrice(value: number, currency = 'USD', unit?: string) {
  return `FOB · ${currency} ${value.toLocaleString('en-US')}${unit ? ` / ${unit}` : ''}`;
}

export function BuyerProductImage({ uri, label, style }: { uri: string; label: string; style?: Record<string, any> }) {
  return (
    <div style={{ ...style, position: 'relative', overflow: 'hidden', flexShrink: 0, background: '#E3EEEC' }}>
      <img src={uri} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
}

export function BuyerProductPrice({ product }: { product: Record<string, any>; compact?: boolean }) {
  const item = record(product);
  const detail = record(item.product);
  const price = amount(item, ['unit_price']) ?? amount(detail, ['price']);
  if (price === null || price <= 0) return <Text style={{ color: palette.primary, fontSize: 11, fontWeight: '800' }}>Request a quote</Text>;
  return <Text style={{ color: palette.primary, fontSize: 11, lineHeight: 15, fontWeight: '800' }}>{formatFobPrice(price, first(detail, ['currency'], 'USD'), first(detail, ['unit_of_measure']))}</Text>;
}

export function Card({ children, style, testID }: { children: React.ReactNode; style?: Record<string, any>; testID?: string }) {
  return (
    <div data-testid={testID} style={{
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, rgba(255,255,255,.92), rgba(249,224,173,.34), rgba(211,233,227,.54))',
      border: '1px solid rgba(255,252,239,.95)',
      borderRadius: 18,
      boxShadow: '0 10px 28px rgba(100,75,28,.10)',
      ...style,
    }}>{children}</div>
  );
}

export function Action({ title, icon, secondary, disabled, onPress, testID }: {
  title: string; icon?: keyof typeof iconMap; secondary?: boolean; disabled?: boolean; onPress?: () => void; testID?: string;
}) {
  return (
    <button data-testid={testID} onClick={onPress} disabled={disabled} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
      width: '100%', minHeight: 48, borderRadius: 13, border: `1px solid ${secondary ? '#DFDDD7' : '#0A3335'}`,
      background: secondary ? '#FDFDFB' : '#0A3335', color: secondary ? '#0A3335' : '#F9F8F6',
      font: '600 14px Inter, sans-serif', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .5 : 1,
    }}>
      {icon ? <Feather name={icon} size={16} color={secondary ? '#0A3335' : '#F9F8F6'} /> : null}
      {title}
    </button>
  );
}

export function EmptyState({ title, body, icon = 'package' }: { title: string; body: string; icon?: keyof typeof iconMap }) {
  return <Card style={{ padding: 24, textAlign: 'center' }}><Feather name={icon} /><Text>{title}</Text><Text>{body}</Text></Card>;
}

export function ErrorState({ message, onRetry }: { message: string; error?: unknown; onRetry?: () => void }) {
  return <Card style={{ padding: 18 }}><Text>{message}</Text>{onRetry ? <div style={{ marginTop: 12 }}><Action title="Try again" icon="refresh-cw" onPress={onRetry} /></div> : null}</Card>;
}

export function LoadingCard({ label }: { label?: string }) {
  return <Card style={{ padding: 18 }}><Text>{label ?? 'Loading…'}</Text></Card>;
}

export function Screen({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode; refreshable?: boolean }) {
  return (
    <div style={{
      minHeight: '100vh', overflowY: 'auto', padding: '42px 20px 106px',
      background: 'radial-gradient(ellipse at 100% 0%, rgba(249,224,173,.42), transparent 34%), radial-gradient(ellipse at 0% 48%, rgba(211,233,227,.56), transparent 36%), #F8F7F3',
    }}>
      <header style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: '#7A6540', font: '700 10px Inter, sans-serif', letterSpacing: 1.3, textTransform: 'uppercase' }}>
          <ShoppingCart size={14} /> Your order
        </div>
        <Text style={{ display: 'block', color: '#283833', fontSize: 25, lineHeight: '31px', fontWeight: '600', marginTop: 10 }}>{title}</Text>
        {subtitle ? <Text style={{ display: 'block', color: '#40534C', fontSize: 13, lineHeight: '19px', marginTop: 5 }}>{subtitle}</Text> : null}
      </header>
      {children}
    </div>
  );
}
