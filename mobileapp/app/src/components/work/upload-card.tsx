import { Image as ImageIcon, Mic, RotateCcw, Video } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Badge } from '@/components/common/badge';
import { Card } from '@/components/common/card';
import { ProgressBar } from '@/components/common/progress-bar';
import { getSafeFeedbackMessage } from '@/features/feedback/error-messages';
import { getLocalizedUploadQueueStatusLabel, getLocalizedUploadResultLabel } from '@/features/localization/upload-status';
import { useTranslation } from '@/features/localization/use-translation';
import { colors, spacing } from '@/theme/tokens';
import type { MediaKind, UploadQueueItem } from '@/types/domain';
import { formatBytes } from '@/utils/format';

const iconByKind = {
  audio: Mic,
  image: ImageIcon,
  video: Video,
} satisfies Record<MediaKind, typeof ImageIcon>;

function statusTone(status: UploadQueueItem['status'], resultStatus?: UploadQueueItem['resultStatus']) {
  if (status === 'failed' || resultStatus === 'failed' || resultStatus === 'duplicate') {
    return 'danger' as const;
  }
  if (resultStatus === 'possible_duplicate' || resultStatus === 'processing') {
    return 'warning' as const;
  }
  if (status === 'uploaded' || resultStatus === 'accepted') {
    return 'success' as const;
  }
  return 'info' as const;
}

type UploadCardProps = {
  item: UploadQueueItem;
  onOpen: () => void;
  onRetry?: () => void;
};

export function UploadCard({ item, onOpen, onRetry }: UploadCardProps) {
  const Icon = iconByKind[item.kind];
  const t = useTranslation();
  const label = item.resultStatus ? getLocalizedUploadResultLabel(item.resultStatus, t) : getLocalizedUploadQueueStatusLabel(item.status, t);

  return (
    <Pressable accessibilityRole="button" onPress={onOpen} style={({ pressed }) => pressed && styles.pressed}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Icon color={colors.accentDark} size={20} />
          </View>
          <View style={styles.titleWrap}>
            <AppText variant="subheading">{item.taskTitle}</AppText>
            <AppText muted variant="small">
              {item.fileName} · {formatBytes(item.sizeBytes)}
            </AppText>
          </View>
          <Badge label={label} tone={statusTone(item.status, item.resultStatus)} />
        </View>

        <ProgressBar
          progress={item.progress}
          tone={item.status === 'failed' ? 'danger' : item.resultStatus === 'possible_duplicate' ? 'warning' : 'accent'}
        />

        {item.error || item.resultMessage ? (
          <AppText muted variant="small">
            {item.error ? getSafeFeedbackMessage(item.error, 'Upload failed. Please retry.') : item.resultMessage}
          </AppText>
        ) : null}

        {item.status === 'failed' && onRetry ? (
          <AppButton icon={RotateCcw} onPress={onRetry} variant="secondary">
            {t('uploads.retryUpload')}
          </AppButton>
        ) : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.78,
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
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cyanSoft,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
});
