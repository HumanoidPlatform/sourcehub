import { RecordingPresets, requestRecordingPermissionsAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Mic, Square } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Card } from '@/components/common/card';
import { ProgressBar } from '@/components/common/progress-bar';
import { Screen } from '@/components/common/screen';
import { getSafeFeedbackMessage } from '@/features/feedback/error-messages';
import { QcIndicators } from '@/components/work/qc-indicators';
import { useFeedback } from '@/features/feedback/feedback-provider';
import { useTranslation } from '@/features/localization/use-translation';
import { useCreateUploadQueueItem } from '@/features/uploads/use-upload-queue';
import { useTask } from '@/hooks/use-odp-queries';
import { colors, spacing } from '@/theme/tokens';
import { firstRouteParam } from '@/utils/route-params';

export default function AudioCaptureScreen() {
  const params = useLocalSearchParams<{ taskId?: string | string[] }>();
  const taskId = firstRouteParam(params.taskId);
  const { data: task, error } = useTask(taskId);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const createQueueItem = useCreateUploadQueueItem();
  const feedback = useFeedback();
  const t = useTranslation();
  const durationSeconds = recorderState.durationMillis / 1000;
  const progress = Math.min(1, durationSeconds / 15);
  const taskReady = Boolean(taskId && task?.requiredMedia.includes('audio'));

  async function startRecording() {
    if (!taskReady) {
      feedback.showError(error ? getSafeFeedbackMessage(error, 'Task could not be loaded.') : 'Audio capture is not available for this task.');
      return;
    }
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        feedback.showWarning('Microphone permission is required to record audio.');
        return;
      }
      await recorder.prepareToRecordAsync();
      recorder.record();
      feedback.showInfo('Recording started', 1800);
    } catch (caught) {
      feedback.showError(getSafeFeedbackMessage(caught, 'Could not start audio recording.'));
    }
  }

  async function stopRecording() {
    if (!taskReady || !task) {
      feedback.showError(error ? getSafeFeedbackMessage(error, 'Task could not be loaded.') : 'Audio capture is not available for this task.');
      return;
    }
    try {
      await recorder.stop();
      if (!recorder.uri) {
        feedback.showWarning('Audio recording was cancelled.');
        return;
      }
      const item = await createQueueItem.mutateAsync({
        durationMs: Math.round(recorderState.durationMillis),
        fileName: `audio-${Date.now()}.m4a`,
        kind: 'audio',
        mimeType: 'audio/m4a',
        taskId,
        taskTitle: task?.title ?? 'Cosaarthi task',
        uri: recorder.uri,
      });
      router.replace(`/preview/${item.id}`);
    } catch (caught) {
      feedback.showError(getSafeFeedbackMessage(caught, 'Could not prepare audio for upload.'));
    }
  }

  return (
    <Screen>
      <AppButton icon={ArrowLeft} onPress={() => router.back()} style={styles.backButton} variant="ghost">
        {t('common.back')}
      </AppButton>
      <View>
        <AppText muted variant="small">
          {t('camera.audioCapture')}
        </AppText>
        <AppText variant="title">{task?.title ?? t('camera.captureAudio')}</AppText>
      </View>

      <Card style={styles.card}>
        <View style={[styles.micWrap, recorderState.isRecording && styles.micLive]}>
          <Mic color={colors.white} size={36} />
        </View>
        <AppText variant="heading">{recorderState.isRecording ? t('camera.recording') : t('common.ready')}</AppText>
        <AppText muted style={styles.center}>
          {Math.round(durationSeconds)} {t('camera.secondsCaptured')}
        </AppText>
        <ProgressBar progress={progress} tone={progress >= 1 ? 'warning' : 'accent'} />
      </Card>

      <QcIndicators phase={recorderState.isRecording ? t('camera.recording') : t('common.ready')} />

      {recorderState.isRecording ? (
        <AppButton icon={Square} loading={createQueueItem.isPending} onPress={stopRecording} variant="danger">
          {t('camera.stopAndSave')}
        </AppButton>
      ) : (
        <AppButton disabled={!taskReady} icon={Mic} onPress={startRecording}>
          {t('camera.startRecording')}
        </AppButton>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 0,
  },
  card: {
    alignItems: 'center',
    gap: spacing.md,
  },
  micWrap: {
    width: 96,
    height: 96,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  micLive: {
    backgroundColor: colors.red,
  },
  center: {
    textAlign: 'center',
  },
});
