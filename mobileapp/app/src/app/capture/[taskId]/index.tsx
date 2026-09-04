import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Camera, Mic, Video } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Card } from '@/components/common/card';
import { Screen } from '@/components/common/screen';
import { getSafeFeedbackMessage } from '@/features/feedback/error-messages';
import { useTranslation } from '@/features/localization/use-translation';
import { useTask } from '@/hooks/use-odp-queries';
import { spacing } from '@/theme/tokens';
import { firstRouteParam } from '@/utils/route-params';

export default function CaptureChooserScreen() {
  const params = useLocalSearchParams<{ taskId?: string | string[] }>();
  const taskId = firstRouteParam(params.taskId);
  const { data: task, error, isLoading } = useTask(taskId);
  const t = useTranslation();

  if (!taskId) {
    return <CaptureChooserUnavailable message="Capture route is missing a task ID." />;
  }

  if (error && !task) {
    return <CaptureChooserUnavailable message={getSafeFeedbackMessage(error, 'Task could not be loaded.')} />;
  }

  return (
    <Screen>
      <AppButton icon={ArrowLeft} onPress={() => router.back()} style={styles.backButton} variant="ghost">
        {t('common.back')}
      </AppButton>
      <View>
        <AppText muted variant="small">
          {t('camera.capture')}
        </AppText>
        <AppText variant="title">{task?.title ?? t('camera.taskMedia')}</AppText>
      </View>
      <Card style={styles.actions}>
        {isLoading ? <AppText muted>Loading task media requirements...</AppText> : null}
        {task?.requiredMedia.includes('image') ? (
          <AppButton icon={Camera} onPress={() => router.push(`/capture/${taskId}/image`)} variant="secondary">
            {t('camera.imageCapture')}
          </AppButton>
        ) : null}
        {task?.requiredMedia.includes('video') ? (
          <AppButton icon={Video} onPress={() => router.push(`/capture/${taskId}/video`)} variant="secondary">
            {t('camera.videoCapture')}
          </AppButton>
        ) : null}
        {task?.requiredMedia.includes('audio') ? (
          <AppButton icon={Mic} onPress={() => router.push(`/capture/${taskId}/audio`)} variant="secondary">
            {t('camera.audioCapture')}
          </AppButton>
        ) : null}
        {!isLoading && task?.requiredMedia.length === 0 ? <AppText muted>No media capture is required for this task.</AppText> : null}
      </Card>
    </Screen>
  );
}

function CaptureChooserUnavailable({ message }: { message: string }) {
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
  actions: {
    gap: spacing.md,
  },
});
