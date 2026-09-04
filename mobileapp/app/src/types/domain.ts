export type Persona =
  | 'platform'
  | 'client'
  | 'tenant'
  | 'aggregator'
  | 'qa'
  | 'partner'
  | 'sponsor'
  | 'crowd'
  | 'ide'
  | 'builder';
export type DemoPersona = Persona;

export type Permission =
  | 'platform:read'
  | 'client:read'
  | 'aggregator:read'
  | 'qa:read'
  | 'qa:review'
  | 'partner:read'
  | 'sponsor:read'
  | 'ide:read'
  | 'builder:read'
  | 'tenant:read'
  | 'work:read'
  | 'task:start'
  | 'media:capture'
  | 'submission:create'
  | 'upload:create'
  | 'wallet:read'
  | 'wallet:withdraw'
  | 'profile:update'
  | 'rfp:award'
  | 'project:publish'
  | 'escalation:update'
  | 'supply:commit'
  | 'kit:allocate'
  | 'delivery:accept';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  locale: string;
  persona: Persona;
  availablePersonas: Persona[];
  entity: {
    id: string;
    name: string;
    type: 'crowd_pool' | 'partner' | 'aggregator' | 'tenant' | 'client' | 'sponsor' | 'builder' | 'platform' | 'qa' | 'ide';
  };
  tenant: {
    id: string;
    name: string;
  };
  permissions: Permission[];
  certificationIds: string[];
};

export type AuthSession = {
  accessToken: string;
  authMode: 'demo' | 'real';
  refreshToken: string;
  expiresAt: string;
  sessionVersion: number;
  user: AuthUser;
};

export type UserLanguagePreferences = {
  languageCode: string;
  regionCode: string;
  locale: string;
};

export type LoginInput = {
  email: string;
  password: string;
  persona?: DemoPersona;
  workerCode?: string;
};

export type SignupInput = {
  confirmPassword: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone: string;
  termsAccepted: boolean;
};

export type TaskDifficulty = 'starter' | 'standard' | 'advanced';
export type TaskStatus = 'available' | 'reserved' | 'in_progress' | 'submitted' | 'approved';
export type MediaKind = 'image' | 'video' | 'audio';
export type WorkType = 'capture' | 'annotation' | 'transcription' | 'survey' | 'sxs';

export type ContentValidationStatus = 'MATCH' | 'UNCERTAIN' | 'MISMATCH';
export type MockQcDuplicateStatus = 'NOT_CHECKED' | 'CLEAR' | 'POSSIBLE_DUPLICATE' | 'CONFIRMED_DUPLICATE';

export type PreliminaryContentValidationResult = {
  checkedAt: string;
  confidence: number;
  frameSampleCount: number;
  mocked: boolean;
  provider: 'mock' | 'real';
  reason: string;
  requirementSummary: string;
  status: ContentValidationStatus;
};

export type WatermarkStatus = 'NOT_REQUIRED' | 'PROCESSING' | 'READY' | 'FAILED';

export type ProtectedMediaAsset = {
  adminOriginalExportAvailable: boolean;
  kind: MediaKind;
  message: string;
  privateOriginalStored: boolean;
  submissionId: string;
  tenantVisibleObjectKey?: string;
  watermarkStatus: WatermarkStatus;
  watermarkText?: string;
  watermarkedObjectKey?: string;
  workerVisibleObjectKey?: string;
};

export type OriginalExportAuditEvent = {
  action: 'export_original_without_watermark';
  adminUserId: string;
  id: string;
  reason: string;
  submissionId: string;
  timestamp: string;
};

export type OriginalExportResponse = {
  auditEvent: OriginalExportAuditEvent;
  expiresAt: string;
  exportToken: string;
  submissionId: string;
};

export type ReadinessCheckId =
  | 'device_attestation'
  | 'consent'
  | 'geofence'
  | 'certification'
  | 'kit_sync'
  | 'battery'
  | 'storage';

export type ReadinessCheck = {
  id: ReadinessCheckId;
  label: string;
  mandatory: boolean;
  status: 'pass' | 'warning' | 'fail';
  detail: string;
};

export type EdgePipelineState = {
  id: string;
  label: string;
  status: 'idle' | 'ready' | 'processing' | 'attention';
  detail: string;
};

export type Task = {
  id: string;
  title: string;
  category?: string;
  project: string;
  campaignId?: string;
  location: string;
  pay: number;
  currency: 'INR' | 'USD';
  estimatedMinutes: number;
  difficulty: TaskDifficulty;
  status: TaskStatus;
  taskType: WorkType;
  progress: number;
  requiredMedia: MediaKind[];
  requiredUploadCount?: number;
  allowedFileTypes?: string[];
  storageBucket?: string;
  requiredDurationMs?: number;
  certificationRequired?: string;
  distanceKm?: number;
  slotsRemaining: number;
  dueAt: string;
  checklist: string[];
  description: string;
  qualityBar: string;
};

export type TodayStats = {
  clipsCompleted: number;
  labelsCompleted: number;
  unitsCompleted: number;
  earnings: number;
};

export type HomeSummary = {
  availableCount: number;
  activeCount: number;
  queuedUploads: number;
  todayEarnings: number;
  todayStats: TodayStats;
  nextAction: string;
  readiness: ReadinessCheck[];
  edgePipeline: EdgePipelineState[];
};

export type UploadQueueStatus =
  | 'queued'
  | 'uploading'
  | 'uploaded'
  | 'failed';

export type UploadResultStatus =
  | 'accepted'
  | 'duplicate'
  | 'possible_duplicate'
  | 'processing'
  | 'rejected'
  | 'failed';

export type UploadQueueItem = {
  id: string;
  taskId: string;
  taskTitle: string;
  kind: MediaKind;
  localUri: string;
  originalUri?: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  durationMs?: number;
  requiredDurationMs?: number;
  status: UploadQueueStatus;
  progress: number;
  attempts: number;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
  error?: string;
  preliminaryValidation?: PreliminaryContentValidationResult;
  preliminaryValidationOverride?: boolean;
  mockQcStatus?: MockQcDuplicateStatus;
  resultStatus?: UploadResultStatus;
  resultMessage?: string;
  duplicateScore?: number;
  remoteObjectKey?: string;
  protectedAsset?: ProtectedMediaAsset;
  submissionId?: string;
};

export type CreateUploadQueueItemInput = {
  taskId: string;
  taskTitle: string;
  kind: MediaKind;
  uri: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  durationMs?: number;
  requiredDurationMs?: number;
};

export type UploadMediaResponse = {
  status: UploadResultStatus;
  message: string;
  duplicateScore?: number;
  mockQcStatus?: MockQcDuplicateStatus;
  objectKey?: string;
  preliminaryValidation?: PreliminaryContentValidationResult;
  protectedAsset?: ProtectedMediaAsset;
  submissionId: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  tone: 'info' | 'warning' | 'success';
  deepLink?: string;
};

export type Certification = {
  id: string;
  title: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'certified' | 'expires_soon';
  expiresAt?: string;
};

export type LearningModule = {
  id: string;
  title: string;
  required: boolean;
  minutes: number;
  progress: number;
  certificationId?: string;
};

export type WalletSummary = {
  balance: number;
  pending: number;
  lifetime: number;
  currency: 'INR' | 'USD';
  weekEarnings: number;
  byJobType: {
    label: string;
    amount: number;
  }[];
  withdrawals: {
    id: string;
    amount: number;
    status: 'processing' | 'settled' | 'failed';
    createdAt: string;
  }[];
  ledger: {
    id: string;
    label: string;
    amount: number;
    status: 'pending' | 'settled';
    createdAt: string;
  }[];
};

export type DeviceRecord = {
  id: string;
  assetId: string;
  name: string;
  model: string;
  firmware: string;
  battery: number;
  health: 'good' | 'warning' | 'service_required';
  syncStatus: 'synced' | 'pending' | 'offline';
  timeSyncOffsetMs: number;
  connection: 'ble' | 'wifi_direct' | 'uwb' | 'usb_c' | 'not_connected';
};

export type KitCustody = {
  kitId: string;
  kitName: string;
  custodyStatus: 'assigned' | 'accepted' | 'service_required';
  acceptedAt?: string;
  warnings: string[];
  devices: DeviceRecord[];
};

export type SubmissionType = 'capture' | 'annotation' | 'transcription' | 'survey' | 'sxs';

export type CreateSubmissionInput = {
  projectId?: string;
  campaignId?: string;
  taskId: string;
  type: SubmissionType;
  payloadRef: string;
  meta: Record<string, unknown>;
  idempotencyKey: string;
};

export type SubmissionStatus =
  | 'queued'
  | 'uploading'
  | 'uploaded'
  | 'processing'
  | 'accepted'
  | 'rejected'
  | 'failed'
  | 'duplicate'
  | 'possible_duplicate';

export type SubmissionResponse = {
  submissionId: string;
  status: SubmissionStatus;
  message: string;
};

export type WithdrawInput = {
  amount: number;
};

export type WithdrawResponse = {
  withdrawalId: string;
  status: 'processing' | 'failed';
  message: string;
};

export type AppealState = 'open' | 'with_qa' | 'upheld' | 'rejected';

export type AppealRecord = {
  id: string;
  submissionId: string;
  ground: string;
  state: AppealState;
  createdAt: string;
};

export type CreateAppealInput = {
  submissionId: string;
  ground: string;
};

export type CreateAppealResponse = {
  appealId: string;
  state: AppealState;
  message: string;
};
