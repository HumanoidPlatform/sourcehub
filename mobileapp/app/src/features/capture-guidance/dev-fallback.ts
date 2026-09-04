import type { CameraFrameAnalysis } from './types';

const alignedFrame: CameraFrameAnalysis = {
  focusScore: 0.88,
  lightingScore: 0.86,
  orientation: 'portrait',
  stabilityScore: 0.88,
  subjectBoxRatio: 0.52,
  subjectCenterX: 0.5,
  subjectCenterY: 0.5,
  subjectDetected: true,
  syncReady: true,
  tiltDegrees: 1,
};

const fallbackFrames: CameraFrameAnalysis[] = [
  {
    focusScore: 0.84,
    lightingScore: 0.82,
    stabilityScore: 0.82,
    subjectBoxRatio: 0.5,
    subjectCenterX: 0.31,
    subjectCenterY: 0.5,
    subjectDetected: true,
    syncReady: true,
    tiltDegrees: 1,
  },
  {
    focusScore: 0.84,
    lightingScore: 0.8,
    stabilityScore: 0.82,
    subjectBoxRatio: 0.28,
    subjectCenterX: 0.5,
    subjectCenterY: 0.5,
    subjectDetected: true,
    syncReady: true,
    tiltDegrees: 2,
  },
  {
    focusScore: 0.82,
    lightingScore: 0.79,
    stabilityScore: 0.82,
    subjectBoxRatio: 0.5,
    subjectCenterX: 0.5,
    subjectCenterY: 0.5,
    subjectDetected: true,
    syncReady: true,
    tiltDegrees: 8,
  },
  {
    focusScore: 0.78,
    lightingScore: 0.78,
    stabilityScore: 0.44,
    subjectBoxRatio: 0.5,
    subjectCenterX: 0.5,
    subjectCenterY: 0.5,
    subjectDetected: true,
    syncReady: true,
    tiltDegrees: 2,
  },
  ...Array.from({ length: 10 }, (_, index) => ({
    ...alignedFrame,
    focusScore: 0.78 + Math.min(index, 4) * 0.025,
    lightingScore: 0.78 + Math.min(index, 4) * 0.02,
    stabilityScore: 0.74 + Math.min(index, 4) * 0.035,
  })),
  ...Array.from({ length: 3 }, () => ({
    ...alignedFrame,
    subjectCenterX: 0.74,
  })),
  ...Array.from({ length: 10 }, () => alignedFrame),
];

export const fallbackFrameCount = fallbackFrames.length;

export function createDeterministicFallbackFrame(step: number): CameraFrameAnalysis {
  const index = Math.max(step, 0) % fallbackFrames.length;
  return {
    ...fallbackFrames[index],
    timestampMs: Date.now(),
  };
}
