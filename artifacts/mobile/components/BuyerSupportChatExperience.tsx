import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File as ExpoFile } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import {
  useGetBuyerSupportTranslationLanguages,
  useSendInvestorConversationMessage,
  useUpdateBuyerSupportLanguage,
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
  type SupportLanguage,
} from '@/lib/support-languages';
import { motionHaptic } from '@/lib/motion';
import {
  BuyerSupportChatPanel,
  type BuyerSupportMessage,
  type BuyerSupportPendingMedia,
} from '@/components/BuyerSupportChatPanel';

type BuyerSupportChatExperienceProps = {
  conversationId: string;
  savedBuyerLanguage: string;
  messages: Json[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onSent: () => void;
};

type PendingMediaSource = string | ExpoFile | Blob;
type QueuedBuyerMedia = BuyerSupportPendingMedia & { source: PendingMediaSource };

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
      senderLabel: own ? 'You' : 'OG Exports Support',
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
  messages,
  loading,
  error,
  onRetry,
  onSent,
}: BuyerSupportChatExperienceProps) {
  const { apiOrigin, user } = useAuth();
  const ownId = first(record(user), ['id'], '');
  const userProfile = record(record(user).profile);
  const defaultBuyerLanguage = defaultSupportLanguageForCountry(
    first(record(user), ['country'], first(userProfile, ['country'], '')),
  );
  const languageStorageKey = `og-buyer-support-language:${ownId || 'guest'}`;
  const languagesQuery = useGetBuyerSupportTranslationLanguages({
    query: {
      queryKey: ['buyer-support-translation-languages'],
      enabled: Boolean(ownId),
      staleTime: 7 * 24 * 60 * 60 * 1000,
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
  const updateBuyerLanguage = useUpdateBuyerSupportLanguage();
  const send = useSendInvestorConversationMessage();
  const [draft, setDraft] = useState('');
  const [pendingMedia, setPendingMedia] = useState<QueuedBuyerMedia[]>([]);
  const queuedPendingMedia = Array.isArray(pendingMedia) ? pendingMedia : [];
  const [uploading, setUploading] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [sendProgress, setSendProgress] = useState<{ current: number; total: number } | null>(null);
  const sendingRef = useRef(false);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const player = useAudioPlayer(null, { updateInterval: 300 });
  const playerStatus = useAudioPlayerStatus(player);
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
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
            Alert.alert('Camera access is off', detail, [
              { text: 'Not now', style: 'cancel' },
              { text: 'Open settings', onPress: () => void Linking.openSettings() },
            ]);
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
            Alert.alert('Microphone access is off', detail, [
              { text: 'Not now', style: 'cancel' },
              { text: 'Open settings', onPress: () => void Linking.openSettings() },
            ]);
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
          Alert.alert('Microphone access is off', detail, [
            { text: 'Not now', style: 'cancel' },
            { text: 'Open settings', onPress: () => void Linking.openSettings() },
          ]);
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

      const mimeType = Platform.OS === 'web' ? 'audio/webm' : 'audio/mp4';
      const kind = 'audio' as const;
      const name = normalizedName(
        Platform.OS === 'web' ? 'voice-message.webm' : 'voice-message.m4a',
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

  async function sendMessage() {
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
          await send.mutateAsync({
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

  async function openMedia(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      setActionError('This media could not be opened on this device.');
    }
  }

  async function changeBuyerLanguage(language: string) {
    setBuyerLanguage(language);
    await AsyncStorage.setItem(languageStorageKey, language).catch(() => {
      setActionError('Your reply language could not be saved on this device.');
    });
    try {
      await updateBuyerLanguage.mutateAsync({
        conversation: conversationId,
        data: { buyer_language: language },
      });
      onSent();
    } catch {
      setActionError('Your language is saved on this device, but could not sync to your account.');
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
      onSend={() => void sendMessage()}
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
      onOpenMedia={(url) => void openMedia(url)}
      playingAudioUrl={playingAudioUrl}
      audioPlaying={Boolean(playingAudioUrl && playerStatus.playing)}
      audioProgress={progress}
      buyerLanguage={buyerLanguage}
      buyerLanguages={buyerLanguages}
      onBuyerLanguageChange={(language) => void changeBuyerLanguage(language)}
      sendProgressLabel={sendProgress ? `Sending ${sendProgress.current}/${sendProgress.total}` : undefined}
    />
  );
}
