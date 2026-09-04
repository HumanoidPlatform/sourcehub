import { describe, expect, it } from '@jest/globals';

import { getReadinessBlocker, isCaptureReady } from '@/features/readiness/readiness';
import type { ReadinessCheck } from '@/types/domain';

const checks: ReadinessCheck[] = [
  {
    detail: 'Attested',
    id: 'device_attestation',
    label: 'Device attestation',
    mandatory: true,
    status: 'pass',
  },
  {
    detail: 'Too little storage',
    id: 'storage',
    label: 'Available storage',
    mandatory: true,
    status: 'fail',
  },
];

describe('readiness gate', () => {
  it('blocks capture when a mandatory check fails', () => {
    expect(isCaptureReady(checks)).toBe(false);
    expect(getReadinessBlocker(checks)?.id).toBe('storage');
  });

  it('allows capture when only optional checks warn', () => {
    expect(
      isCaptureReady([
        {
          detail: 'Signal is weak',
          id: 'kit_sync',
          label: 'Kit sync',
          mandatory: false,
          status: 'warning',
        },
      ]),
    ).toBe(true);
  });
});
