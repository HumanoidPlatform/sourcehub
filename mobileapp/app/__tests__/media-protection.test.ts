import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { mockMediaAccessService, resetMockMediaProtectionState } from '@/features/media-protection/media-access-service';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'audit-uuid-1'),
}));

describe('media access protection service', () => {
  beforeEach(() => {
    resetMockMediaProtectionState();
  });

  it('starts a watermark job when a video submission is accepted', async () => {
    const asset = await mockMediaAccessService.registerAcceptedVideo({
      kind: 'video',
      objectKey: 'mock/original/sub-847291.mp4',
      submissionId: 'SUB-847291',
    });

    expect(asset.watermarkStatus).toBe('PROCESSING');
    expect(asset.watermarkText).toBe('Cosaarthi • SUB-847291');
    expect(asset.privateOriginalStored).toBe(true);
    expect('privateOriginalObjectKey' in asset).toBe(false);
  });

  it('switches worker and tenant access to the watermarked derivative when ready', async () => {
    await mockMediaAccessService.registerAcceptedVideo({
      kind: 'video',
      objectKey: 'mock/original/sub-ready.mp4',
      submissionId: 'sub-ready',
    });
    await mockMediaAccessService.setWatermarkStatus('sub-ready', 'READY');

    const workerAsset = await mockMediaAccessService.getProtectedAssetForPersona('sub-ready', 'crowd');
    const tenantAsset = await mockMediaAccessService.getProtectedAssetForPersona('sub-ready', 'tenant');

    expect(workerAsset?.workerVisibleObjectKey).toBe('mock/watermarked/sub-ready.mp4');
    expect(tenantAsset?.tenantVisibleObjectKey).toBe('mock/watermarked/sub-ready.mp4');
    expect(workerAsset?.adminOriginalExportAvailable).toBe(false);
    expect(tenantAsset?.adminOriginalExportAvailable).toBe(false);
    expect('privateOriginalObjectKey' in (workerAsset ?? {})).toBe(false);
    expect('privateOriginalObjectKey' in (tenantAsset ?? {})).toBe(false);
  });

  it('requires an admin reason and creates an audit event for original export', async () => {
    await mockMediaAccessService.registerAcceptedVideo({
      kind: 'video',
      objectKey: 'mock/original/sub-admin.mp4',
      submissionId: 'sub-admin',
    });

    await expect(
      mockMediaAccessService.exportOriginal({
        adminUserId: 'user-platform-admin',
        reason: '   ',
        submissionId: 'sub-admin',
      }),
    ).rejects.toThrow('requires a reason');

    const exportResponse = await mockMediaAccessService.exportOriginal({
      adminUserId: 'user-platform-admin',
      reason: 'Legal evidence hold',
      submissionId: 'sub-admin',
    });
    const auditEvents = await mockMediaAccessService.getAuditEvents();

    expect(exportResponse.exportToken).toContain('mock-original-export:sub-admin');
    expect(exportResponse.auditEvent).toMatchObject({
      action: 'export_original_without_watermark',
      adminUserId: 'user-platform-admin',
      id: 'audit-uuid-1',
      reason: 'Legal evidence hold',
      submissionId: 'sub-admin',
    });
    expect(auditEvents).toHaveLength(1);
  });

  it('handles watermark processing failure without exposing the original', async () => {
    await mockMediaAccessService.registerAcceptedVideo({
      kind: 'video',
      objectKey: 'mock/original/sub-failed.mp4',
      submissionId: 'sub-failed',
    });
    await mockMediaAccessService.setWatermarkStatus('sub-failed', 'FAILED');

    const workerAsset = await mockMediaAccessService.getProtectedAssetForPersona('sub-failed', 'crowd');

    expect(workerAsset?.watermarkStatus).toBe('FAILED');
    expect(workerAsset?.workerVisibleObjectKey).toBeUndefined();
    expect(workerAsset?.message).toContain('playback is blocked');
    expect('privateOriginalObjectKey' in (workerAsset ?? {})).toBe(false);
  });
});
