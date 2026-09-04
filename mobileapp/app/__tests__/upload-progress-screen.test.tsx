import { fireEvent, render } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import UploadProgressScreen from '@/app/upload/[queueId]';
import type { UploadQueueItem } from '@/types/domain';

const mockUseUploadQueueItem = jest.fn();
const mockStartUploadMutate = jest.fn();
const mockRetryUploadMutate = jest.fn();

jest.mock('expo-router', () => ({
  __esModule: true,
  router: {
    back: jest.fn(),
    replace: jest.fn(),
  },
  useLocalSearchParams: jest.fn(() => ({ queueId: 'queue-possible' })),
}));

jest.mock('@/features/uploads/use-upload-queue', () => ({
  useRetryUpload: jest.fn(() => ({ isPending: false, mutate: mockRetryUploadMutate })),
  useStartUpload: jest.fn(() => ({ isPending: false, mutate: mockStartUploadMutate })),
  useUploadQueueItem: jest.fn(() => mockUseUploadQueueItem()),
}));

jest.mock('@/hooks/use-network-status', () => ({
  useNetworkStatus: jest.fn(() => ({ isOffline: false })),
}));

const safeAreaMetrics = {
  frame: { height: 844, width: 390, x: 0, y: 0 },
  insets: { bottom: 34, left: 0, right: 0, top: 47 },
};

const possibleDuplicateItem: UploadQueueItem = {
  attempts: 1,
  createdAt: '2026-08-24T00:00:00.000Z',
  duplicateScore: 0.78,
  fileName: 'traffic-road-signal.mp4',
  id: 'queue-possible',
  idempotencyKey: 'idem-possible',
  kind: 'video',
  localUri: 'file:///tmp/traffic-road-signal.mp4',
  mimeType: 'video/mp4',
  mockQcStatus: 'POSSIBLE_DUPLICATE',
  progress: 1,
  remoteObjectKey: 'mock/task-traffic-video/queue-possible',
  resultMessage: 'Your video was uploaded successfully. The demo duplicate check flagged it for review.',
  resultStatus: 'possible_duplicate',
  sizeBytes: 1024,
  status: 'uploaded',
  submissionId: 'sub-queue-possible',
  taskId: 'task-traffic-video',
  taskTitle: 'Short road-safety video',
  updatedAt: '2026-08-24T00:00:01.000Z',
};

function renderWithSafeArea(element: ReactElement) {
  return render(<SafeAreaProvider initialMetrics={safeAreaMetrics}>{element}</SafeAreaProvider>);
}

describe('UploadProgressScreen mock review completion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUploadQueueItem.mockReturnValue({ data: possibleDuplicateItem });
  });

  it('shows submitted-for-review after a possible duplicate without leaving the upload spinner active', async () => {
    const screen = await renderWithSafeArea(<UploadProgressScreen />);

    expect(screen.getByText('100%')).toBeTruthy();
    expect(screen.getByText('Submitted for review')).toBeTruthy();
    expect(screen.getByText('Your video was uploaded successfully. The demo duplicate check flagged it for review.')).toBeTruthy();
    expect(screen.getByText('View Submission')).toBeTruthy();
    expect(screen.getByText('Back to Work')).toBeTruthy();
    expect(screen.queryByText('Uploading')).toBeNull();
    expect(mockStartUploadMutate).not.toHaveBeenCalled();
  });

  it('opens the submission result from View Submission', async () => {
    const screen = await renderWithSafeArea(<UploadProgressScreen />);

    fireEvent.press(screen.getByText('View Submission'));

    const mockedRouter = (jest.requireMock('expo-router') as { router: { replace: jest.Mock } }).router;
    expect(mockedRouter.replace).toHaveBeenCalledWith('/result/queue-possible');
  });

  it('returns to Work from Back to Work', async () => {
    const screen = await renderWithSafeArea(<UploadProgressScreen />);

    fireEvent.press(screen.getByText('Back to Work'));

    const mockedRouter = (jest.requireMock('expo-router') as { router: { replace: jest.Mock } }).router;
    expect(mockedRouter.replace).toHaveBeenCalledWith('/work');
  });
});
