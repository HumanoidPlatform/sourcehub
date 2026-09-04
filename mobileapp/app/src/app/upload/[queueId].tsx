import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle2, CloudUpload, Eye, RotateCcw, BriefcaseBusiness } from 'lucide-react-native';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Badge } from '@/components/common/badge';
import { Card } from '@/components/common/card';
import { ProgressBar } from '@/components/common/progress-bar';
import { Screen } from '@/components/common/screen';
import { getSafeFeedbackMessage } from '@/features/feedback/error-messages';
import { getLocalizedUploadQueueStatusLabel, getLocalizedUploadResultLabel } from '@/features/localization/upload-status';
import { useTranslation } from '@/features/localization/use-translation';
import { useRetryUpload, useStartUpload, useUploadQueueItem } from '@/features/uploads/use-upload-queue';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { spacing } from '@/theme/tokens';
import { firstRouteParam } from '@/utils/route-params';

export default function UploadProgressScreen() {
  const params = useLocalSearchParams<{ queueId?: string | string[] }>();
  const queueId = firstRouteParam(params.queueId);
  const { data: item, isLoading } = useUploadQueueItem(queueId);
  const startUpload = useStartUpload();
  const retryUpload = useRetryUpload();
  const { isOffline } = useNetworkStatus();
  const t = useTranslation();

  useEffect(() => {
    if (!item || isOffline || item.status !== 'queued' || startUpload.isPending) {
      return;
    }
    startUpload.mutate(item.id);
  }, [isOffline, item, startUpload]);

  if (!queueId) {
    return <UploadProgressUnavailable message="Upload route is missing an upload queue ID." />;
  }

  if (isLoading) {
    return <UploadProgressUnavailable message="Loading upload..." />;
  }

  if (!item) {
    return <UploadProgressUnavailable message={t('uploads.notFound')} />;
  }

  const finished = item.status === 'uploaded';
  const failed = item.status === 'failed';
  const possibleDuplicate = item.mockQcStatus === 'POSSIBLE_DUPLICATE' || item.resultStatus === 'possible_duplicate';

  return (
    <Screen>
      <AppButton icon={ArrowLeft} onPress={() => router.back()} style={styles.backButton} variant="ghost">
        {t('common.back')}
      </AppButton>
      <View>
        <AppText muted variant="small">
          {t('uploads.uploadProgress')}
        </AppText>
        <AppText variant="title">{item.taskTitle}</AppText>
      </View>

      <Card style={styles.card}>
        <Badge
          label={item.resultStatus ? getLocalizedUploadResultLabel(item.resultStatus, t) : getLocalizedUploadQueueStatusLabel(item.status, t)}
          tone={failed ? 'danger' : possibleDuplicate ? 'warning' : finished ? 'success' : 'info'}
        />
        <View style={styles.progressWrap}>
          <AppText variant="heading">{Math.round(item.progress * 100)}%</AppText>
          <ProgressBar progress={item.progress} tone={failed ? 'danger' : 'accent'} />
        </View>
        {possibleDuplicate ? (
          <View style={styles.reviewCopy}>
            <Badge label={t('uploads.mockDuplicateCheck')} tone="warning" />
            <AppText variant="subheading">{t('uploads.submittedForReview')}</AppText>
            <AppText muted>{t('uploads.submittedForReviewDetail')}</AppText>
          </View>
        ) : item.mockQcStatus && item.mockQcStatus !== 'NOT_CHECKED' ? (
          <View style={styles.reviewCopy}>
            <Badge label={t('uploads.mockQcCheck')} tone="info" />
            <AppText muted>{item.error ? getSafeFeedbackMessage(item.error, 'Upload failed. Please retry.') : item.resultMessage ?? t('uploads.defaultProgressMessage')}</AppText>
          </View>
        ) : (
          <AppText muted>{item.error ? getSafeFeedbackMessage(item.error, 'Upload failed. Please retry.') : item.resultMessage ?? t('uploads.defaultProgressMessage')}</AppText>
        )}
      </Card>

      {failed ? (
        <AppButton
          disabled={isOffline}
          icon={RotateCcw}
          loading={retryUpload.isPending}
          onPress={() => retryUpload.mutate(item.id)}
          variant="secondary">
          {t('common.retry')}
        </AppButton>
      ) : possibleDuplicate ? (
        <View style={styles.finishedActions}>
          <AppButton icon={Eye} onPress={() => router.replace(`/result/${item.id}`)}>
            {t('uploads.viewSubmission')}
          </AppButton>
          <AppButton icon={BriefcaseBusiness} onPress={() => router.replace('/work')} variant="secondary">
            {t('uploads.backToWork')}
          </AppButton>
        </View>
      ) : finished ? (
        <AppButton icon={CheckCircle2} onPress={() => router.replace(`/result/${item.id}`)}>
          {t('uploads.submissionResult')}
        </AppButton>
      ) : (
        <AppButton disabled icon={CloudUpload} loading>
          {t('uploads.uploading')}
        </AppButton>
      )}
    </Screen>
  );
}

function UploadProgressUnavailable({ message }: { message: string }) {
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
  card: {
    gap: spacing.lg,
  },
  progressWrap: {
    gap: spacing.sm,
  },
  reviewCopy: {
    gap: spacing.sm,
  },
  finishedActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
});
