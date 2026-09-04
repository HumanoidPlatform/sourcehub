import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, FolderOpen, Square, Video } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Card } from '@/components/common/card';
import { Screen } from '@/components/common/screen';
import { PositioningGuidanceOverlay } from '@/components/work/positioning-guidance-overlay';
import { QcIndicators } from '@/components/work/qc-indicators';
import { usePositioningGuidance } from '@/features/capture-guidance/use-positioning-guidance';
import { getSafeFeedbackMessage } from '@/features/feedback/error-messages';
import { useFeedback } from '@/features/feedback/feedback-provider';
import { useTranslation } from '@/features/localization/use-translation';
import { useCreateUploadQueueItem } from '@/features/uploads/use-upload-queue';
import { useTask } from '@/hooks/use-odp-queries';
import { colors, spacing } from '@/theme/tokens';
import { firstRouteParam } from '@/utils/route-params';

export default function VideoCaptureScreen() {
  const params = useLocalSearchParams<{ taskId?: string | string[] }>();
  const taskId = firstRouteParam(params.taskId);
  const { data: task, error } = useTask(taskId);
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [recording, setRecording] = useState(false);
  const [recordingElapsedMs, setRecordingElapsedMs] = useState(0);
  const recordingStartedAtRef = useRef<number | null>(null);
  const minimumDurationAnnouncedRef = useRef(false);
  const { height } = useWindowDimensions();
  const createQueueItem = useCreateUploadQueueItem();
  const feedback = useFeedback();
  const t = useTranslation();
  const requiredDurationMs = task?.requiredDurationMs;
  const taskReady = Boolean(taskId && task?.requiredMedia.includes('video'));
  const guidance = usePositioningGuidance({
    active: taskReady && Boolean(cameraPermission?.granted) && !createQueueItem.isPending,
  });

  async function queueVideo(uri: string, fileName?: string, sizeBytes?: number, durationMs?: number) {
    if (!taskReady || !task) {
      feedback.showError('Video capture is not available for this task.');
      return;
    }
    if (requiredDurationMs && durationMs && durationMs < requiredDurationMs) {
      feedback.showWarning('Required duration has not been reached');
    }
    try {
      const item = await createQueueItem.mutateAsync({
        durationMs,
        fileName,
        kind: 'video',
        mimeType: fileName?.toLowerCase().endsWith('.mov') ? 'video/quicktime' : 'video/mp4',
        requiredDurationMs,
        sizeBytes,
        taskId,
        taskTitle: task?.title ?? 'Cosaarthi task',
        uri,
      });
      router.replace(`/preview/${item.id}`);
    } catch (caught) {
      feedback.showError(getSafeFeedbackMessage(caught, 'Could not prepare video for upload.'));
    }
  }

  async function ensurePermissions() {
    const camera = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
    if (!camera.granted) {
      feedback.showWarning('Camera permission is required to record video.');
      return false;
    }

    const microphone = microphonePermission?.granted ? microphonePermission : await requestMicrophonePermission();
    if (!microphone.granted) {
      feedback.showWarning('Microphone permission is required to record video.');
    }
    return microphone.granted;
  }

  async function recordVideo() {
    if (!taskReady) {
      feedback.showError(error ? getSafeFeedbackMessage(error, 'Task could not be loaded.') : 'Video capture is not available for this task.');
      return;
    }
    const hasPermissions = await ensurePermissions();
    if (!hasPermissions || recording) {
      return;
    }
    if (guidance.captureGate.disabled) {
      feedback.showWarning(guidance.captureGate.reason);
      return;
    }

    setRecording(true);
    recordingStartedAtRef.current = Date.now();
    minimumDurationAnnouncedRef.current = false;
    setRecordingElapsedMs(0);
    feedback.showInfo('Recording started', 1800);
    try {
      const video = await cameraRef.current?.recordAsync({
        maxDuration: Math.max(60, Math.ceil((requiredDurationMs ?? 0) / 1000) + 15),
        maxFileSize: 250 * 1024 * 1024,
      });
      if (video?.uri) {
        const durationMs = recordingStartedAtRef.current ? Date.now() - recordingStartedAtRef.current : undefined;
        await queueVideo(video.uri, undefined, undefined, durationMs);
      } else {
        feedback.showInfo('Video recording cancelled.');
      }
    } catch (caught) {
      feedback.showError(getSafeFeedbackMessage(caught, 'Could not record video.'));
    } finally {
      setRecording(false);
      recordingStartedAtRef.current = null;
    }
  }

  function stopRecording() {
    cameraRef.current?.stopRecording();
  }

  async function pickVideo() {
    if (!taskReady) {
      feedback.showError(error ? getSafeFeedbackMessage(error, 'Task could not be loaded.') : 'Video capture is not available for this task.');
      return;
    }
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        feedback.showWarning('Photo library permission is required to choose a video.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        mediaTypes: ['videos'],
        quality: 0.8,
        videoMaxDuration: Math.min(600, Math.max(60, Math.ceil((requiredDurationMs ?? 60_000) / 1000))),
      });

      if (result.canceled) {
        feedback.showInfo('Video selection cancelled.');
        return;
      }
      const asset = result.assets[0];
      if (asset) {
        await queueVideo(asset.uri, asset.fileName ?? undefined, asset.fileSize ?? undefined, asset.duration ?? undefined);
      }
    } catch (caught) {
      feedback.showError(getSafeFeedbackMessage(caught, 'Could not choose a video.'));
    }
  }

  useEffect(() => {
    if (!recording) {
      return undefined;
    }

    const interval = setInterval(() => {
      if (recordingStartedAtRef.current) {
        setRecordingElapsedMs(Date.now() - recordingStartedAtRef.current);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [recording]);

  useEffect(() => {
    if (!recording || !requiredDurationMs || minimumDurationAnnouncedRef.current || recordingElapsedMs < requiredDurationMs) {
      return;
    }
    minimumDurationAnnouncedRef.current = true;
    feedback.showSuccess('Minimum required recording duration reached');
  }, [feedback, recording, recordingElapsedMs, requiredDurationMs]);

  const needsPermission = !cameraPermission?.granted || !microphonePermission?.granted;
  const requiredDurationLabel = requiredDurationMs ? formatDuration(requiredDurationMs) : null;
  const recordingDurationLabel = formatDuration(recordingElapsedMs);
  const durationProgress = requiredDurationMs ? Math.min(1, recordingElapsedMs / requiredDurationMs) : undefined;
  const compactLayout = height < 740;
  const veryCompactLayout = height < 640;

  return (
    <Screen scroll={false} style={[styles.screen, compactLayout && styles.compactScreen]}>
      <AppButton icon={ArrowLeft} onPress={() => router.back()} style={styles.backButton} variant="ghost">
        {t('common.back')}
      </AppButton>
      <View>
        <AppText muted variant="small">
          {t('camera.videoCapture')}
        </AppText>
        <AppText variant="title">{task?.title ?? t('camera.captureVideo')}</AppText>
        {requiredDurationLabel ? (
          <AppText muted variant="small">
            {t('task.requiredDuration')}: {requiredDurationLabel}
          </AppText>
        ) : null}
      </View>

      <View style={[styles.cameraWrap, compactLayout && styles.cameraWrapCompact, veryCompactLayout && styles.cameraWrapVeryCompact]}>
        {needsPermission ? (
          <Card style={styles.permissionCard}>
            <Video color={colors.accentDark} size={28} />
            <AppText variant="subheading">{t('camera.recordingPermission')}</AppText>
            <AppText muted style={styles.center}>
              {t('camera.recordingPermissionDetail')}
            </AppText>
            <AppButton icon={Video} onPress={ensurePermissions}>
              {t('camera.allowRecording')}
            </AppButton>
          </Card>
        ) : (
          <CameraView
            ref={cameraRef}
            facing="back"
            mode="video"
            mute={false}
            responsiveOrientationWhenOrientationLocked
            style={styles.camera}
            videoQuality="720p">
            <PositioningGuidanceOverlay result={guidance.result} />
          </CameraView>
        )}
      </View>

      <QcIndicators guidance={guidance.result} phase={createQueueItem.isPending ? 'queue/upload' : 'steady'} />

      <View style={styles.actions}>
        {recording ? (
          <AppText muted variant="small">
            {recordingDurationLabel}
            {requiredDurationLabel ? ` / ${requiredDurationLabel}` : ''}
            {durationProgress !== undefined ? ` (${Math.round(durationProgress * 100)}%)` : ''}
          </AppText>
        ) : null}
        {recording ? (
          <AppButton icon={Square} onPress={stopRecording} variant="danger">
            {t('camera.stopRecording')}
          </AppButton>
        ) : (
          <AppButton
            disabled={!taskReady || guidance.captureGate.disabled}
            icon={Video}
            loading={createQueueItem.isPending}
            onPress={recordVideo}>
            {t('camera.recordVideo')}
          </AppButton>
        )}
        {guidance.captureGate.disabled && !recording ? (
          <AppText color={colors.red} variant="small">
            {guidance.captureGate.reason}
          </AppText>
        ) : null}
        {createQueueItem.error ? (
          <AppText color={colors.red} variant="small">
            {getSafeFeedbackMessage(createQueueItem.error, t('uploads.failed'))}
          </AppText>
        ) : null}
        <AppButton disabled={!taskReady} icon={FolderOpen} onPress={pickVideo} variant="secondary">
          {t('camera.pickVideo')}
        </AppButton>
      </View>
    </Screen>
  );
}

function formatDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${seconds}s`;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  compactScreen: {
    gap: spacing.sm,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 0,
  },
  cameraWrap: {
    flex: 1,
    flexShrink: 1,
    minHeight: 280,
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: colors.ink,
  },
  cameraWrapCompact: {
    minHeight: 220,
  },
  cameraWrapVeryCompact: {
    minHeight: 168,
  },
  camera: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  permissionCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    margin: spacing.lg,
  },
  center: {
    textAlign: 'center',
  },
  actions: {
    flexShrink: 0,
    gap: spacing.md,
  },
});
