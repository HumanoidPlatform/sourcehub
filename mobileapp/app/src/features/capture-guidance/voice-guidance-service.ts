import * as Speech from 'expo-speech';

import { CORRECTION_INSTRUCTIONS, type GuidanceResult, type PositionCorrection } from './types';
import { getLocalizedCorrectionInstruction } from '@/features/localization/strings';

export type VoiceGuidanceOptions = {
  changedCorrectionCooldownMs?: number;
  cooldownMs?: number;
  enabled: boolean;
  locale?: string;
  nowMs?: number;
  screenReaderEnabled?: boolean;
};

export type SpeechDriver = {
  getAvailableVoicesAsync?: () => Promise<Speech.Voice[]>;
  speak: (text: string, options?: Speech.SpeechOptions) => void;
  stop: () => Promise<void>;
};

export type VoiceGuidanceSnapshot = {
  lastSpokenAt: number;
  lastSpokenCorrection: PositionCorrection | null;
};

const DEFAULT_COOLDOWN_MS = 4500;
const DEFAULT_CHANGED_CORRECTION_COOLDOWN_MS = 800;

export class VoiceGuidanceService {
  private lastSpokenAt = 0;
  private lastSpokenCorrection: PositionCorrection | null = null;

  constructor(
    private readonly driver: SpeechDriver = Speech,
    private readonly clock: () => number = Date.now,
  ) {}

  getSnapshot(): VoiceGuidanceSnapshot {
    return {
      lastSpokenAt: this.lastSpokenAt,
      lastSpokenCorrection: this.lastSpokenCorrection,
    };
  }

  reset() {
    this.lastSpokenAt = 0;
    this.lastSpokenCorrection = null;
  }

  async stop() {
    await this.driver.stop();
  }

  async speakGuidance(result: GuidanceResult, options: VoiceGuidanceOptions) {
    const enabled = options.enabled && !options.screenReaderEnabled;
    if (!enabled) {
      await this.driver.stop();
      return false;
    }

    const now = options.nowMs ?? this.clock();
    const cooldownMs = options.cooldownMs ?? DEFAULT_COOLDOWN_MS;
    const changedCorrectionCooldownMs = options.changedCorrectionCooldownMs ?? DEFAULT_CHANGED_CORRECTION_COOLDOWN_MS;
    const readinessTransition = result.readiness.transition;
    const forceTransitionSpeech = readinessTransition === 'entered_ready' || readinessTransition === 'exited_ready';

    if (result.readiness.state === 'warning_pending') {
      return false;
    }

    if (result.correction === 'ready' && readinessTransition !== 'entered_ready') {
      return false;
    }

    const correctionChanged = this.lastSpokenCorrection !== result.correction;
    const elapsed = now - this.lastSpokenAt;
    const minimumDelay = forceTransitionSpeech ? 0 : correctionChanged ? changedCorrectionCooldownMs : cooldownMs;

    if (this.lastSpokenCorrection && elapsed < minimumDelay) {
      return false;
    }

    let stoppedStaleSpeech = false;
    if (forceTransitionSpeech && correctionChanged && this.lastSpokenCorrection) {
      await this.driver.stop();
      stoppedStaleSpeech = true;
    }

    const voiceOptions = await this.resolveVoiceOptions(options.locale);
    if (options.locale && !voiceOptions) {
      return false;
    }

    if (!stoppedStaleSpeech) {
      await this.driver.stop();
    }
    this.driver.speak(getSpokenInstruction(result, options.locale), {
      ...voiceOptions,
      pitch: 1,
      rate: 0.94,
      useApplicationAudioSession: false,
    });
    this.lastSpokenAt = now;
    this.lastSpokenCorrection = result.correction;
    return true;
  }

  private async resolveVoiceOptions(locale?: string): Promise<Speech.SpeechOptions | null> {
    if (!locale) {
      return {};
    }
    if (!this.driver.getAvailableVoicesAsync) {
      return { language: locale };
    }

    try {
      const voices = await this.driver.getAvailableVoicesAsync();
      if (!voices.length) {
        return null;
      }
      const normalizedLocale = locale.toLowerCase();
      const languageCode = normalizedLocale.split('-')[0];
      const exact = voices.find((voice) => voice.language.toLowerCase() === normalizedLocale);
      const sameLanguage = voices.find((voice) => voice.language.toLowerCase().split('-')[0] === languageCode);
      const selectedVoice = exact ?? sameLanguage;
      if (!selectedVoice) {
        return null;
      }
      return {
        language: selectedVoice.language,
        voice: selectedVoice.identifier,
      };
    } catch {
      return { language: locale };
    }
  }
}

export function getSpokenInstruction(result: GuidanceResult, locale?: string) {
  const languageCode = locale?.split('-')[0];
  return languageCode ? getLocalizedCorrectionInstruction(result.correction, languageCode) : result.message || CORRECTION_INSTRUCTIONS[result.correction];
}

export const voiceGuidanceService = new VoiceGuidanceService();
