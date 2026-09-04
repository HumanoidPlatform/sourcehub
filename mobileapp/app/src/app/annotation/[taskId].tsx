import { zodResolver } from '@hookform/resolvers/zod';
import * as Crypto from 'expo-crypto';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle2, WandSparkles } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Badge } from '@/components/common/badge';
import { Card } from '@/components/common/card';
import { Screen } from '@/components/common/screen';
import { getSafeFeedbackMessage } from '@/features/feedback/error-messages';
import { useFeedback } from '@/features/feedback/feedback-provider';
import { QcIndicators } from '@/components/work/qc-indicators';
import { localizeFormError } from '@/features/localization/form-errors';
import { useTranslation } from '@/features/localization/use-translation';
import { useCreateSubmission, useTask } from '@/hooks/use-odp-queries';
import { colors, radii, spacing } from '@/theme/tokens';
import { annotationSchema, type AnnotationFormValues } from '@/types/forms';
import { firstRouteParam } from '@/utils/route-params';

export default function AnnotationScreen() {
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
  } = useForm<AnnotationFormValues>({
    defaultValues: {
      label: 'shelf_product',
      notes: 'Pre-label looks aligned to the product face.',
    },
    resolver: zodResolver(annotationSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!task) {
      feedback.showError(error ? getSafeFeedbackMessage(error, 'Task could not be loaded.') : 'Annotation task is not available.');
      return;
    }
    createSubmission.mutate({
      campaignId: task?.campaignId,
      idempotencyKey: Crypto.randomUUID(),
      meta: {
        boxes: [{ h: 0.28, label: values.label, w: 0.46, x: 0.27, y: 0.34 }],
        notes: values.notes,
        source: 'mobile_annotation',
      },
      payloadRef: `mock://annotation/${taskId}/frame-001`,
      projectId: task?.project,
      taskId,
      type: 'annotation',
    });
  });

  if (!taskId) {
    return <WorkTaskUnavailable message="Annotation route is missing a task ID." />;
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
          {t('annotation.annotate')}
        </AppText>
        <AppText variant="title">{task?.title ?? t('annotation.mobileAnnotation')}</AppText>
      </View>

      <Card style={styles.frameCard}>
        <View style={styles.frame}>
          <View style={styles.box} />
          <Badge label={t('annotation.edgeAutoLabel')} tone="purple" />
        </View>
        <View style={styles.preLabel}>
          <WandSparkles color={colors.lavender} size={18} />
          <AppText muted style={styles.preLabelText} variant="small">
            {t('annotation.preLabelDetail')}
          </AppText>
        </View>
      </Card>

      <QcIndicators phase={t('annotation.localValidation')} />

      <Card style={styles.form}>
        <View style={styles.field}>
          <AppText variant="label">{t('annotation.confirmedLabel')}</AppText>
          <Controller
            control={control}
            name="label"
            render={({ field: { onBlur, onChange, value } }) => (
              <TextInput onBlur={onBlur} onChangeText={onChange} style={styles.input} value={value} />
            )}
          />
          {errors.label ? (
            <AppText color={colors.red} variant="small">
              {localizeFormError(errors.label.message, t)}
            </AppText>
          ) : null}
        </View>
        <View style={styles.field}>
          <AppText variant="label">{t('annotation.notes')}</AppText>
          <Controller
            control={control}
            name="notes"
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
        </View>
        <AppButton disabled={!task} icon={CheckCircle2} loading={createSubmission.isPending} onPress={onSubmit}>
          {t('annotation.submitAnnotation')}
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

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 0,
  },
  frameCard: {
    gap: spacing.md,
  },
  frame: {
    aspectRatio: 4 / 3,
    justifyContent: 'flex-start',
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
  },
  box: {
    position: 'absolute',
    left: '27%',
    top: '34%',
    width: '46%',
    height: '28%',
    borderWidth: 3,
    borderColor: colors.accent,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(14,159,142,0.10)',
  },
  preLabel: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  preLabelText: {
    flex: 1,
  },
  form: {
    gap: spacing.md,
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
    minHeight: 88,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
});
