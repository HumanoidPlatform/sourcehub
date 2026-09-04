import { beforeEach, describe, expect, it } from '@jest/globals';

import { mockApiAdapter } from '@/api/mock-adapter';
import { useWorkflowStore } from '@/store/workflow-store';
import type { PreliminaryContentValidationResult, UploadMediaResponse, UploadQueueItem } from '@/types/domain';

const clientId = 'client-autodrive';
const tenantId = 'tenant-meridian';
const aggregatorId = 'user-meridian-ops';
const partnerId = 'user-partner-kova';
const sponsorId = 'user-sponsor-fleet';
const workerId = 'user-crowd-anita';
const qaId = 'user-meridian-qa';
const adminId = 'user-platform-admin';
const builderId = 'user-builder-001';

const matchValidation: PreliminaryContentValidationResult = {
  checkedAt: '2026-08-24T00:00:00.000Z',
  confidence: 0.91,
  frameSampleCount: 3,
  mocked: true,
  provider: 'mock',
  reason: 'Mock frames include industrial machinery and factory equipment.',
  requirementSummary: 'Industrial Equipment Video Dataset',
  status: 'MATCH',
};

describe('shared Cosaarthi workflow store', () => {
  beforeEach(() => {
    useWorkflowStore.getState().resetWorkflow();
  });

  it('propagates one end-to-end Client to Platform lifecycle through every demo persona', async () => {
    const store = useWorkflowStore.getState();
    const requirement = store.createRequirement({
      budget: 'INR 90,000 demo budget',
      businessUseCase: 'Industrial inspection model evaluation',
      category: 'Industry / Manufacturing',
      clientId,
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

    expect(requirement.requirementId).toBe('REQ-001');
    expect(requirement.status).toBe('SUBMITTED');
    expect(useWorkflowStore.getState().notifications.some((item) => item.audience === 'tenant')).toBe(true);

    const acceptedRequirement = store.acceptRequirement(requirement.requirementId, tenantId);
    expect(acceptedRequirement.status).toBe('ACCEPTED');
    expect(acceptedRequirement.history.map((event) => event.to)).toEqual(['SUBMITTED', 'UNDER_TENANT_REVIEW', 'ACCEPTED']);

    const initiative = store.createInitiativeFromRequirement(requirement.requirementId, tenantId);
    expect(initiative.initiativeId).toBe('INIT-001');
    expect(initiative).toMatchObject({
      clientId,
      requirementId: requirement.requirementId,
      status: 'CREATED',
      tenantId,
    });

    const project = store.createProjectFromRequirement(requirement.requirementId, tenantId, {
      qaRequirements: 'QA approval required before Tenant final acceptance.',
      workerReward: 950,
    });
    expect(project.projectId).toBe('PROJ-001');
    expect(project.initiativeId).toBe(initiative.initiativeId);

    const task = store.publishProject(project.projectId);
    expect(task.taskId).toBe('TASK-001');
    expect(task).toMatchObject({
      projectId: project.projectId,
      requirementId: requirement.requirementId,
      tenantId,
    });
    expect(useWorkflowStore.getState().notifications.some((item) => item.audience === 'aggregator' && item.title === 'Project active')).toBe(true);

    const aggregatorAllocation = store.aggregatorAcceptProject(project.projectId, aggregatorId);
    expect(aggregatorAllocation.allocationId).toBe('ALLOC-001');
    expect(aggregatorAllocation).toMatchObject({
      aggregatorId,
      projectId: project.projectId,
      requirementId: requirement.requirementId,
      status: 'AGGREGATOR_ACCEPTED',
      tenantId,
    });

    const partnerAllocation = store.assignProjectToPartner(project.projectId, aggregatorId, partnerId);
    expect(partnerAllocation).toMatchObject({
      allocationId: aggregatorAllocation.allocationId,
      partnerId,
      projectId: project.projectId,
      status: 'PARTNER_ASSIGNED',
      taskId: task.taskId,
    });
    expect(useWorkflowStore.getState().notifications.some((item) => item.audience === 'partner' && item.title === 'Project allocated')).toBe(true);

    const committedAllocation = store.partnerCommitCapacity(project.projectId, partnerId, 8);
    expect(committedAllocation).toMatchObject({
      capacity: 8,
      partnerId,
      status: 'PARTNER_COMMITTED',
    });

    const enabledTask = store.partnerEnableWorker(task.taskId, partnerId, workerId);
    expect(enabledTask).toMatchObject({
      enabledWorkerId: workerId,
      partnerId,
      taskId: task.taskId,
    });

    const requestedDevice = store.requestDeviceForTask(task.taskId, partnerId, workerId);
    expect(requestedDevice.deviceAllocationId).toBe('DEV-001');
    expect(requestedDevice).toMatchObject({
      partnerId,
      projectId: project.projectId,
      requirementId: requirement.requirementId,
      status: 'REQUESTED',
      taskId: task.taskId,
      workerId,
    });
    expect(useWorkflowStore.getState().notifications.some((item) => item.audience === 'sponsor' && item.title === 'Device kit requested')).toBe(true);

    const allocatedDevice = store.allocateDevice(requestedDevice.deviceAllocationId, sponsorId);
    expect(allocatedDevice).toMatchObject({
      deviceAllocationId: requestedDevice.deviceAllocationId,
      sponsorId,
      status: 'ALLOCATED',
    });

    const activeDevice = store.activateDevice(allocatedDevice.deviceAllocationId, sponsorId);
    expect(activeDevice.status).toBe('ACTIVE');

    const availableTasks = await mockApiAdapter.getAvailableTasks();
    expect(availableTasks.find((item) => item.id === task.taskId)?.title).toContain('Industrial Equipment Video Dataset');
    expect(availableTasks.find((item) => item.id === task.taskId)?.requiredDurationMs).toBe(600_000);

    const assignedTask = store.acceptTask(task.taskId, workerId);
    expect(assignedTask.status).toBe('ASSIGNED');

    const uploadItem = createUploadItem(task.taskId, task.title);
    const uploadResult: UploadMediaResponse = {
      message: 'Your video was uploaded successfully. Mock QC check cleared this demo submission.',
      mockQcStatus: 'CLEAR',
      objectKey: 'mock/workflow/industrial-equipment.mp4',
      preliminaryValidation: matchValidation,
      status: 'accepted',
      submissionId: 'sub-industrial-demo',
    };
    const submission = store.recordSubmissionFromUpload(uploadItem, uploadResult, workerId);

    expect(submission?.submissionId).toBe('SUB-001');
    expect(submission).toMatchObject({
      actualDurationSeconds: 600,
      clientId,
      duplicateStatus: 'CLEAR',
      projectId: project.projectId,
      qcStatus: 'CLEAR',
      requirementId: requirement.requirementId,
      requiredDurationSeconds: 600,
      reviewStatus: 'TENANT_REVIEW',
      semanticStatus: 'MATCH',
      status: 'TENANT_REVIEW',
      taskId: task.taskId,
      tenantId,
      workerId,
    });
    expect(submission?.history.map((event) => event.to)).toEqual(['CAPTURING', 'UPLOADING', 'SUBMITTED', 'AUTO_QC', 'TENANT_REVIEW']);

    const routed = store.routeSubmissionToQa(submission?.submissionId ?? '', tenantId);
    expect(routed.status).toBe('QA_REVIEW');
    const ideItem = useWorkflowStore.getState().ideWorkItems.find((item) => item.submissionId === routed.submissionId);
    expect(ideItem).toMatchObject({
      projectId: project.projectId,
      requirementId: requirement.requirementId,
      status: 'OPEN',
      submissionId: routed.submissionId,
      taskId: task.taskId,
    });

    const qaApproved = store.qaReviewSubmission(routed.submissionId, qaId, 'APPROVED', 'Industrial equipment is clearly visible.');
    expect(qaApproved.status).toBe('TENANT_REVIEW');
    expect(qaApproved.reviewStatus).toBe('QA_APPROVED');
    expect(useWorkflowStore.getState().ideWorkItems.find((item) => item.submissionId === routed.submissionId)?.status).toBe('COMPLETED');

    const tenantAccepted = store.tenantFinalizeSubmission(qaApproved.submissionId, tenantId, 'ACCEPT');
    expect(tenantAccepted.status).toBe('WATERMARK_PROCESSING');
    expect(tenantAccepted.history.map((event) => event.to)).toEqual(
      expect.arrayContaining(['ACCEPTED', 'WATERMARK_PROCESSING']),
    );

    const watermarked = store.completeWatermark(tenantAccepted.submissionId);
    expect(watermarked.status).toBe('WATERMARK_READY');
    expect(watermarked.watermarkedAssetId).toBe(`mock-watermarked-${watermarked.submissionId}`);

    const delivery = useWorkflowStore.getState().deliveries.find((item) => item.submissionIds.includes(watermarked.submissionId));
    expect(delivery?.deliveryId).toBe('DEL-001');
    expect(delivery).toMatchObject({
      clientId,
      initiativeId: initiative.initiativeId,
      projectId: project.projectId,
      requirementId: requirement.requirementId,
      status: 'CLIENT_REVIEW',
      submissionIds: [watermarked.submissionId],
      tenantId,
    });

    const acceptedDelivery = store.acceptDelivery(delivery?.deliveryId ?? '', clientId);
    expect(acceptedDelivery.status).toBe('CLIENT_ACCEPTED');

    const dataset = useWorkflowStore.getState().builderDatasets.find((item) => item.deliveryId === acceptedDelivery.deliveryId);
    expect(dataset?.datasetId).toBe('DATA-001');
    expect(dataset).toMatchObject({
      deliveryId: acceptedDelivery.deliveryId,
      projectId: project.projectId,
      requirementId: requirement.requirementId,
      status: 'MARKETPLACE_VISIBLE',
    });

    const licensedDataset = store.licenseDataset(dataset?.datasetId ?? '', builderId);
    expect(licensedDataset).toMatchObject({
      licensedBy: builderId,
      status: 'LICENSED',
    });

    const progress = useWorkflowStore.getState().getProjectProgress(project.projectId);
    expect(progress).toEqual({
      accepted: 1,
      assigned: 1,
      qaPassed: 1,
      rejected: 0,
      remaining: 9,
      required: 10,
      submitted: 1,
    });

    const wallet = await mockApiAdapter.getWallet();
    expect(wallet.ledger[0]).toMatchObject({
      amount: 950,
      id: `ledger-${watermarked.submissionId}`,
      label: `${watermarked.submissionId} Accepted`,
      status: 'settled',
    });

    const adminExport = store.exportOriginal(watermarked.submissionId, adminId, 'Audit review for approved demo delivery.');
    expect(adminExport).toMatchObject({
      action: 'admin.export_original',
      actorId: adminId,
      submissionId: watermarked.submissionId,
    });
    expect(useWorkflowStore.getState().auditEvents.map((event) => event.action)).toEqual(
      expect.arrayContaining([
        'requirement.submitted',
        'requirement.accepted',
        'initiative.created',
        'project.created',
        'project.published',
        'aggregator.project_accepted',
        'aggregator.partner_assigned',
        'partner.capacity_committed',
        'partner.worker_enabled',
        'partner.device_requested',
        'sponsor.device_allocated',
        'sponsor.device_active',
        'task.accepted',
        'submission.created',
        'submission.sent_to_qa',
        'qa.approved',
        'submission.accepted',
        'watermark.ready',
        'delivery.created',
        'delivery.accepted',
        'dataset.marketplace_visible',
        'builder.dataset_licensed',
        'admin.export_original',
      ]),
    );

    const finalState = useWorkflowStore.getState();
    expect(finalState.projects.find((item) => item.projectId === project.projectId)?.status).toBe('COMPLETED');
    expect(finalState.requirements.find((item) => item.requirementId === requirement.requirementId)?.status).toBe('COMPLETED');
    expect(finalState.initiatives.find((item) => item.initiativeId === initiative.initiativeId)?.status).toBe('COMPLETED');
    expect(finalState.submissions.find((item) => item.submissionId === watermarked.submissionId)?.status).toBe('DELIVERED');
    expect(finalState.notifications.map((item) => item.audience)).toEqual(
      expect.arrayContaining(['tenant', 'aggregator', 'partner', 'sponsor', 'crowd', 'qa', 'ide', 'client', 'builder', 'platform']),
    );
  });

  it('prevents invalid requirement and submission transitions', () => {
    const store = useWorkflowStore.getState();

    expect(() =>
      store.createRequirement({
        ...createRequirementInput(),
        requiredDurationSeconds: 240,
      }),
    ).toThrow('minimum duration');

    const requirement = store.createRequirement(createRequirementInput());
    expect(() => store.createProjectFromRequirement(requirement.requirementId, tenantId)).toThrow('Cannot create project');
    expect(() => store.rejectRequirement(requirement.requirementId, tenantId, ' ')).toThrow('requires a reason');

    store.acceptRequirement(requirement.requirementId, tenantId);
    const project = store.createProjectFromRequirement(requirement.requirementId, tenantId);
    expect(() => store.assignProjectToPartner(project.projectId, aggregatorId, partnerId)).toThrow('Partner allocation');
    const task = store.publishProject(project.projectId);
    expect(() => store.partnerCommitCapacity(project.projectId, partnerId, 1)).toThrow('Partner allocation');
    store.aggregatorAcceptProject(project.projectId, aggregatorId);
    expect(() => store.assignProjectToPartner(project.projectId, 'wrong-aggregator', partnerId)).toThrow('Aggregator cannot assign');
    store.assignProjectToPartner(project.projectId, aggregatorId, partnerId);
    expect(() => store.partnerEnableWorker(task.taskId, partnerId, workerId)).toThrow('commit capacity');
    store.partnerCommitCapacity(project.projectId, partnerId, 1);
    store.partnerEnableWorker(task.taskId, partnerId, workerId);
    expect(() => store.acceptTask(task.taskId, 'wrong-worker')).toThrow('not enabled');
    const submission = store.recordSubmissionFromUpload(
      createUploadItem(task.taskId, task.title),
      {
        message: 'uploaded',
        mockQcStatus: 'CLEAR',
        objectKey: 'mock/workflow/invalid-transition.mp4',
        preliminaryValidation: matchValidation,
        status: 'accepted',
        submissionId: 'sub-invalid-transition',
      },
      workerId,
    );

    expect(() => store.tenantFinalizeSubmission(submission?.submissionId ?? '', tenantId, 'ACCEPT')).toThrow('requires QA approval');
    store.routeSubmissionToQa(submission?.submissionId ?? '', tenantId);
    store.qaReviewSubmission(submission?.submissionId ?? '', qaId, 'REJECTED', 'Duration evidence failed.');
    expect(() => store.tenantFinalizeSubmission(submission?.submissionId ?? '', tenantId, 'ACCEPT')).toThrow('Cannot tenant-finalize');
  });

  it('reopens the same worker task after QA rejection and accepts a rework upload', async () => {
    const store = useWorkflowStore.getState();
    const requirement = store.createRequirement(createRequirementInput());
    store.acceptRequirement(requirement.requirementId, tenantId);
    const project = store.createProjectFromRequirement(requirement.requirementId, tenantId, {
      workerReward: 950,
    });
    const task = store.publishProject(project.projectId);
    store.aggregatorAcceptProject(project.projectId, aggregatorId);
    store.assignProjectToPartner(project.projectId, aggregatorId, partnerId);
    store.partnerCommitCapacity(project.projectId, partnerId, 1);
    store.partnerEnableWorker(task.taskId, partnerId, workerId);
    store.acceptTask(task.taskId, workerId);

    const firstSubmission = store.recordSubmissionFromUpload(
      createUploadItem(task.taskId, task.title, 'queue-first-submission'),
      {
        message: 'uploaded',
        mockQcStatus: 'CLEAR',
        objectKey: 'mock/workflow/first.mp4',
        preliminaryValidation: matchValidation,
        status: 'accepted',
        submissionId: 'sub-first',
      },
      workerId,
    );

    store.routeSubmissionToQa(firstSubmission?.submissionId ?? '', tenantId);
    const rejected = store.qaReviewSubmission(firstSubmission?.submissionId ?? '', qaId, 'REJECTED', 'Rework the clip with clearer equipment framing.');

    expect(rejected.status).toBe('RETRY_REQUIRED');
    expect(useWorkflowStore.getState().tasks.find((item) => item.taskId === task.taskId)).toMatchObject({
      status: 'ASSIGNED',
      workerId,
    });
    expect((await mockApiAdapter.getMyTasks()).find((item) => item.id === task.taskId)).toMatchObject({
      status: 'reserved',
    });

    const reworkSubmission = store.recordSubmissionFromUpload(
      createUploadItem(task.taskId, task.title, 'queue-rework-submission'),
      {
        message: 'rework uploaded',
        mockQcStatus: 'CLEAR',
        objectKey: 'mock/workflow/rework.mp4',
        preliminaryValidation: matchValidation,
        status: 'accepted',
        submissionId: 'sub-rework',
      },
      workerId,
    );

    expect(reworkSubmission?.submissionId).toBe('SUB-002');
    expect(reworkSubmission).toMatchObject({
      status: 'TENANT_REVIEW',
      taskId: task.taskId,
      workerId,
    });
    expect(useWorkflowStore.getState().tasks.find((item) => item.taskId === task.taskId)?.status).toBe('COMPLETED');
  });
});

function createRequirementInput() {
  return {
    budget: 'INR 90,000 demo budget',
    businessUseCase: 'Industrial inspection model evaluation',
    category: 'Industry / Manufacturing',
    clientId,
    dataType: 'Video' as const,
    deadline: '2026-09-30',
    description: 'Record normal operating industrial equipment.',
    instructions: 'Keep machinery in frame and do not enter restricted areas.',
    languageRequirements: 'English metadata',
    locationRequirements: 'India factory floor',
    qualityRequirements: 'Stable, well-lit equipment footage.',
    quantity: 10,
    requiredDurationSeconds: 600,
    title: 'Industrial Equipment Video Dataset',
  };
}

function createUploadItem(taskId: string, taskTitle: string, id = 'queue-industrial-demo'): UploadQueueItem {
  return {
    attempts: 1,
    createdAt: '2026-08-24T00:00:00.000Z',
    durationMs: 600_000,
    fileName: 'industrial-machinery.mp4',
    id,
    idempotencyKey: 'idem-industrial-demo',
    kind: 'video',
    localUri: 'file:///tmp/industrial-machinery.mp4',
    mimeType: 'video/mp4',
    preliminaryValidation: matchValidation,
    progress: 1,
    requiredDurationMs: 600_000,
    sizeBytes: 4096,
    status: 'uploaded',
    taskId,
    taskTitle,
    updatedAt: '2026-08-24T00:00:00.000Z',
  };
}
