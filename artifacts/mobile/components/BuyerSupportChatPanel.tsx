import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LocalizedText as Text, LocalizedTextInput as TextInput } from '@/components/LocalizedText';
import { useColors } from '@/hooks/useColors';
import { MAX_BUYER_CHAT_ATTACHMENTS } from '@/lib/upload-rules';

export type BuyerSupportMessage = {
  id: string;
  own: boolean;
  senderLabel: string;
  body: string;
  createdAt: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentMime?: string;
  attachmentKind?: 'image' | 'video' | 'audio' | 'file';
  durationSeconds?: number;
};

export type BuyerSupportPendingMedia = {
  id: string;
  uri: string;
  name: string;
  mimeType: string;
  kind: 'image' | 'video' | 'audio';
  durationSeconds?: number;
};

export type BuyerSupportChatPanelProps = {
  messages: BuyerSupportMessage[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  sendDisabled: boolean;
  sending: boolean;
  pendingMedia: BuyerSupportPendingMedia[];
  onRemovePending: (mediaId: string) => void;
  onPickMedia: () => void;
  recording: boolean;
  recordingSeconds: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlayAudio: (url: string) => void;
  onOpenMedia: (url: string) => void;
  playingAudioUrl: string | null;
  audioPlaying: boolean;
  audioProgress: number;
  sendProgressLabel?: string;
};

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatDuration(seconds?: number) {
  if (seconds == null || !Number.isFinite(seconds)) return 'Voice message';
  const safeSeconds = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, '0')}`;
}

const voiceWaveform = [6, 11, 8, 15, 9, 17, 7, 12, 18, 9, 14, 6, 16, 10, 13, 7, 17, 9, 12, 6];

export function BuyerSupportChatPanel({
  messages,
  loading,
  error,
  onRetry,
  draft,
  onDraftChange,
  onSend,
  sendDisabled,
  sending,
  onRemovePending,
  onPickMedia,
  recording,
  recordingSeconds,
  onStartRecording,
  onStopRecording,
  onPlayAudio,
  onOpenMedia,
  playingAudioUrl,
  audioPlaying,
  audioProgress,
  sendProgressLabel,
  pendingMedia: pendingMediaValue,
}: BuyerSupportChatPanelProps) {
  const colors = useColors();
  const listRef = useRef<FlatList<BuyerSupportMessage>>(null);
  const pendingMedia = Array.isArray(pendingMediaValue) ? pendingMediaValue : [];
  const { width: screenWidth } = useWindowDimensions();
  const pendingCardWidth = pendingMedia.length > 1
    ? Math.max(200, Math.min(260, screenWidth - 148))
    : Math.max(230, screenWidth - 68);

  useEffect(() => {
    const frame = requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: false }));
    return () => cancelAnimationFrame(frame);
  }, [messages.length]);

  const renderMessage = ({ item }: { item: BuyerSupportMessage }) => {
    const own = item.own;
    const isActive = Boolean(item.attachmentUrl && playingAudioUrl === item.attachmentUrl);
    const isPlaying = isActive && audioPlaying;
    const bubbleColor = own ? colors.lightGreen : colors.card;
    return (
      <View style={[styles.messageRow, { justifyContent: own ? 'flex-end' : 'flex-start' }]}>
        <View style={[
          styles.bubble,
          {
            backgroundColor: bubbleColor,
            borderColor: colors.border,
            borderBottomRightRadius: own ? 6 : 18,
            borderBottomLeftRadius: own ? 18 : 6,
          },
        ]}>
          <View style={styles.messageMeta}>
            <Text style={[styles.sender, { color: own ? colors.primary : colors.mutedForeground }]}>
              {item.senderLabel}
            </Text>
            <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>{formatTime(item.createdAt)}</Text>
          </View>
          {item.body ? <Text style={[styles.messageBody, { color: colors.foreground }]}>{item.body}</Text> : null}
          {item.attachmentUrl && item.attachmentKind === 'image' ? (
            <Pressable
              testID="buyer-chat-open-image"
              accessibilityRole="button"
              accessibilityLabel={item.attachmentName ? `Open image ${item.attachmentName}` : 'Open image attachment'}
              onPress={() => onOpenMedia(item.attachmentUrl!)}
              style={styles.imagePressable}
            >
              <Image source={{ uri: item.attachmentUrl }} style={styles.messageImage} resizeMode="cover" />
            </Pressable>
          ) : null}
          {item.attachmentUrl && item.attachmentKind === 'audio' ? (
            <Pressable
              testID="buyer-chat-play-sent-audio"
              accessibilityRole="button"
              accessibilityLabel={`${isPlaying ? 'Pause' : 'Play'} voice message`}
              onPress={() => onPlayAudio(item.attachmentUrl!)}
              style={[styles.audioMessage, { backgroundColor: own ? colors.card : colors.secondary }]}
            >
              <View style={[styles.audioPlay, { backgroundColor: colors.primary }]}>
                <Feather name={isPlaying ? 'pause' : 'play'} size={15} color={colors.primaryForeground} />
              </View>
              <View style={styles.audioDetails}>
                <Text style={[styles.audioTitle, { color: colors.foreground }]}>Voice message</Text>
                <View style={styles.messageWaveform} accessibilityLabel="Voice message playback progress">
                  {voiceWaveform.map((height, index) => {
                    const played = isActive && audioProgress >= (index + 1) / voiceWaveform.length;
                    return (
                      <View
                        key={index}
                        style={[
                          styles.waveformBar,
                          { height, backgroundColor: played ? colors.primary : colors.border, opacity: played ? 1 : 0.8 },
                        ]}
                      />
                    );
                  })}
                </View>
              </View>
              <Text style={[styles.audioDuration, { color: colors.mutedForeground }]}>
                {item.durationSeconds ? formatDuration(item.durationSeconds) : 'Voice note'}
              </Text>
            </Pressable>
          ) : null}
          {item.attachmentUrl && (item.attachmentKind === 'video' || item.attachmentKind === 'file') ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.attachmentKind === 'video' ? 'video' : 'file'} attachment`}
              onPress={() => onOpenMedia(item.attachmentUrl!)}
              style={[styles.fileMessage, { backgroundColor: own ? colors.card : colors.secondary, borderColor: colors.border }]}
            >
              <View style={[styles.fileIcon, { backgroundColor: colors.lightGreen }]}>
                <Feather name={item.attachmentKind === 'video' ? 'video' : 'file-text'} size={17} color={colors.primary} />
              </View>
              <View style={styles.fileCopy}>
                <Text numberOfLines={1} style={[styles.fileName, { color: colors.foreground }]}>
                  {item.attachmentName || (item.attachmentKind === 'video' ? 'Video attachment' : 'File attachment')}
                </Text>
                <Text style={[styles.fileHint, { color: colors.mutedForeground }]}>Tap to open</Text>
              </View>
              <Feather name="arrow-up-right" size={15} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container} testID="buyer-support-chat-panel">
      {error ? (
        <View style={[styles.errorBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.errorIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="alert-circle" size={16} color={colors.mutedForeground} />
          </View>
          <View style={styles.errorCopy}>
            <Text style={[styles.errorTitle, { color: colors.foreground }]}>Messages did not load</Text>
            <Text style={[styles.errorText, { color: colors.mutedForeground }]}>{error}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={onRetry} style={[styles.retryButton, { borderColor: colors.border }]}>
            <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.listContent, messages.length === 0 ? styles.emptyList : null]}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingState}>
              <View style={[styles.skeletonLine, { backgroundColor: colors.secondary, width: '48%' }]} />
              <View style={[styles.skeletonLine, { backgroundColor: colors.secondary, width: '72%' }]} />
              <View style={[styles.skeletonLine, { backgroundColor: colors.secondary, width: '57%' }]} />
              <Text style={[styles.loadingLabel, { color: colors.mutedForeground }]}>Loading your conversation</Text>
            </View>
          ) : error ? undefined : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyMark, { backgroundColor: colors.lightGreen }]}>
                <Feather name="message-circle" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>A direct line to our team</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Ask about a product, quote or order. Our support team will reply here.
              </Text>
            </View>
          )
        }
        style={styles.list}
      />

      {pendingMedia.length > 0 ? (
        <>
          {pendingMedia.length > 1 ? (
            <View style={styles.pendingHeader}>
              <Text style={[styles.pendingHeaderTitle, { color: colors.foreground }]}>Selected files</Text>
              <Text style={[styles.pendingHeaderCount, { color: colors.mutedForeground }]}>
                {pendingMedia.length} / {MAX_BUYER_CHAT_ATTACHMENTS}
              </Text>
            </View>
          ) : null}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.pendingList}
          >
            {pendingMedia.map((media) => {
              const previewPlaying = playingAudioUrl === media.uri && audioPlaying;
              return (
                <View
                  key={media.id}
                  style={[
                    styles.pendingCard,
                    { width: pendingCardWidth, backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  {media.kind === 'image' ? (
                    <Image source={{ uri: media.uri }} style={styles.pendingThumb} resizeMode="cover" />
                  ) : media.kind === 'video' ? (
                    <View style={[styles.pendingThumb, styles.pendingIcon, { backgroundColor: colors.primary }]}>
                      <Feather name="play" size={20} color={colors.primaryForeground} />
                    </View>
                  ) : (
                    <View style={[styles.pendingThumb, styles.pendingIcon, { backgroundColor: colors.lightGreen }]}>
                      <Feather name="mic" size={20} color={colors.primary} />
                    </View>
                  )}
                  <View style={styles.pendingCopy}>
                    <Text style={[styles.pendingEyebrow, { color: colors.primary }]}>READY TO SEND</Text>
                    <Text numberOfLines={1} style={[styles.pendingName, { color: colors.foreground }]}>
                      {media.kind === 'audio' ? 'Voice note' : media.name}
                    </Text>
                    {media.kind === 'audio' ? (
                      <View style={styles.voicePreviewRow}>
                        <Text style={[styles.pendingType, { color: colors.mutedForeground }]}>{formatDuration(media.durationSeconds)}</Text>
                        <View style={styles.waveform} accessibilityLabel="Voice note waveform preview">
                          {voiceWaveform.map((height, index) => (
                            <View key={index} style={[styles.waveformBar, { height, backgroundColor: colors.primary }]} />
                          ))}
                        </View>
                      </View>
                    ) : (
                      <Text style={[styles.pendingType, { color: colors.mutedForeground }]}>
                        {media.kind === 'video' ? 'Video attachment' : 'Image attachment'}
                      </Text>
                    )}
                  </View>
                  {media.kind === 'audio' ? (
                    <Pressable
                      testID={`buyer-chat-preview-audio-${media.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={previewPlaying ? 'Pause voice note preview' : 'Play voice note preview'}
                    disabled={sending}
                      onPress={() => onPlayAudio(media.uri)}
                    style={({ pressed }) => [styles.previewButton, { backgroundColor: colors.lightGreen, opacity: sending ? 0.5 : pressed ? 0.72 : 1 }]}
                    >
                      <Feather name={previewPlaying ? 'pause' : 'play'} size={14} color={colors.primary} />
                    </Pressable>
                  ) : null}
                  <Pressable
                    testID={`buyer-chat-remove-pending-${media.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${media.kind === 'audio' ? 'voice note' : media.kind} attachment`}
                    disabled={sending}
                    onPress={() => onRemovePending(media.id)}
                    hitSlop={6}
                    style={({ pressed }) => [styles.removeButton, { backgroundColor: colors.secondary, opacity: sending ? 0.5 : pressed ? 0.72 : 1 }]}
                  >
                    <Feather name="x" size={16} color={colors.mutedForeground} />
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
        </>
      ) : null}

      <View style={[styles.composer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.composerActions}>
          <Pressable
            testID="buyer-chat-attach"
            accessibilityRole="button"
            accessibilityLabel="Attach a photo, video or audio file"
            disabled={sending || recording}
            onPress={onPickMedia}
            style={({ pressed }) => [styles.utilityButton, { backgroundColor: colors.secondary, opacity: sending || recording ? 0.5 : pressed ? 0.72 : 1 }]}
          >
            <Feather name="paperclip" size={17} color={colors.primary} />
          </Pressable>
          <TextInput
            value={draft}
            onChangeText={onDraftChange}
            placeholder="Write a message to support"
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={4000}
            editable={!sending && !recording}
            accessibilityLabel="Message to OG Exports support"
            style={[
              styles.input,
              { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border },
            ]}
          />
          {recording ? (
            <Pressable
              testID="buyer-chat-stop-recording"
              accessibilityRole="button"
              accessibilityLabel="Stop voice recording"
              onPress={onStopRecording}
              style={[styles.recordButton, { backgroundColor: colors.destructive }]}
            >
              <Feather name="square" size={15} color={colors.destructiveForeground} />
            </Pressable>
          ) : draft.trim() || pendingMedia.length > 0 ? (
            <Pressable
              testID="buyer-chat-send"
              accessibilityRole="button"
              accessibilityLabel={sending ? 'Sending message' : 'Send message'}
              accessibilityState={{ disabled: sendDisabled || sending, busy: sending }}
              disabled={sendDisabled || sending}
              onPress={onSend}
              style={({ pressed }) => [
                styles.sendButton,
                { backgroundColor: colors.primary, opacity: sendDisabled || sending ? 0.45 : pressed ? 0.78 : 1 },
              ]}
            >
              {sending ? <ActivityIndicator size="small" color={colors.primaryForeground} /> : <Feather name="send" size={15} color={colors.primaryForeground} />}
              <Text style={[styles.sendLabel, { color: colors.primaryForeground }]}>{sending ? sendProgressLabel || 'Sending' : 'Send'}</Text>
            </Pressable>
          ) : (
            <Pressable
              testID="buyer-chat-start-recording"
              accessibilityRole="button"
              accessibilityLabel="Start voice recording"
              onPress={onStartRecording}
              style={({ pressed }) => [styles.utilityButton, { backgroundColor: colors.secondary, opacity: pressed ? 0.72 : 1 }]}
            >
              <Feather name="mic" size={17} color={colors.primary} />
            </Pressable>
          )}
        </View>
        {recording ? (
          <View style={styles.recordingStatus} accessibilityLiveRegion="polite">
            <View style={[styles.recordingDot, { backgroundColor: colors.destructive }]} />
            <Text style={[styles.recordingText, { color: colors.mutedForeground }]}>
              Recording · {formatDuration(recordingSeconds)}
            </Text>
            <Text style={[styles.recordingAction, { color: colors.primary }]}>Tap stop when ready</Text>
          </View>
        ) : pendingMedia.length > 0 ? (
          <Text style={[styles.composerFootnote, { color: colors.mutedForeground }]}>
            {pendingMedia.length === 1
              ? 'Tap Send once to share this attachment.'
              : `Tap Send once to share all ${pendingMedia.length} attachments.`}
          </Text>
        ) : (
          <Text style={[styles.composerFootnote, { color: colors.mutedForeground }]}>
            Keep order and quote details in this private conversation.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 14, flexGrow: 1, justifyContent: 'flex-end' },
  emptyList: { justifyContent: 'center' },
  messageRow: { width: '100%', marginBottom: 10, flexDirection: 'row' },
  bubble: { width: '88%', maxWidth: 460, paddingHorizontal: 13, paddingVertical: 10, borderWidth: StyleSheet.hairlineWidth, borderRadius: 18 },
  messageMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 5 },
  sender: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2, flexShrink: 1 },
  timestamp: { fontSize: 10 },
  messageBody: { fontSize: 14, lineHeight: 20 },
  imagePressable: { marginTop: 7, overflow: 'hidden', borderRadius: 12 },
  messageImage: { width: '100%', height: 190, borderRadius: 12, backgroundColor: 'transparent' },
  audioMessage: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, padding: 10, borderRadius: 14 },
  audioPlay: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  audioDetails: { flex: 1, gap: 5 },
  audioTitle: { fontSize: 12, fontWeight: '700' },
  messageWaveform: { height: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden' },
  audioDuration: { fontSize: 10, fontVariant: ['tabular-nums'], maxWidth: 42, textAlign: 'right' },
  fileMessage: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 8, padding: 9, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12 },
  fileIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  fileCopy: { flex: 1, minWidth: 0 },
  fileName: { fontSize: 11, fontWeight: '700' },
  fileHint: { fontSize: 10, marginTop: 2 },
  loadingState: { padding: 18, alignItems: 'flex-start', gap: 10 },
  skeletonLine: { height: 12, borderRadius: 6, opacity: 0.8 },
  loadingLabel: { marginTop: 4, fontSize: 12 },
  emptyState: { alignItems: 'center', paddingHorizontal: 28, paddingVertical: 32 },
  emptyMark: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  emptyTitle: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  emptyText: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 6, maxWidth: 280 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 9, marginHorizontal: 12, marginBottom: 4, padding: 10, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  errorIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  errorCopy: { flex: 1, minWidth: 0 },
  errorTitle: { fontSize: 11, fontWeight: '700' },
  errorText: { fontSize: 10, marginTop: 2 },
  retryButton: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  retryText: { fontSize: 11, fontWeight: '700' },
  pendingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 12, marginBottom: 6 },
  pendingHeaderTitle: { fontSize: 11, fontWeight: '700' },
  pendingHeaderCount: { fontSize: 10, fontVariant: ['tabular-nums'] },
  pendingList: { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  pendingCard: { flexDirection: 'row', alignItems: 'center', padding: 10, borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, gap: 8 },
  pendingThumb: { width: 56, height: 56, borderRadius: 12 },
  pendingIcon: { alignItems: 'center', justifyContent: 'center' },
  pendingCopy: { flex: 1, minWidth: 0 },
  pendingEyebrow: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  pendingName: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  pendingType: { fontSize: 10 },
  voicePreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  waveform: { flex: 1, height: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden' },
  waveformBar: { width: 2, borderRadius: 2, opacity: 0.76 },
  previewButton: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  removeButton: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  composer: { borderTopWidth: StyleSheet.hairlineWidth, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 9, gap: 8 },
  composerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  utilityButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minHeight: 42, maxHeight: 104, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 13, paddingTop: 10, paddingBottom: 9, fontSize: 13, lineHeight: 18 },
  sendButton: { minWidth: 74, height: 42, paddingHorizontal: 12, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  sendLabel: { fontSize: 12, fontWeight: '700' },
  recordButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  composerFootnote: { fontSize: 10, marginTop: 7, marginLeft: 46 },
  recordingStatus: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginLeft: 46, gap: 6 },
  recordingDot: { width: 7, height: 7, borderRadius: 4 },
  recordingText: { fontSize: 10, fontVariant: ['tabular-nums'] },
  recordingAction: { fontSize: 10, marginLeft: 'auto', fontWeight: '600' },
});
