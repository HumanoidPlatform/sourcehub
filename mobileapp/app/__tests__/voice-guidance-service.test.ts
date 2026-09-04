import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  createPositioningService,
  POSITIONING_ALERT_DELAY_MS,
  READY_ENTER_REQUIRED_PASSES,
} from '@/features/capture-guidance/positioning-service';
import type { CameraFrameAnalysis, GuidanceResult } from '@/features/capture-guidance/types';
import { VoiceGuidanceService, type SpeechDriver } from '@/features/capture-guidance/voice-guidance-service';

function createDriver() {
  return {
    speak: jest.fn(),
    stop: jest.fn(() => Promise.resolve()),
  } satisfies SpeechDriver;
}

const baseFrame: CameraFrameAnalysis = {
  focusScore: 0.9,
  lightingScore: 0.9,
  orientation: 'portrait',
  stabilityScore: 0.9,
  subjectBoxRatio: 0.52,
  subjectCenterX: 0.5,
  subjectCenterY: 0.5,
  subjectDetected: true,
  syncReady: true,
  tiltDegrees: 0,
};

function analyzeFrame(frame: CameraFrameAnalysis) {
  return createPositioningService('deterministic_dev_fallback', { alertDelayMs: 0 }).analyzeFrame(frame);
}

function enterReady(service = createPositioningService()) {
  let result: GuidanceResult | null = null;
  for (let index = 0; index < READY_ENTER_REQUIRED_PASSES; index += 1) {
    result = service.analyzeFrame(baseFrame);
  }
  if (!result) {
    throw new Error('Ready frame was not analyzed');
  }
  return { result, service };
}

function exitReadyWithMoveRight(service = createPositioningService()) {
  service.analyzeFrame({ ...baseFrame, subjectCenterX: 0.92, timestampMs: 1000 });
  const result = service.analyzeFrame({ ...baseFrame, subjectCenterX: 0.92, timestampMs: 1000 + POSITIONING_ALERT_DELAY_MS });
  return result;
}

describe('VoiceGuidanceService', () => {
  let driver: SpeechDriver;
  let service: VoiceGuidanceService;

  beforeEach(() => {
    driver = createDriver();
    service = new VoiceGuidanceService(driver);
  });

  it('throttles duplicate speech', async () => {
    const moveRight = analyzeFrame({ ...baseFrame, subjectCenterX: 0.92 });
    await service.speakGuidance(moveRight, { enabled: true, nowMs: 1000 });
    await service.speakGuidance(moveRight, { enabled: true, nowMs: 1800 });
    await service.speakGuidance(moveRight, { enabled: true, nowMs: 5600 });

    expect(driver.speak).toHaveBeenCalledTimes(2);
  });

  it('handles changed corrections sooner and replaces outdated speech', async () => {
    const moveRight = analyzeFrame({ ...baseFrame, subjectCenterX: 0.92 });
    const moveLeft = analyzeFrame({ ...baseFrame, subjectCenterX: 0.08 });
    await service.speakGuidance(moveRight, { enabled: true, nowMs: 1000 });
    await service.speakGuidance(moveLeft, { enabled: true, nowMs: 1900 });

    expect(driver.stop).toHaveBeenCalledTimes(2);
    expect(driver.speak).toHaveBeenCalledTimes(2);
    expect(driver.speak).toHaveBeenLastCalledWith(moveLeft.message, expect.any(Object));
  });

  it('does not speak immediately changed corrections before the changed-correction cooldown', async () => {
    const moveRight = analyzeFrame({ ...baseFrame, subjectCenterX: 0.92 });
    const moveLeft = analyzeFrame({ ...baseFrame, subjectCenterX: 0.08 });
    await service.speakGuidance(moveRight, { enabled: true, nowMs: 1000 });
    await service.speakGuidance(moveLeft, { enabled: true, nowMs: 1200 });

    expect(driver.speak).toHaveBeenCalledTimes(1);
  });

  it('voice-guidance OFF prevents TTS', async () => {
    const moveRight = analyzeFrame({ ...baseFrame, subjectCenterX: 0.92 });
    await service.speakGuidance(moveRight, { enabled: false, nowMs: 1000 });

    expect(driver.speak).not.toHaveBeenCalled();
    expect(driver.stop).toHaveBeenCalledTimes(1);
  });

  it('screen reader mode prevents TTS', async () => {
    const moveRight = analyzeFrame({ ...baseFrame, subjectCenterX: 0.92 });
    await service.speakGuidance(moveRight, { enabled: true, nowMs: 1000, screenReaderEnabled: true });

    expect(driver.speak).not.toHaveBeenCalled();
  });

  it('passes selected locale and exact TTS voice when available', async () => {
    driver = {
      getAvailableVoicesAsync: jest.fn(() =>
        Promise.resolve([
          { identifier: 'voice-en', language: 'en-US', name: 'English', quality: 'Default' },
          { identifier: 'voice-te', language: 'te-IN', name: 'Telugu', quality: 'Default' },
        ]),
      ),
      speak: jest.fn(),
      stop: jest.fn(() => Promise.resolve()),
    } as SpeechDriver;
    service = new VoiceGuidanceService(driver);
    const moveRight = analyzeFrame({ ...baseFrame, subjectCenterX: 0.92 });

    await service.speakGuidance(moveRight, { enabled: true, locale: 'te-IN', nowMs: 1000 });

    expect(driver.speak).toHaveBeenCalledWith(
      'కెమెరాను కొంచెం కుడివైపు కదపండి.',
      expect.objectContaining({ language: 'te-IN', voice: 'voice-te' }),
    );
  });

  it('falls back safely when no requested TTS voice is available', async () => {
    driver = {
      getAvailableVoicesAsync: jest.fn(() =>
        Promise.resolve([{ identifier: 'voice-en', language: 'en-US', name: 'English', quality: 'Default' }]),
      ),
      speak: jest.fn(),
      stop: jest.fn(() => Promise.resolve()),
    } as SpeechDriver;
    service = new VoiceGuidanceService(driver);
    const moveRight = analyzeFrame({ ...baseFrame, subjectCenterX: 0.92 });

    const spoken = await service.speakGuidance(moveRight, { enabled: true, locale: 'te-IN', nowMs: 1000 });

    expect(spoken).toBe(false);
    expect(driver.speak).not.toHaveBeenCalled();
  });

  it('announces ready only on the not-ready to ready transition', async () => {
    const { result: ready, service: positioning } = enterReady();
    const stillReady = positioning.analyzeFrame(baseFrame);

    await service.speakGuidance(ready, { enabled: true, nowMs: 1000 });
    await service.speakGuidance(stillReady, { enabled: true, nowMs: 6000 });

    expect(ready.readiness.transition).toBe('entered_ready');
    expect(stillReady.readiness.transition).toBe('none');
    expect(driver.speak).toHaveBeenCalledTimes(1);
    expect(driver.speak).toHaveBeenLastCalledWith(ready.message, expect.any(Object));
  });

  it('speaks the localized correction immediately when leaving ready', async () => {
    driver = {
      getAvailableVoicesAsync: jest.fn(() =>
        Promise.resolve([
          { identifier: 'voice-en', language: 'en-US', name: 'English', quality: 'Default' },
          { identifier: 'voice-te', language: 'te-IN', name: 'Telugu', quality: 'Default' },
        ]),
      ),
      speak: jest.fn(),
      stop: jest.fn(() => Promise.resolve()),
    } as SpeechDriver;
    service = new VoiceGuidanceService(driver);
    const { result: ready, service: positioning } = enterReady();

    await service.speakGuidance(ready, { enabled: true, locale: 'te-IN', nowMs: 1000 });
    const exitedReady = exitReadyWithMoveRight(positioning);
    await service.speakGuidance(exitedReady, { enabled: true, locale: 'te-IN', nowMs: 1001 });

    expect(exitedReady.readiness.transition).toBe('exited_ready');
    expect(driver.speak).toHaveBeenCalledTimes(2);
    expect(driver.speak).toHaveBeenLastCalledWith(
      'కెమెరాను కొంచెం కుడివైపు కదపండి.',
      expect.objectContaining({ language: 'te-IN', voice: 'voice-te' }),
    );
  });
});
