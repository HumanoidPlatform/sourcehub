import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { ArrowLeft, Gavel, Send } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Badge } from '@/components/common/badge';
import { Card } from '@/components/common/card';
import { Screen } from '@/components/common/screen';
import { SectionHeader } from '@/components/common/section-header';
import { SkeletonList } from '@/components/common/skeleton';
import { localizeFormError } from '@/features/localization/form-errors';
import { useTranslation } from '@/features/localization/use-translation';
import { useAppeals, useCreateAppeal } from '@/hooks/use-odp-queries';
import { colors, radii, spacing } from '@/theme/tokens';
import { appealSchema, type AppealFormValues } from '@/types/forms';
import { formatShortDate } from '@/utils/format';

export default function AppealsScreen() {
  const { data: appeals = [], isLoading } = useAppeals();
  const createAppeal = useCreateAppeal();
  const t = useTranslation();
  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<AppealFormValues>({
    defaultValues: {
      ground: 'The submission appears to have been flagged incorrectly and needs QA review.',
      submissionId: 'sub-road-possible-duplicate',
    },
    resolver: zodResolver(appealSchema),
  });

  const onSubmit = handleSubmit((values) => {
    createAppeal.mutate(values);
  });

  return (
    <Screen>
      <AppButton icon={ArrowLeft} onPress={() => router.back()} style={styles.backButton} variant="ghost">
        {t('common.back')}
      </AppButton>
      <View>
        <AppText muted variant="small">
          {t('appeals.appeals')}
        </AppText>
        <AppText variant="title">{t('appeals.submissionAppeals')}</AppText>
      </View>

      <Card style={styles.form}>
        <View style={styles.formHeader}>
          <Gavel color={colors.accentDark} size={22} />
          <View style={styles.formTitle}>
            <AppText variant="subheading">{t('appeals.createAppeal')}</AppText>
            <AppText muted variant="small">
              {t('appeals.createAppealDetail')}
            </AppText>
          </View>
        </View>
        <View style={styles.field}>
          <AppText variant="label">{t('appeals.submissionId')}</AppText>
          <Controller
            control={control}
            name="submissionId"
            render={({ field: { onBlur, onChange, value } }) => (
              <TextInput autoCapitalize="none" onBlur={onBlur} onChangeText={onChange} style={styles.input} value={value} />
            )}
          />
          {errors.submissionId ? (
            <AppText color={colors.red} variant="small">
              {localizeFormError(errors.submissionId.message, t)}
            </AppText>
          ) : null}
        </View>
        <View style={styles.field}>
          <AppText variant="label">{t('appeals.ground')}</AppText>
          <Controller
            control={control}
            name="ground"
            render={({ field: { onBlur, onChange, value } }) => (
              <TextInput
                multiline
                onBlur={onBlur}
                onChangeText={onChange}
                style={[styles.input, styles.textArea]}
                value={value}
              />
            )}
          />
          {errors.ground ? (
            <AppText color={colors.red} variant="small">
              {localizeFormError(errors.ground.message, t)}
            </AppText>
          ) : null}
        </View>
        <AppButton icon={Send} loading={createAppeal.isPending} onPress={onSubmit}>
          {t('appeals.submitAppeal')}
        </AppButton>
        {createAppeal.data ? <Badge label={createAppeal.data.message} tone="info" /> : null}
      </Card>

      <SectionHeader title={t('appeals.recentAppeals')} />
      {isLoading ? (
        <SkeletonList rows={2} />
      ) : (
        appeals.map((appeal) => (
          <Card key={appeal.id} style={styles.appealCard}>
            <View style={styles.appealTop}>
              <View style={styles.formTitle}>
                <AppText variant="label">{appeal.submissionId}</AppText>
                <AppText muted variant="small">
                  {formatShortDate(appeal.createdAt)}
                </AppText>
              </View>
              <Badge
                label={appeal.state.replace('_', ' ')}
                tone={appeal.state === 'upheld' ? 'success' : appeal.state === 'rejected' ? 'danger' : 'warning'}
              />
            </View>
            <AppText muted>{appeal.ground}</AppText>
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
  form: {
    gap: spacing.md,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  formTitle: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  field: {
    gap: spacing.sm,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    color: colors.ink,
    backgroundColor: colors.white,
    fontSize: 16,
  },
  textArea: {
    minHeight: 96,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  appealCard: {
    gap: spacing.md,
  },
  appealTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
});
