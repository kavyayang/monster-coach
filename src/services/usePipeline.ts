import { useState, useEffect, useRef } from 'react';
import type { DashboardData } from '../types/dashboard';
import type {
  ConnectionStatus,
  FrontendEffect,
  PoseAlgorithmResult,
} from './types';
import { checkHealth, pipelineAnalyze, realtimeCoach, setBaseUrl } from './api';
import { mockData } from '../data/mockData';
import { getCoachMessage } from '../utils/coachVoice';
import type { CoachPersonality } from '../utils/coachVoice';
import { computeIntensity, pickModel } from '../data/monsters';

// ── Mock keypoint generator (squat cycle) ───────────────────────
// Generates keypoints that roughly simulate a person doing squats,
// cycling through standing → descending → bottom → ascending.
function generateMockKeypoints(phase: number): Record<string, [number, number, number]> {
  // phase 0..1: 0=standing, 0.25=descending, 0.5=bottom, 0.75=ascending, 1=standing
  const kneeY = phase < 0.5
    ? 410 + (560 - 410) * (phase / 0.5) * 0.4  // descending: knees go down slightly
    : 410 + (560 - 410) * ((1 - phase) / 0.5) * 0.4;
  const hipY = phase < 0.5
    ? 260 + (380 - 260) * (phase / 0.5) * 0.6
    : 260 + (380 - 260) * ((1 - phase) / 0.5) * 0.6;
  const shoulderY = phase < 0.5
    ? 120 + (200 - 120) * (phase / 0.5) * 0.3
    : 120 + (200 - 120) * ((1 - phase) / 0.5) * 0.3;
  const conf = 0.85 + Math.random() * 0.1;

  return {
    left_shoulder:  [320, shoulderY, conf],
    left_hip:       [300, hipY, conf],
    left_knee:      [310, kneeY, conf],
    left_ankle:     [315, 560, conf],
    right_shoulder: [390, shoulderY, conf],
    right_hip:      [405, hipY, conf],
    right_knee:     [398, kneeY, conf],
    right_ankle:    [392, 558, conf],
  };
}

// ── Hook options ─────────────────────────────────────────────────
interface UsePipelineOptions {
  /** Backend base URL. Default: http://127.0.0.1:8000 */
  backendUrl?: string;
  /** Polling interval in ms. Default: 600 */
  pollingInterval?: number;
  /** Exercise name. Default: '深蹲' */
  action?: string;
  /** Target reps. Default: 20 */
  targetReps?: number;
  /** Coach personality. Default: 'gentle' */
  personality?: CoachPersonality;
}

// ── Hook return type ─────────────────────────────────────────────
interface UsePipelineReturn {
  data: DashboardData;
  connectionStatus: ConnectionStatus;
  frontendEffect: FrontendEffect | null;
  error: string | null;
}

// ── Hook ─────────────────────────────────────────────────────────
export function usePipeline(options: UsePipelineOptions = {}): UsePipelineReturn {
  const {
    backendUrl = 'http://127.0.0.1:8000',
    pollingInterval = 600,
    action = '深蹲',
    targetReps = 20,
    personality = 'gentle',
  } = options;

  const [data, setData] = useState<DashboardData>(() => ({
    ...mockData,
    workout: { ...mockData.workout, currentAction: action, targetReps },
  }));
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [frontendEffect, setFrontendEffect] = useState<FrontendEffect | null>(null);
  const [error, setError] = useState<string | null>(null);

  const phaseRef = useRef(0);
  const sessionIdRef = useRef(`squat_${Date.now()}`);
  const connectedRef = useRef(false);

  // ── Set base URL on mount / change ────────────────────────────
  useEffect(() => {
    setBaseUrl(backendUrl);
  }, [backendUrl]);

  // ── Main pipeline loop ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    // Attempt health check first
    async function connect() {
      try {
        const health = await checkHealth();
        if (cancelled) return;
        if (health.ok) {
          connectedRef.current = true;
          setConnectionStatus('connected');
          setError(null);
          startPolling();
        } else {
          // Model not loaded yet
          connectedRef.current = true;
          setConnectionStatus('connected');
          startPolling();
        }
      } catch {
        // Backend unreachable → fall back to local simulation
        if (!cancelled) {
          connectedRef.current = false;
          setConnectionStatus('disconnected');
          setError('后端服务未连接，使用本地模拟数据');
          startLocalSimulation();
        }
      }
    }

    // ── Poll backend pipeline ──────────────────────────────────
    function startPolling() {
      const poll = async () => {
        if (cancelled || !connectedRef.current) return;

        // Advance mock squat phase
        phaseRef.current = (phaseRef.current + 0.04) % 1;
        const keypoints = generateMockKeypoints(phaseRef.current);

        try {
          const pipeRes = await pipelineAnalyze({
            user_id: 'demo_user',
            session_id: sessionIdRef.current,
            keypoints,
            exercise: 'squat',
            include_report: false,
          });

          if (cancelled) return;

          const result: PoseAlgorithmResult = pipeRes.result;
          const hr = pipeRes.watch?.heart_rate
            ?? result.heart_rate_safety?.warning_line
            ?? 150;

          // Call realtime-coach for commentary
          let commentary = '';
          let effect: FrontendEffect | null = null;

          try {
            const coachRes = await realtimeCoach({
              result,
              user_id: 'demo_user',
              session_id: sessionIdRef.current,
              style: 'playful',
              send_to_voice_agent: false,
            });
            commentary = coachRes.commentary;
            effect = coachRes.frontend_effect;
          } catch {
            // Coach endpoint failed — use local coachVoice as fallback
            const local = getCoachMessage(
              hr,
              result.quality.quality_score,
              action,
              result.quality.errors.length > 0,
              personality,
            );
            commentary = local.message;
          }

          if (cancelled) return;

          const score = result.quality.quality_score;
          const isFormDeformed = result.quality.errors.length > 0;
          const isAlert = result.heart_rate_safety?.status === 'stop'
            || result.heart_rate_safety?.status === 'reduce_intensity';

          setData((prev) => ({
            environment: {
              temp: prev.environment.temp,
              aiActive: true,
              connectionStatus: 'connected' as const,
            },
            workout: {
              currentAction: action,
              reps: result.rep_count,
              targetReps,
              score,
              isFormDeformed,
            },
            biometrics: {
              heartRate: hr,
              hrThreshold: result.heart_rate_safety?.warning_line ?? 170,
            },
            assistant: {
              message: commentary,
              isAlert,
              modelId: pickModel(computeIntensity(
                hr,
                result.heart_rate_safety?.warning_line ?? 170,
                isFormDeformed,
              )).id,
            },
          }));

          if (effect) setFrontendEffect(effect);
          setConnectionStatus('connected');
          setError(null);
        } catch (e) {
          // Pipeline call failed — fall back to local
          if (!cancelled) {
            connectedRef.current = false;
            setConnectionStatus('disconnected');
            setError(`后端请求失败: ${e instanceof Error ? e.message : String(e)}`);
            startLocalSimulation();
            return;
          }
        }

        if (!cancelled && connectedRef.current) {
          timer = setTimeout(poll, pollingInterval);
        }
      };

      poll();
    }

    // ── Local fallback simulation ──────────────────────────────
    function startLocalSimulation() {
      const tick = () => {
        if (cancelled) return;

        setData((prev) => {
          const hrDrift = Math.round((Math.random() - 0.5) * 6);
          const newHr = Math.min(185, Math.max(145, prev.biometrics.heartRate + hrDrift));
          const newReps = Math.random() > 0.85
            ? Math.min(prev.workout.targetReps, prev.workout.reps + 1)
            : prev.workout.reps;
          const newScore = Math.min(100, Math.max(70,
            prev.workout.score + Math.round((Math.random() - 0.55) * 3),
          ));
          const formDeformed = newHr > prev.biometrics.hrThreshold && Math.random() > 0.4;

          return {
            ...prev,
            workout: {
              ...prev.workout,
              reps: newReps,
              score: newScore,
              isFormDeformed: formDeformed,
            },
            biometrics: { ...prev.biometrics, heartRate: newHr },
            assistant: {
              ...getCoachMessage(newHr, newScore, prev.workout.currentAction, formDeformed, personality),
              modelId: pickModel(computeIntensity(newHr, prev.biometrics.hrThreshold, formDeformed)).id,
            },
          };
        });

        if (!cancelled) {
          timer = setTimeout(tick, 2500);
        }
      };
      tick();
    }

    // Start the flow
    connect();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [backendUrl, pollingInterval, action, targetReps]);

  return { data, connectionStatus, frontendEffect, error };
}
