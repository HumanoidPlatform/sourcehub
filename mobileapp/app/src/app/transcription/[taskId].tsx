import { zodResolver } from '@hookform/resolvers/zod';
import * as Crypto from 'expo-crypto';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle2, Pause, Play } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Badge } from '@/components/common/badge';
import { Card } from '@/components/common/card';
import { ProgressBar } from '@/components/common/progress-bar';
import { Screen } from '@/components/common/screen';
import { getSafeFeedbackMessage } from '@/features/feedback/error-messages';
import { useFeedback } from '@/features/feedback/feedback-provider';
import { localizeFormError } from '@/features/localization/form-errors';
import { useTranslation } from '@/features/localization/use-translation';
import { useCreateSubmission, useTask } from '@/hooks/use-odp-queries';
import { colors, radii, spacing } from '@/theme/tokens';
import { transcriptionSchema, type TranscriptionFormValues } from '@/types/forms';
import { firstRouteParam } from '@/utils/route-params';

export default function TranscriptionScreen() {
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
  } = useForm<TranscriptionFormValues>({
    defaultValues: {
      speakerContext: 'Ambient public environment',
      transcript: 'Train announcement audible, traffic in background, no private conversation.',
    },
    resolver: zodResolver(transcriptionSchema),
  });
  const [playing, setPlaying] = useState(false);

  const onSubmit = handleSubmit(async (values) => {
    if (!task) {
      feedback.showError(error ? getSafeFeedbackMessage(error, 'Task could not be loaded.') : 'Transcription task is not available.');
      return;
    }
    createSubmission.mutate({
      campaignId: task?.campaignId,
      idempotencyKey: Crypto.randomUUID(),
      meta: {
        segments: [{ endMs: 15000, startMs: 0, text: values.transcript }],
        speakerContext: values.speakerContext,
        source: 'mobile_transcription',
      },
      payloadRef: `mock://audio/${taskId}/segment-001`,
      projectId: task?.project,
      taskId,
      type: 'transcription',
    });
  });

  if (!taskId) {
    return <WorkTaskUnavailable message="Transcription route is missing a task ID." />;
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
          {t('transcription.transcribe')}
        </AppText>
        <AppText variant="title">{task?.title ?? t('transcription.audioTranscription')}</AppText>
      </View>

      <Card style={styles.playerCard}>
        <View style={styles.playerTop}>
          <Pressable accessibilityRole="button" onPress={() => setPlaying((value) => !value)} style={styles.playButton}>
            {playing ? <Pause color={colors.white} size={24} /> : <Play color={colors.white} size={24} fill={colors.white} />}
          </Pressable>
          <View style={styles.playerText}>
            <AppText variant="subheading">{t('transcription.audioSegment')}</AppText>
            <AppText muted variant="small">
              {t('transcription.edgePreTranscriptionDetail')}
            </AppText>
          </View>
        </View>
        <View style={styles.wave}>
          {Array.from({ length: 22 }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.waveBar,
                {
                  height: 18 + ((index * 13) % 48),
                  opacity: playing ? 1 : 0.58,
                },
              ]}
            />
          ))}
        </View>
        <ProgressBar progress={playing ? 0.44 : 0.18} />
      </Card>

      <Card style={styles.form}>
        <Badge label={t('transcription.edgePreTranscription')} tone="purple" />
        <View style={styles.field}>
          <AppText variant="label">{t('transcription.transcript')}</AppText>
          <Controller
            control={control}
            name="transcript"
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
          {errors.transcript ? (
            <AppText color={colors.red} variant="small">
              {localizeFormError(errors.transcript.message, t)}
            </AppText>
          ) : null}
        </View>
        <View style={styles.field}>
          <AppText variant="label">{t('transcription.segmentContext')}</AppText>
          <Controller
            control={control}
            name="speakerContext"
            render={({ field: { onBlur, onChange, value } }) => (
              <TextInput onBlur={onBlur} onChangeText={onChange} style={styles.input} value={value} />
            )}
          />
        </View>
        <AppButton disabled={!task} icon={CheckCircle2} loading={createSubmission.isPending} onPress={onSubmit}>
          {t('transcription.submitTranscription')}
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
  playerCard: {
    gap: spacing.md,
  },
  playerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  playerText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  wave: {
    height: 88,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  waveBar: {
    width: 5,
    borderRadius: 4,
    backgroundColor: colors.accent,
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
    minHeight: 130,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
});
