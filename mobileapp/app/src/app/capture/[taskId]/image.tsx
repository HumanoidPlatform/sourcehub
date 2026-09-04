import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Camera, ImagePlus } from 'lucide-react-native';
import { useRef } from 'react';
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
import {
  getMinioTestImageSlot,
  getMinioTestQueueFileName,
  isAllowedMinioTestImageFile,
} from '@/features/minio-upload-test/minio-upload-test-task';
import { getRequiredPhotoUploadCount } from '@/features/uploads/photo-upload-progress';
import { useCreateUploadQueueItem, useUploadQueue } from '@/features/uploads/use-upload-queue';
import { useTask } from '@/hooks/use-odp-queries';
import { colors, spacing } from '@/theme/tokens';
import { firstRouteParam } from '@/utils/route-params';

export default function ImageCaptureScreen() {
  const params = useLocalSearchParams<{ taskId?: string | string[] }>();
  const taskId = firstRouteParam(params.taskId);
  const { data: task, error } = useTask(taskId);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const { height } = useWindowDimensions();
  const createQueueItem = useCreateUploadQueueItem();
  const { data: uploadQueue = [] } = useUploadQueue();
  const feedback = useFeedback();
  const t = useTranslation();
  const taskReady = Boolean(taskId && task?.requiredMedia.includes('image'));
  const requiredUploadCount = getRequiredPhotoUploadCount(task);
  const hasPhotoUploadRequirement = requiredUploadCount > 0;
  const guidance = usePositioningGuidance({
    active: taskReady && Boolean(permission?.granted) && !createQueueItem.isPending,
  });

  async function queueImage(uri: string, fileName?: string, sizeBytes?: number, assetMimeType?: string) {
    if (!taskReady || !task) {
      feedback.showError('Image capture is not available for this task.');
      return;
    }
    const taskUploads = uploadQueue.filter((item) => item.taskId === taskId && item.kind === 'image');
    if (hasPhotoUploadRequirement && taskUploads.length >= requiredUploadCount) {
      feedback.showWarning(`This task already has ${requiredUploadCount} queued images. Retry failed images before adding more.`);
      router.replace(`/task/${taskId}/start`);
      return;
    }
    const mimeType = assetMimeType === 'image/png' || fileName?.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    if (hasPhotoUploadRequirement && !isAllowedMinioTestImageFile(fileName, assetMimeType ?? mimeType, task.allowedFileTypes)) {
      feedback.showError('Only jpg, jpeg and png images are allowed for this task.');
      return;
    }
    const photoSlot = hasPhotoUploadRequirement ? getMinioTestImageSlot(taskUploads, taskId, requiredUploadCount) : undefined;
    try {
      const item = await createQueueItem.mutateAsync({
        fileName: photoSlot ? getMinioTestQueueFileName(photoSlot, fileName, mimeType) : fileName,
        kind: 'image',
        mimeType,
        sizeBytes,
        taskId,
        taskTitle: task?.title ?? 'Cosaarthi task',
        uri,
      });
      if (hasPhotoUploadRequirement) {
        feedback.showInfo(`${photoSlot}/${requiredUploadCount} image queued for upload.`);
        router.replace(`/task/${taskId}/start`);
      } else {
        router.replace(`/preview/${item.id}`);
      }
    } catch (caught) {
      feedback.showError(getSafeFeedbackMessage(caught, 'Could not prepare image for upload.'));
    }
  }

  async function capturePhoto() {
    if (!taskReady) {
      feedback.showError(error ? getSafeFeedbackMessage(error, 'Task could not be loaded.') : 'Image capture is not available for this task.');
      return;
    }
    if (!permission?.granted) {
      const requested = await requestPermission();
      if (!requested.granted) {
        feedback.showWarning('Camera permission is required to capture an image.');
        return;
      }
    }
    if (guidance.captureGate.disabled) {
      feedback.showWarning(guidance.captureGate.reason);
      return;
    }

    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.78 });
    if (photo?.uri) {
      await queueImage(photo.uri);
    } else {
      feedback.showWarning('Image capture was cancelled.');
    }
  }

  async function pickPhoto() {
    if (!taskReady) {
      feedback.showError(error ? getSafeFeedbackMessage(error, 'Task could not be loaded.') : 'Image capture is not available for this task.');
      return;
    }
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        feedback.showWarning('Photo library permission is required to choose an image.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.82,
      });
      if (result.canceled) {
        feedback.showInfo('Image selection cancelled.');
        return;
      }
      const asset = result.assets[0];
      if (asset) {
        await queueImage(asset.uri, asset.fileName ?? undefined, asset.fileSize ?? undefined, asset.mimeType);
      }
    } catch (caught) {
      feedback.showError(getSafeFeedbackMessage(caught, 'Could not choose an image.'));
    }
  }

  const compactLayout = height < 740;
  const veryCompactLayout = height < 640;

  return (
    <Screen scroll={false} style={[styles.screen, compactLayout && styles.compactScreen]}>
      <AppButton icon={ArrowLeft} onPress={() => router.back()} style={styles.backButton} variant="ghost">
        {t('common.back')}
      </AppButton>
      <View>
        <AppText muted variant="small">
          {t('camera.imageCapture')}
        </AppText>
        <AppText variant="title">{task?.title ?? t('camera.captureImage')}</AppText>
      </View>

      <View style={[styles.cameraWrap, compactLayout && styles.cameraWrapCompact, veryCompactLayout && styles.cameraWrapVeryCompact]}>
        {permission?.granted ? (
          <View style={styles.cameraPreview}>
            <CameraView ref={cameraRef} animateShutter facing="back" style={styles.camera} />
            <View pointerEvents="none" style={styles.cameraOverlay}>
              <PositioningGuidanceOverlay result={guidance.result} />
            </View>
          </View>
        ) : (
          <Card style={styles.permissionCard}>
            <Camera color={colors.accentDark} size={28} />
            <AppText variant="subheading">{t('camera.cameraPermission')}</AppText>
            <AppText muted style={styles.center}>
              {t('camera.cameraPermissionDetail')}
            </AppText>
            <AppButton icon={Camera} onPress={requestPermission}>
              {t('camera.allowCamera')}
            </AppButton>
          </Card>
        )}
      </View>

      <View style={styles.actions}>
        <AppButton
          disabled={!taskReady || guidance.captureGate.disabled}
          icon={Camera}
          loading={createQueueItem.isPending}
          onPress={capturePhoto}>
          {t('camera.capture')}
        </AppButton>
        {guidance.captureGate.disabled ? (
          <AppText color={colors.red} variant="small">
            {guidance.captureGate.reason}
          </AppText>
        ) : null}
        <AppButton disabled={!taskReady} icon={ImagePlus} onPress={pickPhoto} variant="secondary">
          {t('camera.pickImage')}
        </AppButton>
      </View>
      <QcIndicators guidance={guidance.result} phase={createQueueItem.isPending ? 'queue/upload' : 'framing'} />
    </Screen>
  );
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
    position: 'relative',
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
  cameraPreview: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  camera: {
    ...StyleSheet.absoluteFill,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
    elevation: 10,
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
