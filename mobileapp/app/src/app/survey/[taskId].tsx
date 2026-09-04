import { zodResolver } from '@hookform/resolvers/zod';
import * as Crypto from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Camera, CheckCircle2, QrCode } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
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
import { surveySchema, type SurveyFormValues } from '@/types/forms';
import { firstRouteParam } from '@/utils/route-params';

const conditionLabelKeys = {
  damaged: 'survey.condition.damaged',
  good: 'survey.condition.good',
  missing: 'survey.condition.missing',
  unsafe: 'survey.condition.unsafe',
} satisfies Record<SurveyFormValues['condition'], StringKey>;

export default function SurveyScreen() {
  const params = useLocalSearchParams<{ taskId?: string | string[] }>();
  const taskId = firstRouteParam(params.taskId);
  const { data: task, error } = useTask(taskId);
  const createSubmission = useCreateSubmission();
  const feedback = useFeedback();
  const [photoRef, setPhotoRef] = useState<string | null>(null);
  const t = useTranslation();
  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<SurveyFormValues>({
    defaultValues: {
      assetId: 'RACK-BLR-04-A17',
      condition: 'good',
      notes: 'Rack sealed, labels readable, no visible service issue.',
    },
    resolver: zodResolver(surveySchema),
  });

  async function captureQcPhoto() {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        feedback.showWarning('Camera permission is required to attach the survey QC photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        mediaTypes: ['images'],
        quality: 0.7,
      });
      if (result.canceled) {
        feedback.showInfo('Survey photo capture cancelled.');
        return;
      }
      setPhotoRef(result.assets[0]?.uri ?? null);
    } catch (caught) {
      feedback.showError(getSafeFeedbackMessage(caught, 'Could not capture survey photo.'));
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!task) {
      feedback.showError(error ? getSafeFeedbackMessage(error, 'Task could not be loaded.') : 'Survey task is not available.');
      return;
    }
    createSubmission.mutate({
      campaignId: task?.campaignId,
      idempotencyKey: Crypto.randomUUID(),
      meta: {
        assetId: values.assetId,
        condition: values.condition,
        notes: values.notes,
        photoRef,
        source: 'mobile_survey',
      },
      payloadRef: `mock://survey/${taskId}/${values.assetId}`,
      projectId: task?.project,
      taskId,
      type: 'survey',
    });
  });

  if (!taskId) {
    return <WorkTaskUnavailable message="Survey route is missing a task ID." />;
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
          {t('survey.survey')}
        </AppText>
        <AppText variant="title">{task?.title ?? t('survey.conditionSurvey')}</AppText>
      </View>

      <Card style={styles.scanCard}>
        <View style={styles.scanIcon}>
          <QrCode color={colors.white} size={32} />
        </View>
        <View style={styles.scanText}>
          <AppText variant="subheading">{t('survey.qrRackIdentifier')}</AppText>
          <AppText muted variant="small">
            {t('survey.qrRackDetail')}
          </AppText>
        </View>
      </Card>

      <Card style={styles.form}>
        <View style={styles.field}>
          <AppText variant="label">{t('survey.assetId')}</AppText>
          <Controller
            control={control}
            name="assetId"
            render={({ field: { onBlur, onChange, value } }) => (
              <TextInput autoCapitalize="characters" onBlur={onBlur} onChangeText={onChange} style={styles.input} value={value} />
            )}
          />
          {errors.assetId ? (
            <AppText color={colors.red} variant="small">
              {localizeFormError(errors.assetId.message, t)}
            </AppText>
          ) : null}
        </View>

        <View style={styles.field}>
          <AppText variant="label">{t('survey.condition')}</AppText>
          <Controller
            control={control}
            name="condition"
            render={({ field: { onChange, value } }) => (
              <View style={styles.conditionRow}>
                {(['good', 'damaged', 'missing', 'unsafe'] as const).map((condition) => (
                  <AppButton
                    key={condition}
                    onPress={() => onChange(condition)}
                    style={styles.conditionButton}
                    variant={value === condition ? 'primary' : 'secondary'}>
                    {t(conditionLabelKeys[condition])}
                  </AppButton>
                ))}
              </View>
            )}
          />
        </View>

        <View style={styles.field}>
          <AppText variant="label">{t('survey.observation')}</AppText>
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
          {errors.notes ? (
            <AppText color={colors.red} variant="small">
              {localizeFormError(errors.notes.message, t)}
            </AppText>
          ) : null}
        </View>

        <View style={styles.photoRow}>
          <Badge label={photoRef ? t('survey.autoQcPhotoAttached') : t('survey.autoQcPhotoPending')} tone={photoRef ? 'success' : 'warning'} />
          <AppButton disabled={!task} icon={Camera} onPress={captureQcPhoto} variant="secondary">
            {t('survey.photo')}
          </AppButton>
        </View>

        <AppButton disabled={!task} icon={CheckCircle2} loading={createSubmission.isPending} onPress={onSubmit}>
          {t('survey.submitSurvey')}
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
  scanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  scanIcon: {
    width: 62,
    height: 62,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  scanText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
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
    minHeight: 100,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  conditionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  conditionButton: {
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 132,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
});
