import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { Card, EmptyState, ErrorState, LoadingCard, Screen, Status } from '@/components/InvestorUI';
import { useBrandedAlert } from '@/components/BrandedAlertProvider';
import BuyerHomeCatalog from '@/components/BuyerHomeCatalog';
import BuyerHomeHeader from '@/components/BuyerHomeHeader';
import { useAuth } from '@/context/AuthContext';
import { useBuyerGuestFlow } from '@/context/BuyerGuestFlowContext';
import { useColors } from '@/hooks/useColors';
import {
  getGetPublicInvestorAppSettingsQueryKey,
  getGetBuyerOrdersQueryKey,
  getGetProductCategoriesQueryKey,
  getGetProductsQueryKey,
  getGetSharedUnreadNotificationCountQueryKey,
  useGetPublicInvestorAppSettings,
  useGetBuyerOrders,
  useGetProductCategories,
  useGetProducts,
  useGetSharedUnreadNotificationCount,
} from '@workspace/api-client-react';
import { first, record, unwrap } from '@/lib/data';
import { displayOrderNumber, rowsFromResponse } from '@/lib/buyer-data';
import { buyerUnreadNotificationCount } from '@/lib/buyer-dashboard-data';
import { latestRecords } from '@/lib/latest-records';

const styles = StyleSheet.create({
  ordersSection: {
    marginTop: 13,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.7,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    marginTop: 4,
    fontFamily: 'serif',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '400',
    letterSpacing: -0.4,
  },
  textAction: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  supportMethod: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderWidth: 1,
    borderRadius: 14,
  },
  supportMethodIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
});

export default function BuyerHome() {
  const { ready, token, apiOrigin } = useAuth();
  const { cartItemCount } = useBuyerGuestFlow();
  const colors = useColors();
  const { showAlert } = useBrandedAlert();
  const [search, setSearch] = useState('');
  const [selectedOrigin, setSelectedOrigin] = useState('Global');
  const supportSettingsQuery = useGetPublicInvestorAppSettings({
    query: {
      queryKey: getGetPublicInvestorAppSettingsQueryKey(),
      enabled: ready && !!apiOrigin,
      staleTime: 300_000,
    },
  });
  const ordersQuery = useGetBuyerOrders(
    { per_page: 10 },
    { query: { queryKey: getGetBuyerOrdersQueryKey({ per_page: 10 }), enabled: ready && !!token && !!apiOrigin, staleTime: 30_000 } },
  );
  const unreadNotificationsQuery = useGetSharedUnreadNotificationCount({
    query: {
      queryKey: getGetSharedUnreadNotificationCountQueryKey(),
      enabled: ready && !!token && !!apiOrigin,
      staleTime: 20_000,
      refetchOnMount: 'always',
      refetchOnReconnect: true,
    },
  });
  const catalogEnabled = ready && !!apiOrigin;
  const productsQuery = useGetProducts(
    { per_page: 100 },
    { query: { queryKey: getGetProductsQueryKey({ per_page: 100 }), enabled: catalogEnabled, retry: false, staleTime: 60_000 } },
  );
  const categoriesQuery = useGetProductCategories(
    { query: { queryKey: getGetProductCategoriesQueryKey(), enabled: catalogEnabled, retry: false, staleTime: 300_000 } },
  );
  const orders = rowsFromResponse(ordersQuery.data);
  const activeOrders = orders.filter(order => !['completed', 'cancelled', 'delivered'].includes(first(order, ['status']).toLowerCase()));
  const latestActiveOrders = latestRecords(activeOrders, ['created_at', 'createdAt', 'placed_at', 'order_date'], 2);
  const supportEmail = first(unwrap(supportSettingsQuery.data), ['support_email', 'supportEmail'], 'support@ogexports.co');
  const products = rowsFromResponse(productsQuery.data);
  const categories = rowsFromResponse(categoriesQuery.data).map(category => first(category, ['name'])).filter(Boolean);
  const unreadNotificationCount = token
    ? buyerUnreadNotificationCount(record(unreadNotificationsQuery.data))
    : 0;

  function browseProducts(searchTerm = '') {
    const normalized = searchTerm.trim();
    router.push({
      pathname: '/(buyer-tabs)/buyer-products',
      ...(normalized ? { params: { search: normalized } } : {}),
    });
  }

  function openProduct(productId: string) {
    router.push({ pathname: '/buyer-product/[id]', params: { id: productId } });
  }

  function openOrders() {
    if (token) {
      router.push('/buyer-orders');
      return;
    }
    router.push({
      pathname: '/(auth)/login',
      params: { returnTo: '/buyer-orders' },
    });
  }

  async function openSupportEmail() {
    try {
      await Linking.openURL(`mailto:${supportEmail}`);
    } catch {
      showAlert({
        title: 'Email support',
        message: supportEmail,
        tone: 'warning',
        buttons: [{ label: 'OK' }],
      });
    }
  }

  async function openWhatsAppSupport() {
    try {
      await Linking.openURL('https://wa.me/923032569000');
    } catch {
      showAlert({
        title: 'WhatsApp support',
        message: 'Could not open WhatsApp. Contact support at +92 303 2569000, or create a ticket.',
        tone: 'warning',
        buttons: [{ label: 'OK' }],
      });
    }
  }

  function selectTopTab(label: string) {
    if (label === 'Products') browseProducts(search);
    if (label === 'Worldwide' || label === 'For you') setSelectedOrigin('Global');
  }

  return (
    <Screen title="" hideHeader refreshable>
      <BuyerHomeHeader
        search={search}
        onSearchChange={setSearch}
        onBrowse={browseProducts}
        onOpenCart={() => router.push('/buyer-cart')}
        cartItemCount={cartItemCount}
        onOpenNotifications={() => router.push('/buyer-notifications')}
        unreadNotificationCount={unreadNotificationCount}
        onSelectTab={selectTopTab}
      />
      <BuyerHomeCatalog
        products={products}
        categories={categories}
        selectedOrigin={selectedOrigin}
        onSelectOrigin={setSelectedOrigin}
        onBrowse={browseProducts}
        onSelectProduct={openProduct}
        onSelectCategory={category => router.push({ pathname: '/(buyer-tabs)/buyer-products', params: { category } })}
        productsLoading={productsQuery.isLoading}
        productsError={productsQuery.isError}
        productsErrorValue={productsQuery.error}
        onRetryProducts={() => void productsQuery.refetch()}
        categoriesLoading={categoriesQuery.isLoading}
        categoriesError={categoriesQuery.isError}
        categoriesErrorValue={categoriesQuery.error}
        onRetryCategories={() => void categoriesQuery.refetch()}
        connectionReady={ready}
        isCatalogConfigured={!!apiOrigin}
      />

      {token ? (
        <View style={styles.ordersSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.eyebrow, { color: colors.accentText }]}>Your trade, in view</Text>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Active orders</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={openOrders} style={styles.textAction}>
              <Text style={{ color: colors.foreground, fontSize: 10, fontWeight: '700' }}>View all</Text>
              <Feather name="arrow-up-right" size={13} color={colors.accent} />
            </Pressable>
          </View>
          {ordersQuery.isLoading ? <LoadingCard label="Loading orders…" lines={2} /> : null}
          {ordersQuery.isError ? (
            <ErrorState message="Your orders could not be loaded." error={ordersQuery.error} onRetry={() => void ordersQuery.refetch()} />
          ) : null}
          {!ordersQuery.isLoading && !ordersQuery.isError && activeOrders.length === 0 ? (
            <EmptyState title="No active orders" body="Orders placed from your cart will appear here." icon="package" />
          ) : null}
          {latestActiveOrders.map(order => {
            const id = first(order, ['id']);
            return (
              <Pressable
                key={id || displayOrderNumber(order)}
                testID={`buyer-home-order-${id}`}
                accessibilityRole="button"
                onPress={() => id && router.push(`/buyer-order/${id}`)}
              >
                <Card style={{ padding: 14, marginBottom: 9, borderRadius: colors.radius + 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.foreground, fontWeight: '700' }}>{displayOrderNumber(order)}</Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 4 }}>
                        {first(order, ['destination_port', 'destination'], 'Destination pending')}
                      </Text>
                    </View>
                    <Status value={first(order, ['status'], 'Pending')} />
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <Card testID="buyer-home-support-card" style={{ marginTop: 20, marginBottom: 16, borderRadius: colors.radius + 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 13 }}>
          <View style={[styles.supportMethodIcon, { backgroundColor: colors.lightGreen }]}>
            <Feather name="headphones" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800' }}>Contact Support</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: 3 }}>
              Chat with OG Exports Support
            </Text>
          </View>
        </View>

        <Pressable
          testID="buyer-home-email-support"
          accessibilityRole="button"
          accessibilityLabel={`Email support at ${supportEmail}`}
          onPress={() => void openSupportEmail()}
          style={({ pressed }) => [
            styles.supportMethod,
            { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.82 : 1 },
          ]}
        >
          <View style={[styles.supportMethodIcon, { backgroundColor: colors.glassTintTeal }]}>
            <Feather name="mail" size={17} color={colors.primary} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: '700' }}>Email support</Text>
            <Text numberOfLines={1} style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 3 }}>{supportEmail}</Text>
          </View>
          <Feather name="arrow-up-right" size={16} color={colors.accent} />
        </Pressable>

        <Pressable
          testID="buyer-home-whatsapp-support"
          accessibilityRole="button"
          accessibilityLabel="WhatsApp support"
          onPress={() => void openWhatsAppSupport()}
          style={({ pressed }) => [
            styles.supportMethod,
            { marginTop: 8, borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.82 : 1 },
          ]}
        >
          <View style={[styles.supportMethodIcon, { backgroundColor: colors.statusSuccessBackground }]}>
            <Feather name="message-circle" size={17} color={colors.statusSuccess} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: '700' }}>WhatsApp support</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 3 }}>+92 303 256 9000</Text>
          </View>
          <Feather name="arrow-up-right" size={16} color={colors.accent} />
        </Pressable>
      </Card>
    </Screen>
  );
}
