import * as FileSystem from 'expo-file-system/legacy';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { createOdpApi } from '@/api';
import { realApiAdapter } from '@/api/real-adapter';
import { saveSession } from '@/services/secure-session';
import type { AuthSession, UploadQueueItem } from '@/types/domain';

jest.mock('expo-file-system/legacy', () => ({
  __esModule: true,
  FileSystemUploadType: {
    BINARY_CONTENT: 'BINARY_CONTENT',
  },
  createUploadTask: (
    url: string,
    localUri: string,
    options: object,
    onProgress?: (progress: { totalBytesExpectedToSend: number; totalBytesSent: number }) => void,
  ) => {
    const globalMocks = globalThis as typeof globalThis & {
      __cosaarthiUploadTaskCalls?: [string, string, object][];
    };
    globalMocks.__cosaarthiUploadTaskCalls ??= [];
    globalMocks.__cosaarthiUploadTaskCalls.push([url, localUri, options]);
    onProgress?.({ totalBytesExpectedToSend: 100, totalBytesSent: 100 });
    return {
      uploadAsync: async () => ({ status: 200 }),
    };
  },
}));

const session: AuthSession = {
  accessToken: 'real-access-token',
  authMode: 'real',
  expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  refreshToken: 'real-refresh-token',
  sessionVersion: 2,
  user: {
    availablePersonas: ['crowd'],
    certificationIds: [],
    email: 'anita@crowd.in',
    entity: {
      id: 'worker-1',
      name: 'Anita Rao',
      type: 'crowd_pool',
    },
    id: 'user-1',
    locale: 'en-IN',
    name: 'Anita Rao',
    permissions: ['work:read', 'upload:create', 'submission:create', 'task:start'],
    persona: 'crowd',
    phone: '+91 90000 7007',
    tenant: {
      id: 'org-1',
      name: 'Cosaarthi Crowd',
    },
  },
};

const uploadItem: UploadQueueItem = {
  attempts: 0,
  createdAt: '2026-09-04T00:00:00.000Z',
  fileName: 'minio-upload-001.jpg',
  id: 'queue-1',
  idempotencyKey: 'idem-upload-001',
  kind: 'image',
  localUri: 'file:///image.jpg',
  mimeType: 'image/jpeg',
  progress: 0,
  sizeBytes: 1024,
  status: 'queued',
  taskId: 'TASK-MINIO-5',
  taskTitle: 'Upload 5 Images',
  updatedAt: '2026-09-04T00:00:00.000Z',
};

function jsonResponse(data: unknown, status = 200): Response {
  return {
    json: jest.fn(async () => data),
    ok: status >= 200 && status < 300,
    status,
  } as unknown as Response;
}

describe('realApiAdapter', () => {
  const fetchMock = jest.fn() as unknown as jest.MockedFunction<typeof fetch>;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_API_URL = 'http://mobile-backend.test:8001/api/v1/';
    process.env.EXPO_PUBLIC_API_MODE = 'real';
    globalThis.fetch = fetchMock as typeof fetch;
    (globalThis as typeof globalThis & { __cosaarthiUploadTaskCalls?: unknown[] }).__cosaarthiUploadTaskCalls = [];
    fetchMock.mockReset();
    await saveSession(session);
  });

  it('posts email/password login to the mobile backend without duplicating /api/v1', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(session));

    await expect(
      realApiAdapter.login({
        email: 'anita@crowd.in',
        password: 'Cosaarthi#2026',
      }),
    ).resolves.toMatchObject({ authMode: 'real' });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://mobile-backend.test:8001/api/v1/auth/login',
      expect.objectContaining({
        body: JSON.stringify({
          email: 'anita@crowd.in',
          password: 'Cosaarthi#2026',
        }),
        method: 'POST',
      }),
    );
  });

  it('defaults to the real backend adapter unless mock mode is explicit', () => {
    const previousMode = process.env.EXPO_PUBLIC_API_MODE;
    delete process.env.EXPO_PUBLIC_API_MODE;

    expect(createOdpApi()).toBe(realApiAdapter);

    process.env.EXPO_PUBLIC_API_MODE = previousMode;
  });

  it('rejects localhost URLs before real-mode login can silently target the phone', async () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:8001/api/v1';

    await expect(
      realApiAdapter.login({
        email: 'platform@cosaarthi.local',
        password: 'Cosaarthi#2026',
      }),
    ).rejects.toThrow('EXPO_PUBLIC_API_URL must use your Mac LAN IP');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows a clear backend-unreachable error when the Mac LAN backend cannot be reached', async () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.4:8001/api/v1';
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));

    await expect(
      realApiAdapter.login({
        email: 'platform@cosaarthi.local',
        password: 'Cosaarthi#2026',
      }),
    ).rejects.toThrow('Cannot reach the Cosaarthi mobile backend at http://192.168.1.4:8001/api/v1');
  });

  it('posts persona switches to the mobile backend', async () => {
    const switchedSession: AuthSession = {
      ...session,
      user: {
        ...session.user,
        availablePersonas: ['tenant', 'aggregator', 'qa', 'crowd'],
        persona: 'aggregator',
      },
    };
    fetchMock.mockResolvedValueOnce(jsonResponse(switchedSession));

    await expect(realApiAdapter.switchPersona('aggregator')).resolves.toMatchObject({
      user: { persona: 'aggregator' },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://mobile-backend.test:8001/api/v1/auth/persona',
      expect.objectContaining({
        body: JSON.stringify({ persona: 'aggregator' }),
        headers: expect.objectContaining({
          Authorization: 'Bearer real-access-token',
          'Content-Type': 'application/json',
        }),
        method: 'POST',
      }),
    );
  });

  it('uses backend presign, direct MinIO PUT, and confirm for image uploads', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          headers: { 'Content-Type': 'image/jpeg' },
          objectKey: 'tasks/TASK-MINIO-5/users/user-1/upload.jpg',
          uploadId: '6ef5d62f-11d2-4f54-a049-8b49d67c3223',
          uploadUrl: 'http://mobile-minio.test:59000/cosaarthi-mobile-media/upload.jpg',
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          message: 'Image uploaded to mobile MinIO and metadata recorded.',
          objectKey: 'tasks/TASK-MINIO-5/users/user-1/upload.jpg',
          status: 'accepted',
          submissionId: 'asset-1',
        }),
      );

    await expect(realApiAdapter.uploadMedia(uploadItem)).resolves.toMatchObject({
      objectKey: 'tasks/TASK-MINIO-5/users/user-1/upload.jpg',
      status: 'accepted',
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://mobile-backend.test:8001/api/v1/mobile/crowd/uploads/presign',
      expect.objectContaining({
        body: JSON.stringify({
          fileName: uploadItem.fileName,
          idempotencyKey: uploadItem.idempotencyKey,
          kind: 'image',
          mimeType: 'image/jpeg',
          sizeBytes: 1024,
          taskId: 'TASK-MINIO-5',
        }),
        method: 'POST',
      }),
    );
    const uploadCalls = (globalThis as typeof globalThis & {
      __cosaarthiUploadTaskCalls?: [string, string, { headers: Record<string, string>; httpMethod: string; uploadType: string }][];
    }).__cosaarthiUploadTaskCalls;
    expect(uploadCalls?.[0]).toEqual([
      'http://mobile-minio.test:59000/cosaarthi-mobile-media/upload.jpg',
      'file:///image.jpg',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'image/jpeg' }),
        httpMethod: 'PUT',
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      }),
    ]);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://mobile-backend.test:8001/api/v1/mobile/crowd/uploads/confirm',
      expect.objectContaining({
        body: JSON.stringify({
          idempotencyKey: uploadItem.idempotencyKey,
          taskId: 'TASK-MINIO-5',
          uploadId: '6ef5d62f-11d2-4f54-a049-8b49d67c3223',
        }),
        method: 'POST',
      }),
    );
  });
});
