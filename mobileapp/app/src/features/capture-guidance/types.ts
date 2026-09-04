export type PositionCorrection =
  | 'move_left'
  | 'move_right'
  | 'move_up'
  | 'move_down'
  | 'move_closer'
  | 'move_farther'
  | 'straighten'
  | 'hold_steady'
  | 'improve_light'
  | 'wait_for_focus'
  | 'ready';

export type GuidanceSeverity = 'info' | 'warning' | 'blocking';
export type QcConcept = 'FOCUS' | 'TILT' | 'FRAMING' | 'STEADY' | 'LIGHT' | 'SYNC';
export type QcStatus = 'pass' | 'checking' | 'fail';
export type GuidanceSource = 'deterministic_dev_fallback' | 'native_vision';
export type GuidanceArrow = 'left' | 'right' | 'up' | 'down' | 'closer' | 'farther' | 'straighten' | 'steady' | 'light' | 'focus' | 'ready';
export type PositioningState = 'analyzing' | 'stabilizing' | 'valid' | 'warning_pending' | 'out_of_frame';
export type ReadinessTransition = 'none' | 'entered_ready' | 'exited_ready' | 'changed_correction';

export type QcIndicatorResult = {
  concept: QcConcept;
  detail: string;
  status: QcStatus;
};

export type GuidanceVisual = {
  arrow: GuidanceArrow;
  label: string;
  tone: 'ready' | 'warning' | 'blocking';
};

export type GuidanceReadiness = {
  alertDelayMs: number;
  alertPendingMs: number;
  consecutiveFailures: number;
  currentFramePasses: boolean;
  exitRequiredFailures: number;
  isReady: boolean;
  recentPasses: number;
  requiredPasses: number;
  state: PositioningState;
  transition: ReadinessTransition;
  windowSize: number;
};

export type GuidanceResult = {
  blocksCapture: boolean;
  confidence?: number;
  correction: PositionCorrection;
  message: string;
  positioningState: PositioningState;
  qc: QcIndicatorResult[];
  readiness: GuidanceReadiness;
  severity: GuidanceSeverity;
  source: GuidanceSource;
  visual: GuidanceVisual;
};

export type CameraFrameAnalysis = {
  focusScore?: number;
  lightingScore?: number;
  orientation?: 'portrait' | 'landscape' | 'unknown';
  stabilityScore?: number;
  subjectBoxRatio?: number;
  subjectCenterX?: number;
  subjectCenterY?: number;
  subjectDetected?: boolean;
  syncReady?: boolean;
  tiltDegrees?: number;
  timestampMs?: number;
};

export type PositioningEngineStatus = {
  detail: string;
  engine: GuidanceSource;
  requiresDevelopmentBuild: boolean;
  supportsNativeFrameInference: boolean;
};

export const QC_CONCEPTS: QcConcept[] = ['FOCUS', 'TILT', 'FRAMING', 'STEADY', 'LIGHT', 'SYNC'];

export const CORRECTION_INSTRUCTIONS: Record<PositionCorrection, string> = {
  hold_steady: 'Hold the phone steady.',
  improve_light: 'Move to a brighter area.',
  move_closer: 'Move closer to the target.',
  move_down: 'Lower the camera slightly.',
  move_farther: 'Move slightly farther away.',
  move_left: 'Move the camera slightly to the left.',
  move_right: 'Move the camera slightly to the right.',
  move_up: 'Raise the camera slightly.',
  ready: 'Position looks good. You can start recording.',
  straighten: 'Straighten the phone slightly.',
  wait_for_focus: 'Hold still while the camera focuses.',
};
