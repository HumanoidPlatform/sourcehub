import { router } from 'expo-router';
import { ArrowLeft, BookOpenCheck } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Badge } from '@/components/common/badge';
import { Card } from '@/components/common/card';
import { ProgressBar } from '@/components/common/progress-bar';
import { Screen } from '@/components/common/screen';
import { SkeletonList } from '@/components/common/skeleton';
import { useTranslation } from '@/features/localization/use-translation';
import { useCertifications } from '@/hooks/use-odp-queries';
import { colors, spacing } from '@/theme/tokens';
import { formatShortDate } from '@/utils/format';

export default function LearnScreen() {
  const { data: certifications = [], isLoading } = useCertifications();
  const t = useTranslation();

  return (
    <Screen>
      <AppButton icon={ArrowLeft} onPress={() => router.back()} style={styles.backButton} variant="ghost">
        {t('common.back')}
      </AppButton>
      <View>
        <AppText muted variant="small">
          {t('tabs.learn')}
        </AppText>
        <AppText variant="title">{t('learn.certifications')}</AppText>
      </View>

      {isLoading ? (
        <SkeletonList rows={3} />
      ) : (
        certifications.map((cert) => (
          <Card key={cert.id} style={styles.card}>
            <View style={styles.header}>
              <View style={styles.iconWrap}>
                <BookOpenCheck color={colors.accentDark} size={22} />
              </View>
              <View style={styles.titleWrap}>
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
            <AppButton variant="secondary">{cert.progress > 0 ? t('learn.continueTraining') : t('learn.startTraining')}</AppButton>
          </Card>
        ))
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
    gap: spacing.md,
  },
  header: {
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
  titleWrap: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
});
