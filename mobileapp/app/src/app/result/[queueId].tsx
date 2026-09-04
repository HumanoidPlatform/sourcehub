import { router, useLocalSearchParams } from 'expo-router';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  CopyX,
  Download,
  Gavel,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Badge } from '@/components/common/badge';
import { Card } from '@/components/common/card';
import { ProgressBar } from '@/components/common/progress-bar';
import { Screen } from '@/components/common/screen';
import { getSafeFeedbackMessage } from '@/features/feedback/error-messages';
import { useFeedback } from '@/features/feedback/feedback-provider';
import { getLocalizedUploadResultLabel } from '@/features/localization/upload-status';
import { useTranslation } from '@/features/localization/use-translation';
import { useUploadQueueItem } from '@/features/uploads/use-upload-queue';
import { useAcceptSubmission, useExportOriginal, useProtectedMediaAsset } from '@/hooks/use-odp-queries';
import { useAuthStore } from '@/store/auth-store';
import { type SharedSubmission, useWorkflowStore } from '@/store/workflow-store';
import { colors, spacing } from '@/theme/tokens';
import type { DemoPersona, ProtectedMediaAsset, UploadResultStatus, WatermarkStatus } from '@/types/domain';
import { firstRouteParam } from '@/utils/route-params';

const resultIcon = {
  accepted: CheckCircle2,
  duplicate: CopyX,
  failed: AlertTriangle,
  possible_duplicate: AlertTriangle,
  processing: Clock,
  rejected: AlertTriangle,
} satisfies Record<UploadResultStatus, typeof CheckCircle2>;

export default function SubmissionResultScreen() {
  const params = useLocalSearchParams<{ queueId?: string | string[] }>();
  const queueId = firstRouteParam(params.queueId);
  const { data: item, isLoading } = useUploadQueueItem(queueId);
  const session = useAuthStore((state) => state.session);
  const t = useTranslation();
  const persona = session?.user.persona;
  const { data: protectedAsset } = useProtectedMediaAsset(item?.submissionId, persona);
  const sharedSubmission = useWorkflowStore((state) =>
    item?.submissionId ? state.submissions.find((submission) => submission.submissionId === item.submissionId) : undefined,
  );
  const workflowProtectedAsset =
    item?.kind === 'video' && sharedSubmission ? getWorkflowProtectedAsset(sharedSubmission, item.kind, persona) : undefined;

  if (!queueId) {
    return <SubmissionResultUnavailable message="Submission result route is missing an upload queue ID." />;
  }

  if (isLoading) {
    return <SubmissionResultUnavailable message="Loading submission result..." />;
  }

  if (!item) {
    return <SubmissionResultUnavailable message={t('uploads.notFound')} />;
  }

  const status = item.resultStatus ?? (item.status === 'failed' ? 'failed' : 'processing');
  const Icon = resultIcon[status];
  const tone =
    status === 'accepted' ? 'success' : status === 'failed' || status === 'duplicate' || status === 'rejected' ? 'danger' : 'warning';

  return (
    <Screen>
      <AppButton icon={ArrowLeft} onPress={() => router.replace('/uploads')} style={styles.backButton} variant="ghost">
        {t('uploads.title')}
      </AppButton>

      <Card style={styles.resultCard}>
        <View style={[styles.iconWrap, tone === 'danger' && styles.dangerIcon, tone === 'warning' && styles.warningIcon]}>
          <Icon color={colors.white} size={36} />
        </View>
        <Badge label={getLocalizedUploadResultLabel(status, t)} tone={tone} />
        <AppText style={styles.center} variant="title">
          {item.taskTitle}
        </AppText>
        <AppText muted style={styles.center}>
          {item.resultMessage ?? item.error ?? t('uploads.backendProcessing')}
        </AppText>
        {item.duplicateScore ? (
          <View style={styles.score}>
            <AppText variant="label">{t('uploads.duplicateScore')}</AppText>
            <ProgressBar progress={item.duplicateScore} tone={item.duplicateScore > 0.9 ? 'danger' : 'warning'} />
            <AppText muted variant="small">
              {Math.round(item.duplicateScore * 100)}%
            </AppText>
          </View>
        ) : null}
      </Card>

      {item.kind === 'video' && item.submissionId ? (
        <MediaProtectionCard
          asset={protectedAsset ?? item.protectedAsset ?? workflowProtectedAsset}
          persona={persona}
          submissionId={item.submissionId}
          userId={session?.user.id}
        />
      ) : null}

      <AppButton icon={UploadCloud} onPress={() => router.replace('/uploads')} variant="secondary">
        {t('uploads.uploadQueue')}
      </AppButton>
      {status !== 'accepted' && status !== 'processing' ? (
        <AppButton icon={Gavel} onPress={() => router.push('/appeals')} variant="ghost">
          {t('uploads.appealResult')}
        </AppButton>
      ) : null}
    </Screen>
  );
}

function SubmissionResultUnavailable({ message }: { message: string }) {
  const t = useTranslation();
  return (
    <Screen>
      <AppButton icon={ArrowLeft} onPress={() => router.replace('/uploads')} style={styles.backButton} variant="ghost">
        {t('uploads.title')}
      </AppButton>
      <Card>
        <AppText>{message}</AppText>
      </Card>
    </Screen>
  );
}

function MediaProtectionCard({
  asset,
  persona,
  submissionId,
  userId,
}: {
  asset?: ProtectedMediaAsset;
  persona?: DemoPersona;
  submissionId: string;
  userId?: string;
}) {
  const t = useTranslation();
  const acceptSubmission = useAcceptSubmission();
  const exportOriginal = useExportOriginal();
  const feedback = useFeedback();
  const [reason, setReason] = useState('');
  const canAccept = persona === 'tenant' || persona === 'platform';
  const canExportOriginal = persona === 'platform' && asset?.adminOriginalExportAvailable;
  const visibleObjectKey = asset?.workerVisibleObjectKey ?? asset?.tenantVisibleObjectKey ?? asset?.watermarkedObjectKey;
  const trimmedReason = reason.trim();

  return (
    <Card style={styles.protectionCard}>
      <View style={styles.cardHeader}>
        <View style={styles.headerTitle}>
          <ShieldCheck color={colors.cobalt} size={20} />
          <AppText variant="subheading">{t('mediaProtection.title')}</AppText>
        </View>
        <Badge label={asset ? getWatermarkStatusLabel(asset.watermarkStatus, t) : t('mediaProtection.mockedBackendJob')} tone={getWatermarkTone(asset?.watermarkStatus)} />
      </View>

      <AppText muted>{asset?.message ?? t('mediaProtection.tenantAcceptanceStartsWatermark')}</AppText>
      <AppText muted>{t('mediaProtection.workerTenantDerivativeOnly')}</AppText>

      <View style={styles.protectionRows}>
        <ProtectionRow label={t('appeals.submissionId')} value={submissionId} />
        <ProtectionRow label={t('mediaProtection.privateOriginal')} value={t('mediaProtection.privateOriginalDetail')} />
        {asset?.watermarkText ? <ProtectionRow label={t('mediaProtection.watermarkText')} value={asset.watermarkText} /> : null}
        {visibleObjectKey ? <ProtectionRow label={t('mediaProtection.visibleAsset')} value={visibleObjectKey} /> : null}
      </View>

      {!asset && canAccept ? (
        <AppButton
          icon={CheckCircle2}
          loading={acceptSubmission.isPending}
          onPress={() => {
            acceptSubmission.mutate(submissionId);
          }}
          variant="secondary">
          {t('mediaProtection.acceptSubmission')}
        </AppButton>
      ) : null}

      {acceptSubmission.error ? (
        <AppText color={colors.red} variant="small">
          {getSafeFeedbackMessage(acceptSubmission.error, t('uploads.failed'))}
        </AppText>
      ) : null}

      {canExportOriginal ? (
        <View style={styles.adminExport}>
          <Badge label={t('mediaProtection.adminOnly')} tone="purple" />
          <AppText variant="label">{t('mediaProtection.adminExportOriginal')}</AppText>
          <TextInput
            multiline
            onChangeText={setReason}
            placeholder={t('mediaProtection.adminExportReason')}
            placeholderTextColor={colors.slate500}
            style={styles.reasonInput}
            value={reason}
          />
          <AppButton
            disabled={!userId}
            icon={Download}
            loading={exportOriginal.isPending}
            onPress={() => {
              if (!trimmedReason) {
                feedback.showWarning('Please provide a reason for accessing the original video');
                return;
              }
              if (!userId) {
                return;
              }
              exportOriginal.mutate({ adminUserId: userId, reason: trimmedReason, submissionId });
            }}
            variant="danger">
            {t('mediaProtection.exportOriginal')}
          </AppButton>
          {exportOriginal.data?.auditEvent ? (
            <AppText color={colors.green} variant="small">
              {t('mediaProtection.auditCreated')}: {exportOriginal.data.auditEvent.id}
            </AppText>
          ) : null}
          {exportOriginal.error ? (
            <AppText color={colors.red} variant="small">
              {getSafeFeedbackMessage(exportOriginal.error, t('uploads.failed'))}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

function getWorkflowProtectedAsset(
  submission: SharedSubmission,
  kind: ProtectedMediaAsset['kind'],
  persona?: DemoPersona,
): ProtectedMediaAsset | undefined {
  if (submission.status !== 'WATERMARK_PROCESSING' && submission.status !== 'WATERMARK_READY' && submission.status !== 'DELIVERED') {
    return undefined;
  }
  const ready = submission.status === 'WATERMARK_READY' || submission.status === 'DELIVERED';
  const objectKey = ready ? `mock/watermarked/${submission.watermarkedAssetId ?? submission.submissionId}.mp4` : undefined;
  return {
    adminOriginalExportAvailable: persona === 'platform' && ready,
    kind,
    message: ready
      ? 'Mock watermarked derivative is ready. Worker, Tenant and Client access the derivative only.'
      : 'Mock watermark processing is in progress. The clean original remains private in this prototype.',
    privateOriginalStored: true,
    submissionId: submission.submissionId,
    tenantVisibleObjectKey: objectKey,
    watermarkStatus: ready ? 'READY' : 'PROCESSING',
    watermarkText: submission.watermarkText,
    watermarkedObjectKey: objectKey,
    workerVisibleObjectKey: objectKey,
  };
}

function ProtectionRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.protectionRow}>
      <AppText muted variant="caption">
        {label}
      </AppText>
      <AppText variant="small">{value}</AppText>
    </View>
  );
}

function getWatermarkStatusLabel(status: WatermarkStatus, t: ReturnType<typeof useTranslation>) {
  const labels = {
    FAILED: t('mediaProtection.watermarkFailed'),
    NOT_REQUIRED: t('mediaProtection.watermarkNotRequired'),
    PROCESSING: t('mediaProtection.watermarkProcessing'),
    READY: t('mediaProtection.watermarkReady'),
  } satisfies Record<WatermarkStatus, string>;
  return labels[status];
}

function getWatermarkTone(status?: WatermarkStatus) {
  if (status === 'READY') {
    return 'success';
  }
  if (status === 'FAILED') {
    return 'danger';
  }
  if (status === 'PROCESSING') {
    return 'warning';
  }
  return 'info';
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 0,
  },
  resultCard: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green,
  },
  dangerIcon: {
    backgroundColor: colors.red,
  },
  warningIcon: {
    backgroundColor: colors.amber,
  },
  center: {
    textAlign: 'center',
  },
  score: {
    alignSelf: 'stretch',
    gap: spacing.sm,
  },
  protectionCard: {
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  headerTitle: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  protectionRows: {
    gap: spacing.sm,
  },
  protectionRow: {
    gap: spacing.xs,
  },
  adminExport: {
    gap: spacing.sm,
  },
  reasonInput: {
    minHeight: 84,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.ink,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    textAlignVertical: 'top',
  },
});
