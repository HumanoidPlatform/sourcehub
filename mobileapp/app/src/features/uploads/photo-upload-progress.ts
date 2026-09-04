import type { Task, UploadQueueItem } from '@/types/domain';

export type PhotoUploadProgress = {
  failedCount: number;
  hasRequirement: boolean;
  isComplete: boolean;
  label: string;
  progress: number;
  queuedCount: number;
  remainingCount: number;
  requiredUploadCount: number;
  taskUploads: UploadQueueItem[];
  uploadedCount: number;
  uploadedItems: UploadQueueItem[];
  uploadedObjectKeys: string[];
  uploadingCount: number;
};

export function getRequiredPhotoUploadCount(task?: Pick<Task, 'requiredMedia' | 'requiredUploadCount'> | null) {
  const count = task?.requiredUploadCount;
  if (!task?.requiredMedia.includes('image') || typeof count !== 'number' || !Number.isFinite(count) || count <= 0) {
    return 0;
  }
  return Math.trunc(count);
}

export function hasRequiredPhotoUploads(task?: Pick<Task, 'requiredMedia' | 'requiredUploadCount'> | null) {
  return getRequiredPhotoUploadCount(task) > 0;
}

export function getPhotoUploadProgress(
  task: Pick<Task, 'id' | 'requiredMedia' | 'requiredUploadCount'>,
  queue: UploadQueueItem[],
): PhotoUploadProgress {
  const requiredUploadCount = getRequiredPhotoUploadCount(task);
  const taskUploads = queue
    .filter((item) => item.taskId === task.id && item.kind === 'image')
    .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
  const uploadedItems = taskUploads.filter((item) => item.status === 'uploaded' && Boolean(item.remoteObjectKey));
  const uploadedObjectKeys = uploadedItems
    .map((item) => item.remoteObjectKey)
    .filter((objectKey): objectKey is string => Boolean(objectKey));
  const uploadedCount = uploadedItems.length;
  const progress = requiredUploadCount > 0 ? Math.min(1, uploadedCount / requiredUploadCount) : 0;

  return {
    failedCount: taskUploads.filter((item) => item.status === 'failed').length,
    hasRequirement: requiredUploadCount > 0,
    isComplete: requiredUploadCount > 0 && uploadedCount === requiredUploadCount,
    label: formatPhotoUploadProgress(uploadedCount, requiredUploadCount),
    progress,
    queuedCount: taskUploads.filter((item) => item.status === 'queued').length,
    remainingCount: Math.max(0, requiredUploadCount - uploadedCount),
    requiredUploadCount,
    taskUploads,
    uploadedCount,
    uploadedItems,
    uploadedObjectKeys,
    uploadingCount: taskUploads.filter((item) => item.status === 'uploading').length,
  };
}

export function formatPhotoUploadProgress(uploadedCount: number, requiredUploadCount: number) {
  return `${uploadedCount} out of ${requiredUploadCount} photos uploaded`;
}
