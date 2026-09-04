import type {
  AuthSession,
  AppealRecord,
  CreateAppealInput,
  CreateAppealResponse,
  CreateSubmissionInput,
  DemoPersona,
  KitCustody,
  LearningModule,
  HomeSummary,
  LoginInput,
  NotificationItem,
  OriginalExportAuditEvent,
  OriginalExportResponse,
  ProtectedMediaAsset,
  SubmissionResponse,
  Task,
  UploadMediaResponse,
  UploadQueueItem,
  WithdrawInput,
  WithdrawResponse,
  WalletSummary,
  Certification,
  Persona,
  SignupInput,
} from '@/types/domain';

export type UploadProgressHandler = (progress: number) => void;

export type OdpApiAdapter = {
  login(input: LoginInput): Promise<AuthSession>;
  signup(input: SignupInput): Promise<AuthSession>;
  switchPersona(persona: Persona): Promise<AuthSession>;
  getCurrentSession(): Promise<AuthSession>;
  logout(refreshToken?: string): Promise<void>;
  getHomeSummary(): Promise<HomeSummary>;
  getAvailableTasks(): Promise<Task[]>;
  getMyTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task>;
  startTask(id: string): Promise<Task>;
  getNotifications(): Promise<NotificationItem[]>;
  markNotificationRead(id: string): Promise<NotificationItem>;
  markAllNotificationsRead(): Promise<NotificationItem[]>;
  getCertifications(): Promise<Certification[]>;
  getLearningModules(): Promise<LearningModule[]>;
  getKitCustody(): Promise<KitCustody>;
  getWallet(): Promise<WalletSummary>;
  withdrawWallet(input: WithdrawInput): Promise<WithdrawResponse>;
  createSubmission(input: CreateSubmissionInput): Promise<SubmissionResponse>;
  getAppeals(): Promise<AppealRecord[]>;
  createAppeal(input: CreateAppealInput): Promise<CreateAppealResponse>;
  acceptSubmission(submissionId: string): Promise<ProtectedMediaAsset>;
  getProtectedMediaAsset(submissionId: string, persona: DemoPersona): Promise<ProtectedMediaAsset | null>;
  exportOriginal(input: { adminUserId: string; reason: string; submissionId: string }): Promise<OriginalExportResponse>;
  getOriginalExportAuditEvents(): Promise<OriginalExportAuditEvent[]>;
  uploadMedia(item: UploadQueueItem, onProgress?: UploadProgressHandler): Promise<UploadMediaResponse>;
};
