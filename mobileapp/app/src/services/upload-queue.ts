import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';

import type { OdpApiAdapter } from '@/api/adapter';
import { useWorkflowStore } from '@/store/workflow-store';
import type {
  CreateUploadQueueItemInput,
  MediaKind,
  MockQcDuplicateStatus,
  PreliminaryContentValidationResult,
  ProtectedMediaAsset,
  UploadMediaResponse,
  UploadQueueItem,
  UploadQueueStatus,
} from '@/types/domain';

const DB_NAME = 'odp_mobile_upload_queue.db';
const MEDIA_DIR = 'cosaarthi-media';

type QueueRow = {
  attempts: number;
  created_at: string;
  duplicate_score: number | null;
  duration_ms: number | null;
  error: string | null;
  file_name: string;
  id: string;
  idempotency_key: string;
  kind: MediaKind;
  local_uri: string;
  mime_type: string;
  original_uri: string | null;
  preliminary_validation_json: string | null;
  preliminary_validation_override: number | null;
  progress: number;
  protected_asset_json: string | null;
  mock_qc_status: MockQcDuplicateStatus | null;
  remote_object_key: string | null;
  result_message: string | null;
  result_status: UploadQueueItem['resultStatus'] | null;
  required_duration_ms: number | null;
  size_bytes: number;
  status: UploadQueueStatus;
  submission_id: string | null;
  task_id: string;
  task_title: string;
  updated_at: string;
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDatabase() {
  dbPromise ??= SQLite.openDatabaseAsync(DB_NAME);
  return dbPromise;
}

export async function initUploadQueue() {
  const db = await getDatabase();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS upload_queue (
      id TEXT PRIMARY KEY NOT NULL,
      task_id TEXT NOT NULL,
      task_title TEXT NOT NULL,
      kind TEXT NOT NULL,
      local_uri TEXT NOT NULL,
      original_uri TEXT,
      file_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL DEFAULT 0,
      duration_ms INTEGER,
      status TEXT NOT NULL,
      progress REAL NOT NULL DEFAULT 0,
      attempts INTEGER NOT NULL DEFAULT 0,
      idempotency_key TEXT NOT NULL UNIQUE,
      error TEXT,
      preliminary_validation_json TEXT,
      preliminary_validation_override INTEGER,
      mock_qc_status TEXT,
      result_status TEXT,
      result_message TEXT,
      duplicate_score REAL,
      remote_object_key TEXT,
      submission_id TEXT,
      protected_asset_json TEXT,
      required_duration_ms INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS upload_queue_status_idx ON upload_queue(status, created_at);
    CREATE INDEX IF NOT EXISTS upload_queue_task_idx ON upload_queue(task_id);
  `);
  await ensureUploadQueueMigrations(db);
  await recoverInterruptedUploads(db);
}

function rowToQueueItem(row: QueueRow): UploadQueueItem {
  return {
    attempts: row.attempts,
    createdAt: row.created_at,
    duplicateScore: row.duplicate_score ?? undefined,
    durationMs: row.duration_ms ?? undefined,
    error: row.error ?? undefined,
    fileName: row.file_name,
    id: row.id,
    idempotencyKey: row.idempotency_key,
    kind: row.kind,
    localUri: row.local_uri,
    mimeType: row.mime_type,
    mockQcStatus: row.mock_qc_status ?? undefined,
    originalUri: row.original_uri ?? undefined,
    preliminaryValidation: parseJson<PreliminaryContentValidationResult>(row.preliminary_validation_json),
    preliminaryValidationOverride: Boolean(row.preliminary_validation_override),
    progress: row.progress,
    protectedAsset: parseJson<ProtectedMediaAsset>(row.protected_asset_json),
    remoteObjectKey: row.remote_object_key ?? undefined,
    requiredDurationMs: row.required_duration_ms ?? undefined,
    resultMessage: row.result_message ?? undefined,
    resultStatus: row.result_status ?? undefined,
    sizeBytes: row.size_bytes,
    status: row.status,
    submissionId: row.submission_id ?? undefined,
    taskId: row.task_id,
    taskTitle: row.task_title,
    updatedAt: row.updated_at,
  };
}

async function ensureUploadQueueMigrations(db: SQLite.SQLiteDatabase) {
  const migrations = [
    'ALTER TABLE upload_queue ADD COLUMN preliminary_validation_json TEXT',
    'ALTER TABLE upload_queue ADD COLUMN preliminary_validation_override INTEGER',
    'ALTER TABLE upload_queue ADD COLUMN mock_qc_status TEXT',
    'ALTER TABLE upload_queue ADD COLUMN submission_id TEXT',
    'ALTER TABLE upload_queue ADD COLUMN protected_asset_json TEXT',
    'ALTER TABLE upload_queue ADD COLUMN required_duration_ms INTEGER',
  ];

  for (const migration of migrations) {
    try {
      await db.runAsync(migration);
    } catch {
      // Expo SQLite lacks ADD COLUMN IF NOT EXISTS; duplicate-column failures are safe here.
    }
  }
}

async function recoverInterruptedUploads(db: SQLite.SQLiteDatabase) {
  await db.runAsync(
    `UPDATE upload_queue
      SET status = 'queued',
        progress = 0,
        error = 'Upload was interrupted. Please retry.',
        updated_at = ?
      WHERE status = 'uploading'
        AND datetime(updated_at) < datetime('now', '-2 minutes')`,
    [new Date().toISOString()],
  );
}

function parseJson<T>(value: string | null) {
  if (!value) {
    return undefined;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

function serializeJson(value: unknown) {
  return value ? JSON.stringify(value) : null;
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
}

function inferFileName(uri: string, kind: MediaKind) {
  const path = uri.split('?')[0] ?? uri;
  const lastSegment = path.split('/').filter(Boolean).at(-1);
  if (lastSegment) {
    return sanitizeFileName(lastSegment);
  }
  const extension = kind === 'image' ? 'jpg' : kind === 'video' ? 'mp4' : 'm4a';
  return `${kind}-${Date.now()}.${extension}`;
}

function inferMimeType(kind: MediaKind, fileName: string) {
  const lower = fileName.toLowerCase();
  if (kind === 'image') {
    return lower.endsWith('.png') ? 'image/png' : 'image/jpeg';
  }
  if (kind === 'video') {
    return lower.endsWith('.mov') ? 'video/quicktime' : 'video/mp4';
  }
  return 'audio/m4a';
}

function validateMedia(kind: MediaKind, sizeBytes: number, durationMs?: number, requiredDurationMs?: number) {
  const maxBytes = kind === 'video' ? 250 * 1024 * 1024 : kind === 'audio' ? 50 * 1024 * 1024 : 25 * 1024 * 1024;
  const maxDuration = kind === 'video' ? 10 * 60_000 : kind === 'audio' ? 180_000 : undefined;

  if (sizeBytes > maxBytes) {
    throw new Error(`${kind} file is too large for the V1 mobile uploader.`);
  }
  if (maxDuration && durationMs && durationMs > maxDuration) {
    throw new Error(`${kind} capture is longer than the V1 limit.`);
  }
  if (kind === 'video' && requiredDurationMs && durationMs && durationMs < requiredDurationMs) {
    throw new Error(`video capture is shorter than the required ${Math.round(requiredDurationMs / 60_000)} minute duration.`);
  }
}

async function copyMediaToDocumentDirectory(uri: string, id: string, fileName: string) {
  if (!FileSystem.documentDirectory || !uri.startsWith('file://')) {
    return uri;
  }

  const directory = `${FileSystem.documentDirectory}${MEDIA_DIR}/`;
  const destination = `${directory}${id}-${sanitizeFileName(fileName)}`;

  try {
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    await FileSystem.copyAsync({ from: uri, to: destination });
    return destination;
  } catch {
    return uri;
  }
}

export async function listUploadQueueItems() {
  await initUploadQueue();
  const db = await getDatabase();
  const rows = await db.getAllAsync<QueueRow>(
    'SELECT * FROM upload_queue ORDER BY datetime(created_at) DESC',
  );
  return rows.map(rowToQueueItem);
}

export async function getUploadQueueItem(id: string) {
  await initUploadQueue();
  const db = await getDatabase();
  const row = await db.getFirstAsync<QueueRow>('SELECT * FROM upload_queue WHERE id = ?', [id]);
  return row ? rowToQueueItem(row) : null;
}

export async function createUploadQueueItem(input: CreateUploadQueueItemInput) {
  await initUploadQueue();
  const id = Crypto.randomUUID();
  const idempotencyKey = Crypto.randomUUID();
  const fileName = sanitizeFileName(input.fileName ?? inferFileName(input.uri, input.kind));
  const mimeType = input.mimeType ?? inferMimeType(input.kind, fileName);
  const info = await FileSystem.getInfoAsync(input.uri);
  const sizeBytes = input.sizeBytes ?? (info.exists && 'size' in info ? info.size ?? 0 : 0);

  validateMedia(input.kind, sizeBytes, input.durationMs, input.requiredDurationMs);

  const localUri = await copyMediaToDocumentDirectory(input.uri, id, fileName);
  const createdAt = new Date().toISOString();
  const db = await getDatabase();

  await db.runAsync(
    `INSERT INTO upload_queue (
      id, task_id, task_title, kind, local_uri, original_uri, file_name, mime_type, size_bytes,
      duration_ms, required_duration_ms, status, progress, attempts, idempotency_key, mock_qc_status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued', 0, 0, ?, 'NOT_CHECKED', ?, ?)`,
    [
      id,
      input.taskId,
      input.taskTitle,
      input.kind,
      localUri,
      input.uri,
      fileName,
      mimeType,
      sizeBytes,
      input.durationMs ?? null,
      input.requiredDurationMs ?? null,
      idempotencyKey,
      createdAt,
      createdAt,
    ],
  );

  const item = await getUploadQueueItem(id);
  if (!item) {
    throw new Error('Upload queue insert failed');
  }
  return item;
}

async function patchUploadQueueItem(
  id: string,
  patch: Partial<
    Pick<
      UploadQueueItem,
      | 'attempts'
      | 'duplicateScore'
      | 'error'
      | 'progress'
      | 'protectedAsset'
      | 'remoteObjectKey'
      | 'resultMessage'
      | 'resultStatus'
      | 'status'
      | 'submissionId'
      | 'preliminaryValidation'
      | 'preliminaryValidationOverride'
      | 'mockQcStatus'
    >
  >,
) {
  const db = await getDatabase();
  const current = await getUploadQueueItem(id);
  if (!current) {
    return null;
  }

  const updated = {
    attempts: hasPatch(patch, 'attempts') ? patch.attempts ?? current.attempts : current.attempts,
    duplicateScore: hasPatch(patch, 'duplicateScore') ? patch.duplicateScore ?? null : current.duplicateScore ?? null,
    error: hasPatch(patch, 'error') ? patch.error ?? null : current.error ?? null,
    progress: hasPatch(patch, 'progress') ? patch.progress ?? current.progress : current.progress,
    preliminaryValidation: hasPatch(patch, 'preliminaryValidation') ? patch.preliminaryValidation : current.preliminaryValidation,
    preliminaryValidationOverride: hasPatch(patch, 'preliminaryValidationOverride')
      ? patch.preliminaryValidationOverride ?? false
      : current.preliminaryValidationOverride ?? false,
    mockQcStatus: hasPatch(patch, 'mockQcStatus') ? patch.mockQcStatus ?? 'NOT_CHECKED' : current.mockQcStatus ?? 'NOT_CHECKED',
    protectedAsset: hasPatch(patch, 'protectedAsset') ? patch.protectedAsset : current.protectedAsset,
    remoteObjectKey: hasPatch(patch, 'remoteObjectKey') ? patch.remoteObjectKey ?? null : current.remoteObjectKey ?? null,
    resultMessage: hasPatch(patch, 'resultMessage') ? patch.resultMessage ?? null : current.resultMessage ?? null,
    resultStatus: hasPatch(patch, 'resultStatus') ? patch.resultStatus ?? null : current.resultStatus ?? null,
    status: hasPatch(patch, 'status') ? patch.status ?? current.status : current.status,
    submissionId: hasPatch(patch, 'submissionId') ? patch.submissionId ?? null : current.submissionId ?? null,
    updatedAt: new Date().toISOString(),
  };

  await db.runAsync(
    `UPDATE upload_queue
      SET status = ?, progress = ?, attempts = ?, error = ?, result_status = ?, result_message = ?,
        duplicate_score = ?, remote_object_key = ?, preliminary_validation_json = ?,
        preliminary_validation_override = ?, mock_qc_status = ?, submission_id = ?, protected_asset_json = ?, updated_at = ?
      WHERE id = ?`,
    [
      updated.status,
      updated.progress,
      updated.attempts,
      updated.error,
      updated.resultStatus,
      updated.resultMessage,
      updated.duplicateScore,
      updated.remoteObjectKey,
      serializeJson(updated.preliminaryValidation),
      updated.preliminaryValidationOverride ? 1 : 0,
      updated.mockQcStatus,
      updated.submissionId,
      serializeJson(updated.protectedAsset),
      updated.updatedAt,
      id,
    ],
  );

  return getUploadQueueItem(id);
}

export async function retryUploadQueueItem(id: string) {
  return patchUploadQueueItem(id, {
    duplicateScore: undefined,
    error: undefined,
    mockQcStatus: 'NOT_CHECKED',
    progress: 0,
    protectedAsset: undefined,
    remoteObjectKey: undefined,
    resultMessage: undefined,
    resultStatus: undefined,
    status: 'queued',
    submissionId: undefined,
  });
}

export async function saveUploadQueueItemValidation(
  id: string,
  preliminaryValidation: PreliminaryContentValidationResult,
  options: { override?: boolean } = {},
) {
  return patchUploadQueueItem(id, {
    error: undefined,
    preliminaryValidation,
    preliminaryValidationOverride: options.override ?? false,
    status: 'queued',
  });
}

export async function allowUncertainUploadQueueItem(id: string) {
  const item = await getUploadQueueItem(id);
  if (!item?.preliminaryValidation || item.preliminaryValidation.status !== 'UNCERTAIN') {
    return item;
  }
  return patchUploadQueueItem(id, {
    error: undefined,
    preliminaryValidation: item.preliminaryValidation,
    preliminaryValidationOverride: true,
    status: 'queued',
  });
}

function toQueueCompletion(result: UploadMediaResponse, submissionId?: string): Partial<UploadQueueItem> {
  if (result.status === 'failed') {
    return {
      error: result.message,
      progress: 1,
      resultMessage: result.message,
      resultStatus: result.status,
      status: 'failed',
      submissionId: undefined,
    };
  }

  return {
    duplicateScore: result.duplicateScore,
    error: undefined,
    mockQcStatus: result.mockQcStatus ?? 'NOT_CHECKED',
    progress: 1,
    preliminaryValidation: result.preliminaryValidation,
    protectedAsset: result.protectedAsset,
    remoteObjectKey: result.objectKey,
    resultMessage: result.message,
    resultStatus: result.status,
    submissionId: submissionId ?? result.submissionId,
    status: 'uploaded',
  };
}

export async function processUploadQueueItem(id: string, api: OdpApiAdapter) {
  const item = await getUploadQueueItem(id);
  if (
    !item ||
    item.status === 'uploading' ||
    item.status === 'uploaded'
  ) {
    return item;
  }

  if (
    item.kind === 'video' &&
    (!item.preliminaryValidation ||
      item.preliminaryValidation.status === 'MISMATCH' ||
      (item.preliminaryValidation.status === 'UNCERTAIN' && !item.preliminaryValidationOverride))
  ) {
    return patchUploadQueueItem(id, {
      error: 'Video must pass preliminary content validation before upload.',
      progress: 0,
      status: 'failed',
    });
  }

  const uploading = await patchUploadQueueItem(id, {
    attempts: item.attempts + 1,
    error: undefined,
    progress: 0.02,
    status: 'uploading',
  });

  if (!uploading) {
    return null;
  }

  let progressPatch = Promise.resolve<UploadQueueItem | null>(uploading);

  try {
    const result = await api.uploadMedia(uploading, (progress) => {
      if (progress >= 1) {
        return;
      }
      progressPatch = progressPatch.then(() => patchUploadQueueItem(id, { progress, status: 'uploading' }));
    });
    await progressPatch;
    const submission = result.status === 'failed' ? null : useWorkflowStore.getState().recordSubmissionFromUpload(uploading, result);
    return patchUploadQueueItem(id, toQueueCompletion(result, submission?.submissionId));
  } catch (error) {
    return patchUploadQueueItem(id, {
      error: error instanceof Error ? error.message : 'Upload failed',
      progress: 0,
      status: 'failed',
    });
  }
}

function hasPatch<T extends object, K extends keyof T>(patch: T, key: K) {
  return Object.prototype.hasOwnProperty.call(patch, key);
}

export async function processUploadQueue(
  api: OdpApiAdapter,
  options: { limit?: number; shouldContinue?: () => boolean } = {},
) {
  await initUploadQueue();
  const db = await getDatabase();
  const rows = await db.getAllAsync<QueueRow>(
    `SELECT * FROM upload_queue
      WHERE status = 'queued'
      ORDER BY datetime(created_at) ASC
      LIMIT ?`,
    [options.limit ?? 2],
  );

  for (const row of rows) {
    if (options.shouldContinue && !options.shouldContinue()) {
      break;
    }
    await processUploadQueueItem(row.id, api);
  }
}
