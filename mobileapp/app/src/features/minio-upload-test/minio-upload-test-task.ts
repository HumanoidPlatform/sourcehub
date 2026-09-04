import type { UploadQueueItem } from '@/types/domain';

export const MINIO_UPLOAD_TEST_TASK_ID = 'TASK-MINIO-5';
export const MINIO_UPLOAD_TEST_BUCKET = 'cosaarthi-mobile-media';

const ALLOWED_MINIO_TEST_EXTENSIONS = ['jpg', 'jpeg', 'png'] as const;

type MinioTestExtension = (typeof ALLOWED_MINIO_TEST_EXTENSIONS)[number];

export function isMinioUploadTestTask(taskId?: string) {
  return /^TASK-MINIO-\d+$/i.test(taskId ?? '');
}

export function getMinioTestImageSlot(
  items: Pick<UploadQueueItem, 'kind' | 'taskId'>[],
  taskId: string,
  requiredUploadCount: number,
) {
  return Math.min(items.filter((item) => item.taskId === taskId && item.kind === 'image').length + 1, requiredUploadCount);
}

export function isAllowedMinioTestImageFile(fileName?: string | null, mimeType?: string | null, allowedFileTypes?: string[] | null) {
  const extension = getFileExtension(fileName);
  const normalizedAllowed = allowedFileTypes?.map((item) => item.toLowerCase().replace(/^\./, ''));
  if (extension) {
    return normalizedAllowed?.length
      ? isAllowedExtension(extension, normalizedAllowed)
      : ALLOWED_MINIO_TEST_EXTENSIONS.includes(extension as MinioTestExtension);
  }
  if (mimeType) {
    const mimeExtension = getExtensionFromMimeType(mimeType);
    if (normalizedAllowed?.length && mimeExtension) {
      return isAllowedExtension(mimeExtension, normalizedAllowed);
    }
    return Boolean(mimeExtension);
  }
  return true;
}

export function getMinioTestQueueFileName(slot: number, sourceFileName?: string | null, mimeType?: string | null) {
  return `minio-upload-${formatMinioSlot(slot)}.${getMinioTestExtension(sourceFileName, mimeType)}`;
}

export function getMinioTestObjectKey(item: Pick<UploadQueueItem, 'fileName' | 'mimeType' | 'taskId'>, submissionId: string) {
  return `tasks/${item.taskId}/submissions/${submissionId}/images/${formatMinioSlot(getMinioTestSlotFromFileName(item.fileName))}.${getMinioTestExtension(item.fileName, item.mimeType)}`;
}

function getMinioTestSlotFromFileName(fileName: string) {
  const match = /minio-upload-(\d{3})\./i.exec(fileName);
  if (!match?.[1]) {
    return 1;
  }
  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed)) {
    return 1;
  }
  return Math.max(1, parsed);
}

function getMinioTestExtension(fileName?: string | null, mimeType?: string | null): MinioTestExtension {
  const fromName = getFileExtension(fileName);
  if (fromName === 'png' || fromName === 'jpeg' || fromName === 'jpg') {
    return fromName;
  }
  if (mimeType === 'image/png') {
    return 'png';
  }
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return 'jpg';
  }
  return 'jpg';
}

function formatMinioSlot(slot: number) {
  return Math.max(1, Math.round(slot)).toString().padStart(3, '0');
}

function getFileExtension(fileName?: string | null) {
  return fileName?.split('?')[0]?.split('.').at(-1)?.toLowerCase();
}

function getExtensionFromMimeType(mimeType: string) {
  if (mimeType === 'image/png') {
    return 'png';
  }
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return 'jpg';
  }
  return undefined;
}

function isAllowedExtension(extension: string, allowedFileTypes: string[]) {
  if (allowedFileTypes.includes(extension)) {
    return true;
  }
  return (extension === 'jpg' || extension === 'jpeg') && (allowedFileTypes.includes('jpg') || allowedFileTypes.includes('jpeg'));
}
