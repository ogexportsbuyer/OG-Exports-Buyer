import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetSharedNotificationsQueryKey,
  getGetSharedUnreadNotificationCountQueryKey,
  useGetSharedNotifications,
  useMarkAllSharedNotificationsRead,
  useMarkSharedNotificationRead,
} from '@workspace/api-client-react';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { Card, EmptyState, ErrorState, LoadingCard, Screen } from '@/components/InvestorUI';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { first, list, messageOf, record } from '@/lib/data';
import { notificationHref } from '@/lib/notification-routing';
import { BUYER_NOTIFICATION_CATEGORIES, notificationCategory, notificationCategoryLabel, type NotificationCategoryFilter } from '@/lib/notification-categories';
import { formatNotificationTimestamp, isInvestorNotificationUnread } from '@/lib/notification-utils';
import { goBackOrReplace } from '@/lib/safe-navigation';

export default function BuyerNotifications() {
  const colors = useColors();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState('');
  const query = useGetSharedNotifications({
    query: { queryKey: getGetSharedNotificationsQueryKey(), enabled: !!token, staleTime: 20_000, refetchOnMount: 'always' },
  });
  const markAll = useMarkAllSharedNotificationsRead();
  const markOne = useMarkSharedNotificationRead();
  const notifications = list(record(query.data).data);
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategoryFilter>('All');
  const unreadCount = notifications.filter(isInvestorNotificationUnread).length;
  const visibleNotifications = selectedCategory === 'All'
    ? notifications
    : notifications.filter(item => notificationCategoryLabel(notificationCategory(item)) === selectedCategory);

  useFocusEffect(useCallback(() => {
    if (token) void query.refetch();
  }, [query.refetch, token]));

  async function markAllRead() {
    setActionError('');
    try {
      await markAll.mutateAsync(undefined);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetSharedNotificationsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetSharedUnreadNotificationCountQueryKey() }),
      ]);
    } catch (error) {
      setActionError(messageOf(error));
    }
  }

  async function markRead(id: string) {
    if (!/^\d+$/.test(id)) return;
    setActionError('');
    try {
      await markOne.mutateAsync({ id: Number(id) });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetSharedNotificationsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetSharedUnreadNotificationCountQueryKey() }),
      ]);
    } catch (error) {
      setActionError(messageOf(error));
    }
  }

  function openNotification(item: Record<string, unknown>, id: string) {
    if (isInvestorNotificationUnread(item) && /^\d+$/.test(id)) void markRead(id);
    const target = notificationHref(item);
    if (target) router.push(target);
  }

  if (!token) {
    return <BuyerAuthGate title="Notifications" body="Sign in to view updates about your buyer account and trade activity." returnTo="/buyer-notifications" />;
  }

  return (
    <Screen
      title="Notifications"
      subtitle="Important updates for your buyer account"
      refreshable
      action={(
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable testID="buyer-notifications-back" accessibilityRole="button" accessibilityLabel="Back to home" onPress={() => goBackOrReplace('/(buyer-tabs)/buyer-home')} style={{ minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 3 }}>
            <Feather name="arrow-left" size={14} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>Back</Text>
          </Pressable>
          {unreadCount ? (
            <Pressable testID="buyer-notifications-mark-all" accessibilityRole="button" disabled={markAll.isPending} onPress={() => void markAllRead()} style={{ minHeight: 36, justifyContent: 'center', paddingHorizontal: 5 }}>
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>{markAll.isPending ? 'Saving…' : 'Mark all read'}</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    >
      {query.isLoading ? <LoadingCard label="Loading notifications…" lines={3} /> : null}
      {query.isError ? <ErrorState message="Notifications could not be loaded." error={query.error} onRetry={() => void query.refetch()} /> : null}
      {actionError ? <Text accessibilityRole="alert" style={{ color: colors.destructive, fontSize: 12, marginBottom: 10 }}>{actionError}</Text> : null}
      {query.isSuccess && notifications.length === 0 ? <EmptyState title="You’re all caught up" body="New account and trade updates will appear here." icon="bell" /> : null}
      {notifications.length > 0 ? (
        <>
          <View style={{ flexDirection: 'row', gap: 9, marginBottom: 12 }}>
            <Card testID="buyer-notification-total" style={{ flex: 1, padding: 12, marginBottom: 0 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>Total updates</Text>
              <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: '800', marginTop: 3 }}>{notifications.length}</Text>
            </Card>
            <Card testID="buyer-notification-unread" style={{ flex: 1, padding: 12, marginBottom: 0, borderColor: unreadCount ? colors.accent : colors.border }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>Unread</Text>
              <Text style={{ color: unreadCount ? colors.primary : colors.foreground, fontSize: 20, fontWeight: '800', marginTop: 3 }}>{unreadCount}</Text>
            </Card>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 13 }}>
            {(['All', ...BUYER_NOTIFICATION_CATEGORIES.map(category => category.label)] as NotificationCategoryFilter[]).map(category => {
              const selected = selectedCategory === category;
              return (
                <Pressable
                  key={category}
                  testID={`buyer-notification-filter-${category.toLowerCase()}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setSelectedCategory(category)}
                  style={{ minHeight: 32, borderRadius: 18, paddingHorizontal: 11, justifyContent: 'center', borderWidth: 1, borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.secondary : colors.card }}
                >
                  <Text style={{ color: selected ? colors.primary : colors.mutedForeground, fontSize: 10, fontWeight: selected ? '800' : '600' }}>{category}</Text>
                </Pressable>
              );
            })}
          </View>
          {visibleNotifications.length === 0 ? <EmptyState title={`No ${selectedCategory} updates`} body="Updates in this category will appear here when available." icon="bell" /> : null}
        </>
      ) : null}
      {visibleNotifications.map((item, index) => {
        const id = first(item, ['id'], String(index));
        const unread = isInvestorNotificationUnread(item);
        const category = notificationCategory(item);
        const categoryInfo = BUYER_NOTIFICATION_CATEGORIES.find(value => value.key === category);
        const createdAt = formatNotificationTimestamp(first(item, ['created_at', 'sent_at'], ''));
        return (
          <Pressable key={id} testID={`buyer-notification-${id}`} accessibilityRole="button" onPress={() => openNotification(item, id)}>
            <Card style={{ padding: 14, marginBottom: 9, borderColor: unread ? colors.accent : colors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 11 }}>
                <View style={{ width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: unread ? colors.lightGreen : colors.secondary }}>
                  <Feather name={categoryInfo?.icon ?? (unread ? 'bell' : 'check')} size={15} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: unread ? '800' : '600', flex: 1 }}>
                      {first(item, ['title', 'subject'], 'Account update')}
                    </Text>
                    <View style={{ borderRadius: 10, backgroundColor: colors.secondary, paddingHorizontal: 7, paddingVertical: 3 }}>
                      <Text style={{ color: colors.primary, fontSize: 9, fontWeight: '700' }}>{notificationCategoryLabel(category)}</Text>
                    </View>
                  </View>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18, marginTop: 5 }}>
                    {first(item, ['message', 'body', 'description'], 'Open the app to review this update.')}
                  </Text>
                  {createdAt ? <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 8 }}>{createdAt}</Text> : null}
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} style={{ marginTop: 2 }} />
              </View>
            </Card>
          </Pressable>
        );
      })}
    </Screen>
  );
}
