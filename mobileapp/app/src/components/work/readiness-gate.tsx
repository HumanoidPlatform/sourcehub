import { AlertCircle, CheckCircle2, Info, ShieldAlert } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Badge } from '@/components/common/badge';
import { Card } from '@/components/common/card';
import { getReadinessBlocker } from '@/features/readiness/readiness';
import { useTranslation } from '@/features/localization/use-translation';
import { colors, spacing } from '@/theme/tokens';
import type { ReadinessCheck } from '@/types/domain';

export function ReadinessGate({ checks }: { checks: ReadinessCheck[] }) {
  const blocker = getReadinessBlocker(checks);
  const t = useTranslation();

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="subheading">{t('readiness.gate')}</AppText>
          <AppText muted variant="small">
            {t('readiness.detail')}
          </AppText>
        </View>
        <Badge label={blocker ? t('readiness.blocked') : t('readiness.ready')} tone={blocker ? 'danger' : 'success'} />
      </View>

      {blocker ? (
        <View style={styles.blocker}>
          <ShieldAlert color={colors.red} size={18} />
          <AppText color={colors.red} style={styles.blockerText} variant="small">
            {blocker.label}: {blocker.detail}
          </AppText>
        </View>
      ) : null}

      <View style={styles.grid}>
        {checks.map((check) => {
          const tone = check.status === 'fail' ? 'danger' : check.status === 'warning' ? 'warning' : 'success';
          const Icon = check.status === 'fail' ? AlertCircle : check.status === 'warning' ? Info : CheckCircle2;
          const color = check.status === 'fail' ? colors.red : check.status === 'warning' ? colors.amber : colors.green;

          return (
            <View key={check.id} style={styles.check}>
              <Icon color={color} size={17} />
              <View style={styles.checkText}>
                <View style={styles.checkTitle}>
                  <AppText variant="label">{check.label}</AppText>
                  <Badge label={check.status} tone={tone} />
                </View>
                <AppText muted variant="caption">
                  {check.detail}
                </AppText>
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
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
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  blocker: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.redSoft,
  },
  blockerText: {
    flex: 1,
    minWidth: 0,
  },
  grid: {
    gap: spacing.sm,
  },
  check: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  checkText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  checkTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
