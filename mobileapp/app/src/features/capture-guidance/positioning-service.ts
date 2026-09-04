import {
  CORRECTION_INSTRUCTIONS,
  type CameraFrameAnalysis,
  type GuidanceReadiness,
  type GuidanceResult,
  type GuidanceSeverity,
  type GuidanceSource,
  type GuidanceVisual,
  type PositionCorrection,
  type PositioningEngineStatus,
  type PositioningState,
  type QcConcept,
  type QcIndicatorResult,
  type ReadinessTransition,
} from './types';

const CENTER_MIN = 0.42;
const CENTER_MAX = 0.58;
const SUBJECT_MIN_RATIO = 0.34;
const SUBJECT_MAX_RATIO = 0.76;
const TILT_WARN_DEGREES = 5;
const TILT_BLOCK_DEGREES = 12;
const STABILITY_MIN = 0.62;
const FOCUS_MIN = 0.62;
const LIGHT_MIN = 0.5;

const READY_EXIT_CENTER_MIN = 0.38;
const READY_EXIT_CENTER_MAX = 0.62;
const READY_EXIT_SUBJECT_MIN_RATIO = 0.3;
const READY_EXIT_SUBJECT_MAX_RATIO = 0.82;
const READY_EXIT_TILT_DEGREES = 7;
const READY_EXIT_STABILITY_MIN = 0.54;
const READY_EXIT_FOCUS_MIN = 0.54;
const READY_EXIT_LIGHT_MIN = 0.42;

const OUT_OF_FRAME_CENTER_MIN = 0.22;
const OUT_OF_FRAME_CENTER_MAX = 0.78;
const OUT_OF_FRAME_SUBJECT_MIN_RATIO = 0.2;
const OUT_OF_FRAME_SUBJECT_MAX_RATIO = 0.92;
const OUT_OF_FRAME_TILT_DEGREES = 14;
const OUT_OF_FRAME_STABILITY_MIN = 0.32;
const OUT_OF_FRAME_FOCUS_MIN = 0.32;
const OUT_OF_FRAME_LIGHT_MIN = 0.26;

export const READY_WINDOW_SIZE = 10;
export const READY_ENTER_REQUIRED_PASSES = 8;
export const READY_EXIT_REQUIRED_FAILURES = 3;
export const POSITIONING_ALERT_DELAY_MS = 5000;

type Candidate = {
  blocksCapture: boolean;
  confidence: number;
  correction: PositionCorrection;
  priority: number;
  severity: GuidanceSeverity;
};

type Thresholds = {
  centerMax: number;
  centerMin: number;
  focusMin: number;
  lightMin: number;
  stabilityMin: number;
  subjectMaxRatio: number;
  subjectMinRatio: number;
  tiltMaxDegrees: number;
};

type FrameEvaluation = {
  candidate: Candidate;
  currentFramePasses: boolean;
  qc: QcIndicatorResult[];
};

export type PositioningReadinessConfig = {
  alertDelayMs?: number;
  readyEnterRequiredPasses?: number;
  readyExitRequiredFailures?: number;
  readyWindowSize?: number;
};

export type PositioningSnapshot = {
  alertPendingMs: number;
  consecutiveFailures: number;
  framesAnalyzed: number;
  lastCorrection: PositionCorrection | null;
  recentPasses: number;
  state: PositioningState;
  windowSize: number;
};

export type PositioningService = {
  analyzeFrame: (analysis: CameraFrameAnalysis) => GuidanceResult;
  getEngineStatus: () => PositioningEngineStatus;
  getSnapshot: () => PositioningSnapshot;
  reset: () => void;
};

const enterThresholds: Thresholds = {
  centerMax: CENTER_MAX,
  centerMin: CENTER_MIN,
  focusMin: FOCUS_MIN,
  lightMin: LIGHT_MIN,
  stabilityMin: STABILITY_MIN,
  subjectMaxRatio: SUBJECT_MAX_RATIO,
  subjectMinRatio: SUBJECT_MIN_RATIO,
  tiltMaxDegrees: TILT_WARN_DEGREES,
};

const readyExitThresholds: Thresholds = {
  centerMax: READY_EXIT_CENTER_MAX,
  centerMin: READY_EXIT_CENTER_MIN,
  focusMin: READY_EXIT_FOCUS_MIN,
  lightMin: READY_EXIT_LIGHT_MIN,
  stabilityMin: READY_EXIT_STABILITY_MIN,
  subjectMaxRatio: READY_EXIT_SUBJECT_MAX_RATIO,
  subjectMinRatio: READY_EXIT_SUBJECT_MIN_RATIO,
  tiltMaxDegrees: READY_EXIT_TILT_DEGREES,
};

const outOfFrameThresholds: Thresholds = {
  centerMax: OUT_OF_FRAME_CENTER_MAX,
  centerMin: OUT_OF_FRAME_CENTER_MIN,
  focusMin: OUT_OF_FRAME_FOCUS_MIN,
  lightMin: OUT_OF_FRAME_LIGHT_MIN,
  stabilityMin: OUT_OF_FRAME_STABILITY_MIN,
  subjectMaxRatio: OUT_OF_FRAME_SUBJECT_MAX_RATIO,
  subjectMinRatio: OUT_OF_FRAME_SUBJECT_MIN_RATIO,
  tiltMaxDegrees: OUT_OF_FRAME_TILT_DEGREES,
};

const visualByCorrection: Record<PositionCorrection, GuidanceVisual> = {
  hold_steady: { arrow: 'steady', label: 'Hold steady', tone: 'warning' },
  improve_light: { arrow: 'light', label: 'Improve light', tone: 'warning' },
  move_closer: { arrow: 'closer', label: 'Move closer', tone: 'blocking' },
  move_down: { arrow: 'down', label: 'Lower camera', tone: 'warning' },
  move_farther: { arrow: 'farther', label: 'Move farther', tone: 'blocking' },
  move_left: { arrow: 'left', label: 'Move left', tone: 'warning' },
  move_right: { arrow: 'right', label: 'Move right', tone: 'warning' },
  move_up: { arrow: 'up', label: 'Raise camera', tone: 'warning' },
  ready: { arrow: 'ready', label: 'Ready', tone: 'ready' },
  straighten: { arrow: 'straighten', label: 'Straighten', tone: 'warning' },
  wait_for_focus: { arrow: 'focus', label: 'Wait for focus', tone: 'warning' },
};

const nativeUnavailableStatus: PositioningEngineStatus = {
  detail:
    'Expo Go CameraView does not expose frame processors for MediaPipe inference. Real MediaPipe/Core ML/TFLite guidance needs a development build with a native frame processor module.',
  engine: 'deterministic_dev_fallback',
  requiresDevelopmentBuild: true,
  supportsNativeFrameInference: false,
};

export function createPositioningService(
  source: GuidanceSource = 'deterministic_dev_fallback',
  config: PositioningReadinessConfig = {},
): PositioningService {
  const readyWindowSize = config.readyWindowSize ?? READY_WINDOW_SIZE;
  const readyEnterRequiredPasses = config.readyEnterRequiredPasses ?? READY_ENTER_REQUIRED_PASSES;
  const readyExitRequiredFailures = config.readyExitRequiredFailures ?? READY_EXIT_REQUIRED_FAILURES;
  const alertDelayMs = config.alertDelayMs ?? POSITIONING_ALERT_DELAY_MS;
  let state: PositioningState = 'analyzing';
  let recentPassWindow: boolean[] = [];
  let consecutiveFailures = 0;
  let outOfFrameSinceMs: number | null = null;
  let hasEstablishedValidPosition = false;
  let lastCorrection: PositionCorrection | null = null;
  let framesAnalyzed = 0;

  function reset() {
    state = 'analyzing';
    recentPassWindow = [];
    consecutiveFailures = 0;
    outOfFrameSinceMs = null;
    hasEstablishedValidPosition = false;
    lastCorrection = null;
    framesAnalyzed = 0;
  }

  return {
    analyzeFrame(analysis) {
      framesAnalyzed += 1;
      const previousState = state;
      const previousReady = previousState === 'valid' || (previousState === 'warning_pending' && hasEstablishedValidPosition);
      const timestampMs = analysis.timestampMs ?? Date.now();
      const enterEvaluation = evaluateFrame(analysis, enterThresholds);
      const safeReturnEvaluation = evaluateFrame(analysis, readyExitThresholds);
      const outOfFrameEvaluation = evaluateFrame(analysis, outOfFrameThresholds);

      recentPassWindow = [...recentPassWindow, enterEvaluation.currentFramePasses].slice(-readyWindowSize);
      const recentPasses = recentPassWindow.filter(Boolean).length;
      const hasEnoughSamples = recentPassWindow.length >= readyEnterRequiredPasses;
      const canEnterReady = hasEnoughSamples && recentPasses >= readyEnterRequiredPasses;

      let candidate = enterEvaluation.candidate;
      let qc = enterEvaluation.qc;
      let alertPendingMs = outOfFrameSinceMs ? Math.max(0, timestampMs - outOfFrameSinceMs) : 0;

      if (hasEstablishedValidPosition) {
        if (outOfFrameEvaluation.currentFramePasses || safeReturnEvaluation.currentFramePasses) {
          consecutiveFailures = 0;
          outOfFrameSinceMs = null;
          alertPendingMs = 0;
          state = 'valid';
          candidate = readyCandidate(confidenceFromPasses(recentPasses, recentPassWindow.length));
          qc = outOfFrameEvaluation.currentFramePasses ? outOfFrameEvaluation.qc : safeReturnEvaluation.qc;
        } else {
          consecutiveFailures += 1;
          outOfFrameSinceMs ??= timestampMs;
          alertPendingMs = Math.max(0, timestampMs - outOfFrameSinceMs);
          if (alertPendingMs >= alertDelayMs) {
            state = 'out_of_frame';
            hasEstablishedValidPosition = false;
            candidate = outOfFrameEvaluation.candidate;
            qc = outOfFrameEvaluation.qc;
          } else {
            state = 'warning_pending';
            candidate = readyCandidate(0.84);
            qc = softenFailures(outOfFrameEvaluation.qc);
          }
        }
      } else if (canEnterReady) {
        consecutiveFailures = 0;
        outOfFrameSinceMs = null;
        alertPendingMs = 0;
        state = 'valid';
        hasEstablishedValidPosition = true;
        candidate = readyCandidate(confidenceFromPasses(recentPasses, recentPassWindow.length));
        qc = enterEvaluation.qc;
      } else if (enterEvaluation.currentFramePasses) {
        consecutiveFailures = 0;
        outOfFrameSinceMs = null;
        alertPendingMs = 0;
        state = 'stabilizing';
        candidate = stabilizingCandidate(recentPasses, readyEnterRequiredPasses);
        qc = enterEvaluation.qc;
      } else if (!outOfFrameEvaluation.currentFramePasses) {
        consecutiveFailures += 1;
        outOfFrameSinceMs ??= timestampMs;
        alertPendingMs = Math.max(0, timestampMs - outOfFrameSinceMs);
        if (alertPendingMs >= alertDelayMs) {
          state = 'out_of_frame';
          candidate = outOfFrameEvaluation.candidate;
          qc = outOfFrameEvaluation.qc;
        } else {
          state = 'warning_pending';
          candidate = stabilizingCandidate(recentPasses, readyEnterRequiredPasses);
          qc = softenFailures(outOfFrameEvaluation.qc);
        }
      } else {
        consecutiveFailures = 0;
        outOfFrameSinceMs = null;
        alertPendingMs = 0;
        state = 'stabilizing';
        candidate = stabilizingCandidate(recentPasses, readyEnterRequiredPasses);
        qc = softenFailures(enterEvaluation.qc);
      }

      const isReady = state === 'valid' || (state === 'warning_pending' && hasEstablishedValidPosition);
      const transition = getTransition(previousReady, isReady, lastCorrection, candidate.correction);
      const readiness: GuidanceReadiness = {
        alertDelayMs,
        alertPendingMs,
        consecutiveFailures,
        currentFramePasses: enterEvaluation.currentFramePasses,
        exitRequiredFailures: readyExitRequiredFailures,
        isReady,
        recentPasses,
        requiredPasses: readyEnterRequiredPasses,
        state,
        transition,
        windowSize: readyWindowSize,
      };
      const result = createGuidanceResult(candidate, qc, source, readiness);
      lastCorrection = result.correction;
      return result;
    },
    getEngineStatus() {
      return nativeUnavailableStatus;
    },
    getSnapshot() {
      return {
        consecutiveFailures,
        alertPendingMs: outOfFrameSinceMs ? Math.max(0, Date.now() - outOfFrameSinceMs) : 0,
        framesAnalyzed,
        lastCorrection,
        recentPasses: recentPassWindow.filter(Boolean).length,
        state,
        windowSize: readyWindowSize,
      };
    },
    reset,
  };
}

export const positioningService = createPositioningService();

export function getCaptureGate(result: GuidanceResult) {
  return {
    disabled: !result.readiness.isReady || result.blocksCapture,
    reason: result.readiness.isReady ? 'Positioning checks passed.' : result.message,
  };
}

export function getVisualGuidance(result: GuidanceResult) {
  return result.visual;
}

function evaluateFrame(analysis: CameraFrameAnalysis, thresholds: Thresholds): FrameEvaluation {
  const candidate = chooseCandidate(analysis, thresholds);
  return {
    candidate,
    currentFramePasses: candidate.correction === 'ready',
    qc: buildQcIndicators(analysis, thresholds),
  };
}

function chooseCandidate(analysis: CameraFrameAnalysis, thresholds: Thresholds): Candidate {
  const subjectDetected = analysis.subjectDetected ?? true;
  const subjectBoxRatio = analysis.subjectBoxRatio ?? 0.52;
  const centerX = analysis.subjectCenterX ?? 0.5;
  const centerY = analysis.subjectCenterY ?? 0.5;
  const tiltDegrees = Math.abs(analysis.tiltDegrees ?? 0);
  const stabilityScore = analysis.stabilityScore ?? 0.82;
  const focusScore = analysis.focusScore ?? 0.82;
  const lightingScore = analysis.lightingScore ?? 0.82;
  const orientation = analysis.orientation ?? 'portrait';
  const syncReady = analysis.syncReady ?? true;
  const candidates: Candidate[] = [];

  if (!subjectDetected) {
    candidates.push(blocking('move_farther', 1, 0.94));
  }
  if (subjectBoxRatio < thresholds.subjectMinRatio) {
    candidates.push(blocking('move_closer', 2, confidenceFromGap(thresholds.subjectMinRatio - subjectBoxRatio)));
  }
  if (subjectBoxRatio > thresholds.subjectMaxRatio) {
    candidates.push(blocking('move_farther', 2, confidenceFromGap(subjectBoxRatio - thresholds.subjectMaxRatio)));
  }
  if (centerX < thresholds.centerMin) {
    candidates.push(warning('move_left', 3, confidenceFromGap(thresholds.centerMin - centerX)));
  }
  if (centerX > thresholds.centerMax) {
    candidates.push(warning('move_right', 3, confidenceFromGap(centerX - thresholds.centerMax)));
  }
  if (centerY < thresholds.centerMin) {
    candidates.push(warning('move_up', 3, confidenceFromGap(thresholds.centerMin - centerY)));
  }
  if (centerY > thresholds.centerMax) {
    candidates.push(warning('move_down', 3, confidenceFromGap(centerY - thresholds.centerMax)));
  }
  if (orientation !== 'portrait' || tiltDegrees > thresholds.tiltMaxDegrees) {
    candidates.push({
      blocksCapture: true,
      confidence: confidenceFromGap(tiltDegrees / 20),
      correction: 'straighten',
      priority: 4,
      severity: tiltDegrees > TILT_BLOCK_DEGREES || orientation !== 'portrait' ? 'blocking' : 'warning',
    });
  }
  if (stabilityScore < thresholds.stabilityMin) {
    candidates.push(warning('hold_steady', 5, 1 - stabilityScore));
  }
  if (focusScore < thresholds.focusMin) {
    candidates.push(warning('wait_for_focus', 6, 1 - focusScore));
  }
  if (lightingScore < thresholds.lightMin) {
    candidates.push(warning('improve_light', 7, 1 - lightingScore));
  }
  if (!syncReady) {
    candidates.push(warning('wait_for_focus', 8, 0.58));
  }

  candidates.sort((a, b) => a.priority - b.priority || b.confidence - a.confidence);
  return candidates[0] ?? readyCandidate();
}

function createGuidanceResult(
  candidate: Candidate,
  qc: QcIndicatorResult[],
  source: GuidanceSource,
  readiness: GuidanceReadiness,
): GuidanceResult {
  const visual = {
    ...visualByCorrection[candidate.correction],
    tone: candidate.severity === 'blocking' ? 'blocking' : visualByCorrection[candidate.correction].tone,
  };
  return {
    blocksCapture: candidate.blocksCapture,
    confidence: clamp(candidate.confidence),
    correction: candidate.correction,
    message: CORRECTION_INSTRUCTIONS[candidate.correction],
    positioningState: readiness.state,
    qc,
    readiness,
    severity: candidate.severity,
    source,
    visual,
  };
}

function buildQcIndicators(analysis: CameraFrameAnalysis, thresholds: Thresholds): QcIndicatorResult[] {
  const tiltDegrees = Math.abs(analysis.tiltDegrees ?? 0);
  const subjectDetected = analysis.subjectDetected ?? true;
  const centerX = analysis.subjectCenterX ?? 0.5;
  const centerY = analysis.subjectCenterY ?? 0.5;
  const subjectBoxRatio = analysis.subjectBoxRatio ?? 0.52;
  const orientation = analysis.orientation ?? 'portrait';
  const syncReady = analysis.syncReady ?? true;
  const framingPass =
    subjectDetected &&
    centerX >= thresholds.centerMin &&
    centerX <= thresholds.centerMax &&
    centerY >= thresholds.centerMin &&
    centerY <= thresholds.centerMax &&
    subjectBoxRatio >= thresholds.subjectMinRatio &&
    subjectBoxRatio <= thresholds.subjectMaxRatio;

  return [
    indicator('FOCUS', analysis.focusScore ?? 0.82, thresholds.focusMin, 'Focus lock'),
    {
      concept: 'TILT',
      detail: `${Math.round(tiltDegrees)} degree tilt`,
      status: orientation === 'portrait' && tiltDegrees <= thresholds.tiltMaxDegrees ? 'pass' : 'fail',
    },
    {
      concept: 'FRAMING',
      detail: subjectDetected ? 'Subject inside guide' : 'Subject not detected',
      status: framingPass ? 'pass' : 'fail',
    },
    indicator('STEADY', analysis.stabilityScore ?? 0.82, thresholds.stabilityMin, 'Device stability'),
    indicator('LIGHT', analysis.lightingScore ?? 0.82, thresholds.lightMin, 'Scene lighting'),
    {
      concept: 'SYNC',
      detail: syncReady ? 'Local analysis synced' : 'Frame sync warming up',
      status: syncReady ? 'pass' : 'fail',
    },
  ];
}

function indicator(concept: QcConcept, score: number, minimum: number, label: string): QcIndicatorResult {
  return {
    concept,
    detail: `${label} ${Math.round(score * 100)}%`,
    status: score >= minimum ? 'pass' : 'fail',
  };
}

function softenFailures(qc: QcIndicatorResult[]) {
  return qc.map((indicatorResult) =>
    indicatorResult.status === 'fail' ? { ...indicatorResult, status: 'checking' as const } : indicatorResult,
  );
}

function getTransition(
  previousReady: boolean,
  nextReady: boolean,
  lastCorrection: PositionCorrection | null,
  nextCorrection: PositionCorrection,
): ReadinessTransition {
  if (!previousReady && nextReady) {
    return 'entered_ready';
  }
  if (previousReady && !nextReady) {
    return 'exited_ready';
  }
  if (lastCorrection && lastCorrection !== nextCorrection) {
    return 'changed_correction';
  }
  return 'none';
}

function readyCandidate(confidence = 0.98): Candidate {
  return {
    blocksCapture: false,
    confidence,
    correction: 'ready',
    priority: 99,
    severity: 'info',
  };
}

function stabilizingCandidate(recentPasses: number, requiredPasses: number): Candidate {
  return {
    blocksCapture: true,
    confidence: clamp(0.62 + recentPasses / Math.max(requiredPasses, 1) * 0.24),
    correction: 'hold_steady',
    priority: 90,
    severity: 'warning',
  };
}

function blocking(correction: PositionCorrection, priority: number, confidence: number): Candidate {
  return {
    blocksCapture: true,
    confidence,
    correction,
    priority,
    severity: 'blocking',
  };
}

function warning(correction: PositionCorrection, priority: number, confidence: number): Candidate {
  return {
    blocksCapture: true,
    confidence,
    correction,
    priority,
    severity: 'warning',
  };
}

function confidenceFromPasses(recentPasses: number, sampleCount: number) {
  return clamp(0.82 + recentPasses / Math.max(sampleCount, 1) * 0.17);
}

function confidenceFromGap(gap: number) {
  return clamp(0.62 + gap * 2.4);
}

function clamp(value: number) {
  return Math.max(0, Math.min(0.99, value));
}
