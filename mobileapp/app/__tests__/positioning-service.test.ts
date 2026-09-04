import { describe, expect, it } from '@jest/globals';

import {
  createPositioningService,
  getCaptureGate,
  getVisualGuidance,
  POSITIONING_ALERT_DELAY_MS,
  READY_ENTER_REQUIRED_PASSES,
} from '@/features/capture-guidance/positioning-service';
import type { CameraFrameAnalysis, GuidanceResult } from '@/features/capture-guidance/types';
import { getSpokenInstruction } from '@/features/capture-guidance/voice-guidance-service';

const readyFrame: CameraFrameAnalysis = {
  focusScore: 0.86,
  lightingScore: 0.86,
  orientation: 'portrait',
  stabilityScore: 0.86,
  subjectBoxRatio: 0.52,
  subjectCenterX: 0.5,
  subjectCenterY: 0.5,
  subjectDetected: true,
  syncReady: true,
  tiltDegrees: 1,
};

function analyzeMany(frame: CameraFrameAnalysis, count: number, service = createPositioningService()) {
  let result: GuidanceResult | null = null;
  for (let index = 0; index < count; index += 1) {
    result = service.analyzeFrame(frame);
  }
  if (!result) {
    throw new Error('No frames analyzed');
  }
  return { result, service };
}

function enterReady() {
  return analyzeMany(readyFrame, READY_ENTER_REQUIRED_PASSES);
}

function frameAt(timestampMs: number, frame: CameraFrameAnalysis = readyFrame): CameraFrameAnalysis {
  return { ...frame, timestampMs };
}

function createImmediateAlertService() {
  return createPositioningService('deterministic_dev_fallback', { alertDelayMs: 0 });
}

describe('positioningService', () => {
  it('detects move-left guidance', () => {
    const service = createImmediateAlertService();
    const result = service.analyzeFrame({ ...readyFrame, subjectCenterX: 0.12 });
    expect(result.correction).toBe('move_left');
    expect(result.blocksCapture).toBe(true);
  });

  it('detects move-right guidance', () => {
    const service = createImmediateAlertService();
    const result = service.analyzeFrame({ ...readyFrame, subjectCenterX: 0.9 });
    expect(result.correction).toBe('move_right');
  });

  it('detects move-up guidance', () => {
    const service = createImmediateAlertService();
    const result = service.analyzeFrame({ ...readyFrame, subjectCenterY: 0.1 });
    expect(result.correction).toBe('move_up');
  });

  it('detects move-down guidance', () => {
    const service = createImmediateAlertService();
    const result = service.analyzeFrame({ ...readyFrame, subjectCenterY: 0.9 });
    expect(result.correction).toBe('move_down');
  });

  it('detects move-closer guidance', () => {
    const service = createImmediateAlertService();
    const result = service.analyzeFrame({ ...readyFrame, subjectBoxRatio: 0.1 });
    expect(result.correction).toBe('move_closer');
  });

  it('detects move-farther guidance', () => {
    const service = createImmediateAlertService();
    const result = service.analyzeFrame({ ...readyFrame, subjectBoxRatio: 0.98 });
    expect(result.correction).toBe('move_farther');
  });

  it('detects tilt guidance', () => {
    const service = createImmediateAlertService();
    const result = service.analyzeFrame({ ...readyFrame, tiltDegrees: 18 });
    expect(result.correction).toBe('straighten');
  });

  it('detects stability guidance', () => {
    const service = createImmediateAlertService();
    const result = service.analyzeFrame({ ...readyFrame, stabilityScore: 0.1 });
    expect(result.correction).toBe('hold_steady');
  });

  it('detects poor lighting guidance', () => {
    const service = createImmediateAlertService();
    const result = service.analyzeFrame({ ...readyFrame, lightingScore: 0.1 });
    expect(result.correction).toBe('improve_light');
  });

  it('detects focus guidance', () => {
    const service = createImmediateAlertService();
    const result = service.analyzeFrame({ ...readyFrame, focusScore: 0.1 });
    expect(result.correction).toBe('wait_for_focus');
  });

  it('enters ready only after enough recent valid frames', () => {
    const service = createPositioningService();
    const beforeReady = analyzeMany(readyFrame, READY_ENTER_REQUIRED_PASSES - 1, service).result;
    expect(beforeReady.correction).toBe('hold_steady');
    expect(beforeReady.readiness.state).toBe('stabilizing');
    expect(getCaptureGate(beforeReady).disabled).toBe(true);

    const ready = service.analyzeFrame(readyFrame);
    expect(ready.correction).toBe('ready');
    expect(ready.readiness.state).toBe('valid');
    expect(ready.readiness.transition).toBe('entered_ready');
    expect(getCaptureGate(ready).disabled).toBe(false);
  });

  it('movement under tolerance does not alert', () => {
    const { service } = enterReady();
    const result = service.analyzeFrame({ ...readyFrame, subjectCenterX: 0.63, timestampMs: 1000 });

    expect(result.correction).toBe('ready');
    expect(result.readiness.state).toBe('valid');
    expect(result.readiness.alertPendingMs).toBe(0);
    expect(result.readiness.isReady).toBe(true);
  });

  it('out-of-frame for less than 5 seconds does not alert', () => {
    const { service } = enterReady();
    const outOfFrame = { ...readyFrame, subjectCenterX: 0.92 };

    service.analyzeFrame(frameAt(1000, outOfFrame));
    const result = service.analyzeFrame(frameAt(1000 + POSITIONING_ALERT_DELAY_MS - 1, outOfFrame));

    expect(result.correction).toBe('ready');
    expect(result.readiness.state).toBe('warning_pending');
    expect(result.readiness.alertPendingMs).toBe(POSITIONING_ALERT_DELAY_MS - 1);
    expect(result.readiness.isReady).toBe(true);
    expect(getCaptureGate(result).disabled).toBe(false);
  });

  it('out-of-frame for 5 continuous seconds triggers an alert', () => {
    const { service } = enterReady();
    const outOfFrame = { ...readyFrame, subjectCenterX: 0.92 };

    service.analyzeFrame(frameAt(1000, outOfFrame));
    const result = service.analyzeFrame(frameAt(1000 + POSITIONING_ALERT_DELAY_MS, outOfFrame));

    expect(result.correction).toBe('move_right');
    expect(result.readiness.state).toBe('out_of_frame');
    expect(result.readiness.transition).toBe('exited_ready');
    expect(result.readiness.isReady).toBe(false);
    expect(getCaptureGate(result).disabled).toBe(true);
  });

  it('returning before 5 seconds resets the pending timer', () => {
    const { service } = enterReady();

    service.analyzeFrame(frameAt(1000, { ...readyFrame, subjectCenterX: 0.92 }));
    const recovered = service.analyzeFrame(frameAt(4000, readyFrame));

    expect(recovered.correction).toBe('ready');
    expect(recovered.readiness.state).toBe('valid');
    expect(recovered.readiness.alertPendingMs).toBe(0);
  });

  it('returning after alert restores valid state', () => {
    const { service } = enterReady();

    service.analyzeFrame(frameAt(1000, { ...readyFrame, subjectCenterX: 0.92 }));
    const alerted = service.analyzeFrame(frameAt(1000 + POSITIONING_ALERT_DELAY_MS, { ...readyFrame, subjectCenterX: 0.92 }));
    const recovered = analyzeMany(readyFrame, READY_ENTER_REQUIRED_PASSES, service).result;

    expect(alerted.readiness.state).toBe('out_of_frame');
    expect(recovered.correction).toBe('ready');
    expect(recovered.readiness.state).toBe('valid');
    expect(recovered.readiness.isReady).toBe(true);
  });

  it('uses hysteresis to keep ready through minor threshold noise', () => {
    const { service } = enterReady();

    const result = analyzeMany({ ...readyFrame, subjectCenterX: 0.68, tiltDegrees: 6 }, 6, service).result;

    expect(result.correction).toBe('ready');
    expect(result.readiness.isReady).toBe(true);
    expect(result.readiness.consecutiveFailures).toBe(0);
  });

  it('uses the same guidance result for spoken and visual guidance', () => {
    const service = createImmediateAlertService();
    const result = service.analyzeFrame({ ...readyFrame, subjectCenterX: 0.92 });
    expect(getSpokenInstruction(result)).toBe(result.message);
    expect(getVisualGuidance(result)).toBe(result.visual);
  });

  it('keeps readiness logic independent from language selection', () => {
    const service = createImmediateAlertService();
    const result = service.analyzeFrame({ ...readyFrame, subjectCenterX: 0.92 });

    expect(result.correction).toBe('move_right');
    expect(getSpokenInstruction(result, 'te-IN')).toBe('కెమెరాను కొంచెం కుడివైపు కదపండి.');
    expect(result.correction).toBe('move_right');
    expect(result.readiness.isReady).toBe(false);
  });

  it('continues analyzing frames after entering ready', () => {
    const { service } = enterReady();
    const beforeMove = service.getSnapshot();

    service.analyzeFrame(frameAt(1000, { ...readyFrame, subjectCenterX: 0.92 }));
    const result = service.analyzeFrame(frameAt(1000 + POSITIONING_ALERT_DELAY_MS, { ...readyFrame, subjectCenterX: 0.92 }));
    const afterMove = service.getSnapshot();

    expect(afterMove.framesAnalyzed).toBeGreaterThan(beforeMove.framesAnalyzed);
    expect(result.correction).toBe('move_right');
    expect(result.readiness.isReady).toBe(false);
  });

  it('chooses the highest-priority correction first', () => {
    const service = createImmediateAlertService();
    const result = service.analyzeFrame({
      ...readyFrame,
      stabilityScore: 0.1,
      subjectBoxRatio: 0.1,
      tiltDegrees: 18,
    });

    expect(result.correction).toBe('move_closer');
  });
});
