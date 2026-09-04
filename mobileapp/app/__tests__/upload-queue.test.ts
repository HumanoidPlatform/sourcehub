import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { OdpApiAdapter } from '@/api/adapter';
import {
  allowUncertainUploadQueueItem,
  createUploadQueueItem,
  listUploadQueueItems,
  processUploadQueueItem,
  retryUploadQueueItem,
  saveUploadQueueItemValidation,
} from '@/services/upload-queue';
import { useWorkflowStore } from '@/store/workflow-store';
import type { UploadQueueItem } from '@/types/domain';

type Row = Record<string, unknown>;

const mockRows: Row[] = [];
let mockUuidCounter = 0;

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => {
    mockUuidCounter += 1;
    return `uuid-${mockUuidCounter}`;
  }),
}));

jest.mock('expo-file-system/legacy', () => ({
  copyAsync: jest.fn(() => Promise.resolve()),
  documentDirectory: 'file:///documents/',
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, size: 2048 })),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() =>
    Promise.resolve({
      execAsync: jest.fn(() => Promise.resolve()),
      getAllAsync: jest.fn((sql: string, params?: unknown[]) => {
        if (sql.includes("WHERE status = 'queued'")) {
          const limit = Number(params?.[0] ?? mockRows.length);
          return Promise.resolve(mockRows.filter((row) => row.status === 'queued').slice(0, limit));
        }
        return Promise.resolve([...mockRows].reverse());
      }),
      getFirstAsync: jest.fn((_sql: string, params?: unknown[]) => {
        const id = params?.[0];
        return Promise.resolve(mockRows.find((row) => row.id === id) ?? null);
      }),
      runAsync: jest.fn((sql: string, params?: unknown[]) => {
        if (sql.includes('INSERT INTO upload_queue')) {
          mockRows.push({
            attempts: 0,
            created_at: params?.[12],
            duplicate_score: null,
            duration_ms: params?.[9] ?? null,
            error: null,
            file_name: params?.[6],
            id: params?.[0],
            idempotency_key: params?.[11],
            kind: params?.[3],
            local_uri: params?.[4],
            mime_type: params?.[7],
            mock_qc_status: 'NOT_CHECKED',
            original_uri: params?.[5],
            preliminary_validation_json: null,
            preliminary_validation_override: null,
            progress: 0,
            protected_asset_json: null,
            remote_object_key: null,
            required_duration_ms: params?.[10] ?? null,
            result_message: null,
            result_status: null,
            size_bytes: params?.[8],
            status: 'queued',
            submission_id: null,
            task_id: params?.[1],
            task_title: params?.[2],
            updated_at: params?.[13],
          });
        }

        if (sql.includes('UPDATE upload_queue')) {
          const id = params?.[14];
          const row = mockRows.find((item) => item.id === id);
          if (row) {
            row.status = params?.[0];
            row.progress = params?.[1];
            row.attempts = params?.[2];
            row.error = params?.[3];
            row.result_status = params?.[4];
            row.result_message = params?.[5];
            row.duplicate_score = params?.[6];
            row.remote_object_key = params?.[7];
            row.preliminary_validation_json = params?.[8];
            row.preliminary_validation_override = params?.[9];
            row.mock_qc_status = params?.[10];
            row.submission_id = params?.[11];
            row.protected_asset_json = params?.[12];
            row.updated_at = params?.[13];
          }
        }

        return Promise.resolve();
      }),
    }),
  ),
}));

describe('upload queue service', () => {
  beforeEach(() => {
    mockRows.length = 0;
    mockUuidCounter = 0;
    useWorkflowStore.getState().resetWorkflow();
  });

  it('persists queue metadata and preserves idempotency through processing', async () => {
    const item = await createUploadQueueItem({
      fileName: 'storefront.jpg',
      kind: 'image',
      taskId: 'task-market-photos',
      taskTitle: 'Market storefront image set',
      uri: 'file:///tmp/storefront.jpg',
    });

    expect(item.id).toBe('uuid-1');
    expect(item.idempotencyKey).toBe('uuid-2');
    expect(item.localUri).toContain('file:///documents/cosaarthi-media/');

    const api = {
      uploadMedia: jest.fn((upload: UploadQueueItem, onProgress?: (progress: number) => void) => {
        onProgress?.(0.5);
        return Promise.resolve({
          message: 'accepted',
          objectKey: 'mock/object',
          status: 'accepted' as const,
          submissionId: `sub-${upload.idempotencyKey}`,
        });
      }),
    } as unknown as OdpApiAdapter;

    const processed = await processUploadQueueItem(item.id, api);
    const listed = await listUploadQueueItems();

    expect(api.uploadMedia).toHaveBeenCalledWith(
      expect.objectContaining({ idempotencyKey: 'uuid-2' }),
      expect.any(Function),
    );
    expect(processed?.status).toBe('uploaded');
    expect(processed?.resultStatus).toBe('accepted');
    expect(processed?.remoteObjectKey).toBe('mock/object');
    expect(listed[0]?.idempotencyKey).toBe('uuid-2');
  });

  it('persists preliminary validation metadata and blocks mismatched video upload', async () => {
    const item = await createUploadQueueItem({
      fileName: 'vegetable-cutting.mp4',
      kind: 'video',
      taskId: 'task-traffic-video',
      taskTitle: 'Short road-safety video',
      uri: 'file:///tmp/vegetable-cutting.mp4',
    });
    await saveUploadQueueItemValidation(item.id, {
      checkedAt: '2026-08-23T00:00:00.000Z',
      confidence: 0.92,
      frameSampleCount: 3,
      mocked: true,
      provider: 'mock',
      reason: 'Mock frames show kitchen content.',
      requirementSummary: 'road safety video',
      status: 'MISMATCH',
    });

    const api = {
      uploadMedia: jest.fn(),
    } as unknown as OdpApiAdapter;
    const processed = await processUploadQueueItem(item.id, api);

    expect(api.uploadMedia).not.toHaveBeenCalled();
    expect(processed?.status).toBe('failed');
    expect(processed?.preliminaryValidation?.status).toBe('MISMATCH');
    expect(processed?.error).toContain('preliminary content validation');
  });

  it('persists MATCH validation metadata with the uploaded submission', async () => {
    const item = await createUploadQueueItem({
      fileName: 'traffic-road-signal.mp4',
      kind: 'video',
      taskId: 'task-traffic-video',
      taskTitle: 'Short road-safety video',
      uri: 'file:///tmp/traffic-road-signal.mp4',
    });
    await saveUploadQueueItemValidation(item.id, {
      checkedAt: '2026-08-23T00:00:00.000Z',
      confidence: 0.88,
      frameSampleCount: 3,
      mocked: true,
      provider: 'mock',
      reason: 'Mock frames include road context.',
      requirementSummary: 'road safety video',
      status: 'MATCH',
    });

    const api = {
      uploadMedia: jest.fn((upload: UploadQueueItem) =>
        Promise.resolve({
          message: 'processing',
          objectKey: 'mock/task-traffic-video/upload.mp4',
          preliminaryValidation: upload.preliminaryValidation,
          status: 'processing' as const,
          submissionId: `sub-${upload.id}`,
        }),
      ),
    } as unknown as OdpApiAdapter;

    const processed = await processUploadQueueItem(item.id, api);

    expect(api.uploadMedia).toHaveBeenCalled();
    expect(processed?.status).toBe('uploaded');
    expect(processed?.resultStatus).toBe('processing');
    expect(processed?.preliminaryValidation?.status).toBe('MATCH');
    expect(processed?.submissionId).toBe(`sub-${item.id}`);
    expect(processed?.remoteObjectKey).toBe('mock/task-traffic-video/upload.mp4');
  });

  it('creates a shared workflow submission when a workflow task upload completes', async () => {
    const workflow = useWorkflowStore.getState();
    const requirement = workflow.createRequirement({
      budget: 'INR 90,000 demo budget',
      businessUseCase: 'Industrial inspection model evaluation',
      category: 'Industry / Manufacturing',
      clientId: 'client-autodrive',
      dataType: 'Video',
      deadline: '2026-09-30',
      description: 'Record normal operating industrial equipment.',
      instructions: 'Keep machinery in frame and do not enter restricted areas.',
      languageRequirements: 'English metadata',
      locationRequirements: 'India factory floor',
      qualityRequirements: 'Stable, well-lit equipment footage.',
      quantity: 10,
      requiredDurationSeconds: 600,
      title: 'Industrial Equipment Video Dataset',
    });
    workflow.acceptRequirement(requirement.requirementId, 'tenant-meridian');
    const project = workflow.createProjectFromRequirement(requirement.requirementId, 'tenant-meridian', {
      workerReward: 950,
    });
    const task = workflow.publishProject(project.projectId);
    workflow.acceptTask(task.taskId, 'user-crowd-anita');

    const item = await createUploadQueueItem({
      durationMs: 600_000,
      fileName: 'industrial-machinery.mp4',
      kind: 'video',
      requiredDurationMs: 600_000,
      taskId: task.taskId,
      taskTitle: task.title,
      uri: 'file:///tmp/industrial-machinery.mp4',
    });
    await saveUploadQueueItemValidation(item.id, {
      checkedAt: '2026-08-24T00:00:00.000Z',
      confidence: 0.91,
      frameSampleCount: 3,
      mocked: true,
      provider: 'mock',
      reason: 'Mock frames include industrial machinery.',
      requirementSummary: 'Industrial Equipment Video Dataset',
      status: 'MATCH',
    });

    const api = {
      uploadMedia: jest.fn((upload: UploadQueueItem) =>
        Promise.resolve({
          message: 'uploaded',
          mockQcStatus: 'CLEAR' as const,
          objectKey: 'mock/workflow/industrial-equipment.mp4',
          preliminaryValidation: upload.preliminaryValidation,
          status: 'accepted' as const,
          submissionId: 'sub-workflow-upload',
        }),
      ),
    } as unknown as OdpApiAdapter;

    const processed = await processUploadQueueItem(item.id, api);
    const submission = useWorkflowStore.getState().submissions.find((candidate) => candidate.submissionId === processed?.submissionId);

    expect(processed?.status).toBe('uploaded');
    expect(processed?.submissionId).toBe('SUB-001');
    expect(submission).toMatchObject({
      actualDurationSeconds: 600,
      clientId: 'client-autodrive',
      projectId: project.projectId,
      requirementId: requirement.requirementId,
      reviewStatus: 'TENANT_REVIEW',
      status: 'TENANT_REVIEW',
      taskId: task.taskId,
      tenantId: 'tenant-meridian',
      workerId: 'user-crowd-anita',
    });
    expect(useWorkflowStore.getState().tasks.find((candidate) => candidate.taskId === task.taskId)?.status).toBe('COMPLETED');
  });

  it('does not create a shared workflow submission when an upload response fails', async () => {
    const workflow = useWorkflowStore.getState();
    const requirement = workflow.createRequirement({
      budget: 'INR 90,000 demo budget',
      businessUseCase: 'Industrial inspection model evaluation',
      category: 'Industry / Manufacturing',
      clientId: 'client-autodrive',
      dataType: 'Video',
      deadline: '2026-09-30',
      description: 'Record normal operating industrial equipment.',
      instructions: 'Keep machinery in frame and do not enter restricted areas.',
      languageRequirements: 'English metadata',
      locationRequirements: 'India factory floor',
      qualityRequirements: 'Stable, well-lit equipment footage.',
      quantity: 10,
      requiredDurationSeconds: 600,
      title: 'Industrial Equipment Video Dataset',
    });
    workflow.acceptRequirement(requirement.requirementId, 'tenant-meridian');
    const project = workflow.createProjectFromRequirement(requirement.requirementId, 'tenant-meridian', {
      workerReward: 950,
    });
    const task = workflow.publishProject(project.projectId);
    workflow.acceptTask(task.taskId, 'user-crowd-anita');

    const item = await createUploadQueueItem({
      durationMs: 600_000,
      fileName: 'industrial-machinery.mp4',
      kind: 'video',
      requiredDurationMs: 600_000,
      taskId: task.taskId,
      taskTitle: task.title,
      uri: 'file:///tmp/industrial-machinery.mp4',
    });
    await saveUploadQueueItemValidation(item.id, {
      checkedAt: '2026-08-24T00:00:00.000Z',
      confidence: 0.91,
      frameSampleCount: 3,
      mocked: true,
      provider: 'mock',
      reason: 'Mock frames include industrial machinery.',
      requirementSummary: 'Industrial Equipment Video Dataset',
      status: 'MATCH',
    });

    const api = {
      uploadMedia: jest.fn(() =>
        Promise.resolve({
          message: 'Backend rejected upload',
          status: 'failed' as const,
          submissionId: 'sub-should-not-exist',
        }),
      ),
    } as unknown as OdpApiAdapter;

    const processed = await processUploadQueueItem(item.id, api);

    expect(processed).toMatchObject({
      error: 'Backend rejected upload',
      resultStatus: 'failed',
      status: 'failed',
      submissionId: undefined,
    });
    expect(useWorkflowStore.getState().submissions).toHaveLength(0);
    expect(useWorkflowStore.getState().tasks.find((candidate) => candidate.taskId === task.taskId)?.status).toBe('ASSIGNED');
  });

  it('clears failed result metadata before retrying an upload', async () => {
    const item = await createUploadQueueItem({
      fileName: 'storefront.jpg',
      kind: 'image',
      taskId: 'task-market-photos',
      taskTitle: 'Market storefront image set',
      uri: 'file:///tmp/storefront.jpg',
    });
    const failingApi = {
      uploadMedia: jest.fn(() => Promise.reject(new Error('Network unavailable'))),
    } as unknown as OdpApiAdapter;
    const failed = await processUploadQueueItem(item.id, failingApi);

    expect(failed).toMatchObject({
      error: 'Network unavailable',
      status: 'failed',
    });

    const queued = await retryUploadQueueItem(item.id);
    expect(queued).toMatchObject({
      error: undefined,
      mockQcStatus: 'NOT_CHECKED',
      progress: 0,
      resultMessage: undefined,
      resultStatus: undefined,
      status: 'queued',
      submissionId: undefined,
    });

    const successApi = {
      uploadMedia: jest.fn((upload: UploadQueueItem) =>
        Promise.resolve({
          message: 'accepted',
          objectKey: 'mock/retry/object.jpg',
          status: 'accepted' as const,
          submissionId: `sub-${upload.idempotencyKey}`,
        }),
      ),
    } as unknown as OdpApiAdapter;

    const retried = await processUploadQueueItem(item.id, successApi);
    expect(retried).toMatchObject({
      attempts: 2,
      error: undefined,
      progress: 1,
      remoteObjectKey: 'mock/retry/object.jpg',
      resultStatus: 'accepted',
      status: 'uploaded',
    });
  });

  it('blocks UNCERTAIN validation until the user chooses controlled continuation', async () => {
    const item = await createUploadQueueItem({
      fileName: 'generic-motion.mp4',
      kind: 'video',
      taskId: 'task-traffic-video',
      taskTitle: 'Short road-safety video',
      uri: 'file:///tmp/generic-motion.mp4',
    });
    await saveUploadQueueItemValidation(item.id, {
      checkedAt: '2026-08-23T00:00:00.000Z',
      confidence: 0.56,
      frameSampleCount: 3,
      mocked: true,
      provider: 'mock',
      reason: 'Mock frames are ambiguous.',
      requirementSummary: 'road safety video',
      status: 'UNCERTAIN',
    });

    const api = {
      uploadMedia: jest.fn((upload: UploadQueueItem) =>
        Promise.resolve({
          message: 'queued for human QA',
          objectKey: 'mock/task-traffic-video/uncertain.mp4',
          preliminaryValidation: upload.preliminaryValidation,
          status: 'processing' as const,
          submissionId: `sub-${upload.id}`,
        }),
      ),
    } as unknown as OdpApiAdapter;

    const blocked = await processUploadQueueItem(item.id, api);
    await allowUncertainUploadQueueItem(item.id);
    const continued = await processUploadQueueItem(item.id, api);

    expect(blocked?.status).toBe('failed');
    expect(api.uploadMedia).toHaveBeenCalledTimes(1);
    expect(continued?.preliminaryValidationOverride).toBe(true);
    expect(continued?.status).toBe('uploaded');
    expect(continued?.resultStatus).toBe('processing');
  });

  it('persists Industry video duration requirements with queued media', async () => {
    const item = await createUploadQueueItem({
      durationMs: 5 * 60_000,
      fileName: 'industrial-machinery.mp4',
      kind: 'video',
      requiredDurationMs: 5 * 60_000,
      taskId: 'task-industrial-equipment-video',
      taskTitle: 'Industrial Equipment Inspection Video',
      uri: 'file:///tmp/industrial-machinery.mp4',
    });

    expect(item.requiredDurationMs).toBe(5 * 60_000);
    expect(item.durationMs).toBe(5 * 60_000);
    expect(item.mockQcStatus).toBe('NOT_CHECKED');
  });

  it('marks mock possible duplicates as uploaded instead of leaving upload in progress', async () => {
    const item = await createUploadQueueItem({
      fileName: 'traffic-road-signal.mp4',
      kind: 'video',
      taskId: 'task-traffic-video',
      taskTitle: 'Short road-safety video',
      uri: 'file:///tmp/traffic-road-signal.mp4',
    });
    await saveUploadQueueItemValidation(item.id, {
      checkedAt: '2026-08-23T00:00:00.000Z',
      confidence: 0.88,
      frameSampleCount: 3,
      mocked: true,
      provider: 'mock',
      reason: 'Mock frames include road context.',
      requirementSummary: 'road safety video',
      status: 'MATCH',
    });

    const api = {
      uploadMedia: jest.fn((upload: UploadQueueItem) =>
        Promise.resolve({
          duplicateScore: 0.78,
          message: 'Your video was uploaded successfully. The demo duplicate check flagged it for review.',
          mockQcStatus: 'POSSIBLE_DUPLICATE' as const,
          objectKey: 'mock/task-traffic-video/review.mp4',
          preliminaryValidation: upload.preliminaryValidation,
          status: 'possible_duplicate' as const,
          submissionId: `sub-${upload.id}`,
        }),
      ),
    } as unknown as OdpApiAdapter;

    const processed = await processUploadQueueItem(item.id, api);

    expect(processed?.status).toBe('uploaded');
    expect(processed?.progress).toBe(1);
    expect(processed?.resultStatus).toBe('possible_duplicate');
    expect(processed?.mockQcStatus).toBe('POSSIBLE_DUPLICATE');
    expect(processed?.resultMessage).toContain('demo duplicate check');
  });
});
