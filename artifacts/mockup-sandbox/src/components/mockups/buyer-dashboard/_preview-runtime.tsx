import React from 'react';
import * as RNWeb from 'react-native-web';
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardList,
  Clock3,
  CreditCard,
  DollarSign,
  FilePlus2,
  FileText,
  FolderOpen,
  Grid2X2,
  Home,
  LoaderCircle,
  Search,
  ShieldCheck,
  ShoppingBag,
  Tag,
  TrendingDown,
  TrendingUp,
  Truck,
  UserRound,
} from 'lucide-react';

const native = RNWeb as any;
export const Image = native.Image as React.ComponentType<any>;
export const Pressable = native.Pressable as React.ComponentType<any>;
export const ScrollView = native.ScrollView as React.ComponentType<any>;
export const View = native.View as React.ComponentType<any>;
export const LocalizedText = native.Text as React.ComponentType<any>;
const Text = LocalizedText;

const iconMap: Record<string, React.ComponentType<any>> = {
  'arrow-up-right': ArrowUpRight,
  'arrow-down-right': ArrowDownRight,
  bell: Bell,
  briefcase: BriefcaseBusiness,
  camera: Camera,
  'check-circle': CheckCircle2,
  'chevron-right': ChevronRight,
  clock: Clock3,
  'credit-card': CreditCard,
  'dollar-sign': DollarSign,
  'file-plus': FilePlus2,
  'file-text': FileText,
  folder: FolderOpen,
  grid: Grid2X2,
  home: Home,
  loader: LoaderCircle,
  search: Search,
  shield: ShieldCheck,
  'shopping-bag': ShoppingBag,
  tag: Tag,
  'trending-down': TrendingDown,
  'trending-up': TrendingUp,
  truck: Truck,
  user: UserRound,
  clipboard: ClipboardList,
};

function FeatherIcon({ name, size = 18, color = 'currentColor' }: { name: string; size?: number; color?: string }) {
  const Icon = iconMap[name] ?? Circle;
  return <Icon size={size} color={color} strokeWidth={1.8} aria-hidden />;
}

export const Feather = Object.assign(FeatherIcon, {
  glyphMap: Object.fromEntries(Object.keys(iconMap).map(name => [name, 1])) as Record<string, number>,
});

const palette = {
  background: '#F8F7F3',
  foreground: '#283833',
  card: '#FDFDFB',
  primary: '#0A3335',
  primaryForeground: '#F9F8F6',
  secondary: '#EFEDE6',
  mutedForeground: '#40534C',
  lightGreen: '#E3EEEC',
  accent: '#B08D57',
  border: '#DFDDD7',
  destructive: '#B83C35',
  glassFill: 'rgba(253,253,251,0.75)',
  glassBorder: 'rgba(255,255,255,0.88)',
};

export function useColors() {
  return palette;
}

export const router = { push: (_route: unknown) => undefined };
export function useSegments() {
  return ['(buyer-tabs)', 'dashboard'];
}
export function Redirect({ href: _href }: { href: string }) {
  return null;
}

export function useAuth() {
  return {
    token: 'preview-token',
    user: { name: 'Trade Buyer', profile: { company_name: 'International Sourcing Co.' } },
    apiOrigin: 'https://preview.invalid',
    updateUser: async (_user: Json) => undefined,
  };
}

export type Json = Record<string, any>;

export function useQueryClient() {
  return { invalidateQueries: async (_query: unknown) => undefined };
}

const dashboardPreview = {
  kpis: {
    orders: 5,
    orders_change: '+2 this month',
    orders_trend: 'Growing',
    orders_trend_up: true,
    shipments_active: 3,
    shipments_change: '2 at sea',
    shipments_trend: '',
    rfqs_pending: 2,
    rfqs_change: '1 awaiting response',
    rfqs_trend: '',
  },
  trade_value_summary: {
    total_purchase_value_usd: 68500,
    completed_trade_value_usd: 27400,
    processing_trade_value_usd: 41100,
    discount_savings_usd: 1850,
    currency: 'USD',
  },
  display_currency: 'USD',
  profile_completion: 80,
  trust_score: 780,
  trust_tier: 'Verified',
  member_since: '2024',
  spend_yoy_pct: 12,
  kyc_status: 'approved',
  spend_by_month: [
    { month: 'Jun', value: 6200 }, { month: 'Jul', value: 7100 },
    { month: 'Aug', value: 8400 }, { month: 'Sep', value: 9300 },
    { month: 'Oct', value: 10400 }, { month: 'Nov', value: 12100 },
  ],
  orders_by_status: [
    { name: 'Delivered', value: 2 }, { name: 'Processing', value: 2 }, { name: 'Confirmed', value: 1 },
  ],
  upcoming_shipments: [
    { ref: 'SHP-2048', product: 'Yellow Maize', status: 'In transit', origin: 'Karachi', destination: 'Jebel Ali', qty: '24 MT', eta: '12 Dec', vessel: 'MV Horizon', pct: 68 },
    { ref: 'SHP-2053', product: 'Sesame Seeds', status: 'Preparing', origin: 'Karachi', destination: 'Jebel Ali', qty: '12 MT', eta: '22 Dec', vessel: 'Pending', pct: 24 },
  ],
  profile_checklist: [
    { label: 'Company profile', done: true },
    { label: 'Business documents', done: true },
    { label: 'Trade preferences', done: false },
  ],
  alerts: [{ type: 'shipment', title: 'Shipment SHP-2048 is on the way', badge: 'LIVE UPDATE' }],
  favourites: [
    { id: 'sesame', name: 'Sesame Seeds', grade: 'Premium', origin: 'Pakistan', icon: '✦' },
    { id: 'maize', name: 'Yellow Maize', grade: 'Feed grade', origin: 'Pakistan', icon: '◈' },
  ],
  recent_activity: [
    { type: 'shipment', title: 'Shipment update', desc: 'SHP-2048 · In transit to Jebel Ali', time: '2 hours ago', at: '2026-11-26T08:00:00Z' },
    { type: 'order', title: 'Order confirmed', desc: 'PO-OG-2048 · Yellow Maize', time: 'Yesterday', at: '2026-11-25T10:30:00Z' },
    { type: 'quotation_accepted', title: 'Quotation accepted', desc: 'QT-1048 · Sesame Seeds', time: '2 days ago', at: '2026-11-24T09:00:00Z' },
    { type: 'rfq', title: 'RFQ submitted', desc: 'Premium Basmati Rice · 20 MT', time: '3 days ago', at: '2026-11-23T11:30:00Z' },
  ],
};

const notificationsPreview = {
  data: [
    { id: 1, type: 'approval', title: 'Company documents approved', message: 'Your updated company registration has been reviewed.', created_at: '2026-11-26T07:30:00Z', read_at: null },
  ],
};

export const getGetBuyerDashboardQueryKey = () => ['preview', 'buyer-dashboard'];
export const getGetSharedNotificationsQueryKey = () => ['preview', 'notifications'];
export const getGetInvestorMeQueryKey = () => ['preview', 'investor-me'];

export function useGetBuyerDashboard(_options?: unknown) {
  return { data: { data: dashboardPreview }, isLoading: false, isError: false, isSuccess: true, error: undefined, refetch: () => undefined };
}

export function useGetSharedNotifications(_options?: unknown) {
  return { data: notificationsPreview, isLoading: false, isError: false, isSuccess: true, error: undefined, refetch: () => undefined };
}

export function useUpdateInvestorMe() {
  return { mutateAsync: async (_input: { data: unknown }) => ({ user: {} }) };
}

export const ImagePicker: any = {
  requestMediaLibraryPermissionsAsync: async () => ({ granted: false }),
  launchImageLibraryAsync: async () => ({ canceled: true, assets: [] }),
};

export async function uploadInvestorFile(..._args: any[]) {
  return 'preview-avatar.png';
}

export function record(value: unknown): Json {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Json : {};
}

export function first(row: Json, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return fallback;
}

export function list(value: unknown): Json[] {
  return Array.isArray(value) ? value.map(record) : [];
}

export function amount(row: Json, keys: string[]): number | null {
  for (const key of keys) {
    const value = Number(row[key]);
    if (row[key] !== undefined && row[key] !== null && Number.isFinite(value)) return value;
  }
  return null;
}

export function money(value: number, currency: string, _options?: unknown): string {
  return `${currency} ${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export function mapBuyerDashboardOrderStatuses(statuses: unknown) {
  return list(statuses).map((row, index) => ({
    name: first(row, ['name', 'status'], 'Status'),
    value: amount(row, ['value', 'count']) ?? 0,
    index,
    color: '',
  }));
}

export function Card({ children, style, testID }: { children: React.ReactNode; style?: any; testID?: string }) {
  return (
    <View testID={testID} style={[
      { backgroundColor: palette.glassFill, borderColor: palette.glassBorder, borderWidth: 1, borderRadius: 18, shadowColor: '#0A3335', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
      style,
    ]}>
      {children}
    </View>
  );
}

export function Screen({ title, subtitle, children, action: _action }: { title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode; refreshable?: boolean }) {
  return (
    <View style={{ height: '100vh', width: '100%', backgroundColor: palette.background }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12, backgroundColor: 'rgba(253,253,251,0.9)', borderBottomWidth: 1, borderColor: palette.border }}>
        <Text style={{ color: palette.foreground, fontSize: 19, fontWeight: '800' }}>{title}</Text>
        {subtitle ? <Text style={{ color: palette.mutedForeground, fontSize: 11, marginTop: 3 }}>{subtitle}</Text> : null}
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 110 }}>
        {children}
      </ScrollView>
      <View style={{ position: 'absolute', left: 14, right: 14, bottom: 8, height: 58, borderRadius: 29, backgroundColor: 'rgba(253,253,251,0.96)', borderWidth: 1, borderColor: palette.glassBorder, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', shadowColor: '#0A3335', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}>
        {[['Dashboard', 'home'], ['Products', 'grid'], ['Orders', 'shopping-bag'], ['Messages', 'bell'], ['Profile', 'user']].map(([label, icon], index) => (
          <View key={label} style={{ alignItems: 'center', gap: 2 }}>
            <Feather name={icon} size={17} color={index === 0 ? palette.primary : palette.mutedForeground} />
            <Text style={{ color: index === 0 ? palette.primary : palette.mutedForeground, fontSize: 8, fontWeight: index === 0 ? '800' : '500' }}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function Action({ title, onPress, icon, secondary = false, testID }: { title: string; onPress: () => void; icon?: string; secondary?: boolean; testID?: string }) {
  return (
    <Pressable testID={testID} onPress={onPress} style={{ minHeight: 42, paddingHorizontal: 11, borderRadius: 12, borderWidth: 1, borderColor: secondary ? palette.border : palette.primary, backgroundColor: secondary ? 'rgba(253,253,251,0.55)' : palette.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
      {icon ? <Feather name={icon} size={14} color={secondary ? palette.primary : palette.primaryForeground} /> : null}
      <Text style={{ color: secondary ? palette.primary : palette.primaryForeground, fontSize: 10, fontWeight: '800' }}>{title}</Text>
    </Pressable>
  );
}

export function Status({ value }: { value: string }) {
  return <View style={{ paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12, backgroundColor: palette.lightGreen }}><Text style={{ color: palette.primary, fontSize: 9, fontWeight: '800' }}>{value}</Text></View>;
}

export function EmptyState({ title, body, icon = 'activity' }: { title: string; body: string; icon?: string }) {
  return <Card style={{ padding: 14, marginBottom: 10 }}><View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}><Feather name={icon} size={17} color={palette.mutedForeground} /><View style={{ flex: 1 }}><Text style={{ color: palette.foreground, fontSize: 11, fontWeight: '800' }}>{title}</Text><Text style={{ color: palette.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: 4 }}>{body}</Text></View></View></Card>;
}

export function ErrorState({ message }: { message: string; error?: unknown; onRetry?: () => void }) {
  return <Card style={{ padding: 12, marginBottom: 10 }}><Text style={{ color: palette.destructive, fontSize: 11 }}>{message}</Text></Card>;
}

export function LoadingCard({ label }: { label: string; lines?: number }) {
  return <Card style={{ padding: 12, marginBottom: 10 }}><Text style={{ color: palette.mutedForeground, fontSize: 11 }}>{label}</Text></Card>;
}

export function BuyerAuthGate({ title, body }: { title: string; body: string; returnTo: string }) {
  return <Screen title={title} subtitle={body}><Card style={{ padding: 18 }}><Text style={{ color: palette.foreground }}>Sign in required</Text></Card></Screen>;
}

export function BuyerSpendTrendCard({ points, currency, yearOverYear }: { points: unknown; currency: string; yearOverYear: string }) {
  const rows = list(points);
  const values = rows.map(row => amount(row, ['value']) ?? 0);
  const max = Math.max(1, ...values);
  return (
    <Card style={{ padding: 14, marginBottom: 11 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View><Text style={{ color: palette.foreground, fontSize: 13, fontWeight: '800' }}>Monthly purchase value</Text><Text style={{ color: palette.mutedForeground, fontSize: 9, marginTop: 3 }}>Last 12 months · {currency}</Text></View>
        <Text style={{ color: palette.primary, fontSize: 9, fontWeight: '800' }}>{yearOverYear}</Text>
      </View>
      <View style={{ height: 78, flexDirection: 'row', alignItems: 'flex-end', gap: 5, marginTop: 14 }}>
        {rows.map((row, index) => <View key={index} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}><View style={{ height: Math.max(6, (values[index] / max) * 68), width: '65%', borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: index === rows.length - 1 ? palette.accent : palette.primary }} /></View>)}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}><Text style={{ color: palette.mutedForeground, fontSize: 9 }}>{first(rows[0] || {}, ['month'], '—')}</Text><Text style={{ color: palette.mutedForeground, fontSize: 9 }}>{first(rows[rows.length - 1] || {}, ['month'], '—')}</Text></View>
    </Card>
  );
}

export function BuyerOrdersByStatusCard({ statuses }: { statuses: unknown }) {
  const rows = list(statuses);
  const total = rows.reduce((sum, row) => sum + (amount(row, ['value', 'count']) ?? 0), 0);
  return <Card style={{ padding: 14, marginBottom: 11 }}><Text style={{ color: palette.foreground, fontSize: 13, fontWeight: '800' }}>Orders by status</Text><Text style={{ color: palette.mutedForeground, fontSize: 9, marginTop: 3 }}>Current orders and pending RFQs</Text><View style={{ height: 8, borderRadius: 6, overflow: 'hidden', flexDirection: 'row', marginTop: 13, backgroundColor: palette.secondary }}>{rows.map((row, index) => <View key={index} style={{ width: `${total ? ((amount(row, ['value', 'count']) ?? 0) / total) * 100 : 0}%`, backgroundColor: [palette.primary, palette.accent, '#4C8192'][index % 3] }} />)}</View>{rows.map((row, index) => <Text key={index} style={{ color: palette.mutedForeground, fontSize: 9, marginTop: 7 }}>{first(row, ['name', 'status'], 'Status')} · {first(row, ['value', 'count'], '0')}</Text>)}</Card>;
}

export function buyerDashboardAlertTime(value: string | undefined) {
  if (!value) return 'Recently';
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Recently';
}

export function recentBuyerApprovalNotifications(response: unknown) {
  return list(record(response).data).filter(item => !item.read_at);
}

export function buyerDashboardErrorMessage(_error: unknown) {
  return 'Your trade overview is unavailable right now.';
}

export function buyerDashboardKycLabel(status: string) {
  return status === 'approved' ? 'Verified' : status ? status : 'Verification pending';
}

export function unwrapBuyerDashboardResponse(response: unknown) {
  return record(record(response).data);
}
