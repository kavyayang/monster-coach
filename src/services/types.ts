// Mirror of backend Pydantic schemas from back/shemas.py
// Only the fields consumed by the frontend are declared.

export interface RawKeypoint {
  x: number;
  y: number;
  confidence: number;
}

export interface JointAngles {
  knee_angle: number | null;
  hip_angle: number | null;
  trunk_angle: number | null;
  trunk_forward_lean: number | null;
}

export interface QualityAssessment {
  quality_score: number;
  errors: string[];
  warnings: string[];
}

export type HRSafetyStatus = 'normal' | 'reduce_intensity' | 'stop';

export interface HeartRateSafety {
  status: HRSafetyStatus;
  max_heart_rate: number;
  warning_line: number;
  stop_line: number;
  message: string;
}

export type ExerciseStage = 'standing' | 'descending' | 'bottom' | 'ascending' | 'unknown';
export type TrainingLoadLevel = 'low' | 'medium' | 'high';
export type TrainingSuggestion = 'continue' | 'reduce_intensity' | 'rest';

export interface TrainingLoadResult {
  training_load: TrainingLoadLevel;
  suggestion: TrainingSuggestion;
  reason: string;
}

export interface PoseCleaningResult {
  keypoints: Record<string, { x: number; y: number; confidence: number; valid: boolean; interpolated: boolean }>;
  selected_side: 'left' | 'right' | 'unknown';
  dropped_keypoints: string[];
  interpolated_keypoints: string[];
  abnormal_frame: boolean;
  confidence_mean: number;
}

export interface PoseAlgorithmResult {
  exercise: 'squat';
  stage: ExerciseStage;
  rep_count: number;
  completed_rep: boolean;
  cleaning: PoseCleaningResult;
  angles: JointAngles;
  quality: QualityAssessment;
  heart_rate_safety: HeartRateSafety | null;
  training_load: TrainingLoadResult;
  algorithm_context: string;
}

export type FrontendEffectName = 'none' | 'good' | 'excellent' | 'perfect';

export interface FrontendEffect {
  name: FrontendEffectName;
  trigger: boolean;
  message: string | null;
  sound: string | null;
  min_score: number | null;
}

export interface TrainingContext {
  current_sets: number;
  current_reps: number;
  quality_drop_count: number;
  heart_rate_recovery_seconds: number | null;
  sleep_quality: 'poor' | 'fair' | 'good';
  duration_minutes: number;
  temperature_c: number | null;
  humidity: number | null;
}

export interface WatchHealthData {
  user_id: string;
  session_id: string | null;
  age: number;
  heart_rate: number | null;
  sleep_quality: 'poor' | 'fair' | 'good';
  sleep_hours: number | null;
  heart_rate_recovery_seconds: number | null;
  timestamp: number | null;
}

// ── Request / Response ──────────────────────────────────────────

export interface PipelineAnalyzeRequest {
  user_id?: string;
  session_id?: string;
  keypoints: Record<string, [number, number, number]>;
  exercise?: 'squat';
  timestamp?: number;
  frame_index?: number;
  watch?: WatchHealthData;
  training_context?: Partial<TrainingContext>;
  goal?: string;
  include_report?: boolean;
}

export interface PipelineAnalyzeResponse {
  result: PoseAlgorithmResult;
  report: string | null;
  scene: unknown;
  watch: WatchHealthData | null;
}

export interface RealtimeCoachRequest {
  result: PoseAlgorithmResult;
  user_id?: string;
  session_id?: string;
  scene?: unknown;
  watch?: WatchHealthData;
  style?: 'coach' | 'playful' | 'strict';
  send_to_voice_agent?: boolean;
}

export interface RealtimeCoachResponse {
  commentary: string;
  frontend_effect: FrontendEffect;
  voice_forwarded: boolean;
  voice_response: unknown | null;
  result: PoseAlgorithmResult;
}

export interface HealthResponse {
  ok: boolean;
  model_loaded: boolean;
  model_path: string;
  details: Record<string, unknown>;
}

// ── Connection state ────────────────────────────────────────────

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';
