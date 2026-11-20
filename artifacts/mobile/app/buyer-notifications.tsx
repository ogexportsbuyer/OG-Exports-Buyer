import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
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

  if (!token) {
    return <BuyerAuthGate title="Notifications" body="Sign in to view updates about your buyer account and trade activity." returnTo="/buyer-notifications" />;
  }

  return (
    <Screen
      title="Notifications"
      subtitle="Important updates for your buyer account"
      refreshable
      action={notifications.length ? (
        <Pressable accessibilityRole="button" disabled={markAll.isPending} onPress={() => void markAllRead()} style={{ minHeight: 36, justifyContent: 'center', paddingHorizontal: 5 }}>
          <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>{markAll.isPending ? 'Saving…' : 'Mark all read'}</Text>
        </Pressable>
      ) : null}
    >
      {query.isLoading ? <LoadingCard label="Loading notifications…" lines={3} /> : null}
      {query.isError ? <ErrorState message="Notifications could not be loaded." error={query.error} onRetry={() => void query.refetch()} /> : null}
      {actionError ? <Text accessibilityRole="alert" style={{ color: colors.destructive, fontSize: 12, marginBottom: 10 }}>{actionError}</Text> : null}
      {query.isSuccess && notifications.length === 0 ? <EmptyState title="You’re all caught up" body="New account and trade updates will appear here." icon="bell" /> : null}
      {notifications.map((item, index) => {
        const id = first(item, ['id'], String(index));
        const unread = !item.read_at && !item.is_read && !item.read;
        return (
          <Pressable key={id} accessibilityRole="button" onPress={() => void markRead(id)}>
            <Card style={{ padding: 14, marginBottom: 9, borderColor: unread ? colors.accent : colors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 11 }}>
                <View style={{ width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: unread ? colors.lightGreen : colors.secondary }}>
                  <Feather name={unread ? 'bell' : 'check'} size={15} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: unread ? '800' : '600' }}>
                    {first(item, ['title', 'subject'], 'Account update')}
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18, marginTop: 5 }}>
                    {first(item, ['message', 'body', 'description'], 'Open the app to review this update.')}
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 8 }}>
                    {first(item, ['created_at', 'sent_at'], '')}
                  </Text>
                </View>
                {unread ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent, marginTop: 5 }} /> : null}
              </View>
            </Card>
          </Pressable>
        );
      })}
    </Screen>
  );
}
