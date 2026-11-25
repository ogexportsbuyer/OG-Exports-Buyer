import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { LocalizedText as Text, LocalizedTextInput as TextInput } from '@/components/LocalizedText';
import { useColors } from '@/hooks/useColors';
import { MAX_BUYER_CHAT_ATTACHMENTS } from '@/lib/upload-rules';
import { supportTextForSelectedLanguage } from '@/lib/buyer-support-chat-language';

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
  translatedBody?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  translationStatus?: string;
  buyerTranslatedBody?: string;
  buyerTranslationLanguage?: string;
  buyerTranslationStatus?: string;
  transcriptionBody?: string;
  transcriptionTranslatedBody?: string;
  transcriptionSourceLanguage?: string;
  transcriptionTargetLanguage?: string;
  transcriptionBuyerBody?: string;
  transcriptionBuyerLanguage?: string;
  transcriptionBuyerStatus?: string;
  transcriptionStatus?: string;
};

export type BuyerSupportLanguage = { code: string; name: string };

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
  cameraBusy: boolean;
  onRecordVideo: () => void;
  pendingMedia: BuyerSupportPendingMedia[];
  onRemovePending: (mediaId: string) => void;
  onPickMedia: () => void;
  recording: boolean;
  recordingSeconds: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlayAudio: (url: string) => void;
  onSpeakText: (text: string, language: string, messageKey: string) => void;
  speakingMessageKey: string | null;
  onOpenMedia: (url: string) => void;
  playingAudioUrl: string | null;
  audioPlaying: boolean;
  audioProgress: number;
  buyerLanguage: string;
  languageUpdating: boolean;
  buyerLanguages: BuyerSupportLanguage[];
  onBuyerLanguageChange: (language: string) => void;
  voiceTranslationEnabled: boolean;
  voiceTranslationBusy: boolean;
  onToggleVoiceTranslation: () => void;
  onRetryTranscription: (messageId: string) => void;
  transcribingMessageId: string | null;
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
  cameraBusy,
  onRecordVideo,
  onRemovePending,
  onPickMedia,
  recording,
  recordingSeconds,
  onStartRecording,
  onStopRecording,
  onPlayAudio,
  onSpeakText,
  speakingMessageKey,
  onOpenMedia,
  playingAudioUrl,
  audioPlaying,
  audioProgress,
  buyerLanguage,
  languageUpdating,
  buyerLanguages,
  onBuyerLanguageChange,
  voiceTranslationEnabled,
  voiceTranslationBusy,
  onToggleVoiceTranslation,
  onRetryTranscription,
  transcribingMessageId,
  sendProgressLabel,
  pendingMedia: pendingMediaValue,
}: BuyerSupportChatPanelProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = React.useState(false);
  const listRef = useRef<FlatList<BuyerSupportMessage>>(null);
  const pendingMedia = Array.isArray(pendingMediaValue) ? pendingMediaValue : [];
  const pendingCardWidth = 84;
  const [languagePickerOpen, setLanguagePickerOpen] = React.useState(false);
  const [languageSearch, setLanguageSearch] = React.useState('');
  const visibleLanguages = buyerLanguages.filter((language) =>
    `${language.name} ${language.code}`.toLocaleLowerCase().includes(languageSearch.trim().toLocaleLowerCase()),
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: false }));
    return () => cancelAnimationFrame(frame);
  }, [messages.length]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const renderMessage = ({ item }: { item: BuyerSupportMessage }) => {
    const own = item.own;
    const isActive = Boolean(item.attachmentUrl && playingAudioUrl === item.attachmentUrl);
    const isPlaying = isActive && audioPlaying;
    const selectedBody = supportTextForSelectedLanguage({
      original: item.body,
      selectedTranslation: item.buyerTranslatedBody,
      selectedLanguage: item.buyerTranslationLanguage,
      legacyTranslation: item.translatedBody,
      legacyLanguage: item.targetLanguage,
      language: buyerLanguage,
    });
    const translatedBody = selectedBody && selectedBody !== item.body ? selectedBody : undefined;
    const selectedTranscript = supportTextForSelectedLanguage({
      original: item.transcriptionBody,
      selectedTranslation: item.transcriptionBuyerBody,
      selectedLanguage: item.transcriptionBuyerLanguage,
      legacyTranslation: item.transcriptionTranslatedBody,
      legacyLanguage: item.transcriptionTargetLanguage,
      language: buyerLanguage,
    });
    const translatedTranscript = selectedTranscript && selectedTranscript !== item.transcriptionBody
      ? selectedTranscript
      : undefined;
    const transcript = selectedTranscript || item.transcriptionBody;
    const transcriptLanguage = translatedTranscript
      ? buyerLanguage
      : item.transcriptionSourceLanguage || item.sourceLanguage || buyerLanguage;
    const translatedMessageKey = `message:${item.id}`;
    const transcriptMessageKey = `transcript:${item.id}`;
    const languageName = (code: string) => {
      const normalizedCode = code.toLowerCase();
      return buyerLanguages.find((language) => language.code.toLowerCase() === normalizedCode)?.name
        ?? buyerLanguages.find((language) => language.code.toLowerCase() === normalizedCode.split('-')[0])?.name
        ?? code.toUpperCase();
    };
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
          {item.body ? (
            <>
              <Text style={[styles.messageBody, { color: colors.foreground }]}>
                {translatedBody || item.body}
              </Text>
              {translatedBody && item.body !== translatedBody ? (
                <>
                  <Text style={[styles.originalBody, { color: colors.mutedForeground }]}>
                    Original · {item.body}
                  </Text>
                  <Pressable
                    testID={`buyer-chat-speak-message-${item.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={speakingMessageKey === translatedMessageKey
                      ? 'Stop translated reply audio'
                      : `Listen to translated reply in ${languageName(buyerLanguage)}`}
                    accessibilityState={{ selected: speakingMessageKey === translatedMessageKey }}
                    onPress={() => onSpeakText(translatedBody, buyerLanguage, translatedMessageKey)}
                    style={styles.speechButton}
                  >
                    <Feather
                      name={speakingMessageKey === translatedMessageKey ? 'volume-x' : 'volume-2'}
                      size={14}
                      color={colors.primary}
                    />
                    <Text style={[styles.speechButtonText, { color: colors.primary }]}>
                      {speakingMessageKey === translatedMessageKey ? 'Stop audio' : 'Listen'}
                    </Text>
                  </Pressable>
                </>
              ) : null}
              {!translatedBody && (item.buyerTranslationStatus || item.translationStatus) && !['not_needed', 'translated'].includes(item.buyerTranslationStatus || item.translationStatus || '') ? (
                <Text style={[styles.translationStatus, { color: colors.mutedForeground }]}>
                  {(item.buyerTranslationStatus || item.translationStatus) === 'quota_exceeded'
                    ? 'Monthly translation limit reached; showing original.'
                    : (item.buyerTranslationStatus || item.translationStatus) === 'disabled' || (item.buyerTranslationStatus || item.translationStatus) === 'not_configured'
                      ? 'Translation setup is pending; showing original.'
                      : 'Translation unavailable; showing original.'}
                </Text>
              ) : null}
            </>
          ) : null}
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
            <>
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
              {item.transcriptionBody || item.transcriptionStatus ? (
                <View style={{
                  marginTop: 8,
                  padding: 10,
                  borderRadius: 12,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: colors.border,
                  backgroundColor: own ? colors.card : colors.lightGreen,
                }}>
                  {item.transcriptionBody ? (
                    <>
                      <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 0.6 }}>
                        {translatedTranscript
                          ? `${languageName(buyerLanguage).toLocaleUpperCase()} VOICE TRANSCRIPT`
                          : 'VOICE TRANSCRIPT'}
                      </Text>
                      <Text style={{ color: colors.foreground, fontSize: 12, lineHeight: 18, marginTop: 4 }}>
                        {transcript}
                      </Text>
                      {transcript ? (
                        <Pressable
                          testID={`buyer-chat-speak-transcript-${item.id}`}
                          accessibilityRole="button"
                          accessibilityLabel={speakingMessageKey === transcriptMessageKey
                            ? 'Stop transcript audio'
                            : `Listen to transcript in ${languageName(transcriptLanguage)}`}
                          accessibilityState={{ selected: speakingMessageKey === transcriptMessageKey }}
                          onPress={() => onSpeakText(transcript, transcriptLanguage, transcriptMessageKey)}
                          style={styles.speechButton}
                        >
                          <Feather
                            name={speakingMessageKey === transcriptMessageKey ? 'volume-x' : 'volume-2'}
                            size={14}
                            color={colors.primary}
                          />
                          <Text style={[styles.speechButtonText, { color: colors.primary }]}>
                            {speakingMessageKey === transcriptMessageKey ? 'Stop audio' : 'Listen'}
                          </Text>
                        </Pressable>
                      ) : null}
                      {translatedTranscript && translatedTranscript !== item.transcriptionBody ? (
                        <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 16, marginTop: 5 }}>
                          Original · {item.transcriptionBody}
                        </Text>
                      ) : null}
                      {!translatedTranscript && item.transcriptionBuyerStatus && !['not_needed', 'transcribed', 'translated'].includes(item.transcriptionBuyerStatus) ? (
                        <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 16, marginTop: 5 }}>
                          {item.transcriptionBuyerStatus === 'quota_exceeded'
                            ? 'Monthly translation limit reached; showing the original transcript.'
                            : item.transcriptionBuyerStatus === 'disabled' || item.transcriptionBuyerStatus === 'not_configured'
                              ? 'Translation setup is pending; showing the original transcript.'
                              : 'Translation unavailable; showing the original transcript.'}
                        </Text>
                      ) : null}
                    </>
                  ) : null}
                  {item.transcriptionStatus === 'not_requested' && !voiceTranslationEnabled ? (
                    <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 16 }}>
                      This note was sent as audio only. Turn on voice translation to add a translated transcript.
                    </Text>
                  ) : null}
                  {item.transcriptionStatus && !['translated', 'transcribed', 'not_requested'].includes(item.transcriptionStatus) ? (
                    <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 16 }}>
                      {item.transcriptionStatus === 'processing'
                        ? 'Transcribing this voice note…'
                        : item.transcriptionStatus === 'quota_exceeded'
                          ? 'The monthly voice-processing limit has been reached.'
                          : item.transcriptionStatus === 'unsupported_audio_format'
                            ? 'This voice-note format can still be played, but cannot be transcribed.'
                            : item.transcriptionStatus === 'audio_too_long'
                              ? 'Voice translation supports notes up to 60 seconds.'
                              : item.transcriptionStatus === 'not_configured' || item.transcriptionStatus === 'disabled'
                                ? 'Voice translation setup is not active yet.'
                                : item.transcriptionStatus === 'no_speech_detected'
                                  ? 'No clear speech was detected in this recording.'
                                  : 'Voice transcription could not be completed.'}
                    </Text>
                  ) : null}
                  {voiceTranslationEnabled && ['not_requested', 'failed', 'not_configured', 'disabled'].includes(item.transcriptionStatus || '') ? (
                    <Pressable
                      testID={`buyer-chat-retry-transcription-${item.id}`}
                      accessibilityRole="button"
                      disabled={voiceTranslationBusy || transcribingMessageId === item.id}
                      onPress={() => onRetryTranscription(item.id)}
                      style={{ alignSelf: 'flex-start', marginTop: 7, flexDirection: 'row', alignItems: 'center', gap: 5, opacity: voiceTranslationBusy || transcribingMessageId === item.id ? 0.55 : 1 }}
                    >
                      {transcribingMessageId === item.id
                        ? <ActivityIndicator size="small" color={colors.primary} />
                        : <Feather name="refresh-cw" size={12} color={colors.primary} />}
                      <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>
                        {transcribingMessageId === item.id ? 'Transcribing…' : 'Retry translation'}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </>
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
      <View style={[styles.languageBar, { borderBottomColor: colors.border }]}>
        <View style={styles.languageLabelGroup}>
          <Feather name="globe" size={14} color={colors.primary} />
          <Text style={[styles.languageLabel, { color: colors.mutedForeground }]}>Translate replies to</Text>
        </View>
        <Pressable
          testID="buyer-chat-reply-language"
          accessibilityRole="button"
          accessibilityLabel={`Choose chat language. Current: ${buyerLanguages.find(language => language.code === buyerLanguage)?.name ?? buyerLanguage}`}
          accessibilityState={{ disabled: languageUpdating, busy: languageUpdating }}
          disabled={languageUpdating}
          onPress={() => setLanguagePickerOpen(true)}
          style={[styles.languageButton, { backgroundColor: colors.secondary, borderColor: colors.border }]}
        >
          {languageUpdating
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Text style={[styles.languageButtonText, { color: colors.primary }]}>
                {buyerLanguages.find(language => language.code === buyerLanguage)?.name ?? buyerLanguage.toUpperCase()}
              </Text>}
          {!languageUpdating ? <Feather name="chevron-down" size={14} color={colors.primary} /> : null}
        </Pressable>
      </View>
      <View style={{ paddingHorizontal: 14, paddingTop: 7, paddingBottom: 2 }}>
        <Pressable
          testID="buyer-chat-voice-translation-toggle"
          accessibilityRole="button"
          accessibilityState={{ disabled: voiceTranslationBusy }}
          disabled={voiceTranslationBusy}
          onPress={onToggleVoiceTranslation}
          style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, opacity: voiceTranslationBusy ? 0.55 : 1 }}
        >
          {voiceTranslationBusy
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Feather name={voiceTranslationEnabled ? 'check-circle' : 'mic'} size={13} color={voiceTranslationEnabled ? colors.primary : colors.mutedForeground} />}
          <Text style={{ color: voiceTranslationEnabled ? colors.primary : colors.mutedForeground, fontSize: 10, fontWeight: '600' }}>
            Voice translation {voiceTranslationEnabled ? 'on' : 'off'}
          </Text>
        </Pressable>
      </View>

      <Modal
        visible={languagePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguagePickerOpen(false)}
      >
        <View style={styles.languageModalBackdrop}>
          <View style={[styles.languageModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.languageModalHeader}>
              <View style={styles.languageModalTitleGroup}>
                <Text style={[styles.languageModalTitle, { color: colors.foreground }]}>Chat language</Text>
                <Text style={[styles.languageModalSubtitle, { color: colors.mutedForeground }]}>
                  Support replies will be translated into this language.
                </Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close language selector" onPress={() => setLanguagePickerOpen(false)}>
                <Feather name="x" size={19} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <TextInput
              value={languageSearch}
              onChangeText={setLanguageSearch}
              placeholder="Search languages"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.languageSearch, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]}
              accessibilityLabel="Search translation languages"
            />
            <ScrollView style={styles.languageList} keyboardShouldPersistTaps="handled">
              {visibleLanguages.map((language) => {
                const selected = language.code.toLowerCase() === buyerLanguage.toLowerCase();
                return (
                  <Pressable
                    key={language.code}
                    testID={`buyer-chat-language-${language.code}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      onBuyerLanguageChange(language.code);
                      setLanguagePickerOpen(false);
                      setLanguageSearch('');
                    }}
                    style={[
                      styles.languageOption,
                      { borderBottomColor: colors.border },
                      selected ? { backgroundColor: colors.lightGreen } : null,
                    ]}
                  >
                    <Text style={[styles.languageOptionName, { color: colors.foreground }]}>{language.name}</Text>
                    <Text style={[styles.languageOptionCode, { color: colors.mutedForeground }]}>{language.code.toUpperCase()}</Text>
                    {selected ? <Feather name="check" size={16} color={colors.primary} /> : null}
                  </Pressable>
                );
              })}
              {visibleLanguages.length === 0 ? (
                <Text style={[styles.noLanguages, { color: colors.mutedForeground }]}>No language matches that search.</Text>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
            style={styles.pendingScroll}
            contentContainerStyle={styles.pendingList}
          >
            {pendingMedia.map((media) => {
              const previewPlaying = playingAudioUrl === media.uri && audioPlaying;
              return (
                <View
                  key={media.id}
                  style={[styles.pendingCard, { width: pendingCardWidth }]}
                >
                  <View style={[styles.pendingThumbFrame, { backgroundColor: colors.secondary }]}>
                    {media.kind === 'image' ? (
                      <Image source={{ uri: media.uri }} style={StyleSheet.absoluteFill} resizeMode="contain" />
                    ) : media.kind === 'video' ? (
                      <Feather name="play" size={20} color={colors.primary} />
                    ) : (
                      <Pressable
                        testID={`buyer-chat-preview-audio-${media.id}`}
                        accessibilityRole="button"
                        accessibilityLabel={previewPlaying ? 'Pause voice note preview' : 'Play voice note preview'}
                        disabled={sending}
                        onPress={() => onPlayAudio(media.uri)}
                        style={({ pressed }) => [
                          styles.previewButton,
                          { backgroundColor: colors.lightGreen, opacity: sending ? 0.5 : pressed ? 0.72 : 1 },
                        ]}
                      >
                        <Feather name={previewPlaying ? 'pause' : 'play'} size={14} color={colors.primary} />
                      </Pressable>
                    )}
                    {media.kind === 'video' ? (
                      <View style={[styles.pendingMediaBadge, { backgroundColor: colors.primary }]}>
                        <Feather name="video" size={10} color={colors.primaryForeground} />
                      </View>
                    ) : null}
                    <Pressable
                      testID={`buyer-chat-remove-pending-${media.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${media.kind === 'audio' ? 'voice note' : media.kind} attachment`}
                      disabled={sending}
                      onPress={() => onRemovePending(media.id)}
                      hitSlop={6}
                      style={({ pressed }) => [
                        styles.removeButton,
                        { backgroundColor: colors.primary, opacity: sending ? 0.5 : pressed ? 0.72 : 1 },
                      ]}
                    >
                      <Feather name="x" size={13} color={colors.primaryForeground} />
                    </Pressable>
                  </View>
                  <Text numberOfLines={1} style={[styles.pendingName, { color: colors.foreground }]}>
                    {media.kind === 'audio' ? 'Voice note' : media.name}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </>
      ) : null}

      <KeyboardStickyView style={styles.composerDock}>
        <View style={[styles.composer, { backgroundColor: 'transparent', borderColor: colors.glassBorder }]}>
          <View style={[styles.composerContent, { paddingBottom: keyboardVisible ? 0 : Math.max(insets.bottom, 10) }]}>
          <View style={styles.composerActions}>
          <Pressable
            testID="buyer-chat-attach"
            accessibilityRole="button"
            accessibilityLabel="Attach a photo, video or audio file"
            disabled={sending || recording}
            onPress={onPickMedia}
            style={({ pressed }) => [
              styles.utilityButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: sending || recording ? 0.5 : pressed ? 0.72 : 1,
              },
            ]}
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
          <Pressable
            testID="buyer-chat-record-video"
            accessibilityRole="button"
            accessibilityLabel={cameraBusy ? 'Opening camera' : 'Record a support video'}
            accessibilityState={{ disabled: sending || recording || cameraBusy || pendingMedia.length >= MAX_BUYER_CHAT_ATTACHMENTS, busy: cameraBusy }}
            disabled={sending || recording || cameraBusy || pendingMedia.length >= MAX_BUYER_CHAT_ATTACHMENTS}
            onPress={onRecordVideo}
            style={({ pressed }) => [
              styles.utilityButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: sending || recording || cameraBusy || pendingMedia.length >= MAX_BUYER_CHAT_ATTACHMENTS ? 0.5 : pressed ? 0.72 : 1,
              },
            ]}
          >
            {cameraBusy
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Feather name="video" size={17} color={colors.primary} />}
          </Pressable>
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
          ) : (
            <>
              <Pressable
                testID="buyer-chat-start-recording"
                accessibilityRole="button"
                accessibilityLabel="Start voice recording"
                accessibilityState={{ disabled: sending || cameraBusy }}
                disabled={sending || cameraBusy}
                onPress={onStartRecording}
                style={({ pressed }) => [
                  styles.utilityButton,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: sending || cameraBusy ? 0.5 : pressed ? 0.72 : 1,
                  },
                ]}
              >
                <Feather name="mic" size={17} color={colors.primary} />
              </Pressable>
              {draft.trim() || pendingMedia.length > 0 ? (
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
              ) : null}
            </>
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
          ) : null}
          </View>
        </View>
      </KeyboardStickyView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0 },
  list: { flex: 1 },
  composerDock: { width: '100%', zIndex: 2 },
  listContent: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 14, flexGrow: 1, justifyContent: 'flex-end' },
  languageBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  languageLabelGroup: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  languageLabel: { fontSize: 11, fontWeight: '600' },
  languageButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7, maxWidth: '55%' },
  languageButtonText: { fontSize: 11, fontWeight: '700', flexShrink: 1 },
  languageModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.46)', justifyContent: 'center', padding: 20 },
  languageModal: { maxHeight: '78%', borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  languageModalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  languageModalTitleGroup: { flex: 1, gap: 4 },
  languageModalTitle: { fontSize: 17, fontWeight: '700' },
  languageModalSubtitle: { fontSize: 12, lineHeight: 17 },
  languageSearch: { minHeight: 42, borderWidth: StyleSheet.hairlineWidth, borderRadius: 13, paddingHorizontal: 12, fontSize: 14, marginBottom: 8 },
  languageList: { flexGrow: 0 },
  languageOption: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 8 },
  languageOptionName: { flex: 1, fontSize: 13, fontWeight: '600' },
  languageOptionCode: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  noLanguages: { textAlign: 'center', paddingVertical: 20, fontSize: 12 },
  emptyList: { justifyContent: 'center' },
  messageRow: { width: '100%', marginBottom: 10, flexDirection: 'row' },
  bubble: { width: '88%', maxWidth: 460, paddingHorizontal: 13, paddingVertical: 10, borderWidth: StyleSheet.hairlineWidth, borderRadius: 18 },
  messageMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 5 },
  sender: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2, flexShrink: 1 },
  timestamp: { fontSize: 10 },
  messageBody: { fontSize: 14, lineHeight: 20 },
  originalBody: { marginTop: 5, fontSize: 11, lineHeight: 16 },
  translationStatus: { marginTop: 5, fontSize: 10, lineHeight: 14, fontStyle: 'italic' },
  speechButton: { alignSelf: 'flex-start', minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3, paddingVertical: 5, paddingRight: 10 },
  speechButtonText: { fontSize: 11, fontWeight: '700' },
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
  pendingScroll: { height: 110, maxHeight: 110, flexGrow: 0, flexShrink: 0 },
  pendingList: { paddingHorizontal: 12, paddingBottom: 4, gap: 8, alignItems: 'flex-start' },
  pendingCard: { height: 102, alignItems: 'center', gap: 4 },
  pendingThumbFrame: { width: 76, height: 76, borderRadius: 13, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  pendingMediaBadge: { position: 'absolute', left: 5, bottom: 5, width: 22, height: 22, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  pendingName: { maxWidth: 84, fontSize: 9, lineHeight: 12, fontWeight: '600', textAlign: 'center' },
  waveformBar: { width: 2, borderRadius: 2, opacity: 0.76 },
  previewButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  removeButton: { position: 'absolute', top: 5, right: 5, zIndex: 2, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  composer: { width: '100%', borderTopWidth: StyleSheet.hairlineWidth },
  composerContent: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8, gap: 4 },
  composerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  utilityButton: { width: 38, height: 40, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
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
