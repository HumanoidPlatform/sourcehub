import { CheckCircle2, Clock3, XCircle } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Badge } from '@/components/common/badge';
import { Card } from '@/components/common/card';
import type { GuidanceResult } from '@/features/capture-guidance/types';
import { useTranslation } from '@/features/localization/use-translation';
import { colors, spacing } from '@/theme/tokens';

type QcStatus = 'pass' | 'checking' | 'fail';

const defaultIndicators: { label: string; status: QcStatus }[] = [
  { label: 'FOCUS', status: 'pass' },
  { label: 'TILT +/-5deg', status: 'checking' },
  { label: 'FRAMING', status: 'pass' },
  { label: 'STEADY', status: 'pass' },
  { label: 'LIGHT', status: 'checking' },
  { label: 'SYNC', status: 'pass' },
];

export function QcIndicators({ guidance, phase = 'align' }: { guidance?: GuidanceResult; phase?: string }) {
  const t = useTranslation();
  const indicators = guidance
    ? guidance.qc.map((indicator) => ({
        label: indicator.concept === 'TILT' ? 'TILT +/-5deg' : indicator.concept,
        status: indicator.status,
      }))
    : defaultIndicators;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View>
          <AppText variant="subheading">{t('qc.indicators')}</AppText>
          <AppText muted variant="small">
            {t('qc.detail')}
          </AppText>
        </View>
        <Badge label={guidance?.visual.label ?? phase} tone={guidance?.blocksCapture ? 'warning' : 'info'} />
      </View>
      <View style={styles.grid}>
        {indicators.map((indicator) => {
          const Icon = indicator.status === 'fail' ? XCircle : indicator.status === 'checking' ? Clock3 : CheckCircle2;
          const color =
            indicator.status === 'fail' ? colors.red : indicator.status === 'checking' ? colors.amber : colors.green;

          return (
            <View key={indicator.label} style={styles.item}>
              <Icon color={color} size={16} />
              <AppText variant="caption">{indicator.label}</AppText>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  item: {
    minHeight: 34,
    flexBasis: '30%',
    flexGrow: 1,
    minWidth: 104,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
  },
});
