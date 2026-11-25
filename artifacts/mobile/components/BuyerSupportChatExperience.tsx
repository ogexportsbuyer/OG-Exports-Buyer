import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File as ExpoFile } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import {
  AudioQuality,
  IOSOutputFormat,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as Speech from 'expo-speech';
import {
  useGetBuyerSupportTranslationLanguages,
  useSendInvestorConversationMessage,
  useUpdateBuyerSupportLanguage,
  useTranscribeBuyerVoiceMessage,
  useUpdateBuyerVoiceTranslationConsent,
} from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import {
  buyerChatMediaKind,
  MAX_BUYER_CHAT_ATTACHMENTS,
  validateBuyerChatMediaFile,
} from '@/lib/upload-rules';
import { uploadBuyerChatMedia } from '@/lib/file-upload';
import { resolveBuyerProductImageUrl } from '@/lib/buyer-product-data';
import { first, list, messageOf, record, type Json } from '@/lib/data';
import {
  defaultSupportLanguageForCountry,
  FALLBACK_SUPPORT_LANGUAGES,
  matchSupportSpeechVoice,
  supportLanguageLabel,
  supportSpeechLocale,
  type SupportLanguage,
} from '@/lib/support-languages';
import { motionHaptic } from '@/lib/motion';
import {
  BuyerSupportChatPanel,
  type BuyerSupportMessage,
  type BuyerSupportPendingMedia,
} from '@/components/BuyerSupportChatPanel';
import { useBrandedAlert } from '@/components/BrandedAlertProvider';

type BuyerSupportChatExperienceProps = {
  conversationId: string;
  savedBuyerLanguage: string;
  voiceTranslationConsented: boolean;
  messages: Json[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onSent: () => void;
};

type PendingMediaSource = string | ExpoFile | Blob;
type QueuedBuyerMedia = BuyerSupportPendingMedia & { source: PendingMediaSource };

const buyerVoiceRecordingOptions = Platform.select({
  ios: {
    ...RecordingPresets.LOW_QUALITY,
    extension: '.wav',
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 256000,
    ios: {
      ...RecordingPresets.LOW_QUALITY.ios,
      extension: '.wav',
      sampleRate: 16000,
      outputFormat: IOSOutputFormat.LINEARPCM,
      audioQuality: AudioQuality.HIGH,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
  },
  android: {
    ...RecordingPresets.LOW_QUALITY,
    extension: '.amr',
    sampleRate: 8000,
    numberOfChannels: 1,
    bitRate: 12200,
    android: {
      ...RecordingPresets.LOW_QUALITY.android,
      extension: '.amr',
      sampleRate: 8000,
      outputFormat: 'amrnb',
      audioEncoder: 'amr_nb',
    },
  },
  default: RecordingPresets.LOW_QUALITY,
}) ?? RecordingPresets.LOW_QUALITY;

function createMediaId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function mediaExtension(mimeType: string, kind: 'image' | 'video' | 'audio') {
  const mime = mimeType.toLowerCase();
  if (mime.includes('png')) return 'png';
  if (mime.includes('gif')) return 'gif';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('quicktime')) return 'mov';
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('3gpp')) return '3gp';
  if (mime.includes('mpeg')) return 'mp3';
  if (mime.includes('wav')) return 'wav';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('aac')) return 'aac';
  if (mime.includes('amr')) return 'amr';
  return kind === 'image' ? 'jpg' : kind === 'video' ? 'mp4' : 'm4a';
}

function normalizedName(name: string | null | undefined, mimeType: string, kind: 'image' | 'video' | 'audio') {
  const safeName = name?.trim().replace(/[\\/:*?"<>|]/g, '-') ?? '';
  if (safeName && /\.[a-z0-9]{2,5}$/i.test(safeName)) return safeName;
  const base = safeName || (kind === 'audio' ? 'voice-message' : kind === 'video' ? 'video-message' : 'image-message');
  return `${base}.${mediaExtension(mimeType, kind)}`;
}

function resolveChatAttachment(value: string, apiOrigin: string) {
  return resolveBuyerProductImageUrl(value, apiOrigin);
}

function normalizedMessages(rawMessages: Json[], ownId: string, apiOrigin: string): BuyerSupportMessage[] {
  return rawMessages.map<BuyerSupportMessage>((item, index) => {
    const sender = record(item.sender);
    const senderId = first(item, ['sender_id'], first(sender, ['id'], ''));
    const senderRole = first(sender, ['role', 'type'], first(item, ['sender_type', 'role'], ''));
    const own = (ownId !== '' && senderId === ownId) || /buyer|investor|user/i.test(senderRole);
    const attachmentName = first(item, ['attachment_name', 'name'], '');
    const attachmentMime = first(item, ['attachment_mime', 'mime'], '');
    const attachmentPath = first(item, ['attachment_path'], '');
    const attachmentUrl = first(item, ['attachment_url'], '');
    const rawAttachment = attachmentUrl || attachmentPath;
    const kind = buyerChatMediaKind(attachmentName, attachmentMime);
    const resolvedUrl = rawAttachment ? resolveChatAttachment(rawAttachment, apiOrigin) : '';
    const createdAt = first(item, ['created_at', 'date'], '');

    return {
      id: first(item, ['id'], `${createdAt}-${index}`),
      own,
      senderLabel: own ? 'You' : 'Support',
      body: first(item, ['message', 'body', 'content'], ''),
      createdAt,
      attachmentUrl: resolvedUrl || undefined,
      attachmentName: attachmentName || undefined,
      attachmentMime: attachmentMime || undefined,
      attachmentKind: kind ?? (rawAttachment ? 'file' : undefined),
      translatedBody: first(item, ['translated_body'], '') || undefined,
      sourceLanguage: first(item, ['source_language'], '') || undefined,
      targetLanguage: first(item, ['target_language'], '') || undefined,
      translationStatus: first(item, ['translation_status'], '') || undefined,
      buyerTranslatedBody: first(item, ['buyer_translated_body'], '') || undefined,
      buyerTranslationLanguage: first(item, ['buyer_translation_language'], '') || undefined,
      buyerTranslationStatus: first(item, ['buyer_translation_status'], '') || undefined,
      transcriptionBody: first(item, ['transcription_body'], '') || undefined,
      transcriptionTranslatedBody: first(item, ['transcription_translated_body'], '') || undefined,
      transcriptionSourceLanguage: first(item, ['transcription_language', 'transcription_source_language'], '') || undefined,
      transcriptionTargetLanguage: first(item, ['transcription_target_language'], '') || undefined,
      transcriptionBuyerBody: first(item, ['transcription_buyer_body'], '') || undefined,
      transcriptionBuyerLanguage: first(item, ['transcription_buyer_language'], '') || undefined,
      transcriptionBuyerStatus: first(item, ['transcription_buyer_status'], '') || undefined,
      transcriptionStatus: first(item, ['transcription_status'], '') || undefined,
    };
  }).sort((left, right) => {
    const leftTime = Date.parse(left.createdAt);
    const rightTime = Date.parse(right.createdAt);
    return Number.isFinite(leftTime) && Number.isFinite(rightTime) ? leftTime - rightTime : 0;
  });
}

export function BuyerSupportChatExperience({
  conversationId,
  savedBuyerLanguage,
  voiceTranslationConsented,
  messages,
  loading,
  error,
  onRetry,
  onSent,
}: BuyerSupportChatExperienceProps) {
  const { showAlert } = useBrandedAlert();
  const { apiOrigin, user } = useAuth();
  const ownId = first(record(user), ['id'], '');
  const userProfile = record(record(user).profile);
  const defaultBuyerLanguage = defaultSupportLanguageForCountry(
    first(record(user), ['country'], first(userProfile, ['country'], '')),
  );
  const languageStorageKey = `og-buyer-support-language:${ownId || 'guest'}`;
  const languagesQuery = useGetBuyerSupportTranslationLanguages({
    query: {
      queryKey: ['buyer-support-translation-languages-v2'],
      enabled: Boolean(ownId),
      staleTime: 7 * 24 * 60 * 60 * 1000,
      refetchOnMount: 'always',
      retry: 1,
    },
  });
  const buyerLanguages = useMemo(() => {
    const fetchedLanguages = list(languagesQuery.data).map((language) => ({
      code: first(language, ['code']),
      name: first(language, ['name']),
    })).filter((language): language is SupportLanguage => Boolean(language.code && language.name));
    return fetchedLanguages.length > 0 ? fetchedLanguages : FALLBACK_SUPPORT_LANGUAGES;
  },
    [languagesQuery.data],
  );
  const [buyerLanguage, setBuyerLanguage] = useState(defaultBuyerLanguage);
  const [languageUpdating, setLanguageUpdating] = useState(false);
  const updateBuyerLanguage = useUpdateBuyerSupportLanguage();
  const updateVoiceConsent = useUpdateBuyerVoiceTranslationConsent();
  const transcribeVoiceMessage = useTranscribeBuyerVoiceMessage();
  const send = useSendInvestorConversationMessage();
  const [draft, setDraft] = useState('');
  const [pendingMedia, setPendingMedia] = useState<QueuedBuyerMedia[]>([]);
  const queuedPendingMedia = Array.isArray(pendingMedia) ? pendingMedia : [];
  const [uploading, setUploading] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [sendProgress, setSendProgress] = useState<{ current: number; total: number } | null>(null);
  const sendingRef = useRef(false);
  const recorder = useAudioRecorder(buyerVoiceRecordingOptions);
  const recorderState = useAudioRecorderState(recorder, 250);
  const player = useAudioPlayer(null, { updateInterval: 300 });
  const playerStatus = useAudioPlayerStatus(player);
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const [voiceTranslationEnabled, setVoiceTranslationEnabled] = useState(voiceTranslationConsented);
  const [voiceTranslationBusy, setVoiceTranslationBusy] = useState(false);
  const [voiceConsentPromptVisible, setVoiceConsentPromptVisible] = useState(false);
  const [voiceConsentWillSend, setVoiceConsentWillSend] = useState(false);
  const [transcribingMessageId, setTranscribingMessageId] = useState<string | null>(null);
  const [speakingMessageKey, setSpeakingMessageKey] = useState<string | null>(null);
  const speakingMessageKeyRef = useRef<string | null>(null);
  const speechRequestRef = useRef(0);
  const autoStopRequested = useRef(false);
  const normalized = useMemo(() => normalizedMessages(messages, ownId, apiOrigin), [messages, ownId, apiOrigin]);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(languageStorageKey).then((savedLanguage) => {
      if (active && savedBuyerLanguage && /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(savedBuyerLanguage)) {
        setBuyerLanguage(savedBuyerLanguage);
        void AsyncStorage.setItem(languageStorageKey, savedBuyerLanguage).catch(() => undefined);
      } else if (active && savedLanguage && /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(savedLanguage)) {
        setBuyerLanguage(savedLanguage);
      } else if (active) {
        setBuyerLanguage(defaultBuyerLanguage);
      }
    }).catch(() => {
      if (active) setBuyerLanguage(defaultBuyerLanguage);
    });
    return () => { active = false; };
  }, [defaultBuyerLanguage, languageStorageKey, savedBuyerLanguage]);

  useEffect(() => {
    if (playerStatus.didJustFinish) setPlayingAudioUrl(null);
  }, [playerStatus.didJustFinish]);

  useEffect(() => () => {
    speechRequestRef.current += 1;
    speakingMessageKeyRef.current = null;
    void Speech.stop();
  }, []);

  useEffect(() => {
    setVoiceTranslationEnabled(voiceTranslationConsented);
    if (voiceTranslationConsented) setVoiceConsentPromptVisible(false);
  }, [voiceTranslationConsented]);

  useEffect(() => {
    if (!recorderState.isRecording) {
      autoStopRequested.current = false;
      return;
    }
    if (recorderState.durationMillis < 60_000 || autoStopRequested.current) return;

    autoStopRequested.current = true;
    void stopRecording().then(() => {
      showAlert({
        title: 'Voice note limit reached',
        message: 'Voice translation supports recordings up to one minute. The recording has been stopped and is ready to send.',
        tone: 'warning',
        buttons: [{ label: 'OK' }],
      });
    });
  }, [recorderState.durationMillis, recorderState.isRecording, showAlert]);

  async function pickMedia() {
    if (recorderState.isRecording) {
      setActionError('Stop the voice recording before attaching other media.');
      return;
    }
    const availableSlots = MAX_BUYER_CHAT_ATTACHMENTS - queuedPendingMedia.length;
    if (availableSlots <= 0) {
      setActionError(`You can send up to ${MAX_BUYER_CHAT_ATTACHMENTS} attachments at a time. Send or remove selected files first.`);
      return;
    }
    setActionError('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        allowsMultipleSelection: true,
        selectionLimit: availableSlots,
        orderedSelection: true,
        quality: 0.9,
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });
      if (result.canceled || result.assets.length === 0) return;

      const selected = result.assets.slice(0, availableSlots).map((asset) => {
        const kind = asset.type === 'video' || asset.mimeType?.startsWith('video/') ? 'video' : 'image';
        const mimeType = asset.mimeType || (kind === 'video' ? 'video/mp4' : 'image/jpeg');
        const name = normalizedName(asset.fileName, mimeType, kind);
        const size = asset.fileSize ?? asset.file?.size ?? (Platform.OS === 'web' ? 0 : new ExpoFile(asset.uri).size);

        if (size > 0) validateBuyerChatMediaFile(name, mimeType, size, kind);
        const durationSeconds = kind === 'video' && asset.duration != null
          ? Math.max(1, Math.round(asset.duration / 1000))
          : undefined;
        return {
          id: createMediaId(),
          uri: asset.uri,
          name,
          mimeType,
          kind,
          durationSeconds,
          source: asset.file ?? asset.uri,
        } satisfies QueuedBuyerMedia;
      });
      setPendingMedia((current) => [
        ...(Array.isArray(current) ? current : []),
        ...selected,
      ].slice(0, MAX_BUYER_CHAT_ATTACHMENTS));
    } catch (err) {
      setActionError(messageOf(err));
      motionHaptic('error');
    }
  }

  async function recordSupportVideo() {
    if (cameraBusy || recorderState.isRecording) return;
    if (queuedPendingMedia.length >= MAX_BUYER_CHAT_ATTACHMENTS) {
      setActionError(`You can send up to ${MAX_BUYER_CHAT_ATTACHMENTS} attachments at a time. Send or remove selected files first.`);
      return;
    }

    setActionError('');
    setCameraBusy(true);
    try {
      if (Platform.OS !== 'web') {
        const currentCameraPermission = await ImagePicker.getCameraPermissionsAsync();
        const cameraPermission = currentCameraPermission.granted
          ? currentCameraPermission
          : await ImagePicker.requestCameraPermissionsAsync();
        if (!cameraPermission.granted) {
          const detail = cameraPermission.canAskAgain
            ? 'Allow camera access to record a support video.'
            : 'Enable camera access in your device settings to record a support video.';
          setActionError(detail);
          if (!cameraPermission.canAskAgain) {
            showAlert({
              title: 'Camera access is off',
              message: detail,
              tone: 'warning',
              buttons: [
                { label: 'Not now', style: 'cancel' },
                { label: 'Open settings', onPress: () => void Linking.openSettings() },
              ],
            });
          }
          return;
        }

        const microphonePermission = await requestRecordingPermissionsAsync();
        if (!microphonePermission.granted) {
          const detail = microphonePermission.canAskAgain
            ? 'Allow microphone access so your support video includes sound.'
            : 'Enable microphone access in your device settings so support videos include sound.';
          setActionError(detail);
          if (!microphonePermission.canAskAgain) {
            showAlert({
              title: 'Microphone access is off',
              message: detail,
              tone: 'warning',
              buttons: [
                { label: 'Not now', style: 'cancel' },
                { label: 'Open settings', onPress: () => void Linking.openSettings() },
              ],
            });
          }
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        videoMaxDuration: 60,
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
        cameraType: ImagePicker.CameraType.back,
      });
      const asset = result.canceled ? undefined : result.assets[0];
      if (!asset) return;

      const extension = asset.fileName?.split('.').pop()?.toLowerCase();
      const fallbackMime = extension === 'mov'
        ? 'video/quicktime'
        : extension === 'webm'
          ? 'video/webm'
          : extension === 'avi'
            ? 'video/x-msvideo'
            : 'video/mp4';
      const mimeType = asset.mimeType || fallbackMime;
      const name = normalizedName(asset.fileName, mimeType, 'video');
      const size = asset.fileSize ?? asset.file?.size ?? new ExpoFile(asset.uri).size;
      if (size > 0) validateBuyerChatMediaFile(name, mimeType, size, 'video');
      const durationSeconds = asset.duration != null
        ? Math.max(1, Math.round(asset.duration / 1000))
        : undefined;

      setPendingMedia((current) => [
        ...(Array.isArray(current) ? current : []),
        {
          id: createMediaId(),
          uri: asset.uri,
          name,
          mimeType,
          kind: 'video' as const,
          durationSeconds,
          source: asset.file ?? asset.uri,
        },
      ].slice(0, MAX_BUYER_CHAT_ATTACHMENTS));
      motionHaptic('success');
    } catch (err) {
      setActionError(messageOf(err));
      motionHaptic('error');
    } finally {
      setCameraBusy(false);
    }
  }

  async function startRecording() {
    if (queuedPendingMedia.length >= MAX_BUYER_CHAT_ATTACHMENTS) {
      setActionError(`You can send up to ${MAX_BUYER_CHAT_ATTACHMENTS} attachments at a time. Send or remove selected files first.`);
      return;
    }
    setActionError('');
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        const detail = permission.canAskAgain
          ? 'Allow microphone access to record a voice note.'
          : 'Enable microphone access in your device settings to record a voice note.';
        setActionError(detail);
        if (!permission.canAskAgain) {
          showAlert({
            title: 'Microphone access is off',
            message: detail,
            tone: 'warning',
            buttons: [
              { label: 'Not now', style: 'cancel' },
              { label: 'Open settings', onPress: () => void Linking.openSettings() },
            ],
          });
        }
        return;
      }

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (err) {
      setActionError(messageOf(err));
      motionHaptic('error');
    }
  }

  async function stopRecording() {
    setActionError('');
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      const status = recorder.getStatus();
      const uri = recorder.uri || status.url;
      if (!uri) throw new Error('The voice note was not saved. Please record it again.');

      const mimeType = Platform.OS === 'web'
        ? 'audio/webm'
        : Platform.OS === 'ios'
          ? 'audio/wav'
          : 'audio/amr';
      const kind = 'audio' as const;
      const name = normalizedName(
        Platform.OS === 'web'
          ? 'voice-message.webm'
          : Platform.OS === 'ios'
            ? 'voice-message.wav'
            : 'voice-message.amr',
        mimeType,
        kind,
      );
      const durationSeconds = Math.max(1, Math.round((status.durationMillis || recorderState.durationMillis) / 1000));
      if (status.fileSize > 0) validateBuyerChatMediaFile(name, mimeType, status.fileSize, kind);
      setPendingMedia((current) => [
        ...(Array.isArray(current) ? current : []),
        { id: createMediaId(), uri, name, mimeType, kind, durationSeconds, source: uri },
      ]);
    } catch (err) {
      setActionError(messageOf(err));
      motionHaptic('error');
    }
  }

  function removePendingMedia(mediaId: string) {
    const removed = queuedPendingMedia.find((media) => media.id === mediaId);
    if (removed?.kind === 'audio' && playingAudioUrl === removed.uri) {
      player.pause();
      setPlayingAudioUrl(null);
    }
    setPendingMedia((current) => (Array.isArray(current) ? current : []).filter((media) => media.id !== mediaId));
  }

  async function saveVoiceTranslationConsent(enabled: boolean): Promise<boolean> {
    setVoiceTranslationBusy(true);
    setActionError('');
    try {
      await updateVoiceConsent.mutateAsync({
        conversation: conversationId,
        data: { enabled },
      });
      setVoiceTranslationEnabled(enabled);
      if (enabled) setVoiceConsentPromptVisible(false);
      onSent();
      return true;
    } catch (err) {
      setActionError(messageOf(err));
      return false;
    } finally {
      setVoiceTranslationBusy(false);
    }
  }

  function toggleVoiceTranslation() {
    if (voiceTranslationEnabled) {
      setVoiceConsentPromptVisible(false);
      setVoiceConsentWillSend(false);
      void saveVoiceTranslationConsent(false);
      return;
    }

    setVoiceConsentWillSend(false);
    setVoiceConsentPromptVisible((visible) => !visible);
  }

  async function transcribeMessage(messageId: string) {
    if (!conversationId || !messageId || !voiceTranslationEnabled || transcribingMessageId) return;
    setTranscribingMessageId(messageId);
    setActionError('');
    try {
      await transcribeVoiceMessage.mutateAsync({ conversation: conversationId, messageId });
      onSent();
    } catch (err) {
      setActionError(`Voice note is in the chat, but its transcript could not be loaded. ${messageOf(err)}`);
    } finally {
      setTranscribingMessageId(null);
    }
  }

  async function sendMessage(translateVoice = voiceTranslationEnabled) {
    const body = draft.trim();
    const queuedMedia = [...queuedPendingMedia];
    if (!conversationId || (!body && queuedMedia.length === 0) || uploading || send.isPending || sendingRef.current) return;
    if (queuedMedia.some((media) => !media.source)) {
      setActionError('One of the selected attachments is no longer available. Please select it again.');
      return;
    }
    sendingRef.current = true;
    setActionError('');
    setSendProgress(null);
    let sentMessages = 0;

    try {
      if (queuedMedia.length > 0) {
        setUploading(true);
        for (let index = 0; index < queuedMedia.length; index += 1) {
          const media = queuedMedia[index];
          setSendProgress({ current: index + 1, total: queuedMedia.length });
          const uploaded = await uploadBuyerChatMedia(
            media.source,
            media.name,
            media.mimeType,
            media.kind,
            apiOrigin,
          );
          const sent = await send.mutateAsync({
            conversation: conversationId,
            data: {
              body: index === 0 ? body : '',
              buyer_language: buyerLanguage,
              attachment_path: uploaded.path,
              attachment_url: uploaded.url,
              attachment_name: uploaded.name,
              attachment_mime: uploaded.mime,
            },
          });
          sentMessages += 1;
          const sentMessage = record(record(sent).data);
          const sentMessageId = first(sentMessage, ['id'], first(record(sent), ['id'], ''));
          if (media.kind === 'audio' && translateVoice && sentMessageId) {
            try {
              await transcribeVoiceMessage.mutateAsync({
                conversation: conversationId,
                messageId: sentMessageId,
              });
            } catch {
              setActionError('Your voice note was sent, but its transcript could not be completed. You can retry it later.');
            }
          }
          setPendingMedia((current) => (Array.isArray(current) ? current : []).filter((item) => item.id !== media.id));
          if (media.kind === 'audio' && playingAudioUrl === media.uri) {
            player.pause();
            setPlayingAudioUrl(null);
          }
          if (index === 0 && body) setDraft('');
        }
      } else {
        await send.mutateAsync({
          conversation: conversationId,
          data: { body, buyer_language: buyerLanguage },
        });
        sentMessages += 1;
        setDraft('');
      }
      motionHaptic('success');
    } catch (err) {
      motionHaptic('error');
      setActionError(messageOf(err));
    } finally {
      if (sentMessages > 0) onSent();
      sendingRef.current = false;
      setUploading(false);
      setSendProgress(null);
    }
  }

  async function playAudio(url: string) {
    try {
      speechRequestRef.current += 1;
      speakingMessageKeyRef.current = null;
      setSpeakingMessageKey(null);
      await Speech.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (playingAudioUrl === url) {
        if (playerStatus.playing) {
          player.pause();
          return;
        }
        player.play();
        return;
      }
      player.replace(url);
      setPlayingAudioUrl(url);
      player.play();
    } catch (err) {
      setActionError(messageOf(err));
    }
  }

  async function speakText(text: string, language: string, messageKey: string) {
    if (!text.trim()) return;

    const requestId = speechRequestRef.current + 1;
    speechRequestRef.current = requestId;
    setActionError('');

    if (speakingMessageKeyRef.current === messageKey) {
      speakingMessageKeyRef.current = null;
      setSpeakingMessageKey(null);
      await Speech.stop();
      return;
    }

    speakingMessageKeyRef.current = messageKey;
    setSpeakingMessageKey(messageKey);
    if (playingAudioUrl) {
      player.pause();
      setPlayingAudioUrl(null);
    }

    const clearSpeakingState = () => {
      if (speechRequestRef.current === requestId) {
        speakingMessageKeyRef.current = null;
        setSpeakingMessageKey(null);
      }
    };

    try {
      await Speech.stop();
      const voices = await Speech.getAvailableVoicesAsync();
      if (speechRequestRef.current !== requestId) return;

      const voice = matchSupportSpeechVoice(voices, language);
      if (Platform.OS !== 'web' && voices.length === 0) {
        clearSpeakingState();
        setActionError('This phone has no available text-to-speech voice engine. The translated text is still available.');
        return;
      }
      if (voices.length > 0 && !voice) {
        clearSpeakingState();
        const setupHint = Platform.OS === 'android'
          ? ' Install this language in Android Settings > Text-to-speech output.'
          : ' Install a voice for this language in iPhone Settings > Accessibility > Spoken Content.';
        setActionError(`No ${supportLanguageLabel(language, buyerLanguages)} voice is installed.${setupHint} The translated text is still available.`);
        return;
      }

      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (speechRequestRef.current !== requestId) return;
      Speech.speak(text, {
        language: voice?.language || supportSpeechLocale(language),
        ...(voice ? { voice: voice.identifier } : {}),
        rate: 0.94,
        onDone: clearSpeakingState,
        onStopped: clearSpeakingState,
        onError: () => {
          clearSpeakingState();
          setActionError(Platform.OS === 'android'
            ? 'Android could not play this language. Check Text-to-speech output and install its voice data; the translated text remains available.'
            : 'This device could not play the selected language. The translated text remains available.');
        },
      });
    } catch {
      clearSpeakingState();
      setActionError('The device could not start speech playback. The translated text is still available.');
    }
  }

  function sendWithConsentCheck() {
    if (voiceTranslationEnabled || !queuedPendingMedia.some((media) => media.kind === 'audio')) {
      void sendMessage(voiceTranslationEnabled);
      return;
    }

    setActionError('');
    setVoiceConsentWillSend(true);
    setVoiceConsentPromptVisible(true);
  }

  async function confirmVoiceTranslationConsent() {
    const shouldSend = voiceConsentWillSend;
    setVoiceConsentWillSend(false);
    if (await saveVoiceTranslationConsent(true) && shouldSend) {
      await sendMessage(true);
    }
  }

  async function openMedia(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      setActionError('This media could not be opened on this device.');
    }
  }

  async function changeBuyerLanguage(language: string) {
    if (languageUpdating || language.toLowerCase() === buyerLanguage.toLowerCase()) return;
    setLanguageUpdating(true);
    setActionError('');
    speechRequestRef.current += 1;
    speakingMessageKeyRef.current = null;
    setSpeakingMessageKey(null);
    await Speech.stop();

    try {
      await updateBuyerLanguage.mutateAsync({
        conversation: conversationId,
        data: { buyer_language: language },
      });
      setBuyerLanguage(language);
      await AsyncStorage.setItem(languageStorageKey, language).catch(() => {
        setActionError('Your language changed, but could not be saved on this device.');
      });
      onSent();
    } catch (err) {
      setActionError(`Your language was not changed. ${messageOf(err)}`);
    } finally {
      setLanguageUpdating(false);
    }
  }

  const progress = playerStatus.duration > 0
    ? Math.min(1, playerStatus.currentTime / playerStatus.duration)
    : 0;

  return (
    <BuyerSupportChatPanel
      messages={normalized}
      loading={loading}
      error={actionError || error}
      onRetry={() => {
        setActionError('');
        onRetry();
      }}
      draft={draft}
      onDraftChange={setDraft}
      onSend={sendWithConsentCheck}
      sendDisabled={!draft.trim() && queuedPendingMedia.length === 0}
      sending={uploading || send.isPending}
      cameraBusy={cameraBusy}
      onRecordVideo={recordSupportVideo}
      pendingMedia={queuedPendingMedia.map(({ source: _source, ...media }) => media)}
      onRemovePending={removePendingMedia}
      onPickMedia={() => void pickMedia()}
      recording={recorderState.isRecording}
      recordingSeconds={Math.ceil(recorderState.durationMillis / 1000)}
      onStartRecording={() => void startRecording()}
      onStopRecording={() => void stopRecording()}
      onPlayAudio={(url) => void playAudio(url)}
      onSpeakText={(text, language, messageKey) => void speakText(text, language, messageKey)}
      speakingMessageKey={speakingMessageKey}
      onOpenMedia={(url) => void openMedia(url)}
      playingAudioUrl={playingAudioUrl}
      audioPlaying={Boolean(playingAudioUrl && playerStatus.playing)}
      audioProgress={progress}
      buyerLanguage={buyerLanguage}
      languageUpdating={languageUpdating}
      buyerLanguages={buyerLanguages}
      onBuyerLanguageChange={(language) => void changeBuyerLanguage(language)}
      voiceTranslationEnabled={voiceTranslationEnabled}
      voiceTranslationBusy={voiceTranslationBusy}
      voiceConsentPromptVisible={voiceConsentPromptVisible}
      voiceConsentWillSend={voiceConsentWillSend}
      onToggleVoiceTranslation={toggleVoiceTranslation}
      onConfirmVoiceConsent={() => void confirmVoiceTranslationConsent()}
      onCancelVoiceConsent={() => {
        setVoiceConsentWillSend(false);
        setVoiceConsentPromptVisible(false);
      }}
      onRetryTranscription={(messageId) => void transcribeMessage(messageId)}
      transcribingMessageId={transcribingMessageId}
      sendProgressLabel={sendProgress ? `Sending ${sendProgress.current}/${sendProgress.total}` : undefined}
    />
  );
}
