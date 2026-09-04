import { router } from 'expo-router';
import {
  BriefcaseBusiness,
  ChevronRight,
  CloudUpload,
  Cpu,
  MessageCircleQuestion,
  RefreshCcw,
  WalletCards,
} from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Badge } from '@/components/common/badge';
import { Card } from '@/components/common/card';
import { ProgressBar } from '@/components/common/progress-bar';
import { Screen } from '@/components/common/screen';
import { SectionHeader } from '@/components/common/section-header';
import { SkeletonList } from '@/components/common/skeleton';
import { PersonaHeader } from '@/components/navigation/persona-header';
import { ReadinessGate } from '@/components/work/readiness-gate';
import { TaskCard } from '@/components/work/task-card';
import { getSafeFeedbackMessage } from '@/features/feedback/error-messages';
import { useFeedback } from '@/features/feedback/feedback-provider';
import { useTranslation } from '@/features/localization/use-translation';
import { useUploadQueue } from '@/features/uploads/use-upload-queue';
import { useAvailableTasks, useHomeSummary } from '@/hooks/use-odp-queries';
import { useAuthStore } from '@/store/auth-store';
import { colors, spacing } from '@/theme/tokens';
import { formatCurrency } from '@/utils/format';

export default function HomeTab() {
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);
  const { data: summary, isLoading } = useHomeSummary();
  const { data: tasks = [] } = useAvailableTasks();
  const { data: queue = [] } = useUploadQueue();
  const feedback = useFeedback();
  const t = useTranslation();
  const queuedCount = queue.filter((item) => item.status === 'queued' || item.status === 'failed').length;

  async function switchAccount() {
    try {
      await logout();
      feedback.showSuccess('Signed out successfully');
      router.replace('/login');
    } catch (error) {
      feedback.showError(getSafeFeedbackMessage(error, 'Unable to sign out. Please try again.'));
    }
  }

  return (
    <Screen>
      <PersonaHeader
        actions={[
          {
            accessibilityLabel: 'Switch account',
            icon: RefreshCcw,
            onPress: switchAccount,
            testID: 'crowd-header-switch-account',
          },
        ]}
        eyebrow="Crowd Mobile"
        showNotifications
        title={`${t('home.greeting')}, ${session?.user.name.split(' ')[0] ?? 'worker'}`}
      />

      {isLoading ? (
        <SkeletonList rows={2} />
      ) : (
        <>
          <Card style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.heroText}>
                <Badge label={t('home.mockApi')} tone="info" />
                <AppText color={colors.white} variant="heading">
                  {summary?.nextAction}
                </AppText>
              </View>
              <ChevronRight color={colors.white} size={24} />
            </View>
            <View style={styles.statsGrid}>
              <Stat label={t('home.clips')} value={String(summary?.todayStats.clipsCompleted ?? 0)} />
              <Stat label={t('home.labels')} value={String(summary?.todayStats.labelsCompleted ?? 0)} />
              <Stat label={t('home.units')} value={String(summary?.todayStats.unitsCompleted ?? 0)} />
            </View>
          </Card>

          <View style={styles.quickActions}>
            <AppButton icon={CloudUpload} onPress={() => router.push('/uploads')} variant="secondary">
              {t('home.queue')} {queuedCount || summary?.queuedUploads || 0}
            </AppButton>
            <AppButton icon={BriefcaseBusiness} onPress={() => router.push('/work')} variant="secondary">
              {t('tabs.work')}
            </AppButton>
          </View>

          <SectionHeader title={t('home.today')} />
          <Card style={styles.earningsCard}>
            <WalletCards color={colors.accentDark} size={24} />
            <View style={styles.earningsText}>
              <AppText muted variant="small">
                {t('home.earningsLedger')}
              </AppText>
              <AppText variant="heading">
                {formatCurrency(summary?.todayStats.earnings ?? summary?.todayEarnings ?? 0, 'INR')}
              </AppText>
            </View>
            <AppButton onPress={() => router.push('/wallet')} style={styles.smallButton} variant="ghost">
              {t('tabs.wallet')}
            </AppButton>
          </Card>

          {summary?.readiness ? <ReadinessGate checks={summary.readiness} /> : null}

          <SectionHeader detail={t('home.jobQueueDetail')} title={t('home.jobQueue')} />
          <View style={styles.list}>
            {tasks.slice(0, 3).map((task) => (
              <TaskCard key={task.id} task={task} onPress={() => router.push(`/task/${task.id}`)} />
            ))}
          </View>

          <SectionHeader detail={t('home.edgePipelineDetail')} title={t('home.edgePipeline')} />
          <View style={styles.list}>
            {summary?.edgePipeline.map((item) => (
              <Card key={item.id} style={styles.pipelineCard}>
                <View style={styles.pipelineTop}>
                  <Cpu color={item.status === 'attention' ? colors.amber : colors.accentDark} size={20} />
                  <View style={styles.pipelineText}>
                    <AppText variant="label">{item.label}</AppText>
                    <AppText muted variant="small">
                      {item.detail}
                    </AppText>
                  </View>
                  <Badge label={item.status} tone={item.status === 'attention' ? 'warning' : 'info'} />
                </View>
                <ProgressBar progress={item.status === 'processing' ? 0.62 : item.status === 'ready' ? 1 : 0.18} />
              </Card>
            ))}
          </View>

          <Card style={styles.copilotCard}>
            <View style={styles.pipelineTop}>
              <MessageCircleQuestion color={colors.accentDark} size={22} />
              <View style={styles.pipelineText}>
                <AppText variant="subheading">{t('home.copilotTitle')}</AppText>
                <AppText muted variant="small">
                  {t('home.copilotDetail')}
                </AppText>
              </View>
            </View>
            <View style={styles.copilotQuestions}>
              <Badge label={t('home.whatsNext')} tone="info" />
              <Badge label={t('home.readinessBlocker')} tone="warning" />
              <Badge label={t('home.qcExplanation')} tone="purple" />
            </View>
          </Card>
        </>
      )}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <AppText color={colors.white} variant="heading">
        {value}
      </AppText>
      <AppText color={colors.slate200} variant="caption">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.xl,
    backgroundColor: colors.darkBand,
    borderColor: colors.darkBand,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  heroText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  stat: {
    flex: 1,
    minWidth: '30%',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  earningsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  earningsText: {
    flex: 1,
    minWidth: 0,
  },
  smallButton: {
    flexGrow: 1,
    minWidth: 82,
  },
  list: {
    gap: spacing.md,
  },
  pipelineCard: {
    gap: spacing.md,
  },
  pipelineTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  pipelineText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  copilotCard: {
    gap: spacing.md,
  },
  copilotQuestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
