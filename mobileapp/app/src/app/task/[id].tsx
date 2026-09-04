import { router, type Href, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Camera, CheckCircle2, Clock, MapPin, Play } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Badge } from '@/components/common/badge';
import { Card } from '@/components/common/card';
import { ProgressBar } from '@/components/common/progress-bar';
import { Screen } from '@/components/common/screen';
import { SkeletonList } from '@/components/common/skeleton';
import { getSafeFeedbackMessage } from '@/features/feedback/error-messages';
import { useFeedback } from '@/features/feedback/feedback-provider';
import { useTranslation } from '@/features/localization/use-translation';
import { getPhotoUploadProgress } from '@/features/uploads/photo-upload-progress';
import { useUploadQueue } from '@/features/uploads/use-upload-queue';
import { useStartTask, useTask } from '@/hooks/use-odp-queries';
import { colors, spacing } from '@/theme/tokens';
import type { WorkType } from '@/types/domain';
import { formatCurrency, formatShortDate } from '@/utils/format';
import { firstRouteParam } from '@/utils/route-params';

export default function TaskDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const taskId = firstRouteParam(params.id);
  const { data: task, error, isLoading } = useTask(taskId);
  const { data: queue = [] } = useUploadQueue();
  const startTask = useStartTask();
  const feedback = useFeedback();
  const t = useTranslation();

  if (!taskId) {
    return <TaskUnavailable message="Task route is missing a task ID." />;
  }

  if (error && !task) {
    return <TaskUnavailable message={getSafeFeedbackMessage(error, 'Task could not be loaded.')} />;
  }

  if (isLoading || !task) {
    return (
      <Screen>
        <AppButton icon={ArrowLeft} onPress={() => router.back()} variant="ghost">
          {t('common.back')}
        </AppButton>
        <SkeletonList rows={3} />
      </Screen>
    );
  }

  const loadedTask = task;
  const workRoute = getTaskRoute(loadedTask.id, loadedTask.taskType);
  const photoProgress = getPhotoUploadProgress(loadedTask, queue);

  async function openWorkflow() {
    try {
      if (loadedTask.status === 'available') {
        await startTask.mutateAsync(loadedTask.id);
      }
      router.push(workRoute);
    } catch (caught) {
      feedback.showError(getSafeFeedbackMessage(caught, 'Unable to open this task.'));
    }
  }

  return (
    <Screen>
      <AppButton icon={ArrowLeft} onPress={() => router.back()} style={styles.backButton} variant="ghost">
        {t('common.back')}
      </AppButton>

      <View style={styles.header}>
        <Badge label={task.status.replace('_', ' ')} tone={task.status === 'available' ? 'success' : 'warning'} />
        <AppText variant="title">{task.title}</AppText>
        <AppText muted>{task.description}</AppText>
      </View>

      <Card style={styles.payCard}>
        <View>
          <AppText muted variant="small">
            {t('task.mockReward')}
          </AppText>
          <AppText variant="heading">{formatCurrency(task.pay, task.currency)}</AppText>
        </View>
        {task.category ? (
          <View style={styles.meta}>
            <AppText muted variant="small">
              {t('task.category')} · {task.category}
            </AppText>
          </View>
        ) : null}
        <View style={styles.meta}>
          <MapPin color={colors.slate500} size={16} />
          <AppText muted variant="small">
            {task.location}
          </AppText>
        </View>
        <View style={styles.meta}>
          <Clock color={colors.slate500} size={16} />
          <AppText muted variant="small">
            {task.estimatedMinutes} {t('task.min')} · {t('task.due')} {formatShortDate(task.dueAt)}
          </AppText>
        </View>
        <View style={styles.meta}>
          <Camera color={colors.slate500} size={16} />
          <AppText muted variant="small">
            {t('task.requires')} {task.requiredMedia.join(', ')}
          </AppText>
        </View>
        {photoProgress.hasRequirement ? (
          <View style={styles.photoProgress}>
            <View style={styles.photoProgressText}>
              <Camera color={colors.accentDark} size={16} />
              <AppText color={colors.accentDark} variant="label">
                {photoProgress.label}
              </AppText>
            </View>
            <ProgressBar progress={photoProgress.progress} tone={photoProgress.failedCount > 0 ? 'warning' : 'accent'} />
          </View>
        ) : null}
        {task.requiredDurationMs ? (
          <View style={styles.meta}>
            <Clock color={colors.slate500} size={16} />
            <AppText muted variant="small">
              {t('task.requiredDuration')} · {formatDuration(task.requiredDurationMs)}
            </AppText>
          </View>
        ) : null}
      </Card>

      <Card style={styles.qualityCard}>
        <AppText variant="subheading">{t('task.qualityBar')}</AppText>
        <AppText muted>{task.qualityBar}</AppText>
      </Card>

      <Card style={styles.checklist}>
        <AppText variant="subheading">{t('task.checklist')}</AppText>
        {task.checklist.map((item) => (
          <View key={item} style={styles.checkRow}>
            <CheckCircle2 color={colors.accentDark} size={18} />
            <AppText style={styles.checkText}>{item}</AppText>
          </View>
        ))}
      </Card>

      <AppButton icon={Play} loading={startTask.isPending} onPress={openWorkflow}>
        {loadedTask.status === 'available' ? 'Accept Task' : loadedTask.taskType === 'capture' ? t('task.startCapture') : t('task.openWorkflow')}
      </AppButton>
    </Screen>
  );
}

function TaskUnavailable({ message }: { message: string }) {
  const t = useTranslation();
  return (
    <Screen>
      <AppButton icon={ArrowLeft} onPress={() => router.back()} variant="ghost">
        {t('common.back')}
      </AppButton>
      <Card>
        <AppText>{message}</AppText>
      </Card>
    </Screen>
  );
}

function formatDuration(durationMs: number) {
  const minutes = Math.round(durationMs / 60_000);
  if (minutes >= 1) {
    return `${minutes} ${minutes === 1 ? 'min' : 'min'}`;
  }
  return `${Math.round(durationMs / 1000)} sec`;
}

function getTaskRoute(taskId: string, taskType: WorkType) {
  if (taskType === 'annotation') {
    return `/annotation/${taskId}` as Href;
  }
  if (taskType === 'transcription') {
    return `/transcription/${taskId}` as Href;
  }
  if (taskType === 'survey') {
    return `/survey/${taskId}` as Href;
  }
  if (taskType === 'sxs') {
    return `/rating/${taskId}` as Href;
  }
  return `/task/${taskId}/start` as Href;
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 0,
  },
  header: {
    gap: spacing.md,
  },
  payCard: {
    gap: spacing.md,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoProgress: {
    gap: spacing.sm,
  },
  photoProgressText: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  qualityCard: {
    gap: spacing.sm,
  },
  checklist: {
    gap: spacing.md,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  checkText: {
    flex: 1,
    minWidth: 0,
  },
});
