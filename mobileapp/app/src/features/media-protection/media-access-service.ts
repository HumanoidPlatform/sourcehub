import * as Crypto from 'expo-crypto';

import type {
  DemoPersona,
  MediaKind,
  OriginalExportAuditEvent,
  OriginalExportResponse,
  ProtectedMediaAsset,
  WatermarkStatus,
} from '@/types/domain';

type InternalProtectedAsset = ProtectedMediaAsset & {
  privateOriginalObjectKey: string;
};

type RegisterAcceptedVideoInput = {
  kind: MediaKind;
  objectKey: string;
  submissionId: string;
};

type ExportOriginalInput = {
  adminUserId: string;
  reason: string;
  submissionId: string;
};

export type MediaAccessService = {
  exportOriginal(input: ExportOriginalInput): Promise<OriginalExportResponse>;
  getAuditEvents(): Promise<OriginalExportAuditEvent[]>;
  getProtectedAssetForPersona(submissionId: string, persona: DemoPersona): Promise<ProtectedMediaAsset | null>;
  registerAcceptedVideo(input: RegisterAcceptedVideoInput): Promise<ProtectedMediaAsset>;
  setWatermarkStatus(submissionId: string, status: Exclude<WatermarkStatus, 'NOT_REQUIRED'>): Promise<ProtectedMediaAsset | null>;
};

const protectedAssets = new Map<string, InternalProtectedAsset>();
const auditEvents: OriginalExportAuditEvent[] = [];

export const mockMediaAccessService: MediaAccessService = {
  async registerAcceptedVideo(input) {
    const watermarkText = `Cosaarthi • ${input.submissionId}`;
    const asset: InternalProtectedAsset = {
      adminOriginalExportAvailable: true,
      kind: input.kind,
      message: 'Mock server-side watermark job created. The clean original remains in private master storage.',
      privateOriginalObjectKey: input.objectKey,
      privateOriginalStored: true,
      submissionId: input.submissionId,
      watermarkStatus: 'PROCESSING',
      watermarkText,
    };
    protectedAssets.set(input.submissionId, asset);
    return toClientAsset(asset);
  },

  async setWatermarkStatus(submissionId, status) {
    const asset = protectedAssets.get(submissionId);
    if (!asset) {
      return null;
    }
    const watermarkedObjectKey =
      status === 'READY' ? `mock/watermarked/${submissionId}.mp4` : asset.watermarkedObjectKey;
    const next: InternalProtectedAsset = {
      ...asset,
      message:
        status === 'READY'
          ? 'Watermarked derivative is ready. Worker and tenant access use the derivative only.'
          : status === 'FAILED'
            ? 'Mock watermark processing failed. Clean original remains private and worker/tenant playback is blocked.'
            : 'Mock server-side watermark job is still processing.',
      tenantVisibleObjectKey: status === 'READY' ? watermarkedObjectKey : undefined,
      watermarkStatus: status,
      watermarkedObjectKey,
      workerVisibleObjectKey: status === 'READY' ? watermarkedObjectKey : undefined,
    };
    protectedAssets.set(submissionId, next);
    return toClientAsset(next);
  },

  async getProtectedAssetForPersona(submissionId, persona) {
    const asset = protectedAssets.get(submissionId);
    if (!asset) {
      return null;
    }
    if (persona === 'platform') {
      return toClientAsset(asset);
    }
    return toClientAsset({
      ...asset,
      adminOriginalExportAvailable: false,
    });
  },

  async exportOriginal(input) {
    const reason = input.reason.trim();
    if (!reason) {
      throw new Error('Admin original export requires a reason.');
    }
    const asset = protectedAssets.get(input.submissionId);
    if (!asset) {
      throw new Error('Protected submission was not found.');
    }

    const auditEvent: OriginalExportAuditEvent = {
      action: 'export_original_without_watermark',
      adminUserId: input.adminUserId,
      id: Crypto.randomUUID(),
      reason,
      submissionId: input.submissionId,
      timestamp: new Date().toISOString(),
    };
    auditEvents.push(auditEvent);

    return {
      auditEvent,
      expiresAt: new Date(Date.now() + 1000 * 60 * 5).toISOString(),
      exportToken: `mock-original-export:${input.submissionId}:${auditEvent.id}`,
      submissionId: input.submissionId,
    };
  },

  async getAuditEvents() {
    return [...auditEvents];
  },
};

export function resetMockMediaProtectionState() {
  protectedAssets.clear();
  auditEvents.length = 0;
}

function toClientAsset(asset: InternalProtectedAsset): ProtectedMediaAsset {
  return {
    adminOriginalExportAvailable: asset.adminOriginalExportAvailable,
    kind: asset.kind,
    message: asset.message,
    privateOriginalStored: true,
    submissionId: asset.submissionId,
    tenantVisibleObjectKey: asset.tenantVisibleObjectKey,
    watermarkStatus: asset.watermarkStatus,
    watermarkText: asset.watermarkText,
    watermarkedObjectKey: asset.watermarkedObjectKey,
    workerVisibleObjectKey: asset.workerVisibleObjectKey,
  };
}
