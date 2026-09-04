import { render } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { TaskCard } from '@/components/work/task-card';
import type { Task, UploadQueueItem } from '@/types/domain';

const mockUseUploadQueue = jest.fn();

jest.mock('@/features/uploads/use-upload-queue', () => ({
  useUploadQueue: jest.fn(() => mockUseUploadQueue()),
}));

jest.mock('@/features/localization/use-translation', () => ({
  useTranslation: jest.fn(() => (key: string) => key),
}));

const task: Task = {
  id: 'TASK-MINIO-3',
  title: 'Upload 3 Photos',
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
  checklist: [
    'Upload exactly 3 jpg, jpeg or png images.',
    'Wait for each image to reach uploaded before submitting the task.',
  ],
  description: 'Upload photos.',
  qualityBar: 'Uploaded photos only.',
};

function uploaded(id: string): UploadQueueItem {
  return {
    attempts: 1,
    createdAt: `2026-09-05T00:00:0${id}.000Z`,
    fileName: `image-${id}.jpg`,
    id,
    idempotencyKey: `idem-${id}`,
    kind: 'image',
    localUri: `file:///tmp/image-${id}.jpg`,
    mimeType: 'image/jpeg',
    progress: 1,
    remoteObjectKey: `tasks/TASK-MINIO-3/${id}.jpg`,
    sizeBytes: 1024,
    status: 'uploaded',
    taskId: task.id,
    taskTitle: task.title,
    updatedAt: `2026-09-05T00:00:1${id}.000Z`,
  };
}

describe('TaskCard upload progress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows dynamic uploaded photo progress for required-upload tasks', async () => {
    mockUseUploadQueue.mockReturnValue({
      data: [
        uploaded('1'),
        {
          ...uploaded('2'),
          remoteObjectKey: undefined,
          status: 'queued',
        },
        {
          ...uploaded('3'),
          remoteObjectKey: undefined,
          status: 'failed',
        },
      ],
    });

    const screen = await render(<TaskCard task={task} onPress={jest.fn()} />);

    expect(screen.getByText('1 out of 3 photos uploaded')).toBeTruthy();
  });
});
