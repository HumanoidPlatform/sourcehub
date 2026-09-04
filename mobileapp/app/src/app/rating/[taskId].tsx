import { zodResolver } from '@hookform/resolvers/zod';
import * as Crypto from 'expo-crypto';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle2, Star } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Badge } from '@/components/common/badge';
import { Card } from '@/components/common/card';
import { Screen } from '@/components/common/screen';
import { getSafeFeedbackMessage } from '@/features/feedback/error-messages';
import { useFeedback } from '@/features/feedback/feedback-provider';
import { localizeFormError } from '@/features/localization/form-errors';
import type { StringKey } from '@/features/localization/strings';
import { useTranslation } from '@/features/localization/use-translation';
import { useCreateSubmission, useTask } from '@/hooks/use-odp-queries';
import { colors, radii, spacing } from '@/theme/tokens';
import { ratingSchema, type RatingFormValues } from '@/types/forms';
import { firstRouteParam } from '@/utils/route-params';

const preferenceLabelKeys = {
  A: 'rating.optionA',
  B: 'rating.optionB',
  tie: 'rating.tie',
} satisfies Record<RatingFormValues['preference'], StringKey>;

const rubricLabelKeys = {
  accuracy: 'rating.accuracy',
  helpfulness: 'rating.helpfulness',
  safety: 'rating.safety',
} satisfies Record<RatingFormValues['rubric'], StringKey>;

export default function RatingScreen() {
  const params = useLocalSearchParams<{ taskId?: string | string[] }>();
  const taskId = firstRouteParam(params.taskId);
  const { data: task, error } = useTask(taskId);
  const createSubmission = useCreateSubmission();
  const feedback = useFeedback();
  const t = useTranslation();
  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<RatingFormValues>({
    defaultValues: {
      justification: 'Option A gives a more direct answer and avoids the unsupported safety claim in Option B.',
      preference: 'A',
      rubric: 'accuracy',
    },
    resolver: zodResolver(ratingSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!task) {
      feedback.showError(error ? getSafeFeedbackMessage(error, 'Task could not be loaded.') : 'Rating task is not available.');
      return;
    }
    createSubmission.mutate({
      campaignId: task?.campaignId,
      idempotencyKey: Crypto.randomUUID(),
      meta: {
        justification: values.justification,
        optionARef: 'mock://sxs/option-a',
        optionBRef: 'mock://sxs/option-b',
        preference: values.preference,
        rubric: values.rubric,
        source: 'mobile_sxs',
      },
      payloadRef: `mock://sxs/${taskId}/pair-001`,
      projectId: task?.project,
      taskId,
      type: 'sxs',
    });
  });

  if (!taskId) {
    return <WorkTaskUnavailable message="Rating route is missing a task ID." />;
  }

  if (error && !task) {
    return <WorkTaskUnavailable message={getSafeFeedbackMessage(error, 'Task could not be loaded.')} />;
  }

  return (
    <Screen>
      <AppButton icon={ArrowLeft} onPress={() => router.back()} style={styles.backButton} variant="ghost">
        {t('common.back')}
      </AppButton>
      <View>
        <AppText muted variant="small">
          {t('rating.rate')}
        </AppText>
        <AppText variant="title">{task?.title ?? t('rating.sideBySideRating')}</AppText>
      </View>

      <View style={styles.options}>
        <OptionCard label={t('rating.optionA')} text={t('rating.optionAText')} />
        <OptionCard label={t('rating.optionB')} text={t('rating.optionBText')} />
      </View>

      <Card style={styles.form}>
        <View style={styles.field}>
          <AppText variant="label">{t('rating.preference')}</AppText>
          <Controller
            control={control}
            name="preference"
            render={({ field: { onChange, value } }) => (
              <View style={styles.buttonRow}>
                {(['A', 'B', 'tie'] as const).map((preference) => (
                  <AppButton
                    key={preference}
                    onPress={() => onChange(preference)}
                    style={styles.choiceButton}
                    variant={value === preference ? 'primary' : 'secondary'}>
                    {t(preferenceLabelKeys[preference])}
                  </AppButton>
                ))}
              </View>
            )}
          />
        </View>

        <View style={styles.field}>
          <AppText variant="label">{t('rating.rubric')}</AppText>
          <Controller
            control={control}
            name="rubric"
            render={({ field: { onChange, value } }) => (
              <View style={styles.buttonRow}>
                {(['accuracy', 'safety', 'helpfulness'] as const).map((rubric) => (
                  <AppButton
                    key={rubric}
                    onPress={() => onChange(rubric)}
                    style={styles.rubricButton}
                    variant={value === rubric ? 'primary' : 'secondary'}>
                    {t(rubricLabelKeys[rubric])}
                  </AppButton>
                ))}
              </View>
            )}
          />
        </View>

        <View style={styles.field}>
          <AppText variant="label">{t('rating.justification')}</AppText>
          <Controller
            control={control}
            name="justification"
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
          {errors.justification ? (
            <AppText color={colors.red} variant="small">
              {localizeFormError(errors.justification.message, t)}
            </AppText>
          ) : null}
        </View>

        <AppButton disabled={!task} icon={CheckCircle2} loading={createSubmission.isPending} onPress={onSubmit}>
          {t('rating.submitRating')}
        </AppButton>
        {createSubmission.data ? (
          <Badge label={`${createSubmission.data.status}: ${createSubmission.data.submissionId}`} tone="success" />
        ) : null}
      </Card>
    </Screen>
  );
}

function WorkTaskUnavailable({ message }: { message: string }) {
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

function OptionCard({ label, text }: { label: string; text: string }) {
  return (
    <Card style={styles.optionCard}>
      <View style={styles.optionHeader}>
        <Star color={colors.amber} size={18} />
        <AppText variant="subheading">{label}</AppText>
      </View>
      <AppText muted>{text}</AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 0,
  },
  options: {
    gap: spacing.md,
  },
  optionCard: {
    gap: spacing.md,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  form: {
    gap: spacing.md,
  },
  field: {
    gap: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  choiceButton: {
    minWidth: '30%',
  },
  rubricButton: {
    minWidth: '47%',
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
    minHeight: 112,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
});
