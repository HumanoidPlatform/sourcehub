import type { ReadinessCheck } from '@/types/domain';

export function getReadinessBlocker(checks: ReadinessCheck[] = []) {
  return checks.find((check) => check.mandatory && check.status === 'fail') ?? null;
}

export function isCaptureReady(checks: ReadinessCheck[] = []) {
  return !getReadinessBlocker(checks);
}
