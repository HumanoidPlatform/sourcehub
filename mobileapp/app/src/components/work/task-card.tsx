import { Clock, MapPin, Navigation, Play } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Badge } from '@/components/common/badge';
import { Card } from '@/components/common/card';
import { ProgressBar } from '@/components/common/progress-bar';
import { useTranslation } from '@/features/localization/use-translation';
import { getPhotoUploadProgress } from '@/features/uploads/photo-upload-progress';
import { useUploadQueue } from '@/features/uploads/use-upload-queue';
import { colors, spacing } from '@/theme/tokens';
import type { Task } from '@/types/domain';
import { formatCurrency, formatShortDate } from '@/utils/format';

type TaskCardProps = {
  onPress: () => void;
  task: Task;
};

function difficultyTone(difficulty: Task['difficulty']) {
  if (difficulty === 'advanced') {
    return 'purple' as const;
  }
  if (difficulty === 'standard') {
    return 'info' as const;
  }
  return 'success' as const;
}

export function TaskCard({ onPress, task }: TaskCardProps) {
  const t = useTranslation();
  const { data: queue = [] } = useUploadQueue();
  const photoProgress = getPhotoUploadProgress(task, queue);
  const progressValue = photoProgress.hasRequirement ? photoProgress.progress : task.progress;
  const progressLabel = photoProgress.hasRequirement ? photoProgress.label : `${Math.round(task.progress * 100)}%`;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleWrap}>
            <AppText variant="subheading">{task.title}</AppText>
            <AppText muted variant="small">
              {task.category ?? task.project}
            </AppText>
          </View>
          <View style={styles.reward}>
            <AppText muted variant="caption">
              {t('task.mockReward')}
            </AppText>
            <AppText color={colors.accentDark} variant="subheading">
              {formatCurrency(task.pay, task.currency)}
            </AppText>
          </View>
        </View>

        <View style={styles.badges}>
          <Badge label={task.status.replace('_', ' ')} tone={task.status === 'available' ? 'success' : 'warning'} />
          <Badge label={task.difficulty} tone={difficultyTone(task.difficulty)} />
          <Badge label={task.taskType === 'sxs' ? 'rate' : task.taskType} tone="info" />
          {task.requiredMedia.length ? <Badge label={task.requiredMedia.join(' + ')} tone="neutral" /> : null}
          {task.requiredDurationMs ? <Badge label={`${t('task.requiredDuration')}: ${formatDuration(task.requiredDurationMs)}`} tone="neutral" /> : null}
        </View>

        <View style={styles.requirements}>
          <AppText muted variant="caption">
            {t('task.requirements')}
          </AppText>
          {task.checklist.slice(0, 3).map((item) => (
            <AppText key={item} muted variant="small">
              - {item}
            </AppText>
          ))}
        </View>

        <View style={styles.progress}>
          <View style={styles.progressText}>
            <AppText muted variant="caption">
              {t('task.progress')}
            </AppText>
            <AppText muted style={styles.progressValue} variant="caption">
              {progressLabel}
            </AppText>
          </View>
          <ProgressBar progress={progressValue} tone={photoProgress.failedCount > 0 ? 'warning' : 'accent'} />
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.meta}>
            <MapPin color={colors.slate500} size={15} />
            <AppText muted variant="small">
              {task.location}
            </AppText>
          </View>
          <View style={styles.meta}>
            <Clock color={colors.slate500} size={15} />
            <AppText muted variant="small">
              {task.estimatedMinutes} {t('task.min')}
            </AppText>
          </View>
          <View style={styles.meta}>
            <Navigation color={colors.slate500} size={15} />
            <AppText muted variant="small">
              {task.distanceKm ? `${task.distanceKm} km` : t('task.remote')}
            </AppText>
          </View>
        </View>

        <View style={styles.footer}>
          <AppText muted variant="small">
            {t('task.due')} {formatShortDate(task.dueAt)}
          </AppText>
          <View style={styles.open}>
            <Play color={colors.accent} size={16} fill={colors.accent} />
            <AppText color={colors.accentDark} variant="label">
              {t('task.open')}
            </AppText>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

function formatDuration(durationMs: number) {
  const minutes = Math.round(durationMs / 60_000);
  if (minutes >= 1) {
    return `${minutes} min`;
  }
  return `${Math.round(durationMs / 1000)} sec`;
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.78,
  },
  card: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  reward: {
    alignItems: 'flex-end',
    maxWidth: '100%',
    gap: spacing.xs,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaGrid: {
    gap: spacing.sm,
  },
  progress: {
    gap: spacing.xs,
  },
  requirements: {
    gap: spacing.xs,
  },
  progressText: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  progressValue: {
    flexShrink: 1,
    textAlign: 'right',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  footer: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  open: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: spacing.xs,
  },
});
