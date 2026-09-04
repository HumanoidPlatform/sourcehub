import { create } from 'zustand';

import type {
  ContentValidationStatus,
  MockQcDuplicateStatus,
  Task,
  UploadMediaResponse,
  UploadQueueItem,
} from '@/types/domain';

export type RequirementStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_TENANT_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'RESUBMITTED'
  | 'REJECTED'
  | 'ACCEPTED'
  | 'PROJECT_CREATED'
  | 'PROJECT_ACTIVE'
  | 'COMPLETED';

export type WorkflowProjectStatus = 'DRAFT' | 'PROJECT_CREATED' | 'PROJECT_ACTIVE' | 'COMPLETED';
export type WorkflowTaskStatus = 'TASK_AVAILABLE' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';
export type WorkflowInitiativeStatus = 'CREATED' | 'PROJECT_CREATED' | 'ACTIVE' | 'DELIVERING' | 'COMPLETED';
export type PartnerAllocationStatus = 'PUBLISHED' | 'AGGREGATOR_ACCEPTED' | 'PARTNER_ASSIGNED' | 'PARTNER_COMMITTED' | 'WORKERS_ENABLED';
export type DeviceAllocationStatus = 'REQUESTED' | 'ALLOCATED' | 'ACTIVE' | 'RETURNED';
export type DeliveryStatus = 'CLIENT_REVIEW' | 'CLIENT_ACCEPTED';
export type BuilderDatasetStatus = 'MARKETPLACE_VISIBLE' | 'LICENSED';
export type IdeWorkItemStatus = 'OPEN' | 'COMPLETED';

export type WorkflowSubmissionStatus =
  | 'CAPTURING'
  | 'UPLOADING'
  | 'SUBMITTED'
  | 'AUTO_QC'
  | 'QA_REVIEW'
  | 'TENANT_REVIEW'
  | 'ACCEPTED'
  | 'WATERMARK_PROCESSING'
  | 'WATERMARK_READY'
  | 'DELIVERED'
  | 'REJECTED'
  | 'RETRY_REQUIRED'
  | 'FAILED';

export type RequirementHistoryEvent = {
  actorId: string;
  at: string;
  comment?: string;
  from?: RequirementStatus;
  to: RequirementStatus;
};

export type SharedRequirement = {
  budget: string;
  businessUseCase: string;
  category: string;
  clientId: string;
  createdAt: string;
  dataType: 'Video' | 'Image' | 'Audio' | 'Text' | 'Other';
  deadline: string;
  description: string;
  history: RequirementHistoryEvent[];
  instructions: string;
  languageRequirements: string;
  locationRequirements: string;
  qualityRequirements: string;
  quantity: number;
  rejectionReason?: string;
  requirementId: string;
  requiredDurationSeconds?: number;
  status: RequirementStatus;
  tenantId?: string;
  title: string;
  updatedAt: string;
};

export type RequirementInput = Omit<
  SharedRequirement,
  'createdAt' | 'history' | 'rejectionReason' | 'requirementId' | 'status' | 'tenantId' | 'updatedAt'
> & {
  tenantId?: string;
};

export type SharedProject = {
  acceptanceCriteria: string;
  aggregatorId?: string;
  allocation: string;
  category: string;
  certifications: string;
  clientId: string;
  createdAt: string;
  dataType: SharedRequirement['dataType'];
  deadline: string;
  instructions: string;
  initiativeId?: string;
  partnerId?: string;
  projectId: string;
  qaRequirements: string;
  quantity: number;
  requirementId: string;
  requiredDurationSeconds?: number;
  status: WorkflowProjectStatus;
  taskIds: string[];
  tenantId: string;
  title: string;
  updatedAt: string;
  workerEligibility: string;
  workerReward: number;
};

export type ProjectOperationalInput = Partial<
  Pick<
    SharedProject,
    'acceptanceCriteria' | 'allocation' | 'certifications' | 'instructions' | 'qaRequirements' | 'workerEligibility' | 'workerReward'
  >
>;

export type SharedWorkflowTask = {
  category: string;
  clientId: string;
  createdAt: string;
  dataType: SharedRequirement['dataType'];
  enabledWorkerId?: string;
  instructions: string;
  partnerId?: string;
  projectId: string;
  quantity: number;
  requirementId: string;
  requiredDurationSeconds?: number;
  status: WorkflowTaskStatus;
  taskId: string;
  tenantId: string;
  title: string;
  updatedAt: string;
  workerId?: string;
  workerReward: number;
};

export type SharedInitiative = {
  clientId: string;
  createdAt: string;
  initiativeId: string;
  requirementId: string;
  status: WorkflowInitiativeStatus;
  tenantId: string;
  title: string;
  updatedAt: string;
};

export type SharedPartnerAllocation = {
  aggregatorId: string;
  allocationId: string;
  capacity?: number;
  createdAt: string;
  partnerId?: string;
  projectId: string;
  requirementId: string;
  status: PartnerAllocationStatus;
  taskId?: string;
  tenantId: string;
  updatedAt: string;
};

export type SharedDeviceAllocation = {
  createdAt: string;
  deviceAllocationId: string;
  kitLabel: string;
  partnerId: string;
  projectId: string;
  requirementId: string;
  sponsorId?: string;
  status: DeviceAllocationStatus;
  taskId: string;
  updatedAt: string;
  workerId?: string;
};

export type SharedDelivery = {
  acceptedAt?: string;
  clientId: string;
  createdAt: string;
  datasetId?: string;
  deliveryId: string;
  initiativeId?: string;
  projectId: string;
  requirementId: string;
  status: DeliveryStatus;
  submissionIds: string[];
  tenantId: string;
  title: string;
  updatedAt: string;
};

export type SharedBuilderDataset = {
  createdAt: string;
  datasetId: string;
  deliveryId: string;
  licensedBy?: string;
  projectId: string;
  requirementId: string;
  status: BuilderDatasetStatus;
  title: string;
  updatedAt: string;
};

export type SharedIdeWorkItem = {
  createdAt: string;
  ideWorkItemId: string;
  projectId: string;
  requirementId: string;
  status: IdeWorkItemStatus;
  submissionId: string;
  taskId: string;
  title: string;
  updatedAt: string;
  workType: 'review' | 'annotation' | 'transcription' | 'rating' | 'evaluation';
};

export type SharedSubmission = {
  actualDurationSeconds?: number;
  clientId: string;
  createdAt: string;
  duplicateStatus: MockQcDuplicateStatus;
  history: SubmissionHistoryEvent[];
  mediaAssetId: string;
  originalAssetPrivate: boolean;
  projectId: string;
  qaDecision?: 'APPROVED' | 'REJECTED' | 'ESCALATED';
  qaNotes?: string;
  qcStatus: 'NOT_CHECKED' | 'CLEAR' | 'NEEDS_REVIEW' | 'FAILED';
  requirementId: string;
  requiredDurationSeconds?: number;
  reviewStatus: 'NOT_REVIEWED' | 'QA_REVIEW' | 'QA_APPROVED' | 'QA_REJECTED' | 'TENANT_REVIEW' | 'TENANT_ACCEPTED' | 'TENANT_REJECTED';
  rewardAmount: number;
  semanticStatus?: ContentValidationStatus;
  status: WorkflowSubmissionStatus;
  submissionId: string;
  submittedAt: string;
  taskId: string;
  tenantId: string;
  updatedAt: string;
  watermarkedAssetId?: string;
  watermarkText?: string;
  workerId: string;
};

export type SubmissionHistoryEvent = {
  actorId: string;
  at: string;
  from?: WorkflowSubmissionStatus;
  to: WorkflowSubmissionStatus;
};

export type WorkflowNotification = {
  audience: 'client' | 'tenant' | 'aggregator' | 'partner' | 'sponsor' | 'crowd' | 'ide' | 'builder' | 'qa' | 'platform';
  body: string;
  createdAt: string;
  id: string;
  title: string;
};

export type WorkflowAuditEvent = {
  action: string;
  actorId: string;
  createdAt: string;
  detail: string;
  id: string;
  requirementId?: string;
  projectId?: string;
  submissionId?: string;
};

export type WorkflowLedgerEntry = {
  amount: number;
  createdAt: string;
  id: string;
  label: string;
  status: 'pending' | 'settled';
  submissionId: string;
  workerId: string;
};

export type ProjectProgress = {
  accepted: number;
  assigned: number;
  qaPassed: number;
  rejected: number;
  remaining: number;
  required: number;
  submitted: number;
};

type WorkflowStateData = {
  auditEvents: WorkflowAuditEvent[];
  builderDatasets: SharedBuilderDataset[];
  deliveries: SharedDelivery[];
  deviceAllocations: SharedDeviceAllocation[];
  ideWorkItems: SharedIdeWorkItem[];
  initiatives: SharedInitiative[];
  ledgerEntries: WorkflowLedgerEntry[];
  notifications: WorkflowNotification[];
  partnerAllocations: SharedPartnerAllocation[];
  projects: SharedProject[];
  requirements: SharedRequirement[];
  submissions: SharedSubmission[];
  tasks: SharedWorkflowTask[];
};

type WorkflowActions = {
  acceptRequirement: (requirementId: string, tenantId: string) => SharedRequirement;
  acceptDelivery: (deliveryId: string, clientId: string) => SharedDelivery;
  acceptTask: (taskId: string, workerId: string) => SharedWorkflowTask;
  activateDevice: (deviceAllocationId: string, sponsorId: string) => SharedDeviceAllocation;
  aggregatorAcceptProject: (projectId: string, aggregatorId: string) => SharedPartnerAllocation;
  allocateDevice: (deviceAllocationId: string, sponsorId: string) => SharedDeviceAllocation;
  assignProjectToPartner: (projectId: string, aggregatorId: string, partnerId: string) => SharedPartnerAllocation;
  completeWatermark: (submissionId: string) => SharedSubmission;
  completeIdeWork: (ideWorkItemId: string, workerId: string) => SharedIdeWorkItem;
  createInitiativeFromRequirement: (requirementId: string, tenantId: string) => SharedInitiative;
  createProjectFromRequirement: (requirementId: string, tenantId: string, input?: ProjectOperationalInput) => SharedProject;
  createRequirement: (input: RequirementInput) => SharedRequirement;
  exportOriginal: (submissionId: string, adminId: string, reason: string) => WorkflowAuditEvent;
  getProjectProgress: (projectId: string) => ProjectProgress;
  licenseDataset: (datasetId: string, builderId: string) => SharedBuilderDataset;
  partnerCommitCapacity: (projectId: string, partnerId: string, capacity: number) => SharedPartnerAllocation;
  partnerEnableWorker: (taskId: string, partnerId: string, workerId: string) => SharedWorkflowTask;
  publishProject: (projectId: string) => SharedWorkflowTask;
  recordSubmissionFromUpload: (item: UploadQueueItem, result: UploadMediaResponse, workerId?: string) => SharedSubmission | null;
  rejectRequirement: (requirementId: string, tenantId: string, reason: string) => SharedRequirement;
  requestDeviceForTask: (taskId: string, partnerId: string, workerId?: string) => SharedDeviceAllocation;
  requestRequirementChanges: (requirementId: string, tenantId: string, comment: string) => SharedRequirement;
  resetWorkflow: () => void;
  resubmitRequirement: (requirementId: string, clientId: string, patch: Partial<RequirementInput>) => SharedRequirement;
  routeSubmissionToQa: (submissionId: string, tenantId: string) => SharedSubmission;
  qaReviewSubmission: (submissionId: string, qaId: string, decision: 'APPROVED' | 'REJECTED' | 'ESCALATED', notes?: string) => SharedSubmission;
  tenantFinalizeSubmission: (submissionId: string, tenantId: string, decision: 'ACCEPT' | 'REJECT', reason?: string) => SharedSubmission;
};

export type WorkflowState = WorkflowStateData & WorkflowActions;

const DEFAULT_TENANT_ID = 'tenant-meridian';
const DEFAULT_WORKER_ID = 'user-crowd-anita';

type WorkflowSet = (
  partial:
    | WorkflowState
    | Partial<WorkflowState>
    | ((state: WorkflowState) => WorkflowState | Partial<WorkflowState>),
  replace?: false,
) => void;

const initialData: WorkflowStateData = {
  auditEvents: [],
  builderDatasets: [],
  deliveries: [],
  deviceAllocations: [],
  ideWorkItems: [],
  initiatives: [],
  ledgerEntries: [],
  notifications: [],
  partnerAllocations: [],
  projects: [],
  requirements: [],
  submissions: [],
  tasks: [],
};

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  ...initialData,

  createRequirement(input) {
    if (input.dataType === 'Video' && (input.requiredDurationSeconds ?? 0) < 300) {
      throw new Error('Video requirements need a minimum duration of 5 minutes.');
    }
    const now = timestamp();
    const requirement: SharedRequirement = {
      ...input,
      requirementId: nextId('REQ'),
      status: 'SUBMITTED',
      tenantId: input.tenantId ?? DEFAULT_TENANT_ID,
      createdAt: now,
      updatedAt: now,
      history: [{ actorId: input.clientId, at: now, to: 'SUBMITTED', comment: 'Client submitted requirement.' }],
    };
    set((state) => ({
      auditEvents: [
        ...state.auditEvents,
        audit('requirement.submitted', input.clientId, `Client submitted ${requirement.title}.`, {
          requirementId: requirement.requirementId,
        }),
      ],
      notifications: [
        ...state.notifications,
        notification('tenant', 'New Client requirement', requirement.title),
        notification('client', 'Requirement submitted', requirement.title),
      ],
      requirements: [...state.requirements, requirement],
    }));
    return requirement;
  },

  requestRequirementChanges(requirementId, tenantId, comment) {
    const requirement = findRequirement(get(), requirementId);
    const reviewing = ensureRequirementInReview(requirement, tenantId);
    const next = transitionRequirement(reviewing, 'CHANGES_REQUESTED', tenantId, comment);
    updateRequirement(set, next, [
      notification('client', 'Changes requested', comment),
      notification('tenant', 'Requirement change request sent', next.title),
    ]);
    pushAudit(set, audit('requirement.changes_requested', tenantId, comment, { requirementId }));
    return next;
  },

  resubmitRequirement(requirementId, clientId, patch) {
    const requirement = findRequirement(get(), requirementId);
    if (requirement.status !== 'CHANGES_REQUESTED') {
      throw new Error(`Cannot resubmit requirement from ${requirement.status}.`);
    }
    const now = timestamp();
    const merged: SharedRequirement = {
      ...requirement,
      ...patch,
      status: 'RESUBMITTED',
      updatedAt: now,
      history: [...requirement.history, { actorId: clientId, at: now, from: requirement.status, to: 'RESUBMITTED', comment: 'Client resubmitted requirement.' }],
    };
    updateRequirement(set, merged, [notification('tenant', 'Requirement resubmitted', merged.title)]);
    pushAudit(set, audit('requirement.resubmitted', clientId, merged.title, { requirementId }));
    return merged;
  },

  rejectRequirement(requirementId, tenantId, reason) {
    const cleanReason = reason.trim();
    if (!cleanReason) {
      throw new Error('Requirement rejection requires a reason.');
    }
    const requirement = findRequirement(get(), requirementId);
    const reviewing = ensureRequirementInReview(requirement, tenantId);
    const next = { ...transitionRequirement(reviewing, 'REJECTED', tenantId, cleanReason), rejectionReason: cleanReason };
    updateRequirement(set, next, [notification('client', 'Requirement rejected', cleanReason)]);
    pushAudit(set, audit('requirement.rejected', tenantId, cleanReason, { requirementId }));
    return next;
  },

  acceptRequirement(requirementId, tenantId) {
    const requirement = findRequirement(get(), requirementId);
    const reviewing = ensureRequirementInReview(requirement, tenantId);
    const next = transitionRequirement(reviewing, 'ACCEPTED', tenantId, 'Tenant accepted requirement.');
    updateRequirement(set, next, [notification('client', 'Requirement accepted', next.title)]);
    pushAudit(set, audit('requirement.accepted', tenantId, next.title, { requirementId }));
    return next;
  },

  createInitiativeFromRequirement(requirementId, tenantId) {
    const state = get();
    const requirement = findRequirement(state, requirementId);
    if (requirement.status !== 'ACCEPTED') {
      throw new Error(`Cannot create initiative from requirement in ${requirement.status}.`);
    }
    const existing = state.initiatives.find((initiative) => initiative.requirementId === requirementId);
    if (existing) {
      return existing;
    }
    const initiative = createInitiativeRecord(requirement, tenantId);
    set((current) => ({
      auditEvents: [
        ...current.auditEvents,
        audit('initiative.created', tenantId, initiative.title, { requirementId }),
      ],
      initiatives: [...current.initiatives, initiative],
      notifications: [
        ...current.notifications,
        notification('client', 'Initiative created', initiative.title),
        notification('platform', 'Initiative created', initiative.title),
      ],
    }));
    return initiative;
  },

  createProjectFromRequirement(requirementId, tenantId, input = {}) {
    const state = get();
    const requirement = findRequirement(state, requirementId);
    if (requirement.status !== 'ACCEPTED') {
      throw new Error(`Cannot create project from requirement in ${requirement.status}.`);
    }
    const existingInitiative = state.initiatives.find((item) => item.requirementId === requirementId);
    const initiative = existingInitiative ?? createInitiativeRecord(requirement, tenantId);
    const now = timestamp();
    const project: SharedProject = {
      acceptanceCriteria: input.acceptanceCriteria ?? requirement.qualityRequirements,
      allocation: input.allocation ?? 'Shared demo allocation for eligible Crowd workers.',
      category: requirement.category,
      certifications: input.certifications ?? 'Field Privacy and Consent',
      clientId: requirement.clientId,
      createdAt: now,
      dataType: requirement.dataType,
      deadline: requirement.deadline,
      instructions: input.instructions ?? requirement.instructions,
      initiativeId: initiative.initiativeId,
      projectId: nextId('PROJ'),
      qaRequirements: input.qaRequirements ?? 'QA required before tenant final acceptance.',
      quantity: requirement.quantity,
      requirementId,
      requiredDurationSeconds: requirement.requiredDurationSeconds,
      status: 'PROJECT_CREATED',
      taskIds: [],
      tenantId,
      title: requirement.title,
      updatedAt: now,
      workerEligibility: input.workerEligibility ?? 'Crowd workers with capture readiness and required safety certification.',
      workerReward: input.workerReward ?? normalizeBudget(requirement.budget),
    };
    const nextRequirement = transitionRequirement(requirement, 'PROJECT_CREATED', tenantId, 'Tenant created project from requirement.');
    const nextInitiative: SharedInitiative = {
      ...initiative,
      status: 'PROJECT_CREATED',
      updatedAt: now,
    };
    set((state) => ({
      auditEvents: [
        ...state.auditEvents,
        ...(existingInitiative ? [] : [audit('initiative.created', tenantId, initiative.title, { requirementId })]),
        audit('project.created', tenantId, project.title, { requirementId, projectId: project.projectId }),
      ],
      initiatives: existingInitiative
        ? state.initiatives.map((item) => (item.initiativeId === initiative.initiativeId ? nextInitiative : item))
        : [...state.initiatives, nextInitiative],
      notifications: [
        ...state.notifications,
        ...(existingInitiative ? [] : [notification('client', 'Initiative created', initiative.title)]),
        notification('client', 'Project created', project.title),
      ],
      projects: [...state.projects, project],
      requirements: state.requirements.map((item) => (item.requirementId === requirementId ? nextRequirement : item)),
    }));
    return project;
  },

  publishProject(projectId) {
    const project = findProject(get(), projectId);
    if (project.status !== 'PROJECT_CREATED') {
      throw new Error(`Cannot publish project from ${project.status}.`);
    }
    const task = createWorkflowTask(project);
    const requirement = findRequirement(get(), project.requirementId);
    const nextRequirement = transitionRequirement(requirement, 'PROJECT_ACTIVE', project.tenantId, 'Tenant published project and task.');
    const now = timestamp();
    set((state) => ({
      auditEvents: [...state.auditEvents, audit('project.published', project.tenantId, project.title, { projectId, requirementId: project.requirementId })],
      initiatives: state.initiatives.map((initiative) =>
        initiative.initiativeId === project.initiativeId ? { ...initiative, status: 'ACTIVE', updatedAt: now } : initiative,
      ),
      notifications: [
        ...state.notifications,
        notification('client', 'Project started', project.title),
        notification('aggregator', 'Project active', project.title),
      ],
      projects: state.projects.map((item) =>
        item.projectId === projectId ? { ...item, status: 'PROJECT_ACTIVE', taskIds: [task.taskId], updatedAt: now } : item,
      ),
      requirements: state.requirements.map((item) => (item.requirementId === project.requirementId ? nextRequirement : item)),
      tasks: [...state.tasks, task],
    }));
    return task;
  },

  aggregatorAcceptProject(projectId, aggregatorId) {
    const project = findProject(get(), projectId);
    if (project.status !== 'PROJECT_ACTIVE') {
      throw new Error(`Cannot coordinate project from ${project.status}.`);
    }
    const existing = get().partnerAllocations.find((allocation) => allocation.projectId === projectId);
    const now = timestamp();
    const allocation: SharedPartnerAllocation = existing
      ? { ...existing, aggregatorId, status: 'AGGREGATOR_ACCEPTED', updatedAt: now }
      : {
          aggregatorId,
          allocationId: nextId('ALLOC'),
          createdAt: now,
          projectId,
          requirementId: project.requirementId,
          status: 'AGGREGATOR_ACCEPTED',
          tenantId: project.tenantId,
          updatedAt: now,
        };
    set((state) => ({
      auditEvents: [...state.auditEvents, audit('aggregator.project_accepted', aggregatorId, project.title, { projectId, requirementId: project.requirementId })],
      notifications: [
        ...state.notifications,
        notification('tenant', 'Aggregator accepted project', project.title),
        notification('platform', 'Aggregator coordinating project', project.title),
      ],
      partnerAllocations: existing
        ? state.partnerAllocations.map((item) => (item.allocationId === allocation.allocationId ? allocation : item))
        : [...state.partnerAllocations, allocation],
      projects: state.projects.map((item) => (item.projectId === projectId ? { ...item, aggregatorId, updatedAt: now } : item)),
    }));
    return allocation;
  },

  assignProjectToPartner(projectId, aggregatorId, partnerId) {
    const project = findProject(get(), projectId);
    const allocation = findPartnerAllocationByProject(get(), projectId);
    if (allocation.aggregatorId !== aggregatorId) {
      throw new Error('Aggregator cannot assign a project it has not accepted.');
    }
    if (allocation.status !== 'AGGREGATOR_ACCEPTED' && allocation.status !== 'PARTNER_ASSIGNED') {
      throw new Error(`Cannot assign partner from ${allocation.status}.`);
    }
    const now = timestamp();
    const next = {
      ...allocation,
      partnerId,
      status: 'PARTNER_ASSIGNED' as PartnerAllocationStatus,
      taskId: project.taskIds[0],
      updatedAt: now,
    };
    set((state) => ({
      auditEvents: [...state.auditEvents, audit('aggregator.partner_assigned', aggregatorId, partnerId, { projectId, requirementId: project.requirementId })],
      notifications: [
        ...state.notifications,
        notification('partner', 'Project allocated', project.title),
        notification('tenant', 'Partner allocated', `${project.title} → ${partnerId}`),
      ],
      partnerAllocations: state.partnerAllocations.map((item) => (item.allocationId === allocation.allocationId ? next : item)),
      projects: state.projects.map((item) => (item.projectId === projectId ? { ...item, partnerId, updatedAt: now } : item)),
    }));
    return next;
  },

  partnerCommitCapacity(projectId, partnerId, capacity) {
    if (capacity <= 0) {
      throw new Error('Partner capacity must be greater than zero.');
    }
    const project = findProject(get(), projectId);
    const allocation = findPartnerAllocationByProject(get(), projectId);
    if (allocation.partnerId !== partnerId) {
      throw new Error('Partner cannot commit capacity before assignment.');
    }
    if (allocation.status !== 'PARTNER_ASSIGNED' && allocation.status !== 'PARTNER_COMMITTED' && allocation.status !== 'WORKERS_ENABLED') {
      throw new Error(`Cannot commit capacity from ${allocation.status}.`);
    }
    const now = timestamp();
    const next = { ...allocation, capacity, status: 'PARTNER_COMMITTED' as PartnerAllocationStatus, updatedAt: now };
    set((state) => ({
      auditEvents: [...state.auditEvents, audit('partner.capacity_committed', partnerId, `${capacity} workers`, { projectId, requirementId: project.requirementId })],
      notifications: [
        ...state.notifications,
        notification('aggregator', 'Partner committed capacity', `${project.title}: ${capacity}`),
        notification('tenant', 'Supply committed', project.title),
      ],
      partnerAllocations: state.partnerAllocations.map((item) => (item.allocationId === allocation.allocationId ? next : item)),
    }));
    return next;
  },

  partnerEnableWorker(taskId, partnerId, workerId) {
    const task = findTask(get(), taskId);
    const allocation = findPartnerAllocationByProject(get(), task.projectId);
    if (allocation.partnerId !== partnerId || (allocation.status !== 'PARTNER_COMMITTED' && allocation.status !== 'WORKERS_ENABLED')) {
      throw new Error('Partner must commit capacity before enabling workers.');
    }
    const now = timestamp();
    const nextTask = { ...task, enabledWorkerId: workerId, partnerId, updatedAt: now };
    const nextAllocation = { ...allocation, status: 'WORKERS_ENABLED' as PartnerAllocationStatus, taskId, updatedAt: now };
    set((state) => ({
      auditEvents: [...state.auditEvents, audit('partner.worker_enabled', partnerId, workerId, { projectId: task.projectId, requirementId: task.requirementId })],
      notifications: [
        ...state.notifications,
        notification('crowd', 'Task enabled by Partner', task.title),
        notification('aggregator', 'Worker enabled', `${task.title}: ${workerId}`),
      ],
      partnerAllocations: state.partnerAllocations.map((item) => (item.allocationId === allocation.allocationId ? nextAllocation : item)),
      tasks: state.tasks.map((item) => (item.taskId === taskId ? nextTask : item)),
    }));
    return nextTask;
  },

  requestDeviceForTask(taskId, partnerId, workerId) {
    const task = findTask(get(), taskId);
    const allocation = findPartnerAllocationByProject(get(), task.projectId);
    if (allocation.partnerId !== partnerId || (allocation.status !== 'WORKERS_ENABLED' && allocation.status !== 'PARTNER_COMMITTED')) {
      throw new Error('Partner must own the project before requesting devices.');
    }
    const existing = get().deviceAllocations.find((item) => item.taskId === taskId && item.partnerId === partnerId);
    if (existing) {
      return existing;
    }
    const now = timestamp();
    const deviceAllocation: SharedDeviceAllocation = {
      createdAt: now,
      deviceAllocationId: nextId('DEV'),
      kitLabel: `${task.category} capture kit`,
      partnerId,
      projectId: task.projectId,
      requirementId: task.requirementId,
      status: 'REQUESTED',
      taskId,
      updatedAt: now,
      workerId: workerId ?? task.enabledWorkerId,
    };
    set((state) => ({
      auditEvents: [...state.auditEvents, audit('partner.device_requested', partnerId, task.title, { projectId: task.projectId, requirementId: task.requirementId })],
      deviceAllocations: [...state.deviceAllocations, deviceAllocation],
      notifications: [
        ...state.notifications,
        notification('sponsor', 'Device kit requested', task.title),
        notification('platform', 'Device demand opened', task.title),
      ],
    }));
    return deviceAllocation;
  },

  allocateDevice(deviceAllocationId, sponsorId) {
    const allocation = findDeviceAllocation(get(), deviceAllocationId);
    if (allocation.status !== 'REQUESTED') {
      throw new Error(`Cannot allocate device from ${allocation.status}.`);
    }
    const now = timestamp();
    const next = { ...allocation, sponsorId, status: 'ALLOCATED' as DeviceAllocationStatus, updatedAt: now };
    set((state) => ({
      auditEvents: [
        ...state.auditEvents,
        audit('sponsor.device_allocated', sponsorId, allocation.kitLabel, { projectId: allocation.projectId, requirementId: allocation.requirementId }),
      ],
      deviceAllocations: state.deviceAllocations.map((item) => (item.deviceAllocationId === deviceAllocationId ? next : item)),
      notifications: [
        ...state.notifications,
        notification('partner', 'Device kit allocated', allocation.kitLabel),
        notification('crowd', 'Device kit assigned', allocation.kitLabel),
      ],
    }));
    return next;
  },

  activateDevice(deviceAllocationId, sponsorId) {
    const allocation = findDeviceAllocation(get(), deviceAllocationId);
    if (allocation.sponsorId !== sponsorId) {
      throw new Error('Sponsor cannot activate a device it has not allocated.');
    }
    if (allocation.status !== 'ALLOCATED' && allocation.status !== 'ACTIVE') {
      throw new Error(`Cannot activate device from ${allocation.status}.`);
    }
    const now = timestamp();
    const next = { ...allocation, status: 'ACTIVE' as DeviceAllocationStatus, updatedAt: now };
    set((state) => ({
      auditEvents: [
        ...state.auditEvents,
        audit('sponsor.device_active', sponsorId, allocation.kitLabel, { projectId: allocation.projectId, requirementId: allocation.requirementId }),
      ],
      deviceAllocations: state.deviceAllocations.map((item) => (item.deviceAllocationId === deviceAllocationId ? next : item)),
      notifications: [
        ...state.notifications,
        notification('partner', 'Device kit active', allocation.kitLabel),
        notification('platform', 'Device custody active', allocation.kitLabel),
      ],
    }));
    return next;
  },

  acceptTask(taskId, workerId) {
    const task = findTask(get(), taskId);
    if (task.status !== 'TASK_AVAILABLE') {
      throw new Error(`Cannot accept task from ${task.status}.`);
    }
    if (task.enabledWorkerId && task.enabledWorkerId !== workerId) {
      throw new Error('Worker is not enabled for this partner-assigned task.');
    }
    const next = { ...task, status: 'ASSIGNED' as WorkflowTaskStatus, updatedAt: timestamp(), workerId };
    set((state) => ({
      auditEvents: [...state.auditEvents, audit('task.accepted', workerId, task.title, { projectId: task.projectId, requirementId: task.requirementId })],
      notifications: [
        ...state.notifications,
        notification('crowd', 'Task assigned', task.title),
        ...(task.partnerId ? [notification('partner', 'Worker accepted task', task.title)] : []),
      ],
      tasks: state.tasks.map((item) => (item.taskId === taskId ? next : item)),
    }));
    return next;
  },

  recordSubmissionFromUpload(item, result, workerId = DEFAULT_WORKER_ID) {
    const state = get();
    const task = state.tasks.find((candidate) => candidate.taskId === item.taskId);
    if (!task || result.status === 'failed' || state.submissions.some((submission) => submission.mediaAssetId === item.id)) {
      return null;
    }
    const now = timestamp();
    const submissionId = nextId('SUB');
    const submission: SharedSubmission = {
      actualDurationSeconds: item.durationMs ? Math.round(item.durationMs / 1000) : undefined,
      clientId: task.clientId,
      createdAt: now,
      duplicateStatus: result.mockQcStatus ?? 'NOT_CHECKED',
      history: createUploadSubmissionHistory(workerId, now),
      mediaAssetId: item.id,
      originalAssetPrivate: true,
      projectId: task.projectId,
      qcStatus: result.mockQcStatus === 'POSSIBLE_DUPLICATE' ? 'NEEDS_REVIEW' : 'CLEAR',
      requirementId: task.requirementId,
      requiredDurationSeconds: task.requiredDurationSeconds,
      reviewStatus: 'TENANT_REVIEW',
      rewardAmount: task.workerReward,
      semanticStatus: result.preliminaryValidation?.status,
      status: 'TENANT_REVIEW',
      submissionId,
      submittedAt: now,
      taskId: task.taskId,
      tenantId: task.tenantId,
      updatedAt: now,
      workerId,
    };
    set((current) => ({
      auditEvents: [...current.auditEvents, audit('submission.created', workerId, submission.submissionId, { submissionId: submission.submissionId, projectId: task.projectId, requirementId: task.requirementId })],
      notifications: [
        ...current.notifications,
        notification('tenant', 'New worker submission', submission.submissionId),
        notification('aggregator', 'Worker submission uploaded', submission.submissionId),
        notification('partner', 'Worker submission uploaded', submission.submissionId),
        notification('qa', 'Submission visible for review', submission.submissionId),
        notification('crowd', 'Upload received', submission.submissionId),
      ],
      submissions: [...current.submissions, submission],
      tasks: current.tasks.map((candidate) => (candidate.taskId === task.taskId ? { ...candidate, status: 'COMPLETED', updatedAt: now, workerId } : candidate)),
    }));
    return submission;
  },

  routeSubmissionToQa(submissionId, tenantId) {
    const state = get();
    const submission = findSubmission(state, submissionId);
    if (submission.tenantId !== tenantId) {
      throw new Error('Tenant cannot route a submission outside its tenant scope.');
    }
    if (submission.status !== 'TENANT_REVIEW' && submission.status !== 'SUBMITTED') {
      throw new Error(`Cannot route submission from ${submission.status}.`);
    }
    const next = transitionSubmission(submission, 'QA_REVIEW', {
      reviewStatus: 'QA_REVIEW',
    }, tenantId);
    const existingIdeItem = state.ideWorkItems.find((item) => item.submissionId === submissionId);
    const ideWorkItem = existingIdeItem ?? createIdeWorkItem(next);
    set((current) => ({
      auditEvents: [...current.auditEvents, audit('submission.sent_to_qa', tenantId, submission.submissionId, { submissionId })],
      ideWorkItems: existingIdeItem ? current.ideWorkItems : [...current.ideWorkItems, ideWorkItem],
      notifications: [
        ...current.notifications,
        notification('qa', 'New review assigned', submission.submissionId),
        notification('ide', 'Capture review linked', submission.submissionId),
      ],
      submissions: current.submissions.map((item) => (item.submissionId === submission.submissionId ? next : item)),
    }));
    return next;
  },

  qaReviewSubmission(submissionId, qaId, decision, notes = '') {
    const state = get();
    const submission = findSubmission(state, submissionId);
    if (submission.status !== 'QA_REVIEW') {
      throw new Error(`Cannot QA-review submission from ${submission.status}.`);
    }
    const now = timestamp();
    const nextStatus = decision === 'APPROVED' ? 'TENANT_REVIEW' : decision === 'REJECTED' ? 'RETRY_REQUIRED' : 'TENANT_REVIEW';
    const next = transitionSubmission(submission, nextStatus, {
      qaDecision: decision,
      qaNotes: notes,
      reviewStatus: decision === 'APPROVED' ? 'QA_APPROVED' : decision === 'REJECTED' ? 'QA_REJECTED' : 'TENANT_REVIEW',
    }, qaId);
    set((current) => ({
      auditEvents: [...current.auditEvents, audit(`qa.${decision.toLowerCase()}`, qaId, notes || decision, { submissionId })],
      ideWorkItems: current.ideWorkItems.map((item) =>
        item.submissionId === submissionId && decision === 'APPROVED' ? { ...item, status: 'COMPLETED', updatedAt: timestamp() } : item,
      ),
      notifications: [
        ...current.notifications,
        notification('tenant', 'QA completed', `${submission.submissionId}: ${decision}`),
        ...(decision === 'REJECTED' ? [notification('crowd', 'Rework requested', notes || submission.submissionId)] : []),
        ...(decision === 'APPROVED' ? [notification('ide', 'Review work completed', submission.submissionId)] : []),
      ],
      submissions: current.submissions.map((item) => (item.submissionId === submission.submissionId ? next : item)),
      tasks: current.tasks.map((task) =>
        task.taskId === submission.taskId && decision === 'REJECTED'
          ? { ...task, status: 'ASSIGNED', updatedAt: now, workerId: submission.workerId }
          : task,
      ),
    }));
    return next;
  },

  completeIdeWork(ideWorkItemId, workerId) {
    const item = findIdeWorkItem(get(), ideWorkItemId);
    if (item.status !== 'OPEN') {
      throw new Error(`Cannot complete IDE work from ${item.status}.`);
    }
    const now = timestamp();
    const next = { ...item, status: 'COMPLETED' as IdeWorkItemStatus, updatedAt: now };
    set((state) => ({
      auditEvents: [...state.auditEvents, audit('ide.work_completed', workerId, item.title, { projectId: item.projectId, requirementId: item.requirementId, submissionId: item.submissionId })],
      ideWorkItems: state.ideWorkItems.map((candidate) => (candidate.ideWorkItemId === ideWorkItemId ? next : candidate)),
      notifications: [...state.notifications, notification('qa', 'IDE review support completed', item.submissionId)],
    }));
    return next;
  },

  tenantFinalizeSubmission(submissionId, tenantId, decision, reason = '') {
    const submission = findSubmission(get(), submissionId);
    if (submission.tenantId !== tenantId) {
      throw new Error('Tenant cannot finalize a submission outside its tenant scope.');
    }
    if (submission.status !== 'TENANT_REVIEW') {
      throw new Error(`Cannot tenant-finalize submission from ${submission.status}.`);
    }
    if (decision === 'REJECT') {
      const now = timestamp();
      const next = transitionSubmission(submission, 'REJECTED', { reviewStatus: 'TENANT_REJECTED' }, tenantId);
      set((state) => ({
        notifications: [...state.notifications, notification('crowd', 'Submission rejected', reason || submission.submissionId)],
        submissions: state.submissions.map((item) => (item.submissionId === next.submissionId ? next : item)),
        tasks: state.tasks.map((task) =>
          task.taskId === submission.taskId ? { ...task, status: 'ASSIGNED', updatedAt: now, workerId: submission.workerId } : task,
        ),
      }));
      pushAudit(set, audit('submission.rejected', tenantId, reason || submission.submissionId, { submissionId }));
      return next;
    }
    if (submission.qaDecision !== 'APPROVED') {
      throw new Error('Tenant final acceptance requires QA approval in this demo workflow.');
    }
    const watermarkText = `Cosaarthi • ${submission.submissionId}`;
    const accepted = transitionSubmission(submission, 'ACCEPTED', {
      reviewStatus: 'TENANT_ACCEPTED',
    }, tenantId);
    const next = transitionSubmission(accepted, 'WATERMARK_PROCESSING', {
      reviewStatus: 'TENANT_ACCEPTED',
      status: 'WATERMARK_PROCESSING',
      watermarkText,
    }, 'system');
    updateSubmission(set, next, [notification('crowd', 'Submission accepted', submission.submissionId)]);
    pushAudit(set, audit('submission.accepted', tenantId, submission.submissionId, { submissionId }));
    return next;
  },

  completeWatermark(submissionId) {
    const state = get();
    const submission = findSubmission(state, submissionId);
    if (submission.status !== 'WATERMARK_PROCESSING') {
      throw new Error(`Cannot complete watermark from ${submission.status}.`);
    }
    const project = findProject(state, submission.projectId);
    const watermarkedAssetId = `mock-watermarked-${submission.submissionId}`;
    const next = transitionSubmission(submission, 'WATERMARK_READY', {
      watermarkedAssetId,
      watermarkText: submission.watermarkText ?? `Cosaarthi • ${submission.submissionId}`,
    }, 'system');
    const existingDelivery = state.deliveries.find((delivery) => delivery.projectId === submission.projectId && delivery.submissionIds.includes(submissionId));
    const delivery = existingDelivery ?? createDeliveryRecord(project, next);
    const ledgerEntry: WorkflowLedgerEntry = {
      amount: submission.rewardAmount,
      createdAt: timestamp(),
      id: `ledger-${submission.submissionId}`,
      label: `${submission.submissionId} Accepted`,
      status: 'settled',
      submissionId,
      workerId: submission.workerId,
    };
    set((state) => ({
      auditEvents: [
        ...state.auditEvents,
        audit('watermark.ready', 'system', submission.submissionId, { submissionId }),
        ...(existingDelivery ? [] : [audit('delivery.created', project.tenantId, delivery.title, { projectId: project.projectId, requirementId: project.requirementId, submissionId })]),
      ],
      deliveries: existingDelivery ? state.deliveries : [...state.deliveries, delivery],
      initiatives: state.initiatives.map((initiative) =>
        initiative.initiativeId === project.initiativeId ? { ...initiative, status: 'DELIVERING', updatedAt: timestamp() } : initiative,
      ),
      ledgerEntries: state.ledgerEntries.some((entry) => entry.submissionId === submissionId)
        ? state.ledgerEntries
        : [...state.ledgerEntries, ledgerEntry],
      notifications: [
        ...state.notifications,
        notification('client', 'Deliverables ready', submission.submissionId),
        notification('crowd', 'Payment credited', submission.submissionId),
        notification('platform', 'Delivery ready for Client', delivery.deliveryId),
      ],
      submissions: state.submissions.map((item) => (item.submissionId === submissionId ? next : item)),
    }));
    return next;
  },

  acceptDelivery(deliveryId, clientId) {
    const state = get();
    const delivery = findDelivery(state, deliveryId);
    if (delivery.clientId !== clientId) {
      throw new Error('Client cannot accept a delivery outside its account.');
    }
    if (delivery.status !== 'CLIENT_REVIEW') {
      throw new Error(`Cannot accept delivery from ${delivery.status}.`);
    }
    const project = findProject(state, delivery.projectId);
    const requirement = findRequirement(state, delivery.requirementId);
    const dataset = createBuilderDatasetRecord(delivery);
    const now = timestamp();
    const nextDelivery = {
      ...delivery,
      acceptedAt: now,
      datasetId: dataset.datasetId,
      status: 'CLIENT_ACCEPTED' as DeliveryStatus,
      updatedAt: now,
    };
    set((current) => ({
      auditEvents: [
        ...current.auditEvents,
        audit('delivery.accepted', clientId, delivery.title, { projectId: delivery.projectId, requirementId: delivery.requirementId }),
        audit('dataset.marketplace_visible', 'system', dataset.title, { projectId: delivery.projectId, requirementId: delivery.requirementId }),
      ],
      builderDatasets: current.builderDatasets.some((item) => item.deliveryId === deliveryId) ? current.builderDatasets : [...current.builderDatasets, dataset],
      deliveries: current.deliveries.map((item) => (item.deliveryId === deliveryId ? nextDelivery : item)),
      initiatives: current.initiatives.map((initiative) =>
        initiative.initiativeId === delivery.initiativeId ? { ...initiative, status: 'COMPLETED', updatedAt: now } : initiative,
      ),
      notifications: [
        ...current.notifications,
        notification('tenant', 'Client accepted delivery', delivery.title),
        notification('builder', 'Governed dataset available', dataset.title),
        notification('platform', 'Lifecycle completed', delivery.title),
      ],
      projects: current.projects.map((item) => (item.projectId === project.projectId ? { ...item, status: 'COMPLETED', updatedAt: now } : item)),
      requirements: current.requirements.map((item) =>
        item.requirementId === requirement.requirementId
          ? transitionRequirement(requirement, 'COMPLETED', clientId, 'Client accepted final delivery.')
          : item,
      ),
      submissions: current.submissions.map((submission) =>
        delivery.submissionIds.includes(submission.submissionId) && submission.status === 'WATERMARK_READY'
          ? transitionSubmission(submission, 'DELIVERED', { reviewStatus: 'TENANT_ACCEPTED' }, clientId)
          : submission,
      ),
    }));
    return nextDelivery;
  },

  licenseDataset(datasetId, builderId) {
    const dataset = findBuilderDataset(get(), datasetId);
    if (dataset.status !== 'MARKETPLACE_VISIBLE' && dataset.status !== 'LICENSED') {
      throw new Error(`Cannot license dataset from ${dataset.status}.`);
    }
    const now = timestamp();
    const next = { ...dataset, licensedBy: builderId, status: 'LICENSED' as BuilderDatasetStatus, updatedAt: now };
    set((state) => ({
      auditEvents: [...state.auditEvents, audit('builder.dataset_licensed', builderId, dataset.title, { projectId: dataset.projectId, requirementId: dataset.requirementId })],
      builderDatasets: state.builderDatasets.map((item) => (item.datasetId === datasetId ? next : item)),
      notifications: [
        ...state.notifications,
        notification('platform', 'Dataset licensed', dataset.title),
        notification('tenant', 'Builder licensed dataset', dataset.title),
      ],
    }));
    return next;
  },

  exportOriginal(submissionId, adminId, reason) {
    const cleanReason = reason.trim();
    if (!cleanReason) {
      throw new Error('Admin original export requires a reason.');
    }
    const submission = findSubmission(get(), submissionId);
    if (submission.status !== 'WATERMARK_READY' && submission.status !== 'DELIVERED') {
      throw new Error('Admin original export is available only after accepted media is watermarked.');
    }
    const event = audit('admin.export_original', adminId, cleanReason, { submissionId, projectId: submission.projectId, requirementId: submission.requirementId });
    pushAudit(set, event);
    return event;
  },

  getProjectProgress(projectId) {
    return getProjectProgress(get(), projectId);
  },

  resetWorkflow() {
    resetIdCounters();
    set({ ...initialData });
  },
}));

export function selectWorkflowRevision(state: WorkflowState) {
  return [
    state.auditEvents.length,
    state.builderDatasets.length,
    state.deliveries.length,
    state.deviceAllocations.length,
    state.ideWorkItems.length,
    state.initiatives.length,
    state.ledgerEntries.length,
    state.notifications.length,
    state.partnerAllocations.length,
    state.projects.length,
    state.requirements.length,
    state.submissions.length,
    state.tasks.length,
  ].join(':');
}

export function getWorkflowTasksAsDomainTasks(state: WorkflowStateData = useWorkflowStore.getState()): Task[] {
  return state.tasks
    .filter((task) => (task.enabledWorkerId || task.workerId) && (task.status === 'TASK_AVAILABLE' || task.status === 'ASSIGNED' || task.status === 'IN_PROGRESS'))
    .map((task) => ({
      campaignId: `campaign-${task.projectId.toLowerCase()}`,
      category: task.category,
      checklist: [
        task.instructions,
        'Keep required subject matter in frame.',
        'Use the existing Cosaarthi capture, semantic validation and mock upload flow.',
      ],
      currency: 'INR',
      description: task.instructions,
      difficulty: 'advanced',
      distanceKm: undefined,
      dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      estimatedMinutes: Math.max(12, Math.ceil((task.requiredDurationSeconds ?? 600) / 60) + 8),
      id: task.taskId,
      location: 'Shared mock project region',
      pay: task.workerReward,
      progress: task.status === 'TASK_AVAILABLE' ? 0 : 0.35,
      project: task.projectId,
      requiredDurationMs: task.requiredDurationSeconds ? task.requiredDurationSeconds * 1000 : undefined,
      requiredMedia: [toRequiredMediaKind(task.dataType)],
      slotsRemaining: Math.max(0, task.quantity - state.submissions.filter((submission) => submission.taskId === task.taskId).length),
      status: task.status === 'TASK_AVAILABLE' ? 'available' : task.status === 'ASSIGNED' ? 'reserved' : task.status === 'IN_PROGRESS' ? 'in_progress' : 'submitted',
      taskType: 'capture',
      title: task.title,
      qualityBar: 'Matches Client requirement and Tenant acceptance criteria.',
    }));
}

export function getProjectProgress(state: WorkflowStateData, projectId: string): ProjectProgress {
  const project = state.projects.find((item) => item.projectId === projectId);
  const submissions = state.submissions.filter((submission) => submission.projectId === projectId);
  const accepted = submissions.filter((submission) => submission.status === 'WATERMARK_READY' || submission.status === 'DELIVERED').length;
  const rejected = submissions.filter((submission) => submission.status === 'REJECTED' || submission.status === 'RETRY_REQUIRED').length;
  return {
    accepted,
    assigned: state.tasks.filter((task) => task.projectId === projectId && task.workerId).length,
    qaPassed: submissions.filter((submission) => submission.qaDecision === 'APPROVED').length,
    rejected,
    remaining: Math.max(0, (project?.quantity ?? 0) - accepted),
    required: project?.quantity ?? 0,
    submitted: submissions.length,
  };
}

function createWorkflowTask(project: SharedProject): SharedWorkflowTask {
  const now = timestamp();
  return {
    category: project.category,
    clientId: project.clientId,
    createdAt: now,
    dataType: project.dataType,
    instructions: project.instructions,
    projectId: project.projectId,
    quantity: project.quantity,
    requirementId: project.requirementId,
    requiredDurationSeconds: project.requiredDurationSeconds,
    status: 'TASK_AVAILABLE',
    taskId: nextId('TASK'),
    tenantId: project.tenantId,
    title: project.title.includes('Task') ? project.title : `${project.title} Task`,
    updatedAt: now,
    workerReward: project.workerReward,
  };
}

function createInitiativeRecord(requirement: SharedRequirement, tenantId: string): SharedInitiative {
  const now = timestamp();
  return {
    clientId: requirement.clientId,
    createdAt: now,
    initiativeId: nextId('INIT'),
    requirementId: requirement.requirementId,
    status: 'CREATED',
    tenantId,
    title: requirement.title,
    updatedAt: now,
  };
}

function createIdeWorkItem(submission: SharedSubmission): SharedIdeWorkItem {
  const now = timestamp();
  return {
    createdAt: now,
    ideWorkItemId: nextId('IDE'),
    projectId: submission.projectId,
    requirementId: submission.requirementId,
    status: 'OPEN',
    submissionId: submission.submissionId,
    taskId: submission.taskId,
    title: `Review ${submission.submissionId}`,
    updatedAt: now,
    workType: 'review',
  };
}

function createDeliveryRecord(project: SharedProject, submission: SharedSubmission): SharedDelivery {
  const now = timestamp();
  return {
    clientId: submission.clientId,
    createdAt: now,
    deliveryId: nextId('DEL'),
    initiativeId: project.initiativeId,
    projectId: submission.projectId,
    requirementId: submission.requirementId,
    status: 'CLIENT_REVIEW',
    submissionIds: [submission.submissionId],
    tenantId: submission.tenantId,
    title: `${project.title} Delivery`,
    updatedAt: now,
  };
}

function createBuilderDatasetRecord(delivery: SharedDelivery): SharedBuilderDataset {
  const now = timestamp();
  return {
    createdAt: now,
    datasetId: nextId('DATA'),
    deliveryId: delivery.deliveryId,
    projectId: delivery.projectId,
    requirementId: delivery.requirementId,
    status: 'MARKETPLACE_VISIBLE',
    title: delivery.title.replace(/ Delivery$/, ' Governed Dataset'),
    updatedAt: now,
  };
}

function assertRequirementTransition(from: RequirementStatus, to: RequirementStatus) {
  const allowed: Record<RequirementStatus, RequirementStatus[]> = {
    ACCEPTED: ['PROJECT_CREATED'],
    CHANGES_REQUESTED: ['RESUBMITTED'],
    COMPLETED: [],
    DRAFT: ['SUBMITTED'],
    PROJECT_ACTIVE: ['COMPLETED'],
    PROJECT_CREATED: ['PROJECT_ACTIVE'],
    REJECTED: [],
    RESUBMITTED: ['UNDER_TENANT_REVIEW'],
    SUBMITTED: ['UNDER_TENANT_REVIEW'],
    UNDER_TENANT_REVIEW: ['ACCEPTED', 'CHANGES_REQUESTED', 'REJECTED'],
  };
  if (!allowed[from].includes(to)) {
    throw new Error(`Invalid requirement transition ${from} -> ${to}.`);
  }
}

function transitionRequirement(requirement: SharedRequirement, to: RequirementStatus, actorId: string, comment?: string): SharedRequirement {
  assertRequirementTransition(requirement.status, to);
  const now = timestamp();
  return {
    ...requirement,
    status: to,
    updatedAt: now,
    history: [...requirement.history, { actorId, at: now, from: requirement.status, to, comment }],
  };
}

function transitionSubmission(
  submission: SharedSubmission,
  to: WorkflowSubmissionStatus,
  patch: Partial<SharedSubmission> = {},
  actorId = 'system',
): SharedSubmission {
  const allowed: Record<WorkflowSubmissionStatus, WorkflowSubmissionStatus[]> = {
    ACCEPTED: ['WATERMARK_PROCESSING'],
    AUTO_QC: ['QA_REVIEW', 'TENANT_REVIEW', 'RETRY_REQUIRED'],
    CAPTURING: ['UPLOADING'],
    DELIVERED: [],
    FAILED: [],
    QA_REVIEW: ['TENANT_REVIEW', 'RETRY_REQUIRED'],
    REJECTED: [],
    RETRY_REQUIRED: [],
    SUBMITTED: ['AUTO_QC', 'QA_REVIEW', 'TENANT_REVIEW'],
    TENANT_REVIEW: ['QA_REVIEW', 'ACCEPTED', 'REJECTED'],
    UPLOADING: ['SUBMITTED', 'FAILED'],
    WATERMARK_PROCESSING: ['WATERMARK_READY', 'FAILED'],
    WATERMARK_READY: ['DELIVERED'],
  };
  if (!allowed[submission.status].includes(to)) {
    throw new Error(`Invalid submission transition ${submission.status} -> ${to}.`);
  }
  return {
    ...submission,
    ...patch,
    history: [
      ...submission.history,
      {
        actorId,
        at: timestamp(),
        from: submission.status,
        to,
      },
    ],
    status: to,
    updatedAt: timestamp(),
  };
}

function updateRequirement(
  set: WorkflowSet,
  requirement: SharedRequirement,
  notifications: WorkflowNotification[] = [],
) {
  set((state) => ({
    notifications: [...state.notifications, ...notifications],
    requirements: state.requirements.map((item) => (item.requirementId === requirement.requirementId ? requirement : item)),
  }));
}

function updateSubmission(
  set: WorkflowSet,
  submission: SharedSubmission,
  notifications: WorkflowNotification[] = [],
) {
  set((state) => ({
    notifications: [...state.notifications, ...notifications],
    submissions: state.submissions.map((item) => (item.submissionId === submission.submissionId ? submission : item)),
  }));
}

function pushAudit(set: WorkflowSet, event: WorkflowAuditEvent) {
  set((state) => ({ auditEvents: [...state.auditEvents, event] }));
}

function ensureRequirementInReview(requirement: SharedRequirement, tenantId: string) {
  if (requirement.status === 'SUBMITTED' || requirement.status === 'RESUBMITTED') {
    return transitionRequirement(requirement, 'UNDER_TENANT_REVIEW', tenantId, 'Tenant started requirement review.');
  }
  if (requirement.status === 'UNDER_TENANT_REVIEW') {
    return requirement;
  }
  throw new Error(`Cannot review requirement from ${requirement.status}.`);
}

function createUploadSubmissionHistory(workerId: string, at: string): SubmissionHistoryEvent[] {
  return [
    { actorId: workerId, at, to: 'CAPTURING' },
    { actorId: workerId, at, from: 'CAPTURING', to: 'UPLOADING' },
    { actorId: workerId, at, from: 'UPLOADING', to: 'SUBMITTED' },
    { actorId: 'system', at, from: 'SUBMITTED', to: 'AUTO_QC' },
    { actorId: 'system', at, from: 'AUTO_QC', to: 'TENANT_REVIEW' },
  ];
}

function toRequiredMediaKind(dataType: SharedRequirement['dataType']): Task['requiredMedia'][number] {
  if (dataType === 'Video') {
    return 'video';
  }
  if (dataType === 'Audio') {
    return 'audio';
  }
  return 'image';
}

function findRequirement(state: WorkflowStateData, requirementId: string) {
  const requirement = state.requirements.find((item) => item.requirementId === requirementId);
  if (!requirement) {
    throw new Error(`Requirement ${requirementId} was not found.`);
  }
  return requirement;
}

function findProject(state: WorkflowStateData, projectId: string) {
  const project = state.projects.find((item) => item.projectId === projectId);
  if (!project) {
    throw new Error(`Project ${projectId} was not found.`);
  }
  return project;
}

function findTask(state: WorkflowStateData, taskId: string) {
  const task = state.tasks.find((item) => item.taskId === taskId);
  if (!task) {
    throw new Error(`Task ${taskId} was not found.`);
  }
  return task;
}

function findPartnerAllocationByProject(state: WorkflowStateData, projectId: string) {
  const allocation = state.partnerAllocations.find((item) => item.projectId === projectId);
  if (!allocation) {
    throw new Error(`Partner allocation for project ${projectId} was not found.`);
  }
  return allocation;
}

function findDeviceAllocation(state: WorkflowStateData, deviceAllocationId: string) {
  const allocation = state.deviceAllocations.find((item) => item.deviceAllocationId === deviceAllocationId);
  if (!allocation) {
    throw new Error(`Device allocation ${deviceAllocationId} was not found.`);
  }
  return allocation;
}

function findSubmission(state: WorkflowStateData, submissionId: string) {
  const submission = state.submissions.find((item) => item.submissionId === submissionId);
  if (!submission) {
    throw new Error(`Submission ${submissionId} was not found.`);
  }
  return submission;
}

function findDelivery(state: WorkflowStateData, deliveryId: string) {
  const delivery = state.deliveries.find((item) => item.deliveryId === deliveryId);
  if (!delivery) {
    throw new Error(`Delivery ${deliveryId} was not found.`);
  }
  return delivery;
}

function findBuilderDataset(state: WorkflowStateData, datasetId: string) {
  const dataset = state.builderDatasets.find((item) => item.datasetId === datasetId);
  if (!dataset) {
    throw new Error(`Dataset ${datasetId} was not found.`);
  }
  return dataset;
}

function findIdeWorkItem(state: WorkflowStateData, ideWorkItemId: string) {
  const item = state.ideWorkItems.find((candidate) => candidate.ideWorkItemId === ideWorkItemId);
  if (!item) {
    throw new Error(`IDE work item ${ideWorkItemId} was not found.`);
  }
  return item;
}

function normalizeBudget(value: string) {
  const parsed = Number(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed / 10) : 900;
}

function notification(audience: WorkflowNotification['audience'], title: string, body: string): WorkflowNotification {
  return {
    audience,
    body,
    createdAt: timestamp(),
    id: nextId('NOTIF'),
    title,
  };
}

function audit(
  action: string,
  actorId: string,
  detail: string,
  refs: Pick<WorkflowAuditEvent, 'projectId' | 'requirementId' | 'submissionId'> = {},
): WorkflowAuditEvent {
  return {
    ...refs,
    action,
    actorId,
    createdAt: timestamp(),
    detail,
    id: nextId('AUDIT'),
  };
}

function nextId(prefix: string) {
  idCounters[prefix] = (idCounters[prefix] ?? 0) + 1;
  return `${prefix}-${String(idCounters[prefix]).padStart(3, '0')}`;
}

function timestamp() {
  return new Date().toISOString();
}

const idCounters: Record<string, number> = {};

function resetIdCounters() {
  for (const key of Object.keys(idCounters)) {
    delete idCounters[key];
  }
}
