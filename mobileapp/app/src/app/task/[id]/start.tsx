import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Camera, CheckCircle2, ImagePlus, Mic, RotateCcw, Video } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Badge } from '@/components/common/badge';
import { Card } from '@/components/common/card';
import { ProgressBar } from '@/components/common/progress-bar';
import { Screen } from '@/components/common/screen';
import { ReadinessGate } from '@/components/work/readiness-gate';
import { getSafeFeedbackMessage } from '@/features/feedback/error-messages';
import { useFeedback } from '@/features/feedback/feedback-provider';
import { useTranslation } from '@/features/localization/use-translation';
import {
  getMinioTestImageSlot,
  getMinioTestQueueFileName,
  isAllowedMinioTestImageFile,
  MINIO_UPLOAD_TEST_BUCKET,
} from '@/features/minio-upload-test/minio-upload-test-task';
import { getReadinessBlocker } from '@/features/readiness/readiness';
import { getPhotoUploadProgress, hasRequiredPhotoUploads } from '@/features/uploads/photo-upload-progress';
import { useCreateUploadQueueItem, useRetryUpload, useStartUpload, useUploadQueue } from '@/features/uploads/use-upload-queue';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useCreateSubmission, useHomeSummary, useTask } from '@/hooks/use-odp-queries';
import { colors, spacing } from '@/theme/tokens';
import type { MediaKind, Task, UploadQueueItem } from '@/types/domain';
import { firstRouteParam } from '@/utils/route-params';

const captureMap = {
  audio: { icon: Mic, labelKey: 'camera.audioCapture', route: 'audio' },
  image: { icon: Camera, labelKey: 'camera.imageCapture', route: 'image' },
  video: { icon: Video, labelKey: 'camera.videoCapture', route: 'video' },
} satisfies Record<MediaKind, { icon: typeof Camera; labelKey: 'camera.audioCapture' | 'camera.imageCapture' | 'camera.videoCapture'; route: string }>;

export default function StartTaskScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const taskId = firstRouteParam(params.id);
  const { data: task, error, isLoading } = useTask(taskId);
  const { data: summary } = useHomeSummary();
  const blocker = getReadinessBlocker(summary?.readiness ?? []);
  const t = useTranslation();
  const hasPhotoUploadRequirement = hasRequiredPhotoUploads(task);

  if (!taskId) {
    return <StartTaskUnavailable message="Task route is missing a task ID." />;
  }

  if (error && !task) {
    return <StartTaskUnavailable message={getSafeFeedbackMessage(error, 'Task could not be loaded.')} />;
  }

  return (
    <Screen>
      <AppButton icon={ArrowLeft} onPress={() => router.back()} style={styles.backButton} variant="ghost">
        {t('common.back')}
      </AppButton>
      <View style={styles.header}>
        <Badge label={t('camera.startTask')} tone="info" />
        <AppText variant="title">{task?.title ?? t('task.fallbackTitle')}</AppText>
        <AppText muted>
          {t('camera.startTaskDetail')}
        </AppText>
      </View>

      {summary?.readiness ? <ReadinessGate checks={summary.readiness} /> : null}

      {hasPhotoUploadRequirement && task ? (
        <PhotoUploadTaskPanel blocked={Boolean(blocker)} task={task} />
      ) : (
        <Card style={styles.card}>
          <AppText variant="subheading">{t('camera.captureRequiredMedia')}</AppText>
          {isLoading ? (
            <AppText muted>Loading task media requirements...</AppText>
          ) : null}
          {blocker ? (
            <AppText color={colors.red} variant="small">
              {t('camera.captureDisabledBy')} {blocker.label}: {blocker.detail}
            </AppText>
          ) : null}
          <View style={styles.actions}>
            {(task?.requiredMedia ?? []).map((kind) => {
              const action = captureMap[kind];
              return (
                <AppButton
                  disabled={Boolean(blocker) || !task}
                  key={kind}
                  icon={action.icon}
                  onPress={() => router.push(`/capture/${taskId}/${action.route}`)}
                  variant="secondary">
                  {t(action.labelKey)}
                </AppButton>
              );
            })}
          </View>
          {!isLoading && task?.requiredMedia.length === 0 ? <AppText muted>No media capture is required for this task.</AppText> : null}
        </Card>
      )}

      {!hasPhotoUploadRequirement ? (
        <AppButton disabled={!task || task.requiredMedia.length === 0} onPress={() => router.push(`/capture/${taskId}`)} variant="ghost">
          {t('camera.captureChooser')}
        </AppButton>
      ) : null}
    </Screen>
  );
}

type AsyncActionStatus = 'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR';

function PhotoUploadTaskPanel({ blocked, task }: { blocked: boolean; task: Task }) {
  const { data: queue = [] } = useUploadQueue();
  const createQueueItem = useCreateUploadQueueItem();
  const startUpload = useStartUpload();
  const retryUpload = useRetryUpload();
  const createSubmission = useCreateSubmission();
  const { isOffline } = useNetworkStatus();
  const feedback = useFeedback();
  const [captureStatus, setCaptureStatus] = useState<AsyncActionStatus>('IDLE');
  const [selectStatus, setSelectStatus] = useState<AsyncActionStatus>('IDLE');
  const [submissionStatus, setSubmissionStatus] = useState<AsyncActionStatus>('IDLE');
  const uploadProgress = useMemo(() => getPhotoUploadProgress(task, queue), [queue, task]);
  const taskUploads = uploadProgress.taskUploads;
  const nextQueuedItem = taskUploads.find((item) => item.status === 'queued');
  const requiredUploadCount = uploadProgress.requiredUploadCount;
  const storageBucket = task.storageBucket ?? MINIO_UPLOAD_TEST_BUCKET;
  const hasOpenSlots = taskUploads.length < requiredUploadCount;
  const readyToSubmit = uploadProgress.isComplete;
  const busyUploading = startUpload.isPending || uploadProgress.uploadingCount > 0;
  const cannotAddMoreMessage = `This task already has ${requiredUploadCount} queued images. Retry failed images before adding more.`;

  useEffect(() => {
    if (isOffline || startUpload.isPending) {
      return;
    }
    if (!nextQueuedItem) {
      return;
    }
    startUpload.mutate(nextQueuedItem.id);
  }, [isOffline, nextQueuedItem, startUpload]);

  function openCamera() {
    setCaptureStatus('LOADING');
    if (blocked) {
      setCaptureStatus('ERROR');
      feedback.showWarning('Capture is blocked by readiness checks.');
      return;
    }
    if (!hasOpenSlots) {
      setCaptureStatus('ERROR');
      feedback.showWarning(cannotAddMoreMessage);
      return;
    }
    setCaptureStatus('SUCCESS');
    router.push(`/capture/${task.id}/image`);
  }

  async function selectImage() {
    if (blocked) {
      setSelectStatus('ERROR');
      feedback.showWarning('Capture is blocked by readiness checks.');
      return;
    }
    if (!hasOpenSlots) {
      setSelectStatus('ERROR');
      feedback.showWarning(cannotAddMoreMessage);
      return;
    }

    setSelectStatus('LOADING');
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setSelectStatus('ERROR');
        feedback.showWarning('Photo library permission is required to choose an image.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.82,
      });
      if (result.canceled) {
        setSelectStatus('IDLE');
        feedback.showInfo('Image selection cancelled.');
        return;
      }
      const asset = result.assets[0];
      if (!asset) {
        setSelectStatus('ERROR');
        feedback.showWarning('Image selection was cancelled.');
        return;
      }
      const sourceFileName = asset.fileName ?? undefined;
      const mimeType = asset.mimeType === 'image/png' || sourceFileName?.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
      if (!isAllowedMinioTestImageFile(sourceFileName, asset.mimeType ?? mimeType, task.allowedFileTypes)) {
        setSelectStatus('ERROR');
        feedback.showError('Only jpg, jpeg and png images are allowed for this task.');
        return;
      }
      const slot = getMinioTestImageSlot(taskUploads, task.id, requiredUploadCount);
      const item = await createQueueItem.mutateAsync({
        fileName: getMinioTestQueueFileName(slot, sourceFileName, mimeType),
        kind: 'image',
        mimeType,
        sizeBytes: asset.fileSize ?? undefined,
        taskId: task.id,
        taskTitle: task.title,
        uri: asset.uri,
      });
      setSelectStatus('SUCCESS');
      feedback.showInfo(`${slot}/${requiredUploadCount} image queued for upload.`);
      if (!isOffline) {
        startUpload.mutate(item.id);
      }
    } catch (caught) {
      setSelectStatus('ERROR');
      feedback.showError(getSafeFeedbackMessage(caught, 'Could not choose or queue this image.'));
    }
  }

  async function submitTask() {
    if (!readyToSubmit) {
      setSubmissionStatus('ERROR');
      feedback.showWarning(`Upload all ${requiredUploadCount} photos before submitting this task.`);
      return;
    }

    setSubmissionStatus('LOADING');
    try {
      const uploadedObjectKeys = uploadProgress.uploadedObjectKeys;
      await createSubmission.mutateAsync({
        campaignId: task.campaignId,
        idempotencyKey: `minio-final-${uploadProgress.uploadedItems.map((item) => item.id).join('-')}`,
        meta: {
          bucket: storageBucket,
          objectKeys: uploadedObjectKeys,
          uploadedCount: uploadedObjectKeys.length,
          requiredUploadCount,
        },
        payloadRef: `minio://${storageBucket}/${task.id}`,
        projectId: task.project,
        taskId: task.id,
        type: 'capture',
      });
      setSubmissionStatus('SUCCESS');
      feedback.showSuccess('MinIO upload test completed successfully');
    } catch (caught) {
      setSubmissionStatus('ERROR');
      feedback.showError(getSafeFeedbackMessage(caught, 'Could not submit the MinIO upload test.'));
    }
  }

  return (
    <Card style={styles.card}>
      <View style={styles.minioHeader}>
        <View style={styles.minioHeaderText}>
          <AppText variant="subheading">{task.title}</AppText>
          <AppText muted>{task.description}</AppText>
        </View>
        <Badge label={storageBucket} tone="info" />
      </View>

      <View style={styles.minioStats}>
        <MinioStat label="Required" value={`${requiredUploadCount}`} />
        <MinioStat label="Uploaded" value={`${uploadProgress.uploadedCount} / ${requiredUploadCount}`} />
        <MinioStat label="Remaining" value={`${uploadProgress.remainingCount}`} />
        <MinioStat danger={uploadProgress.failedCount > 0} label="Failed" value={`${uploadProgress.failedCount}`} />
      </View>

      <View style={styles.progressWrap}>
        <AppText variant="heading">{uploadProgress.label}</AppText>
        <ProgressBar progress={uploadProgress.progress} tone={uploadProgress.failedCount > 0 ? 'warning' : 'accent'} />
      </View>

      {blocked ? (
        <AppText color={colors.red} variant="small">
          Capture is blocked by readiness checks.
        </AppText>
      ) : null}
      {isOffline ? (
        <AppText color={colors.red} variant="small">
          You are offline. Queued images will remain in SQLite until upload can resume.
        </AppText>
      ) : null}

      <View style={styles.minioActions}>
        <AppButton disabled={blocked || !hasOpenSlots} icon={Camera} loading={captureStatus === 'LOADING'} onPress={openCamera} variant="secondary">
          Capture Image
        </AppButton>
        <AppButton disabled={blocked || !hasOpenSlots} icon={ImagePlus} loading={selectStatus === 'LOADING'} onPress={selectImage} variant="secondary">
          Select Image
        </AppButton>
      </View>

      <View style={styles.uploadList}>
        {taskUploads.length ? (
          taskUploads.map((item, index) => <MinioUploadRow item={item} key={item.id} number={index + 1} retrying={retryUpload.isPending} onRetry={() => retryUpload.mutate(item.id)} />)
        ) : (
          <AppText muted>No images queued yet.</AppText>
        )}
      </View>

      {readyToSubmit ? (
        <AppText color={colors.green} variant="label">
          {uploadProgress.label}
        </AppText>
      ) : null}

      <AppButton disabled={!readyToSubmit || submissionStatus === 'SUCCESS'} icon={CheckCircle2} loading={submissionStatus === 'LOADING'} onPress={submitTask}>
        Submit Task
      </AppButton>

      {submissionStatus === 'SUCCESS' ? (
        <AppText color={colors.green} variant="label">
          MinIO upload test completed successfully
        </AppText>
      ) : null}
      {busyUploading ? (
        <AppText muted variant="caption">
          Uploading images through the existing SQLite queue...
        </AppText>
      ) : null}
    </Card>
  );
}

function MinioUploadRow({ item, number, onRetry, retrying }: { item: UploadQueueItem; number: number; onRetry: () => void; retrying: boolean }) {
  const tone = item.status === 'failed' ? 'danger' : item.status === 'uploaded' ? 'success' : 'info';

  return (
    <View style={styles.uploadRow}>
      <View style={styles.uploadRowHeader}>
        <View style={styles.uploadRowText}>
          <AppText variant="label">Image {number}</AppText>
          <AppText muted numberOfLines={1} variant="caption">
            {item.fileName}
          </AppText>
        </View>
        <Badge label={item.status} tone={tone} />
      </View>
      <ProgressBar progress={item.progress} tone={item.status === 'failed' ? 'danger' : 'accent'} />
      {item.remoteObjectKey ? (
        <AppText muted numberOfLines={1} variant="caption">
          {item.remoteObjectKey}
        </AppText>
      ) : null}
      {item.error ? (
        <AppText color={colors.red} variant="small">
          {getSafeFeedbackMessage(item.error, 'Upload failed. Please retry.')}
        </AppText>
      ) : null}
      {item.status === 'failed' ? (
        <AppButton icon={RotateCcw} loading={retrying} onPress={onRetry} variant="secondary">
          Retry
        </AppButton>
      ) : null}
    </View>
  );
}

function MinioStat({ danger, label, value }: { danger?: boolean; label: string; value: string }) {
  return (
    <View style={styles.minioStat}>
      <AppText color={danger ? colors.red : colors.ink} variant="heading">
        {value}
      </AppText>
      <AppText muted variant="caption">
        {label}
      </AppText>
    </View>
  );
}

function StartTaskUnavailable({ message }: { message: string }) {
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

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 0,
  },
  header: {
    gap: spacing.md,
  },
  card: {
    gap: spacing.lg,
  },
  actions: {
    gap: spacing.md,
  },
  minioActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  minioHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  minioHeaderText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  minioStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  minioStat: {
    flex: 1,
    minWidth: 112,
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  progressWrap: {
    gap: spacing.sm,
  },
  uploadList: {
    gap: spacing.md,
  },
  uploadRow: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
  },
  uploadRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  uploadRowText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
});
