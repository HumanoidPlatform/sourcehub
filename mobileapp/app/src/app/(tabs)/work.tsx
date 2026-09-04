import { router } from 'expo-router';
import { Camera, ClipboardCheck, FileAudio, ListChecks, Star, type LucideProps } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Badge } from '@/components/common/badge';
import { Card } from '@/components/common/card';
import { EmptyState } from '@/components/common/empty-state';
import { Screen } from '@/components/common/screen';
import { SectionHeader } from '@/components/common/section-header';
import { SkeletonList } from '@/components/common/skeleton';
import { ReadinessGate } from '@/components/work/readiness-gate';
import { TaskCard } from '@/components/work/task-card';
import { getReadinessBlocker } from '@/features/readiness/readiness';
import type { StringKey } from '@/features/localization/strings';
import { useTranslation } from '@/features/localization/use-translation';
import { useAvailableTasks, useHomeSummary, useMyTasks } from '@/hooks/use-odp-queries';
import { colors, radii, spacing } from '@/theme/tokens';
import type { Task, WorkType } from '@/types/domain';

type WorkMode = {
  detailKey: StringKey;
  icon: ComponentType<LucideProps>;
  labelKey: StringKey;
  routeType: WorkType;
  titleKey: StringKey;
};

const workModes: WorkMode[] = [
  {
    detailKey: 'work.captureDetail',
    icon: Camera,
    labelKey: 'work.capture',
    routeType: 'capture',
    titleKey: 'work.captureTitle',
  },
  {
    detailKey: 'work.annotationDetail',
    icon: ClipboardCheck,
    labelKey: 'work.annotate',
    routeType: 'annotation',
    titleKey: 'work.annotationTitle',
  },
  {
    detailKey: 'work.transcriptionDetail',
    icon: FileAudio,
    labelKey: 'work.transcribe',
    routeType: 'transcription',
    titleKey: 'work.transcriptionTitle',
  },
  {
    detailKey: 'work.surveyDetail',
    icon: ListChecks,
    labelKey: 'work.survey',
    routeType: 'survey',
    titleKey: 'work.surveyTitle',
  },
  {
    detailKey: 'work.rateDetail',
    icon: Star,
    labelKey: 'work.rate',
    routeType: 'sxs',
    titleKey: 'work.rateTitle',
  },
];

export default function WorkTab() {
  const [selectedMode, setSelectedMode] = useState<WorkType>('capture');
  const available = useAvailableTasks();
  const mine = useMyTasks();
  const { data: summary } = useHomeSummary();
  const t = useTranslation();
  const blocker = getReadinessBlocker(summary?.readiness ?? []);
  const mode = workModes.find((item) => item.routeType === selectedMode) ?? workModes[0];
  const ModeIcon = mode.icon;
  const allTasks = [...(mine.data ?? []), ...(available.data ?? [])];
  const tasks = allTasks.filter((task) => task.taskType === selectedMode);
  const isLoading = available.isLoading || mine.isLoading;

  function openTask(task: Task) {
    if (task.taskType === 'capture') {
      router.push(`/task/${task.id}`);
      return;
    }
    const route = task.taskType === 'sxs' ? 'rating' : task.taskType;
    router.push(`/${route}/${task.id}`);
  }

  return (
    <Screen>
      <View>
        <AppText muted variant="small">
          {t('tabs.work')}
        </AppText>
        <AppText variant="title">{t('work.modeTitle')}</AppText>
      </View>

      <View style={styles.modeGrid}>
        {workModes.map((item) => (
          <ModeChip
            key={item.routeType}
            mode={item}
            onPress={() => setSelectedMode(item.routeType)}
            selected={selectedMode === item.routeType}
            title={t(item.labelKey)}
          />
        ))}
      </View>

      {selectedMode === 'capture' && summary?.readiness ? <ReadinessGate checks={summary.readiness} /> : null}

      <Card style={styles.modeCard}>
        <View style={styles.modeHeader}>
          <ModeIcon color={colors.accentDark} size={22} />
          <View style={styles.modeText}>
            <AppText variant="subheading">{t(mode.titleKey)}</AppText>
            <AppText muted variant="small">
              {t(mode.detailKey)}
            </AppText>
          </View>
          <Badge label={t(mode.labelKey)} tone="info" />
        </View>
        {selectedMode === 'capture' && blocker ? (
          <AppText color={colors.red} variant="small">
            {t('work.blockedBy')} {blocker.label}: {blocker.detail}
          </AppText>
        ) : null}
      </Card>

      <SectionHeader
        detail={selectedMode === 'capture' ? t('work.captureBlockedDetail') : t('work.submissionDetail')}
        title={t(mode.labelKey)}
      />

      {isLoading ? (
        <SkeletonList rows={3} />
      ) : tasks.length ? (
        <View style={styles.list}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onPress={() => (blocker && selectedMode === 'capture' ? undefined : openTask(task))} />
          ))}
        </View>
      ) : (
        <EmptyState body={t('work.noTasksDetail')} icon={mode.icon} title={t('work.noTasks')} />
      )}
    </Screen>
  );
}

function ModeChip({ mode, onPress, selected, title }: { mode: WorkMode; onPress: () => void; selected: boolean; title: string }) {
  const Icon = mode.icon;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.modeChip, selected && styles.modeChipActive, pressed && styles.pressed]}>
      <Icon color={selected ? colors.white : colors.ink} size={18} />
      <AppText color={selected ? colors.white : colors.ink} variant="caption">
        {title}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  modeChip: {
    minHeight: 42,
    flexBasis: '30%',
    flexGrow: 1,
    minWidth: 104,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
  },
  modeChipActive: {
    borderColor: colors.ink,
    backgroundColor: colors.ink,
  },
  modeCard: {
    gap: spacing.md,
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  modeText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  list: {
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.78,
  },
});
