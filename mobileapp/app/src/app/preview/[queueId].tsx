import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { router, useLocalSearchParams } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { AlertTriangle, ArrowLeft, CheckCircle2, CloudUpload, Pause, Play, RotateCcw, ShieldQuestion } from 'lucide-react-native';
import { Image, StyleSheet, View } from 'react-native';
import { useEffect } from 'react';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Badge } from '@/components/common/badge';
import { Card } from '@/components/common/card';
import { ProgressBar } from '@/components/common/progress-bar';
import { Screen } from '@/components/common/screen';
import { canUploadWithValidation, contentValidationService } from '@/features/content-validation/content-validation-service';
import { getSafeFeedbackMessage } from '@/features/feedback/error-messages';
import { useFeedback } from '@/features/feedback/feedback-provider';
import { getLocalizedUploadQueueStatusLabel } from '@/features/localization/upload-status';
import { useTranslation } from '@/features/localization/use-translation';
import { useAllowUncertainUpload, useRetryUpload, useSaveUploadValidation, useStartUpload, useUploadQueueItem } from '@/features/uploads/use-upload-queue';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useTask } from '@/hooks/use-odp-queries';
import { colors, spacing } from '@/theme/tokens';
import type { UploadQueueItem } from '@/types/domain';
import { formatBytes } from '@/utils/format';
import { firstRouteParam } from '@/utils/route-params';

export default function MediaPreviewScreen() {
  const params = useLocalSearchParams<{ queueId?: string | string[] }>();
  const queueId = firstRouteParam(params.queueId);
  const { data: item, isLoading } = useUploadQueueItem(queueId);
  const { data: task } = useTask(item?.taskId ?? '');
  const startUpload = useStartUpload();
  const retryUpload = useRetryUpload();
  const saveValidation = useSaveUploadValidation();
  const allowUncertain = useAllowUncertainUpload();
  const { isOffline } = useNetworkStatus();
  const feedback = useFeedback();
  const t = useTranslation();

  useEffect(() => {
    if (!item || item.kind !== 'video' || item.preliminaryValidation || !task || saveValidation.isPending) {
      return;
    }

    let cancelled = false;
    contentValidationService
      .validateVideo({
        durationMs: item.durationMs,
        fileName: item.fileName,
        localUri: item.localUri,
        task,
      })
      .then((result) => {
        if (!cancelled) {
          saveValidation.mutate({ id: item.id, result });
        }
      })
      .catch((caught) => {
        if (cancelled) {
          return;
        }
        const message = getSafeFeedbackMessage(caught, 'Video validation failed. Please retry or continue with manual review.');
        feedback.showError(message);
        saveValidation.mutate({
          id: item.id,
          result: {
            checkedAt: new Date().toISOString(),
            confidence: 0,
            frameSampleCount: 0,
            mocked: true,
            provider: 'mock',
            reason: message,
            requirementSummary: task.title,
            status: 'UNCERTAIN',
          },
        });
      });

    return () => {
      cancelled = true;
    };
  }, [feedback, item, saveValidation, task]);

  if (!queueId) {
    return <QueueItemUnavailable message="Preview route is missing an upload queue ID." />;
  }

  if (isLoading) {
    return <QueueItemUnavailable message="Loading media preview..." />;
  }

  if (!item) {
    return <QueueItemUnavailable message={t('uploads.itemNotFound')} />;
  }

  const validationAllowsUpload =
    item.kind !== 'video' || canUploadWithValidation(item.preliminaryValidation, item.preliminaryValidationOverride);
  const canUpload = (item.status === 'queued' || item.status === 'failed') && validationAllowsUpload;

  return (
    <Screen>
      <AppButton icon={ArrowLeft} onPress={() => router.back()} style={styles.backButton} variant="ghost">
        {t('common.back')}
      </AppButton>

      <View>
        <AppText muted variant="small">
          {t('uploads.mediaPreview')}
        </AppText>
        <AppText variant="title">{item.taskTitle}</AppText>
      </View>

      <Card style={styles.previewCard}>
        <MediaPreview item={item} />
        <View style={styles.metaRow}>
          <Badge label={item.kind} tone="info" />
          <Badge label={getLocalizedUploadQueueStatusLabel(item.status, t)} tone={item.status === 'failed' ? 'danger' : 'neutral'} />
        </View>
        <AppText muted variant="small">
          {item.fileName} · {formatBytes(item.sizeBytes)} · {t('uploads.attempt')} {item.attempts}
        </AppText>
        <ProgressBar progress={item.progress} tone={item.status === 'failed' ? 'danger' : 'accent'} />
        {item.error ? (
          <AppText color={colors.red} variant="small">
            {getSafeFeedbackMessage(item.error, 'Upload failed. Please retry.')}
          </AppText>
        ) : null}
      </Card>

      {item.kind === 'video' ? (
        <ValidationCard
          checking={!item.preliminaryValidation || saveValidation.isPending}
          item={item}
          onContinueAnyway={() => {
            allowUncertain.mutate(item.id, {
              onSuccess: () => router.push(`/upload/${item.id}`),
            });
          }}
          onRetryRecording={() => router.replace(`/capture/${item.taskId}/video`)}
        />
      ) : null}

      {isResultStatus(item.status) ? (
        <AppButton icon={Play} onPress={() => router.replace(`/result/${item.id}`)}>
          {t('uploads.viewResult')}
        </AppButton>
      ) : item.status === 'failed' ? (
        <AppButton
          disabled={isOffline}
          icon={RotateCcw}
          loading={retryUpload.isPending}
          onPress={() => retryUpload.mutate(item.id)}
          variant="secondary">
          {t('uploads.retryUpload')}
        </AppButton>
      ) : (
        <AppButton
          disabled={!canUpload || isOffline}
          icon={CloudUpload}
          loading={startUpload.isPending || item.status === 'uploading'}
          onPress={() => router.push(`/upload/${item.id}`)}>
          {t('common.upload')}
        </AppButton>
      )}
    </Screen>
  );
}

function QueueItemUnavailable({ message }: { message: string }) {
  const t = useTranslation();
  return (
    <Screen>
      <AppButton icon={ArrowLeft} onPress={() => router.back()} style={styles.backButton} variant="ghost">
        {t('common.back')}
      </AppButton>
      <Card>
        <AppText>{message}</AppText>
      </Card>
    </Screen>
  );
}

function ValidationCard({
  checking,
  item,
  onContinueAnyway,
  onRetryRecording,
}: {
  checking: boolean;
  item: UploadQueueItem;
  onContinueAnyway: () => void;
  onRetryRecording: () => void;
}) {
  const t = useTranslation();
  const validation = item.preliminaryValidation;
  const status = validation?.status;
  const Icon = status === 'MATCH' ? CheckCircle2 : status === 'MISMATCH' ? AlertTriangle : ShieldQuestion;
  const title = checking
    ? t('contentValidation.checking')
    : status === 'MATCH'
      ? t('contentValidation.match')
      : status === 'MISMATCH'
        ? t('contentValidation.mismatch')
        : t('contentValidation.uncertain');
  const tone = status === 'MATCH' ? 'success' : status === 'MISMATCH' ? 'danger' : 'warning';

  return (
    <Card style={styles.validationCard}>
      <View style={styles.validationTop}>
        <Icon color={status === 'MATCH' ? colors.green : status === 'MISMATCH' ? colors.red : colors.amber} size={22} />
        <View style={styles.validationText}>
          <AppText variant="subheading">{title}</AppText>
          <AppText muted variant="small">
            {validation?.reason ?? t('contentValidation.mocked')}
          </AppText>
        </View>
        {validation ? <Badge label={`${Math.round(validation.confidence * 100)}%`} tone={tone} /> : <Badge label={t('common.mock')} tone="info" />}
      </View>
      {validation?.mocked ? <Badge label={t('contentValidation.mocked')} tone="info" /> : null}
      {status === 'MISMATCH' ? (
        <AppButton icon={RotateCcw} onPress={onRetryRecording} variant="secondary">
          {t('contentValidation.retryRecording')}
        </AppButton>
      ) : null}
      {status === 'UNCERTAIN' && !item.preliminaryValidationOverride ? (
        <View style={styles.validationActions}>
          <AppButton icon={RotateCcw} onPress={onRetryRecording} style={styles.validationButton} variant="secondary">
            {t('contentValidation.retryRecording')}
          </AppButton>
          <AppButton onPress={onContinueAnyway} style={styles.validationButton} variant="secondary">
            {t('contentValidation.continueAnyway')}
          </AppButton>
        </View>
      ) : null}
    </Card>
  );
}

function isResultStatus(status: UploadQueueItem['status']) {
  return status === 'uploaded';
}

function MediaPreview({ item }: { item: UploadQueueItem }) {
  if (item.kind === 'image') {
    return <Image source={{ uri: item.localUri }} style={styles.imagePreview} />;
  }

  if (item.kind === 'video') {
    return <VideoPreview uri={item.localUri} />;
  }

  return <AudioPreview uri={item.localUri} />;
}

function VideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
  });

  return <VideoView contentFit="cover" nativeControls player={player} style={styles.videoPreview} />;
}

function AudioPreview({ uri }: { uri: string }) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const isPlaying = status.playing;
  const t = useTranslation();

  return (
    <View style={styles.audioPreview}>
      <View style={styles.wave}>
        {Array.from({ length: 18 }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.waveBar,
              {
                height: 18 + ((index * 11) % 42),
                opacity: isPlaying ? 1 : 0.58,
              },
            ]}
          />
        ))}
      </View>
      <AppButton icon={isPlaying ? Pause : Play} onPress={() => (isPlaying ? player.pause() : player.play())}>
        {isPlaying ? t('common.pause') : t('common.play')}
      </AppButton>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 0,
  },
  previewCard: {
    gap: spacing.md,
  },
  imagePreview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
  },
  videoPreview: {
    width: '100%',
    aspectRatio: 9 / 16,
    maxHeight: 420,
    borderRadius: 8,
    backgroundColor: colors.ink,
  },
  audioPreview: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
  },
  wave: {
    height: 90,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  waveBar: {
    width: 6,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  validationActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  validationButton: {
    flexBasis: '46%',
    flexGrow: 1,
    minWidth: 136,
  },
  validationCard: {
    gap: spacing.md,
  },
  validationText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  validationTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
});
