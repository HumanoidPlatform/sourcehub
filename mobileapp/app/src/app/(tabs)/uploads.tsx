import { router } from 'expo-router';
import { CloudUpload } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { EmptyState } from '@/components/common/empty-state';
import { Screen } from '@/components/common/screen';
import { SkeletonList } from '@/components/common/skeleton';
import { UploadCard } from '@/components/work/upload-card';
import { useTranslation } from '@/features/localization/use-translation';
import { useRetryUpload, useUploadQueue } from '@/features/uploads/use-upload-queue';
import { colors, spacing } from '@/theme/tokens';
import type { UploadQueueItem } from '@/types/domain';

export default function UploadsTab() {
  const { data: queue = [], isLoading } = useUploadQueue();
  const retry = useRetryUpload();
  const t = useTranslation();

  return (
    <Screen>
      <View>
        <AppText muted variant="small">
          {t('uploads.uploadQueue')}
        </AppText>
        <AppText variant="title">{t('uploads.title')}</AppText>
      </View>

      <View style={styles.summary}>
        <QueueCount label={t('uploads.queued')} value={queue.filter((item) => item.status === 'queued').length} />
        <QueueCount label={t('uploads.uploading')} value={queue.filter((item) => item.status === 'uploading').length} />
        <QueueCount label={t('uploads.failed')} value={queue.filter((item) => item.status === 'failed').length} danger />
      </View>

      {isLoading ? (
        <SkeletonList rows={3} />
      ) : queue.length ? (
        <View style={styles.list}>
          {queue.map((item) => (
            <UploadCard
              key={item.id}
              item={item}
              onOpen={() => router.push(isResultStatus(item.status) ? `/result/${item.id}` : `/preview/${item.id}`)}
              onRetry={() => retry.mutate(item.id)}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          body={t('uploads.queueClearDetail')}
          icon={CloudUpload}
          title={t('uploads.queueClear')}
        />
      )}
    </Screen>
  );
}

function isResultStatus(status: UploadQueueItem['status']) {
  return status === 'uploaded';
}

function QueueCount({ danger, label, value }: { danger?: boolean; label: string; value: number }) {
  return (
    <View style={styles.count}>
      <AppText color={danger ? colors.red : colors.ink} variant="heading">
        {value}
      </AppText>
      <AppText muted variant="caption">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  count: {
    flex: 1,
    minWidth: '30%',
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  list: {
    gap: spacing.md,
  },
});
