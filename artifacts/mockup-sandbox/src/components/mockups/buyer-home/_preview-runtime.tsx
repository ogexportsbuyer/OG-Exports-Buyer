import React from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Globe2,
  Grid2X2,
  Home,
  MapPin,
  MessageCircle,
  Package,
  Search,
  ShoppingCart,
  UserRound,
} from 'lucide-react';
import * as RNWeb from 'react-native-web';

const web = RNWeb as any;
export const Image = web.Image as React.ComponentType<any>;
export const Pressable = web.Pressable as React.ComponentType<any>;
export const ScrollView = web.ScrollView as React.ComponentType<any>;
export const View = web.View as React.ComponentType<any>;
export const LocalizedText = web.Text as React.ComponentType<any>;
export const LocalizedTextInput = web.TextInput as React.ComponentType<any>;
export const useWindowDimensions = web.useWindowDimensions as () => { width: number; height: number };
const Text = LocalizedText;
const TextInput = LocalizedTextInput;

const palette = {
  text: '#283833',
  foreground: '#283833',
  background: '#F8F7F3',
  card: '#FDFDFB',
  primary: '#0A3335',
  primaryForeground: '#F9F8F6',
  secondary: '#EFEDE6',
  mutedForeground: '#40534C',
  lightGreen: '#E3EEEC',
  balanceCardStart: '#0B3A3C',
  balanceCardEnd: '#1E6464',
  balanceCardText: '#F8FBF8',
  accent: '#B99A64',
  accentForeground: '#24332F',
  glassTintGold: 'rgba(247, 235, 210, 0.72)',
  border: '#DFDDD7',
  shadow: 'rgba(40, 56, 51, 0.045)',
};

const iconMap = {
  'arrow-right': ArrowRight,
  'arrow-up-right': ArrowUpRight,
  globe: Globe2,
  grid: Grid2X2,
  home: Home,
  'map-pin': MapPin,
  'message-circle': MessageCircle,
  package: Package,
  search: Search,
  'shopping-cart': ShoppingCart,
  user: UserRound,
};

function FeatherIcon({
  name,
  size = 20,
  color = 'currentColor',
}: {
  name: keyof typeof iconMap;
  size?: number;
  color?: string;
}) {
  const Icon = iconMap[name];
  return <Icon size={size} color={color} strokeWidth={1.8} aria-hidden />;
}

export const Feather = Object.assign(FeatherIcon, {
  glyphMap: Object.fromEntries(Object.keys(iconMap).map((name) => [name, 1])) as Record<keyof typeof iconMap, number>,
});

export const router = {
  push: (_destination: unknown) => undefined,
};

export function useColors() {
  return { ...palette, radius: 12 };
}

export function useAuth() {
  return { ready: true, token: null, apiOrigin: 'https://preview.invalid' };
}

const previewProducts = [
  {
    id: 'preview-sesame-seeds',
    name: 'Sesame Seeds',
    category: 'Seeds & Oilseeds',
    origin: 'Pakistan',
    image_url: 'https://api.ogexports.co/product_images/sesame-seeds-1788251385-0-apy2t5.png',
    price: 1680,
    currency: 'USD',
  },
  {
    id: 'preview-yellow-maize',
    name: 'Yellow Maize (Corn)',
    category: 'Grains',
    origin: 'Pakistan',
    image_url: 'https://api.ogexports.co/product_images/yellow-maize-corn-1788251429-0-q5nyov.png',
    price: 295,
    currency: 'USD',
  },
  {
    id: 'preview-basmati-rice',
    name: 'Premium Basmati Rice',
    category: 'Rice',
    origin: 'Pakistan',
    image_url: 'https://api.ogexports.co/product_images/premium-basmati-rice-1788251454-0-dj9bd7.png',
    price: 1360,
    currency: 'USD',
  },
];

const previewCategories = ['Seeds & Oilseeds', 'Grains', 'Rice'];

export function useGetProducts(_params?: unknown, _options?: unknown) {
  return { data: { data: previewProducts }, isLoading: false, isError: false, error: undefined, refetch: () => undefined };
}

export function useGetProductCategories(_options?: unknown) {
  return { data: { data: previewCategories.map((name) => ({ name })) }, isLoading: false, isError: false, error: undefined, refetch: () => undefined };
}

export function useGetBuyerOrders(_params?: unknown, _options?: unknown) {
  return { data: { data: [] as Record<string, unknown>[] }, isLoading: false, isError: false, error: undefined, refetch: () => undefined };
}

export const getGetBuyerOrdersQueryKey = (_params: unknown) => ['preview', 'buyer-orders'];
export const getGetProductCategoriesQueryKey = () => ['preview', 'product-categories'];
export const getGetProductsQueryKey = (_params: unknown) => ['preview', 'products'];

export function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function first(row: Record<string, unknown>, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return fallback;
}

export function rowsFromResponse(response: unknown): Record<string, unknown>[] {
  const rows = record(response).data;
  return Array.isArray(rows) ? rows.map(record) : [];
}

export function categoryName(product: Record<string, unknown>): string {
  const value = product.category;
  return typeof value === 'string' ? value : first(record(value), ['name'], 'General');
}

export function displayOrderNumber(order: Record<string, unknown>): string {
  return first(order, ['order_number', 'reference', 'id'], 'Order');
}

export function displayPrice(product: Record<string, unknown>): string {
  const price = Number(product.fob ?? product.price);
  if (!Number.isFinite(price) || price <= 0) return 'Request a quote';
  const currency = first(product, ['currency'], 'USD');
  return `${currency} ${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

export function Card({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: any;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: palette.card,
          borderColor: palette.border,
          borderWidth: 1,
          borderRadius: 18,
          shadowColor: '#283833',
          shadowOpacity: 0.06,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Screen({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  refreshable?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={{ flex: 1, width: '100%', height: '100%', backgroundColor: palette.background }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 18,
          paddingTop: 15,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: palette.border,
          backgroundColor: palette.card,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: palette.foreground, fontSize: 19, fontWeight: '700' }}>{title}</Text>
          {subtitle ? <Text style={{ color: palette.mutedForeground, fontSize: 11, marginTop: 2 }}>{subtitle}</Text> : null}
        </View>
        {action}
      </View>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 110 }}
      >
        {children}
      </ScrollView>
      <View
        style={{
          position: 'absolute',
          left: 15,
          right: 15,
          bottom: 8,
          minHeight: 60,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          borderRadius: 30,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.84)',
          backgroundColor: 'rgba(253,253,251,0.96)',
          shadowColor: '#283833',
          shadowOpacity: 0.12,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 3 },
          elevation: 6,
        }}
      >
        {[
          { label: 'Home', icon: 'home', active: true },
          { label: 'Categories', icon: 'grid', active: false },
          { label: 'Messages', icon: 'message-circle', active: false },
          { label: 'Cart', icon: 'shopping-cart', active: false },
          { label: 'My account', icon: 'user', active: false },
        ].map((item) => (
          <Pressable
            key={item.label}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 54, gap: 3 }}
          >
            <View
              style={{
                width: 31,
                height: 29,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 11,
                backgroundColor: item.active ? palette.lightGreen : 'transparent',
              }}
            >
              <Feather name={item.icon as keyof typeof iconMap} size={18} color={item.active ? palette.primary : palette.mutedForeground} />
            </View>
            <Text style={{ color: item.active ? palette.primary : palette.mutedForeground, fontSize: 9, fontWeight: item.active ? '700' : '500' }}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function Section({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <Text style={{ color: palette.foreground, fontSize: 16, fontWeight: '700' }}>{title}</Text>
      {right}
    </View>
  );
}

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
  icon?: string;
}) {
  return (
    <View style={{ padding: 18, marginBottom: 12, backgroundColor: palette.card, borderColor: palette.border, borderWidth: 1, borderRadius: 16 }}>
      <Text style={{ color: palette.foreground, fontWeight: '700' }}>{title}</Text>
      <Text style={{ color: palette.mutedForeground, fontSize: 12, lineHeight: 17, marginTop: 5 }}>{body}</Text>
    </View>
  );
}

export function ErrorState({
  message,
  error: _error,
  onRetry: _onRetry,
}: {
  message: string;
  error?: unknown;
  onRetry?: () => void;
}) {
  return (
    <View style={{ padding: 14, marginBottom: 12, backgroundColor: '#FBEDEC', borderRadius: 14 }}>
      <Text style={{ color: '#852D26', fontSize: 12 }}>{message}</Text>
    </View>
  );
}

export function LoadingCard({ label }: { label: string; lines?: number }) {
  return (
    <View style={{ padding: 14, marginBottom: 12, backgroundColor: palette.card, borderRadius: 14, borderColor: palette.border, borderWidth: 1 }}>
      <Text style={{ color: palette.mutedForeground, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

export function Status({ value }: { value: string }) {
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: palette.lightGreen }}>
      <Text style={{ color: palette.primary, fontSize: 10, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

