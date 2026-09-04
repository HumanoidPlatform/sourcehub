import { BookOpenCheck, Clock3 } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Badge } from '@/components/common/badge';
import { Card } from '@/components/common/card';
import { ProgressBar } from '@/components/common/progress-bar';
import { Screen } from '@/components/common/screen';
import { SectionHeader } from '@/components/common/section-header';
import { SkeletonList } from '@/components/common/skeleton';
import { useTranslation } from '@/features/localization/use-translation';
import { useCertifications, useLearningModules } from '@/hooks/use-odp-queries';
import { colors, spacing } from '@/theme/tokens';
import { formatShortDate } from '@/utils/format';

export default function LearnTab() {
  const certifications = useCertifications();
  const modules = useLearningModules();
  const t = useTranslation();

  return (
    <Screen>
      <View>
        <AppText muted variant="small">
          {t('tabs.learn')}
        </AppText>
        <AppText variant="title">{t('learn.title')}</AppText>
      </View>

      <SectionHeader detail={t('learn.trainingDetail')} title={t('learn.trainingModules')} />
      {modules.isLoading ? (
        <SkeletonList rows={2} />
      ) : (
        modules.data?.map((module) => (
          <Card key={module.id} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.iconWrap}>
                <Clock3 color={colors.accentDark} size={20} />
              </View>
              <View style={styles.text}>
                <View style={styles.titleRow}>
                  <AppText variant="subheading">{module.title}</AppText>
                  {module.required ? <Badge label={t('common.required')} tone="warning" /> : <Badge label={t('common.optional')} />}
                </View>
                <AppText muted variant="small">
                  {module.minutes} {t('task.min')} · {Math.round(module.progress * 100)}% {t('learn.complete')}
                </AppText>
              </View>
            </View>
            <ProgressBar progress={module.progress} tone={module.required && module.progress < 1 ? 'warning' : 'accent'} />
          </Card>
        ))
      )}

      <SectionHeader detail={t('learn.certificationDetail')} title={t('learn.certifications')} />
      {certifications.isLoading ? (
        <SkeletonList rows={3} />
      ) : (
        certifications.data?.map((cert) => (
          <Card key={cert.id} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.iconWrap}>
                <BookOpenCheck color={colors.accentDark} size={22} />
              </View>
              <View style={styles.text}>
                <AppText variant="subheading">{cert.title}</AppText>
                {cert.expiresAt ? (
                  <AppText muted variant="small">
                    {t('learn.expires')} {formatShortDate(cert.expiresAt)}
                  </AppText>
                ) : (
                  <AppText muted variant="small">
                    {Math.round(cert.progress * 100)}% {t('learn.complete')}
                  </AppText>
                )}
              </View>
              <Badge
                label={cert.status.replace('_', ' ')}
                tone={cert.status === 'certified' ? 'success' : cert.status === 'expires_soon' ? 'warning' : 'neutral'}
              />
            </View>
            <ProgressBar progress={cert.progress} tone={cert.status === 'expires_soon' ? 'warning' : 'accent'} />
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.greenSoft,
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
