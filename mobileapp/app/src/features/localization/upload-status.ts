import type { StringKey } from '@/features/localization/strings';
import type { UploadQueueStatus, UploadResultStatus } from '@/types/domain';

const uploadResultStatusKeys = {
  accepted: 'uploads.status.accepted',
  duplicate: 'uploads.status.duplicate',
  failed: 'uploads.status.failed',
  possible_duplicate: 'uploads.status.possibleDuplicate',
  processing: 'uploads.status.processing',
  rejected: 'uploads.status.rejected',
} satisfies Record<UploadResultStatus, StringKey>;

const uploadQueueStatusKeys = {
  failed: 'uploads.status.failed',
  queued: 'uploads.status.queued',
  uploaded: 'uploads.status.uploaded',
  uploading: 'uploads.status.uploading',
} satisfies Record<UploadQueueStatus, StringKey>;

type TFunction = (key: StringKey) => string;

export function getLocalizedUploadResultLabel(status: UploadResultStatus | undefined, t: TFunction) {
  return t(status ? uploadResultStatusKeys[status] : 'uploads.status.pending');
}

export function getLocalizedUploadQueueStatusLabel(status: UploadQueueStatus, t: TFunction) {
  return t(uploadQueueStatusKeys[status]);
}
