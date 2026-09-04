import { describe, expect, it } from '@jest/globals';

import { formatPhotoUploadProgress, getPhotoUploadProgress, getRequiredPhotoUploadCount } from '@/features/uploads/photo-upload-progress';
import type { Task, UploadQueueItem, UploadQueueStatus } from '@/types/domain';

const task: Task = {
  id: 'TASK-MINIO-DYNAMIC',
  title: 'Dynamic photo task',
  category: 'Storage / MinIO',
  project: 'MinIO Upload Reliability Test',
  campaignId: 'campaign-minio-upload-test',
  location: 'Expo Go test device',
  pay: 75,
  currency: 'INR',
  estimatedMinutes: 10,
  difficulty: 'starter',
  status: 'available',
  taskType: 'capture',
  progress: 0,
  requiredMedia: ['image'],
  requiredUploadCount: 3,
  allowedFileTypes: ['jpg', 'jpeg', 'png'],
  storageBucket: 'cosaarthi-mobile-media',
  slotsRemaining: 10,
  dueAt: '2026-09-05T00:00:00.000Z',
  checklist: [],
  description: 'Upload photos.',
  qualityBar: 'Uploaded photos only.',
};

function queueItem(id: string, status: UploadQueueStatus, remoteObjectKey?: string): UploadQueueItem {
  return {
    attempts: 1,
    createdAt: `2026-09-05T00:00:0${id}.000Z`,
    fileName: `image-${id}.jpg`,
    id,
    idempotencyKey: `idem-${id}`,
    kind: 'image',
    localUri: `file:///tmp/image-${id}.jpg`,
    mimeType: 'image/jpeg',
    progress: status === 'uploaded' ? 1 : 0.4,
    remoteObjectKey,
    sizeBytes: 1024,
    status,
    taskId: task.id,
    taskTitle: task.title,
    updatedAt: `2026-09-05T00:00:1${id}.000Z`,
  };
}

describe('photo upload progress', () => {
  it('uses the task requiredUploadCount instead of a fixed upload count', () => {
    expect(getRequiredPhotoUploadCount(task)).toBe(3);
    expect(formatPhotoUploadProgress(2, 10)).toBe('2 out of 10 photos uploaded');
  });

  it('counts only successfully uploaded image rows with object keys', () => {
    const progress = getPhotoUploadProgress(task, [
      queueItem('1', 'uploaded', 'tasks/TASK-MINIO-DYNAMIC/one.jpg'),
      queueItem('2', 'queued'),
      queueItem('3', 'uploading'),
      queueItem('4', 'failed'),
      {
        ...queueItem('5', 'uploaded', 'tasks/other-task/five.jpg'),
        taskId: 'other-task',
      },
    ]);

    expect(progress.label).toBe('1 out of 3 photos uploaded');
    expect(progress.uploadedCount).toBe(1);
    expect(progress.remainingCount).toBe(2);
    expect(progress.failedCount).toBe(1);
    expect(progress.queuedCount).toBe(1);
    expect(progress.uploadingCount).toBe(1);
    expect(progress.isComplete).toBe(false);
  });

  it('reports completion only when uploadedCount matches requiredUploadCount', () => {
    const progress = getPhotoUploadProgress(task, [
      queueItem('1', 'uploaded', 'tasks/TASK-MINIO-DYNAMIC/one.jpg'),
      queueItem('2', 'uploaded', 'tasks/TASK-MINIO-DYNAMIC/two.jpg'),
      queueItem('3', 'uploaded', 'tasks/TASK-MINIO-DYNAMIC/three.jpg'),
    ]);

    expect(progress.label).toBe('3 out of 3 photos uploaded');
    expect(progress.uploadedObjectKeys).toHaveLength(3);
    expect(progress.isComplete).toBe(true);
  });
});
