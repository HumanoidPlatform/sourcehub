import type { OdpApiAdapter, UploadProgressHandler } from './adapter';
import {
  mockCertifications,
  mockAppeals,
  mockHomeSummary,
  mockKitCustody,
  mockLearningModules,
  mockNotifications,
  mockTasks,
  mockWallet,
  myMockTasks,
} from './mock-data';

import type {
  AuthUser,
  CreateAppealInput,
  CreateSubmissionInput,
  DemoPersona,
  ProtectedMediaAsset,
  LoginInput,
  SignupInput,
  UploadMediaResponse,
  UploadQueueItem,
  WithdrawInput,
} from '@/types/domain';
import { getAvailablePersonasForDemoLogin } from '@/auth/demo-personas';
import { mockMediaAccessService } from '@/features/media-protection/media-access-service';
import { getMinioTestObjectKey, isMinioUploadTestTask } from '@/features/minio-upload-test/minio-upload-test-task';
import { CURRENT_SESSION_VERSION, getStoredSession } from '@/services/secure-session';
import { getWorkflowTasksAsDomainTasks, useWorkflowStore } from '@/store/workflow-store';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function inferMockUploadResponse(item: UploadQueueItem): UploadMediaResponse {
  const submissionId = `sub-${item.id}`;
  if (isMinioUploadTestTask(item.taskId) && item.kind === 'image') {
    return {
      status: 'accepted',
      message: 'MinIO upload test image uploaded successfully.',
      mockQcStatus: 'CLEAR',
      objectKey: getMinioTestObjectKey(item, submissionId),
      preliminaryValidation: item.preliminaryValidation,
      submissionId,
    };
  }

  if (item.kind === 'video') {
    const semanticStatus = item.preliminaryValidation?.status;
    const isRoadSafetyDemo = item.taskId === 'task-traffic-video';
    const isUncertain = semanticStatus === 'UNCERTAIN';

    if (isUncertain) {
      return {
        status: 'processing',
        message: 'Your video was uploaded successfully. Mock QC queued it for human review because the demo semantic check was uncertain.',
        mockQcStatus: 'NOT_CHECKED',
        objectKey: `mock/${item.taskId}/${item.id}`,
        preliminaryValidation: item.preliminaryValidation,
        submissionId,
      };
    }

    return {
      status: isRoadSafetyDemo ? 'possible_duplicate' : 'accepted',
      message: isRoadSafetyDemo
        ? 'Your video was uploaded successfully. The demo duplicate check flagged it for review.'
        : 'Your video was uploaded successfully. Mock QC check cleared this demo submission.',
      duplicateScore: isRoadSafetyDemo ? 0.78 : undefined,
      mockQcStatus: isRoadSafetyDemo ? 'POSSIBLE_DUPLICATE' : 'CLEAR',
      objectKey: `mock/${item.taskId}/${item.id}`,
      preliminaryValidation: item.preliminaryValidation,
      submissionId,
    };
  }

  if (item.kind === 'audio') {
    return {
      status: 'duplicate',
      message: 'Your audio was uploaded successfully. The demo duplicate check marked it as a confirmed duplicate.',
      duplicateScore: 0.94,
      mockQcStatus: 'CONFIRMED_DUPLICATE',
      objectKey: `mock/${item.taskId}/${item.id}`,
      preliminaryValidation: item.preliminaryValidation,
      submissionId,
    };
  }

  return {
    status: 'accepted',
    message: 'Your media was uploaded successfully. Mock QC check cleared this demo submission.',
    mockQcStatus: 'CLEAR',
    objectKey: `mock/${item.taskId}/${item.id}`,
    preliminaryValidation: item.preliminaryValidation,
    submissionId,
  };
}

const uploadedMedia = new Map<string, { kind: UploadQueueItem['kind']; objectKey: string }>();
const readNotificationIds = new Set<string>();

function notRequiredAsset(submissionId: string): ProtectedMediaAsset {
  return {
    adminOriginalExportAvailable: false,
    kind: 'image',
    message: 'Watermark is not required for this mock non-video submission.',
    privateOriginalStored: false,
    submissionId,
    watermarkStatus: 'NOT_REQUIRED',
  };
}

const demoUsers = {
  aggregator: {
    certificationIds: [],
    entity: {
      id: 'ent-meridian',
      name: 'Meridian Data Labs',
      type: 'aggregator',
    },
    id: 'user-meridian-ops',
    locale: 'en-IN',
    name: 'Meridian Ops',
    permissions: ['aggregator:read', 'escalation:update'],
    persona: 'aggregator',
    phone: '+91 90000 2204',
    tenant: {
      id: 'tenant-meridian',
      name: 'Meridian Data Labs',
    },
  },
  builder: {
    certificationIds: [],
    entity: {
      id: 'ent-helix-labs',
      name: 'Helix Labs AI',
      type: 'builder',
    },
    id: 'user-builder-001',
    locale: 'en-US',
    name: 'Helix AI Builder',
    permissions: ['builder:read'],
    persona: 'builder',
    phone: '+1 555 0108',
    tenant: {
      id: 'builder-helix',
      name: 'Helix Labs',
    },
  },
  client: {
    certificationIds: [],
    entity: {
      id: 'ent-autodrive',
      name: 'AutoDrive GmbH',
      type: 'client',
    },
    id: 'user-client-2031',
    locale: 'en-DE',
    name: 'AutoDrive Client',
    permissions: ['client:read', 'rfp:award', 'delivery:accept'],
    persona: 'client',
    phone: '+49 30 0000 2031',
    tenant: {
      id: 'client-autodrive',
      name: 'AutoDrive GmbH',
    },
  },
  crowd: {
    certificationIds: ['cert-visual'],
    entity: {
      id: 'ent-crowd-anita',
      name: 'Anita Crowd Worker',
      type: 'crowd_pool',
    },
    id: 'user-crowd-anita',
    locale: 'en-IN',
    name: 'Anita Rao',
    permissions: [
      'work:read',
      'task:start',
      'media:capture',
      'submission:create',
      'upload:create',
      'wallet:read',
      'wallet:withdraw',
      'profile:update',
    ],
    persona: 'crowd',
    phone: '+91 90000 7007',
    tenant: {
      id: 'tenant-meridian',
      name: 'Meridian Data Labs',
    },
  },
  ide: {
    certificationIds: ['cert-visual', 'cert-model-eval'],
    entity: {
      id: 'ent-crowd-anita',
      name: 'Anita Crowd Worker',
      type: 'crowd_pool',
    },
    id: 'user-crowd-anita',
    locale: 'en-IN',
    name: 'Anita Rao',
    permissions: ['ide:read', 'submission:create', 'wallet:read'],
    persona: 'ide',
    phone: '+91 90000 7007',
    tenant: {
      id: 'tenant-meridian',
      name: 'Meridian Data Labs',
    },
  },
  partner: {
    certificationIds: [],
    entity: {
      id: 'ent-kova',
      name: 'Kova Field Partners',
      type: 'partner',
    },
    id: 'user-partner-kova',
    locale: 'en-IN',
    name: 'Kova Coordinator',
    permissions: ['partner:read', 'supply:commit'],
    persona: 'partner',
    phone: '+91 90000 3098',
    tenant: {
      id: 'tenant-meridian',
      name: 'Meridian Data Labs',
    },
  },
  qa: {
    certificationIds: ['cert-visual'],
    entity: {
      id: 'ent-meridian-qa',
      name: 'Meridian QA',
      type: 'tenant',
    },
    id: 'user-meridian-qa',
    locale: 'en-IN',
    name: 'Meridian QA Reviewer',
    permissions: ['qa:read', 'qa:review', 'tenant:read'],
    persona: 'qa',
    phone: '+91 90000 2205',
    tenant: {
      id: 'tenant-meridian',
      name: 'Meridian Data Labs',
    },
  },
  platform: {
    certificationIds: [],
    entity: {
      id: 'ent-platform',
      name: 'Cosaarthi Command Centre',
      type: 'platform',
    },
    id: 'user-platform-admin',
    locale: 'en-US',
    name: 'Platform Admin',
    permissions: ['platform:read'],
    persona: 'platform',
    phone: '+1 555 0100',
    tenant: {
      id: 'platform',
      name: 'Cosaarthi Data Platform',
    },
  },
  sponsor: {
    certificationIds: [],
    entity: {
      id: 'ent-gearlend',
      name: 'GearLend Devices',
      type: 'sponsor',
    },
    id: 'user-sponsor-fleet',
    locale: 'en-IN',
    name: 'GearLend Fleet',
    permissions: ['sponsor:read', 'kit:allocate'],
    persona: 'sponsor',
    phone: '+91 90000 4100',
    tenant: {
      id: 'sponsor-gearlend',
      name: 'GearLend Devices',
    },
  },
  tenant: {
    certificationIds: [],
    entity: {
      id: 'ent-meridian',
      name: 'Meridian Data Labs',
      type: 'tenant',
    },
    id: 'user-meridian-ops',
    locale: 'en-IN',
    name: 'Meridian Ops',
    permissions: ['tenant:read', 'project:publish'],
    persona: 'tenant',
    phone: '+91 90000 2204',
    tenant: {
      id: 'tenant-meridian',
      name: 'Meridian Data Labs',
    },
  },
} satisfies Record<DemoPersona, Omit<AuthUser, 'availablePersonas' | 'email'>>;

export const mockApiAdapter: OdpApiAdapter = {
  async login(input: LoginInput) {
    await delay(450);
    const persona = input.persona ?? 'crowd';
    const user = demoUsers[persona];
    return {
      accessToken: `mock-access-${persona}-${input.email}`,
      authMode: 'demo',
      refreshToken: `mock-refresh-${persona}-${input.workerCode ?? input.password}`,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
      sessionVersion: CURRENT_SESSION_VERSION,
      user: {
        ...user,
        availablePersonas: getAvailablePersonasForDemoLogin(input.email, persona),
        email: input.email,
      },
    };
  },
  async signup(input: SignupInput) {
    await delay(450);
    return this.login({
      email: input.email,
      password: input.password,
      persona: 'crowd',
      workerCode: input.password,
    });
  },
  async switchPersona(persona: DemoPersona) {
    await delay(180);
    const stored = await getStoredSession();
    const user = demoUsers[persona];
    return {
      accessToken: `mock-access-${persona}-${stored?.user.email ?? 'anita@crowd.in'}`,
      authMode: 'demo',
      expiresAt: stored?.expiresAt ?? new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
      refreshToken: stored?.refreshToken ?? `mock-refresh-${persona}`,
      sessionVersion: CURRENT_SESSION_VERSION,
      user: {
        ...user,
        availablePersonas: stored?.user.availablePersonas ?? [persona],
        email: stored?.user.email ?? 'anita@crowd.in',
      },
    };
  },
  async getCurrentSession() {
    return this.login({
      email: 'anita@crowd.in',
      password: 'Cosaarthi#2026',
      persona: 'crowd',
      workerCode: 'COSAARTHI-CROWD',
    });
  },
  async logout() {
    await delay(80);
  },
  async getHomeSummary() {
    await delay(180);
    const workflowTasks = getWorkflowTasksAsDomainTasks(useWorkflowStore.getState());
    return clone({
      ...mockHomeSummary,
      activeCount: mockHomeSummary.activeCount + workflowTasks.filter((task) => task.status !== 'available').length,
      availableCount: mockHomeSummary.availableCount + workflowTasks.filter((task) => task.status === 'available').length,
    });
  },
  async getAvailableTasks() {
    await delay(260);
    const workflowTasks = getWorkflowTasksAsDomainTasks(useWorkflowStore.getState()).filter((task) => task.status === 'available');
    return clone([...mockTasks.filter((task) => task.status === 'available'), ...workflowTasks]);
  },
  async getMyTasks() {
    await delay(260);
    const workflowTasks = getWorkflowTasksAsDomainTasks(useWorkflowStore.getState()).filter((task) => task.status !== 'available');
    return clone([...myMockTasks, ...workflowTasks]);
  },
  async getTask(id: string) {
    await delay(160);
    const task = [...mockTasks, ...myMockTasks, ...getWorkflowTasksAsDomainTasks(useWorkflowStore.getState())].find((item) => item.id === id);
    if (!task) {
      throw new Error('Task not found');
    }
    return clone(task);
  },
  async startTask(id: string) {
    const task = await this.getTask(id);
    if (useWorkflowStore.getState().tasks.some((item) => item.taskId === id && item.status === 'TASK_AVAILABLE')) {
      useWorkflowStore.getState().acceptTask(id, 'user-crowd-anita');
    }
    return { ...task, status: 'reserved' };
  },
  async getNotifications() {
    await delay(220);
    const workflowNotifications = useWorkflowStore.getState().notifications.map((item) => ({
      body: item.body,
      createdAt: item.createdAt,
      deepLink: item.audience === 'crowd' ? '/work' : `/${item.audience === 'platform' ? 'platform' : item.audience}`,
      id: item.id,
      read: readNotificationIds.has(item.id),
      title: item.title,
      tone: item.audience === 'crowd' || item.title.includes('ready') ? 'success' as const : 'info' as const,
    }));
    return clone([...workflowNotifications, ...mockNotifications.map((item) => ({ ...item, read: item.read || readNotificationIds.has(item.id) }))]);
  },
  async markNotificationRead(id: string) {
    await delay(120);
    readNotificationIds.add(id);
    const workflowNotification = useWorkflowStore.getState().notifications.find((item) => item.id === id);
    if (workflowNotification) {
      return clone({
        body: workflowNotification.body,
        createdAt: workflowNotification.createdAt,
        deepLink: workflowNotification.audience === 'crowd' ? '/work' : `/${workflowNotification.audience === 'platform' ? 'platform' : workflowNotification.audience}`,
        id: workflowNotification.id,
        read: true,
        title: workflowNotification.title,
        tone: 'info' as const,
      });
    }
    const notification = mockNotifications.find((item) => item.id === id);
    if (!notification) {
      throw new Error('Notification not found');
    }
    return clone({ ...notification, read: true });
  },
  async markAllNotificationsRead() {
    await delay(150);
    for (const item of useWorkflowStore.getState().notifications) {
      readNotificationIds.add(item.id);
    }
    for (const item of mockNotifications) {
      readNotificationIds.add(item.id);
    }
    const workflowNotifications = useWorkflowStore.getState().notifications.map((item) => ({
      body: item.body,
      createdAt: item.createdAt,
      deepLink: item.audience === 'crowd' ? '/work' : `/${item.audience === 'platform' ? 'platform' : item.audience}`,
      id: item.id,
      read: true,
      title: item.title,
      tone: 'info' as const,
    }));
    return clone([...workflowNotifications, ...mockNotifications.map((item) => ({ ...item, read: true }))]);
  },
  async getCertifications() {
    await delay(220);
    return clone(mockCertifications);
  },
  async getLearningModules() {
    await delay(220);
    return clone(mockLearningModules);
  },
  async getKitCustody() {
    await delay(220);
    return clone(mockKitCustody);
  },
  async getWallet() {
    await delay(220);
    const workflowLedger = useWorkflowStore.getState().ledgerEntries.map((entry) => ({
      amount: entry.amount,
      createdAt: entry.createdAt,
      id: entry.id,
      label: entry.label,
      status: entry.status,
    }));
    const settled = workflowLedger.filter((entry) => entry.status === 'settled').reduce((sum, entry) => sum + entry.amount, 0);
    const pending = workflowLedger.filter((entry) => entry.status === 'pending').reduce((sum, entry) => sum + entry.amount, 0);
    return clone({
      ...mockWallet,
      balance: mockWallet.balance + settled,
      byJobType: mockWallet.byJobType.map((entry) =>
        entry.label === 'Capture' ? { ...entry, amount: entry.amount + settled + pending } : entry,
      ),
      ledger: [...workflowLedger, ...mockWallet.ledger],
      lifetime: mockWallet.lifetime + settled,
      pending: mockWallet.pending + pending,
      weekEarnings: mockWallet.weekEarnings + settled + pending,
    });
  },
  async withdrawWallet(input: WithdrawInput) {
    await delay(360);
    if (input.amount > mockWallet.balance) {
      return {
        message: 'Withdrawal amount exceeds the available server ledger balance.',
        status: 'failed',
        withdrawalId: `mock-wd-${Date.now()}`,
      };
    }
    return {
      message: 'Withdrawal request created. Settlement remains backend-authoritative.',
      status: 'processing',
      withdrawalId: `mock-wd-${Date.now()}`,
    };
  },
  async createSubmission(input: CreateSubmissionInput) {
    await delay(380);
    const task = [...mockTasks, ...myMockTasks, ...getWorkflowTasksAsDomainTasks(useWorkflowStore.getState())].find((item) => item.id === input.taskId);
    if (!task) {
      throw new Error('Cannot create submission for an unknown task.');
    }
    if (input.projectId && input.projectId !== task.project) {
      throw new Error('Submission project does not match the task project.');
    }
    if (input.campaignId && input.campaignId !== task.campaignId) {
      throw new Error('Submission campaign does not match the task campaign.');
    }
    return {
      message: `Mock submission.create received for ${input.type}. Demo QC remains local in this prototype.`,
      status: input.type === 'capture' ? 'processing' : 'accepted',
      submissionId: `mock-sub-${input.idempotencyKey}`,
    };
  },
  async getAppeals() {
    await delay(180);
    return clone(mockAppeals);
  },
  async createAppeal(input: CreateAppealInput) {
    await delay(260);
    return {
      appealId: `mock-appeal-${Date.now()}`,
      message: `Mock submission.appeal opened for ${input.submissionId}. A future QA service owns the decision.`,
      state: 'open',
    };
  },
  async acceptSubmission(submissionId: string) {
    await delay(220);
    const media = uploadedMedia.get(submissionId);
    if (!media || media.kind !== 'video') {
      return notRequiredAsset(submissionId);
    }
    return mockMediaAccessService.registerAcceptedVideo({
      kind: media.kind,
      objectKey: media.objectKey,
      submissionId,
    });
  },
  async getProtectedMediaAsset(submissionId, persona) {
    await delay(120);
    return mockMediaAccessService.getProtectedAssetForPersona(submissionId, persona);
  },
  async exportOriginal(input) {
    await delay(180);
    return mockMediaAccessService.exportOriginal(input);
  },
  async getOriginalExportAuditEvents() {
    await delay(120);
    return mockMediaAccessService.getAuditEvents();
  },
  async uploadMedia(item: UploadQueueItem, onProgress?: UploadProgressHandler) {
    for (const progress of [0.12, 0.28, 0.48, 0.68, 0.86, 1]) {
      await delay(180);
      onProgress?.(progress);
    }
    const result = inferMockUploadResponse(item);
    if (result.objectKey) {
      uploadedMedia.set(result.submissionId, { kind: item.kind, objectKey: result.objectKey });
    }
    return result;
  },
};
