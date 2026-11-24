import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, FlatList, Linking, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGetPublicInvestorAppSettings, getGetPublicInvestorAppSettingsQueryKey, useGetInvestorAdminConversation, useGetInvestorConversationMessages, useSendInvestorConversationMessage, useGetInvestorSupportTickets, useCreateInvestorSupportTicket } from '@workspace/api-client-react';
import { Action, Card, EmptyState, ErrorState, Field, Screen, Section, Status, SuccessFeedback } from '@/components/InvestorUI';
import { first, list, messageOf, record, unwrap } from '@/lib/data';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { MOTION, MotionReveal, motionHaptic, useMotion } from '@/lib/motion';
import { GlassLayers } from '@/components/GlassSurface';
import { hasBuyerAccount } from '@/lib/account-role';
import { BuyerSupportChatExperience } from '@/components/BuyerSupportChatExperience';

type SupportMode = 'help' | 'chat' | 'tickets';

const helpTopics = [
  {
    title: 'Investing',
    description: 'Browse current opportunities and review investment details.',
    icon: 'trending-up',
    href: '/(tabs)/opportunities',
  },
  {
    title: 'Trade Tracking',
    description: 'Open your portfolio to view investments and available shipment tracking.',
    icon: 'truck',
    href: '/(tabs)/portfolio',
  },
  {
    title: 'Wallet',
    description: 'Review wallet activity, deposits, and withdrawal options.',
    icon: 'credit-card',
    href: '/(tabs)/wallet',
  },
  {
    title: 'KYC',
    description: 'Check identity verification and any document requests.',
    icon: 'shield',
    href: '/account/kyc',
  },
  {
    title: 'Withdrawals',
    description: 'Review payout requirements and follow withdrawal status.',
    icon: 'corner-up-right',
    href: '/wallet/withdraw',
  },
  {
    title: 'Account',
    description: 'Manage profile details, security, and account preferences.',
    icon: 'user',
    href: '/account/profile',
  },
] as const;

const buyerHelpTopics = [
  {
    title: 'Products',
    description: 'Browse the current OG Exports product catalogue.',
    icon: 'package',
    href: '/(buyer-tabs)/buyer-products',
  },
  {
    title: 'Orders & quotes',
    description: 'Review your order and quotation updates.',
    icon: 'clipboard',
    href: '/buyer-orders',
  },
  {
    title: 'Cart',
    description: 'Review products saved for your next order.',
    icon: 'shopping-cart',
    href: '/buyer-cart',
  },
  {
    title: 'Buyer account',
    description: 'View your buyer profile and account details.',
    icon: 'user',
    href: '/(buyer-tabs)/buyer-profile',
  },
] as const;

const ticketStatusSteps = ['Open', 'In Progress', 'Resolved'] as const;

function ChatBubbleReveal({
  id,
  seenIds,
  children,
}: {
  id: string;
  seenIds: React.MutableRefObject<Set<string>>;
  children: React.ReactNode;
}) {
  const { reduceMotion } = useMotion();
  const firstReveal = !seenIds.current.has(id);
  const opacity = useRef(new Animated.Value(firstReveal && !reduceMotion ? 0 : 1)).current;
  const offset = useRef(new Animated.Value(firstReveal && !reduceMotion ? MOTION.revealY : 0)).current;

  useEffect(() => {
    const shouldReveal = !seenIds.current.has(id);
    seenIds.current.add(id);
    if (!shouldReveal || reduceMotion) {
      opacity.setValue(1);
      offset.setValue(0);
      return;
    }
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: MOTION.component,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(offset, {
        toValue: 0,
        duration: MOTION.component,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [id, offset, opacity, reduceMotion, seenIds]);

  return <Animated.View style={{ opacity, transform: [{ translateY: offset }] }}>{children}</Animated.View>;
}

function normalizedTicketStatus(value: string) {
  const normalized = value.toLowerCase().replace(/[_-]+/g, ' ').trim();
  if (normalized === 'pending' || normalized === 'answered') return 'In Progress';
  return ticketStatusSteps.find(status => status.toLowerCase() === normalized) ?? '';
}

function chatTimestamp(value: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function TicketStatusProgress({ status }: { status: string }) {
  const colors = useColors();
  const current = ticketStatusSteps.indexOf(normalizedTicketStatus(status) as typeof ticketStatusSteps[number]);
  if (current < 0) return <Status value={status || '—'} />;

  return (
    <View accessibilityLabel={`Ticket status: ${ticketStatusSteps[current]}`} style={{ flexDirection: 'row', gap: 5, marginTop: 13 }}>
      {ticketStatusSteps.map((step, index) => {
        const reached = index <= current;
        return <View key={step} style={{ flex: 1 }}>
          <View style={{ height: 4, borderRadius: 3, backgroundColor: reached ? colors.primary : colors.border }} />
          <Text style={{ color: reached ? colors.primary : colors.mutedForeground, fontSize: 10, fontWeight: reached ? '700' : '400', marginTop: 5 }}>{step}</Text>
        </View>;
      })}
    </View>
  );
}

export default function Messages() {
  const { user } = useAuth();
  if (hasBuyerAccount(user)) {
    return <Redirect href="/(buyer-tabs)/buyer-messages" />;
  }
  return <SupportMessages />;
}

export function SupportMessages({
  buyerMode = false,
  onBack,
}: {
  buyerMode?: boolean;
  onBack?: () => void;
}) {
  const params = useLocalSearchParams<{ mode?: string; subject?: string; body?: string }>();
  const { token, user } = useAuth();
  const investorId = first(record(user), ['id'], '');
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const chatBottomClearance = !buyerMode && Platform.OS === 'android'
    ? Math.max(70 + Math.max(insets.bottom - 4, 8) + 12 - insets.bottom, 0)
    : 0;
  const [mode, setMode] = useState<SupportMode>(buyerMode ? 'chat' : 'help');
  const [supportMenuOpen, setSupportMenuOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [ticketBody, setTicketBody] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [chatSentVisible, setChatSentVisible] = useState(false);
  const [chatSentCount, setChatSentCount] = useState(0);
  const [ticketFeedbackVisible, setTicketFeedbackVisible] = useState(false);
  const animatedChatMessageIds = useRef(new Set<string>());

  useEffect(() => {
    if (params.mode !== 'tickets') return;
    setMode('tickets');
    if (typeof params.subject === 'string') setSubject(params.subject);
    if (typeof params.body === 'string') setTicketBody(params.body);
  }, [params.mode, params.subject, params.body]);

  useEffect(() => {
    if (buyerMode && params.mode !== 'tickets') setMode('chat');
  }, [buyerMode, params.mode]);

  const settingsQuery = useGetPublicInvestorAppSettings({
    query: { queryKey: getGetPublicInvestorAppSettingsQueryKey(), staleTime: 300_000 },
  });
  const platformSettings = unwrap(settingsQuery.data);
  const supportEmail = first(platformSettings, ['support_email', 'supportEmail'], 'support@ogexports.co');
  const visibleHelpTopics = buyerMode ? buyerHelpTopics : helpTopics;

  const conversationQuery = useGetInvestorAdminConversation({
    query: { queryKey: ['investor-admin-conversation'], enabled: !!token && mode === 'chat' },
  });
  const conversationResponse = unwrap(conversationQuery.data);
  const conversation = record(conversationResponse.conversation);
  const conversationId = first(
    conversation,
    ['id', 'conversation_id'],
    first(conversationResponse, ['id', 'conversation_id'], ''),
  );
  const messagesQuery = useGetInvestorConversationMessages(conversationId, {
    query: {
      queryKey: ['investor-conversation-messages', conversationId],
      enabled: Boolean(token && conversationId && mode === 'chat'),
      refetchInterval: mode === 'chat' && conversationId ? 5_000 : false,
      refetchIntervalInBackground: false,
    },
  });
  const send = useSendInvestorConversationMessage();
  const ticketsQuery = useGetInvestorSupportTickets({
    query: { queryKey: ['investor-support-tickets'], enabled: !!token && mode === 'tickets' },
  });
  const createTicket = useCreateInvestorSupportTicket();
  const messages = list(messagesQuery.data);
  const tickets = list(ticketsQuery.data);
  const chatMessages = [...messages].sort((left, right) => {
    const leftTime = Date.parse(first(left, ['created_at', 'date'], ''));
    const rightTime = Date.parse(first(right, ['created_at', 'date'], ''));
    return Number.isFinite(leftTime) && Number.isFinite(rightTime) ? rightTime - leftTime : 0;
  });

  useEffect(() => {
    if (!chatSentVisible) return;
    const timeout = setTimeout(() => setChatSentVisible(false), 2400);
    return () => clearTimeout(timeout);
  }, [chatSentVisible, chatSentCount]);

  async function sendMessage() {
    setError('');
    setNotice('');
    if (!conversationId || !message.trim()) return;
    try {
      await send.mutateAsync({ conversation: conversationId, data: { body: message.trim() } });
      motionHaptic('success');
      setMessage('');
      setChatSentCount(count => count + 1);
      setChatSentVisible(true);
      void messagesQuery.refetch();
    } catch (err) { motionHaptic('error'); setError(messageOf(err)); }
  }

  async function openTicket() {
    setError('');
    setNotice('');
    if (!subject.trim() || !ticketBody.trim()) {
      setError('Add a subject and describe your issue.');
      return;
    }
    try {
      await createTicket.mutateAsync({ data: { subject: subject.trim(), body: ticketBody.trim() } });
      setSubject('');
      setTicketBody('');
      setNotice('Your support ticket was sent. Its latest status will appear in ticket history.');
      setTicketFeedbackVisible(true);
      setMode('tickets');
      void ticketsQuery.refetch();
    } catch (err) { motionHaptic('error'); setError(messageOf(err)); }
  }

  async function emailSupport() {
    setError('');
    try {
      await Linking.openURL(`mailto:${supportEmail}`);
    } catch {
      setError(`Could not open an email app. Contact support at ${supportEmail}, or create a ticket.`);
    }
  }

  async function whatsappSupport() {
    setError('');
    try {
      await Linking.openURL('https://wa.me/923032569000');
    } catch {
      setError('Could not open WhatsApp. Contact support at +92 303 2569000, or create a ticket.');
    }
  }

  function selectSupportMode(nextMode: SupportMode) {
    motionHaptic('micro');
    setMode(nextMode);
    setError('');
    setNotice('');
    setSupportMenuOpen(false);
  }

  return <Screen
    title={buyerMode ? 'Buyer support' : 'Support'}
    subtitle="Help Center, live chat, and support tickets"
    scrollable={mode !== 'chat'}
    hideHeader={buyerMode}
    edgeToEdgeContent={buyerMode && mode === 'chat'}
  >
    {buyerMode ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14, marginHorizontal: mode === 'chat' ? 20 : 0 }}>
      {onBack ? <Pressable
        testID="buyer-support-back"
        accessibilityRole="button"
        accessibilityLabel="Back to previous page"
        onPress={onBack}
        hitSlop={8}
        style={({ pressed }) => ({
          width: 42,
          height: 42,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.secondary,
          opacity: pressed ? 0.72 : 1,
        })}
      >
        <Feather name="arrow-left" size={18} color={colors.primary} />
      </Pressable> : null}
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: '700' }}>Buyer support</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>
          {mode === 'chat' ? 'Messages with OG Exports support' : mode === 'help' ? 'Help Center' : 'Support tickets'}
        </Text>
      </View>
      <Pressable
        testID="buyer-support-mode-menu"
        accessibilityRole="button"
        accessibilityLabel="More support options"
        accessibilityState={{ expanded: supportMenuOpen }}
        onPress={() => setSupportMenuOpen(true)}
        hitSlop={8}
        style={({ pressed }) => ({
          width: 42,
          height: 42,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.glassBorder,
          backgroundColor: colors.glassFill,
          opacity: pressed ? 0.74 : 1,
        })}
      >
        <Feather name="more-vertical" size={19} color={colors.primary} />
      </Pressable>
    </View> : null}
    {!buyerMode ? <View accessibilityRole="tablist" style={{ flexDirection: 'row', gap: 7, marginBottom: 14 }}>
      {([
        ['help', 'Help Center'],
        ['chat', 'Live chat'],
        ['tickets', 'Tickets'],
      ] as const).map(([value, label]) => (
        <Pressable
          key={value}
          testID={`support-tab-${value}`}
          accessibilityRole="tab"
          accessibilityState={{ selected: mode === value }}
          onPress={() => selectSupportMode(value)}
          style={{ flex: 1, alignItems: 'center', borderRadius: 18, paddingHorizontal: 8, paddingVertical: 10, backgroundColor: mode === value ? colors.primary : colors.secondary }}
        >
          <Text style={{ color: mode === value ? colors.primaryForeground : colors.foreground, fontWeight: '700', fontSize: 11 }}>{label}</Text>
        </Pressable>
      ))}
    </View> : null}

    {error ? <ErrorState message={error} /> : null}
    {notice ? <Card><Text style={{ color: colors.primary, lineHeight: 20 }}>{notice}</Text></Card> : null}

    {mode === 'help' ? <>
      <Card>
        <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 15 }}>How can we help?</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18, marginTop: 5 }}>
          {buyerMode
            ? 'Choose a topic to return to the right area of your buyer account.'
            : 'Choose a topic to open the related area in your investor account.'}
        </Text>
      </Card>
      {visibleHelpTopics.map(topic => (
        <Pressable
          key={topic.title}
          testID={`support-topic-${topic.title.toLowerCase().replace(/\s+/g, '-')}`}
          accessibilityRole="button"
          onPress={() => router.push(topic.href as never)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            padding: 15,
            marginBottom: 9,
            borderRadius: 18,
            backgroundColor: colors.glassFill,
            borderWidth: 1,
            borderColor: colors.glassBorder,
            overflow: 'hidden',
            opacity: pressed ? 0.78 : 1,
          })}
        >
          <GlassLayers />
          <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: colors.lightGreen, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name={topic.icon} size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.foreground, fontWeight: '700' }}>{topic.title}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 16, marginTop: 3 }}>{topic.description}</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </Pressable>
      ))}
      <Section title="Email support" />
      <Card>
        <Text style={{ color: colors.foreground, fontWeight: '700' }}>Prefer email?</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 12 }}>
          {supportEmail}
          {settingsQuery.isError ? ' · Showing the published default support address.' : ''}
        </Text>
        <Action title="Email support" icon="mail" onPress={() => void emailSupport()} />
      </Card>
      <Section title="WhatsApp support" />
      <Card testID="support-whatsapp-card">
        <Text style={{ color: colors.foreground, fontWeight: '700' }}>Chat with OG Exports Support</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 12 }}>
          +92 303 2569000
        </Text>
        <Action
          title="Open WhatsApp"
          icon="message-circle"
          testID="support-whatsapp-button"
          onPress={() => void whatsappSupport()}
        />
      </Card>
    </> : null}

    {mode === 'chat' ? <>
      <KeyboardAvoidingView
        style={{ flex: 1, paddingBottom: chatBottomClearance }}
        behavior="padding"
        keyboardVerticalOffset={0}
        automaticOffset
        enabled={!buyerMode}
      >
        {buyerMode ? <>
          {conversationQuery.isLoading ? <Card><Text style={{ color: colors.mutedForeground }}>Opening your support conversation…</Text></Card> : null}
          {conversationQuery.isError ? <ErrorState message="Your support conversation could not be opened." error={conversationQuery.error} onRetry={() => void conversationQuery.refetch()} /> : null}
          {!conversationQuery.isLoading && !conversationQuery.isError && !conversationId ? <EmptyState title="Conversation unavailable" body="Use a support ticket or email instead. The support conversation could not be opened." /> : null}
          {conversationId ? <View style={{ flex: 1 }}>
            <BuyerSupportChatExperience
              conversationId={conversationId}
              messages={messages}
              loading={messagesQuery.isLoading}
              error={messagesQuery.isError ? 'Messages could not be loaded.' : null}
              onRetry={() => void messagesQuery.refetch()}
              onSent={() => void messagesQuery.refetch()}
            />
          </View> : null}
        </> : <>
        <Card>
          <Text style={{ color: colors.foreground, fontWeight: '700' }}>Investor support conversation</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 17, marginTop: 4 }}>
            Replies refresh automatically while this screen is open.
          </Text>
        </Card>
        {conversationQuery.isLoading ? <Card><Text style={{ color: colors.mutedForeground }}>Opening your support conversation…</Text></Card> : null}
        {conversationQuery.isError ? <ErrorState message="Your support conversation could not be opened." error={conversationQuery.error} onRetry={() => void conversationQuery.refetch()} /> : null}
        {!conversationQuery.isLoading && !conversationQuery.isError && !conversationId ? <EmptyState title="Conversation unavailable" body="Use a support ticket or email instead. The support conversation could not be opened." /> : null}
        {messagesQuery.isError ? <ErrorState message="Messages could not be loaded." error={messagesQuery.error} onRetry={() => void messagesQuery.refetch()} /> : null}
        {conversationId ? <FlatList
          testID="support-chat-messages"
          data={chatMessages}
          inverted={chatMessages.length > 0}
          keyExtractor={(item, index) => first(item, ['id'], String(index))}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingVertical: 6 }}
          ListEmptyComponent={
            messagesQuery.isLoading
              ? <Card><Text style={{ color: colors.mutedForeground }}>Loading messages…</Text></Card>
              : messagesQuery.isError
                ? undefined
                : <EmptyState title="Start a conversation" body={`Send a message to ${buyerMode ? 'buyer' : 'investor'} support. Replies will appear here.`} />
          }
          renderItem={({ item, index }) => {
            const sender = record(item.sender);
            const senderId = first(item, ['sender_id'], first(sender, ['id'], ''));
            const senderRole = first(sender, ['role', 'type'], first(item, ['sender_type', 'role'], ''));
            const own = (investorId !== '' && senderId === investorId) || /investor|user/i.test(senderRole);
            const messageId = first(item, ['id'], first(item, ['created_at', 'date'], String(index)));
            const createdAt = first(item, ['created_at', 'date'], '');
            return <ChatBubbleReveal key={messageId} id={messageId} seenIds={animatedChatMessageIds}>
              <Card style={{ backgroundColor: own ? colors.secondary : colors.card, alignSelf: own ? 'flex-end' : 'flex-start', width: '88%', borderRadius: 18 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: '700', marginBottom: 5 }}>
                {own ? 'You' : 'OG Exports Support'}
              </Text>
              <Text style={{ color: colors.foreground, lineHeight: 20 }}>{first(item, ['message', 'body', 'content'], '')}</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 7 }}>{chatTimestamp(createdAt)}</Text>
              </Card>
            </ChatBubbleReveal>;
          }}
        /> : null}
        {conversationId ? <View style={{ paddingBottom: insets.bottom }}>
          {chatSentVisible ? <MotionReveal key={chatSentCount}>
            <View accessibilityLiveRegion="polite" testID="chat-message-sent" style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 6, marginBottom: 7, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: colors.lightGreen }}>
              <Feather name="check" size={13} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>Sent to support</Text>
            </View>
          </MotionReveal> : null}
          <Card style={{ marginBottom: 0 }}>
            <Field label="Message" value={message} onChangeText={setMessage} placeholder={`Write to ${buyerMode ? 'buyer' : 'investor'} support…`} multiline />
            <Action title="Send message" icon="send" loading={send.isPending} disabled={!message.trim()} onPress={() => void sendMessage()} />
          </Card>
        </View> : null}
        </>}
      </KeyboardAvoidingView>
    </> : null}

    {mode === 'tickets' ? <>
      <Section title="Create a support ticket" />
      <Card>
        <Field label="Subject" value={subject} onChangeText={setSubject} placeholder="What do you need help with?" />
        <Field label="Details" value={ticketBody} onChangeText={setTicketBody} placeholder="Describe the issue" multiline />
        <Action title="Submit support ticket" icon="help-circle" loading={createTicket.isPending} disabled={!subject.trim() || !ticketBody.trim()} onPress={() => void openTicket()} />
      </Card>
      <Section title="Ticket history" />
      {ticketsQuery.isLoading ? <Card><Text style={{ color: colors.mutedForeground }}>Loading ticket history…</Text></Card> : null}
      {ticketsQuery.isError ? <ErrorState message="Support tickets could not be loaded." error={ticketsQuery.error} onRetry={() => void ticketsQuery.refetch()} /> : null}
      {tickets.length === 0 && !ticketsQuery.isLoading && !ticketsQuery.isError ? <EmptyState title="No tickets yet" body="Tickets you create will appear here with their latest status." /> : null}
      {tickets.map((item, index) => {
        const status = first(item, ['status'], '');
        return <MotionReveal key={first(item, ['id'], String(index))} delay={Math.min(index * MOTION.revealStagger, MOTION.staggerCap)}>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <Text style={{ color: colors.foreground, fontWeight: '700', flex: 1 }}>{first(item, ['subject', 'title'], 'Support ticket')}</Text>
            <Status value={normalizedTicketStatus(status) || status || '—'} />
          </View>
          <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 6 }}>
            {first(item, ['created_at', 'date'], '—')}
          </Text>
          {normalizedTicketStatus(status)
            ? <TicketStatusProgress status={status} />
            : null}
        </Card>
        </MotionReveal>;
      })}
    </> : null}

    <SuccessFeedback
      visible={ticketFeedbackVisible}
      title="Support ticket submitted"
      body="Your ticket was received. Its latest status will appear in ticket history."
      onDismiss={() => setTicketFeedbackVisible(false)}
      testID="support-ticket-success-feedback"
    />
    {buyerMode ? (
      <Modal
        visible={supportMenuOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSupportMenuOpen(false)}
      >
        <View style={StyleSheet.absoluteFill}>
          <Pressable
            testID="buyer-support-menu-backdrop"
            accessibilityRole="button"
            accessibilityLabel="Close support options"
            onPress={() => setSupportMenuOpen(false)}
            style={[StyleSheet.absoluteFill, styles.supportMenuBackdrop]}
          />
          <View
            testID="buyer-support-mode-popover"
            accessibilityRole="menu"
            style={[
              styles.supportPopover,
              {
                top: insets.top + 60,
                backgroundColor: colors.glassFill,
                borderColor: colors.glassBorder,
              },
            ]}
          >
            <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: '800', letterSpacing: 1, paddingHorizontal: 9, paddingTop: 4, paddingBottom: 8 }}>
              SUPPORT OPTIONS
            </Text>
            {([
              ['chat', 'Live chat', 'Message our support team', 'message-circle'],
              ['help', 'Help Center', 'Guides and account help', 'help-circle'],
              ['tickets', 'Tickets', 'Requests and status updates', 'file-text'],
            ] as const).map(([value, label, description, icon]) => {
              const active = mode === value;
              return (
                <Pressable
                  key={value}
                  testID={`support-tab-${value}`}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected: active }}
                  onPress={() => selectSupportMode(value)}
                  style={({ pressed }) => [
                    styles.supportMenuItem,
                    {
                      backgroundColor: active ? colors.lightGreen : 'transparent',
                      opacity: pressed ? 0.74 : 1,
                    },
                  ]}
                >
                  <View style={[styles.supportMenuIcon, { backgroundColor: active ? colors.card : colors.secondary }]}>
                    <Feather name={icon} size={16} color={colors.primary} />
                  </View>
                  <View style={styles.supportMenuCopy}>
                    <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700' }}>{label}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 2 }}>{description}</Text>
                  </View>
                  {active ? <Feather name="check" size={16} color={colors.primary} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    ) : null}
  </Screen>;
}

const styles = StyleSheet.create({
  supportMenuBackdrop: { backgroundColor: 'rgba(8, 22, 19, 0.12)' },
  supportPopover: {
    position: 'absolute',
    right: 14,
    width: 276,
    padding: 9,
    borderRadius: 21,
    borderWidth: 1,
    shadowColor: '#102923',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.17,
    shadowRadius: 22,
    elevation: 14,
  },
  supportMenuItem: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 15,
  },
  supportMenuIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  supportMenuCopy: { flex: 1, minWidth: 0 },
});
