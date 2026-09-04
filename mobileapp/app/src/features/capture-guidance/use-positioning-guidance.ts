import { AccessibilityInfo, AppState, type AppStateStatus } from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';

import { createDeterministicFallbackFrame, fallbackFrameCount } from './dev-fallback';
import { createPositioningService, getCaptureGate, type PositioningService } from './positioning-service';
import type { GuidanceResult } from './types';
import { voiceGuidanceService } from './voice-guidance-service';

import { getLocalizedCorrectionInstruction } from '@/features/localization/strings';
import { useGuidanceSettingsStore } from '@/store/guidance-settings-store';
import { useLocalizationStore } from '@/store/localization-store';

type UsePositioningGuidanceInput = {
  active: boolean;
};

const POSITIONING_ANALYSIS_INTERVAL_MS = 650;

function createInitialGuidanceResult() {
  const service = createPositioningService();
  return service.analyzeFrame(createDeterministicFallbackFrame(0));
}

export function usePositioningGuidance({ active }: UsePositioningGuidanceInput) {
  const voiceGuidanceEnabled = useGuidanceSettingsStore((state) => state.voiceGuidanceEnabled);
  const locale = useLocalizationStore((state) => state.preference?.locale);
  const languageCode = useLocalizationStore((state) => state.preference?.languageCode);
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [result, setResult] = useState<GuidanceResult>(createInitialGuidanceResult);
  const [runtime] = useState<{ engineStatus: ReturnType<PositioningService['getEngineStatus']>; service: PositioningService }>(() => {
    const service = createPositioningService();
    return {
      engineStatus: service.getEngineStatus(),
      service,
    };
  });
  const stepRef = useRef(0);
  const speechOptionsRef = useRef({
    locale,
    screenReaderEnabled,
    voiceGuidanceEnabled,
  });

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setScreenReaderEnabled).catch(() => setScreenReaderEnabled(false));
    const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReaderEnabled);
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    speechOptionsRef.current = {
      locale,
      screenReaderEnabled,
      voiceGuidanceEnabled,
    };
  }, [locale, screenReaderEnabled, voiceGuidanceEnabled]);

  useEffect(() => {
    const { service } = runtime;

    const analysisActive = active && appState === 'active';
    if (!analysisActive) {
      service.reset();
      void voiceGuidanceService.stop();
      return undefined;
    }

    service.reset();
    stepRef.current = 0;
    const analyzeNextFrame = () => {
      const nextResult = service.analyzeFrame(createDeterministicFallbackFrame(stepRef.current));
      setResult(nextResult);
      const speechOptions = speechOptionsRef.current;
      void voiceGuidanceService.speakGuidance(nextResult, {
        enabled: speechOptions.voiceGuidanceEnabled,
        locale: speechOptions.locale,
        screenReaderEnabled: speechOptions.screenReaderEnabled,
      });
    };

    analyzeNextFrame();
    const interval = setInterval(() => {
      stepRef.current = (stepRef.current + 1) % fallbackFrameCount;
      analyzeNextFrame();
    }, POSITIONING_ANALYSIS_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      service.reset();
      void voiceGuidanceService.stop();
    };
  }, [active, appState, runtime]);

  const captureGate = useMemo(() => {
    const gate = getCaptureGate(result);
    return {
      ...gate,
      reason: result.readiness.isReady ? getLocalizedCorrectionInstruction('ready', languageCode) : getLocalizedCorrectionInstruction(result.correction, languageCode),
    };
  }, [languageCode, result]);

  return {
    captureGate,
    engineStatus: runtime.engineStatus,
    result,
  };
}
