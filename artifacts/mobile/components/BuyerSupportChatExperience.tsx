import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
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
import { useSendInvestorConversationMessage } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { buyerChatMediaKind, validateBuyerChatMediaFile } from '@/lib/upload-rules';
import { uploadBuyerChatMedia } from '@/lib/file-upload';
import { resolveBuyerProductImageUrl } from '@/lib/buyer-product-data';
import { first, messageOf, record, type Json } from '@/lib/data';
import { motionHaptic } from '@/lib/motion';
import {
  BuyerSupportChatPanel,
  type BuyerSupportMessage,
  type BuyerSupportPendingMedia,
} from '@/components/BuyerSupportChatPanel';

type BuyerSupportChatExperienceProps = {
  conversationId: string;
  messages: Json[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onSent: () => void;
};

type PendingMediaSource = string | ExpoFile | Blob;

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
    };
  }).sort((left, right) => {
    const leftTime = Date.parse(left.createdAt);
    const rightTime = Date.parse(right.createdAt);
    return Number.isFinite(leftTime) && Number.isFinite(rightTime) ? leftTime - rightTime : 0;
  });
}

export function BuyerSupportChatExperience({
  conversationId,
  messages,
  loading,
  error,
  onRetry,
  onSent,
}: BuyerSupportChatExperienceProps) {
  const { apiOrigin, user } = useAuth();
  const ownId = first(record(user), ['id'], '');
  const send = useSendInvestorConversationMessage();
  const [draft, setDraft] = useState('');
  const [pendingMedia, setPendingMedia] = useState<BuyerSupportPendingMedia | null>(null);
  const [pendingSource, setPendingSource] = useState<PendingMediaSource | null>(null);
  const [uploading, setUploading] = useState(false);
  const [actionError, setActionError] = useState('');
  const sendingRef = useRef(false);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const player = useAudioPlayer(null, { updateInterval: 300 });
  const playerStatus = useAudioPlayerStatus(player);
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const normalized = useMemo(() => normalizedMessages(messages, ownId, apiOrigin), [messages, ownId, apiOrigin]);

  useEffect(() => {
    if (playerStatus.didJustFinish) setPlayingAudioUrl(null);
  }, [playerStatus.didJustFinish]);

  async function pickMedia() {
    if (recorderState.isRecording) {
      setActionError('Stop the voice recording before attaching other media.');
      return;
    }
    setActionError('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        allowsMultipleSelection: false,
        quality: 0.9,
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });
      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      const kind = asset.type === 'video' || asset.mimeType?.startsWith('video/') ? 'video' : 'image';
      const mimeType = asset.mimeType || (kind === 'video' ? 'video/mp4' : 'image/jpeg');
      const name = normalizedName(asset.fileName, mimeType, kind);
      const size = asset.fileSize ?? asset.file?.size ?? (Platform.OS === 'web' ? 0 : new ExpoFile(asset.uri).size);

      if (size > 0) validateBuyerChatMediaFile(name, mimeType, size, kind);
      const durationSeconds = kind === 'video' && asset.duration != null
        ? Math.max(1, Math.round(asset.duration / 1000))
        : undefined;
      setPendingMedia({ uri: asset.uri, name, mimeType, kind, durationSeconds });
      setPendingSource(asset.file ?? asset.uri);
    } catch (err) {
      setActionError(messageOf(err));
      motionHaptic('error');
    }
  }

  async function startRecording() {
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
      setPendingMedia({ uri, name, mimeType, kind, durationSeconds });
      setPendingSource(uri);
    } catch (err) {
      setActionError(messageOf(err));
      motionHaptic('error');
    }
  }

  function removePendingMedia() {
    if (pendingMedia?.kind === 'audio' && playingAudioUrl === pendingMedia.uri) {
      player.pause();
      setPlayingAudioUrl(null);
    }
    setPendingMedia(null);
    setPendingSource(null);
  }

  async function sendMessage() {
    const body = draft.trim();
    if (!conversationId || (!body && !pendingMedia) || uploading || send.isPending || sendingRef.current) return;
    sendingRef.current = true;
    setActionError('');

    try {
      let attachment: Record<string, string> = {};
      if (pendingMedia && pendingSource) {
        setUploading(true);
        const uploaded = await uploadBuyerChatMedia(
          pendingSource,
          pendingMedia.name,
          pendingMedia.mimeType,
          pendingMedia.kind,
          apiOrigin,
        );
        attachment = {
          attachment_path: uploaded.path,
          attachment_url: uploaded.url,
          attachment_name: uploaded.name,
          attachment_mime: uploaded.mime,
        };
      }

      await send.mutateAsync({
        conversation: conversationId,
        data: { body, ...attachment },
      });
      motionHaptic('success');
      setDraft('');
      removePendingMedia();
      onSent();
    } catch (err) {
      motionHaptic('error');
      setActionError(messageOf(err));
    } finally {
      sendingRef.current = false;
      setUploading(false);
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
      sendDisabled={!draft.trim() && !pendingMedia}
      sending={uploading || send.isPending}
      pendingMedia={pendingMedia}
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
    />
  );
}
