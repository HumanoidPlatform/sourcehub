import * as FileSystem from 'expo-file-system/legacy';

import type { OdpApiAdapter, UploadProgressHandler } from './adapter';

import { getStoredSession } from '@/services/secure-session';
import type {
  AuthSession,
  AuthUser,
  CreateAppealInput,
  CreateSubmissionInput,
  DemoPersona,
  LoginInput,
  OriginalExportResponse,
  Persona,
  ProtectedMediaAsset,
  SignupInput,
  UploadMediaResponse,
  UploadQueueItem,
  WithdrawInput,
} from '@/types/domain';

class CosaarthiApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

type RequestOptions = RequestInit & {
  auth?: boolean;
  timeoutMs?: number;
};

const LOCAL_DEVICE_HOST_RE = /^https?:\/\/(?:localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0|\[?::1\]?)(?::|\/|$)/i;

function apiBaseUrl() {
  const raw = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!raw) {
    throw new CosaarthiApiError('EXPO_PUBLIC_API_URL is not configured', 500);
  }
  if (LOCAL_DEVICE_HOST_RE.test(raw)) {
    throw new CosaarthiApiError(
      'EXPO_PUBLIC_API_URL must use your Mac LAN IP for iPhone testing, for example http://192.168.x.x:8001/api/v1. localhost and 127.0.0.1 point at the phone, not the Mac.',
      500,
    );
  }
  const withoutTrailingSlash = raw.replace(/\/+$/, '');
  return withoutTrailingSlash.endsWith('/api/v1')
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}/api/v1`;
}

async function authHeader(): Promise<Record<string, string>> {
  const session = await getStoredSession();
  return session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {};
}

async function request<T>(path: string, init: RequestOptions = {}): Promise<T> {
  const baseUrl = apiBaseUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), init.timeoutMs ?? 15_000);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(init.auth ? await authHeader() : {}),
    ...(init.headers as Record<string, string> | undefined),
  };

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });

    if (response.status === 204) {
      return undefined as T;
    }

    let data: unknown = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const detail =
        data && typeof data === 'object' && 'detail' in data
          ? String((data as { detail: unknown }).detail)
          : `Cosaarthi API request failed (${response.status})`;
      throw new CosaarthiApiError(detail, response.status);
    }

    return data as T;
  } catch (error) {
    if (error instanceof CosaarthiApiError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new CosaarthiApiError(
        `Cannot reach the Cosaarthi mobile backend at ${baseUrl}. Start FastAPI with --host 0.0.0.0 --port 8001 and keep the iPhone on the same Wi-Fi network.`,
        408,
      );
    }
    throw new CosaarthiApiError(
      `Cannot reach the Cosaarthi mobile backend at ${baseUrl}. Use your Mac LAN IP in EXPO_PUBLIC_API_URL, not localhost, and start FastAPI on 0.0.0.0:8001.`,
      0,
    );
  } finally {
    clearTimeout(timeout);
  }
}

type PresignResponse = {
  expiresAt: string;
  headers: Record<string, string>;
  objectKey: string;
  uploadId: string;
  uploadUrl: string;
};

type ConfirmUploadResponse = UploadMediaResponse & {
  objectKey: string;
};

async function uploadFile(
  uploadUrl: string,
  item: UploadQueueItem,
  headers: Record<string, string>,
  onProgress?: UploadProgressHandler,
) {
  onProgress?.(0.08);
  const uploadTask = FileSystem.createUploadTask(
    uploadUrl,
    item.localUri,
    {
      headers: {
        'Content-Type': item.mimeType,
        ...headers,
      },
      httpMethod: 'PUT',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    },
    ({ totalBytesExpectedToSend, totalBytesSent }) => {
      if (totalBytesExpectedToSend > 0) {
        onProgress?.(Math.min(0.92, totalBytesSent / totalBytesExpectedToSend));
      }
    },
  );
  const result = await uploadTask.uploadAsync();
  if (!result || result.status < 200 || result.status >= 300) {
    throw new CosaarthiApiError(`MinIO upload failed (${result?.status ?? 'unknown'})`, result?.status ?? 0);
  }
  onProgress?.(0.94);
}

export const realApiAdapter: OdpApiAdapter = {
  login(input: LoginInput) {
    return request<AuthSession>('/auth/login', {
      body: JSON.stringify({
        email: input.email,
        password: input.password,
      }),
      method: 'POST',
    });
  },
  signup(input: SignupInput) {
    return request<AuthSession>('/auth/signup', {
      body: JSON.stringify({
        confirmPassword: input.confirmPassword,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        password: input.password,
        phone: input.phone,
        termsAccepted: input.termsAccepted,
      }),
      method: 'POST',
    });
  },
  switchPersona(persona: Persona) {
    return request<AuthSession>('/auth/persona', {
      auth: true,
      body: JSON.stringify({ persona }),
      method: 'POST',
    });
  },
  async getCurrentSession() {
    const stored = await getStoredSession();
    if (!stored) {
      throw new CosaarthiApiError('No stored session', 401);
    }
    const user = await request<AuthUser>('/auth/me', { auth: true });
    return {
      ...stored,
      authMode: 'real',
      user,
    };
  },
  logout(refreshToken?: string) {
    return request<void>('/auth/logout', {
      auth: true,
      body: JSON.stringify({ refreshToken }),
      method: 'POST',
    });
  },
  getHomeSummary: () => request('/mobile/crowd/home', { auth: true }),
  getAvailableTasks: () => request('/mobile/crowd/tasks/available', { auth: true }),
  getMyTasks: () => request('/mobile/crowd/tasks/mine', { auth: true }),
  getTask: (id: string) => request(`/mobile/crowd/tasks/${id}`, { auth: true }),
  startTask: (id: string) =>
    request(`/mobile/crowd/tasks/${id}/start`, {
      auth: true,
      method: 'POST',
    }),
  getNotifications: () => request('/mobile/crowd/notifications', { auth: true }),
  markNotificationRead: (id: string) =>
    request(`/mobile/crowd/notifications/${id}/read`, {
      auth: true,
      method: 'POST',
    }),
  markAllNotificationsRead: () =>
    request('/mobile/crowd/notifications/read-all', {
      auth: true,
      method: 'POST',
    }),
  getCertifications: () => request('/mobile/crowd/certifications', { auth: true }),
  getLearningModules: () => request('/mobile/crowd/learning', { auth: true }),
  getKitCustody: () => request('/mobile/crowd/kit', { auth: true }),
  getWallet: () => request('/mobile/crowd/wallet', { auth: true }),
  withdrawWallet: (input: WithdrawInput) =>
    request('/actions/wallet.withdraw', {
      auth: true,
      body: JSON.stringify(input),
      method: 'POST',
    }),
  createSubmission: (input: CreateSubmissionInput) =>
    request('/actions/submission.create', {
      auth: true,
      body: JSON.stringify({
        campaignId: input.campaignId,
        idempotencyKey: input.idempotencyKey,
        meta: input.meta,
        payloadRef: input.payloadRef,
        projectId: input.projectId,
        taskId: input.taskId,
        type: input.type,
      }),
      headers: {
        'Idempotency-Key': input.idempotencyKey,
      },
      method: 'POST',
    }),
  getAppeals: () => request('/mobile/crowd/appeals', { auth: true }),
  createAppeal: (input: CreateAppealInput) =>
    request('/actions/submission.appeal', {
      auth: true,
      body: JSON.stringify(input),
      method: 'POST',
    }),
  acceptSubmission: (submissionId: string) =>
    request<ProtectedMediaAsset>(`/actions/submissions/${submissionId}/accept`, {
      auth: true,
      method: 'POST',
    }),
  getProtectedMediaAsset: (submissionId: string, persona: DemoPersona) =>
    request<ProtectedMediaAsset | null>(`/mobile/media/${submissionId}/protected?persona=${persona}`, {
      auth: true,
    }),
  exportOriginal: (input: { adminUserId: string; reason: string; submissionId: string }) =>
    request<OriginalExportResponse>(`/admin/media/${input.submissionId}/export-original`, {
      auth: true,
      body: JSON.stringify({
        adminUserId: input.adminUserId,
        reason: input.reason,
      }),
      method: 'POST',
    }),
  getOriginalExportAuditEvents: () => request('/admin/media/original-export-audit-events', { auth: true }),
  async uploadMedia(item: UploadQueueItem, onProgress?: UploadProgressHandler): Promise<UploadMediaResponse> {
    const presigned = await request<PresignResponse>('/mobile/crowd/uploads/presign', {
      auth: true,
      body: JSON.stringify({
        fileName: item.fileName,
        idempotencyKey: item.idempotencyKey,
        kind: item.kind,
        mimeType: item.mimeType,
        sizeBytes: item.sizeBytes,
        taskId: item.taskId,
      }),
      method: 'POST',
    });
    await uploadFile(presigned.uploadUrl, item, presigned.headers, onProgress);
    const confirmed = await request<ConfirmUploadResponse>('/mobile/crowd/uploads/confirm', {
      auth: true,
      body: JSON.stringify({
        idempotencyKey: item.idempotencyKey,
        taskId: item.taskId,
        uploadId: presigned.uploadId,
      }),
      method: 'POST',
    });
    onProgress?.(1);
    return {
      ...confirmed,
      objectKey: confirmed.objectKey ?? presigned.objectKey,
      status: confirmed.status,
    };
  },
};
