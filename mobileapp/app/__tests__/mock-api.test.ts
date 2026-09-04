import { beforeEach, describe, expect, it } from '@jest/globals';

import { demoPersonaOptions } from '@/auth/demo-personas';
import { mockApiAdapter } from '@/api/mock-adapter';
import { CURRENT_SESSION_VERSION } from '@/services/secure-session';
import { useWorkflowStore } from '@/store/workflow-store';
import type { UploadQueueItem } from '@/types/domain';

const baseItem: UploadQueueItem = {
  attempts: 0,
  createdAt: '2026-08-16T00:00:00.000Z',
  fileName: 'capture.jpg',
  id: 'queue-1',
  idempotencyKey: 'idem-1',
  kind: 'image',
  localUri: 'file:///capture.jpg',
  mimeType: 'image/jpeg',
  progress: 0,
  sizeBytes: 1024,
  status: 'queued',
  taskId: 'task-market-photos',
  taskTitle: 'Market storefront image set',
  updatedAt: '2026-08-16T00:00:00.000Z',
};

describe('mockApiAdapter', () => {
  beforeEach(() => {
    useWorkflowStore.getState().resetWorkflow();
  });

  it('returns the current user and Crowd permissions on login', async () => {
    const session = await mockApiAdapter.login({
      email: 'anita@crowd.in',
      password: 'Cosaarthi#2026',
      persona: 'crowd',
      workerCode: 'COSAARTHI-CROWD',
    });

    expect(session.user.persona).toBe('crowd');
    expect(session.user.permissions).toContain('upload:create');
    expect(session.user.availablePersonas).toEqual(['crowd']);
    expect(session.authMode).toBe('demo');
    expect(session.sessionVersion).toBe(CURRENT_SESSION_VERSION);
    expect(session.accessToken).toContain('mock-access');
  });

  it('returns the requested multi-role personas for the local multi account', async () => {
    const session = await mockApiAdapter.login({
      email: 'multi@cosaarthi.local',
      password: 'Cosaarthi#2026',
      persona: 'tenant',
      workerCode: 'COSAARTHI-MULTI',
    });

    expect(session.user.availablePersonas).toEqual(['tenant', 'aggregator', 'qa', 'crowd']);
  });

  it.each(demoPersonaOptions)('logs in the $label demo persona', async (option) => {
    const session = await mockApiAdapter.login({
      email: option.email,
      password: option.password,
      persona: option.persona,
      workerCode: option.code,
    });

    expect(session.user.persona).toBe(option.persona);
    expect(session.user.email).toBe(option.email);
    expect(session.user.availablePersonas).toContain(option.persona);
    expect(session.refreshToken).toContain(option.persona);
  });

  it('returns typed duplicate states by media kind', async () => {
    const image = await mockApiAdapter.uploadMedia(baseItem);
    const video = await mockApiAdapter.uploadMedia({
      ...baseItem,
      fileName: 'clip.mp4',
      kind: 'video',
      mimeType: 'video/mp4',
      taskId: 'task-traffic-video',
      taskTitle: 'Short road-safety video',
    });
    const audio = await mockApiAdapter.uploadMedia({
      ...baseItem,
      fileName: 'sample.m4a',
      kind: 'audio',
      mimeType: 'audio/m4a',
    });

    expect(image.status).toBe('accepted');
    expect(image.mockQcStatus).toBe('CLEAR');
    expect(video.status).toBe('possible_duplicate');
    expect(video.mockQcStatus).toBe('POSSIBLE_DUPLICATE');
    expect(video.message).toContain('demo duplicate check');
    expect(audio.status).toBe('duplicate');
    expect(audio.mockQcStatus).toBe('CONFIRMED_DUPLICATE');
  });

  it('keeps Road Safety available and adds the Industry mock video task', async () => {
    const available = await mockApiAdapter.getAvailableTasks();
    const mine = await mockApiAdapter.getMyTasks();
    const roadSafety = mine.find((task) => task.id === 'task-traffic-video');
    const industry = available.find((task) => task.id === 'task-industrial-equipment-video');

    expect(roadSafety?.title).toBe('Short road-safety video');
    expect(roadSafety?.category).toBe('Road Safety / Mobility');
    expect(industry?.title).toBe('Industrial Equipment Inspection Video');
    expect(industry?.category).toBe('Industry / Manufacturing');
    expect(industry?.requiredDurationMs).toBe(5 * 60_000);
    expect(industry?.checklist).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Keep machinery in frame'),
        expect.stringContaining('do not enter restricted or hazardous zones'),
      ]),
    );
  });

  it('supports submission.create and submission.appeal mock actions', async () => {
    const submission = await mockApiAdapter.createSubmission({
      idempotencyKey: 'idem-submission-1',
      meta: { label: 'shelf_product' },
      payloadRef: 'mock://annotation/frame-001',
      projectId: 'Retail Shelf Ontology',
      taskId: 'task-label-shelves',
      type: 'annotation',
    });
    const appeal = await mockApiAdapter.createAppeal({
      ground: 'The duplicate flag should be reviewed.',
      submissionId: submission.submissionId,
    });

    expect(submission.submissionId).toBe('mock-sub-idem-submission-1');
    expect(submission.status).toBe('accepted');
    expect(appeal.state).toBe('open');
  });

  it('rejects mock submissions that do not match an existing task relationship', async () => {
    await expect(
      mockApiAdapter.createSubmission({
        idempotencyKey: 'idem-orphan-submission',
        meta: { label: 'shelf_product' },
        payloadRef: 'mock://annotation/frame-001',
        projectId: 'Retail Shelf Ontology',
        taskId: 'missing-task',
        type: 'annotation',
      }),
    ).rejects.toThrow('unknown task');

    await expect(
      mockApiAdapter.createSubmission({
        idempotencyKey: 'idem-wrong-project',
        meta: { label: 'shelf_product' },
        payloadRef: 'mock://annotation/frame-001',
        projectId: 'wrong-project',
        taskId: 'task-label-shelves',
        type: 'annotation',
      }),
    ).rejects.toThrow('project does not match');
  });

  it('keeps available and active work queues unique for React list keys', async () => {
    const available = await mockApiAdapter.getAvailableTasks();
    const mine = await mockApiAdapter.getMyTasks();
    const combinedIds = [...mine, ...available].map((task) => task.id);

    expect(available.every((task) => task.status === 'available')).toBe(true);
    expect(new Set(combinedIds).size).toBe(combinedIds.length);
    expect(available.find((task) => task.id === 'task-traffic-video')).toBeUndefined();
    expect(mine.find((task) => task.id === 'task-traffic-video')).toBeTruthy();
  });
});
