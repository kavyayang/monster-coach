import { useState, useRef, useCallback, useEffect } from 'react';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import CustomPlanModal from './CustomPlanModal';
import WorkoutSummaryModal from './WorkoutSummaryModal';
import type { DashboardData, CoachPersonality, CoachVoice, Workout, Biometrics } from '../types/dashboard';
import { usePipeline } from '../services/usePipeline';
import { triggerHighScore, triggerLowScore, triggerWorkoutComplete } from '../utils/confettiEffects';

interface DashboardProps {
  /** Pass live data from parent (overrides pipeline hook) */
  data?: DashboardData;
  /** Camera / skeleton stream URL (HLS / WebRTC / MJPEG) */
  streamUrl?: string;
  /** Backend base URL */
  backendUrl?: string;
}

interface WorkoutSnapshot {
  workout: Workout;
  biometrics: Biometrics;
}

export default function Dashboard({
  data: externalData,
  streamUrl,
  backendUrl,
}: DashboardProps) {
  const [personality, setPersonality] = useState<CoachPersonality>('gentle');
  const [voice, setVoice] = useState<CoachVoice>('female_soft');
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<WorkoutSnapshot | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);

  const startTimeRef = useRef(Date.now());

  const {
    data: pipelineData,
    connectionStatus,
    frontendEffect: _effect,
    error,
  } = usePipeline({
    backendUrl,
    action: '深蹲',
    targetReps: 20,
    pollingInterval: 600,
    personality,
  });

  const data = externalData ?? pipelineData;

  // ── Refs that depend on data (must be after data is defined) ──
  const prevScoreRef = useRef(data.workout.score);
  const prevRepsRef = useRef(data.workout.reps);
  const completedRef = useRef(false);

  // ── Score change → confetti triggers ───────────────────────────
  useEffect(() => {
    const prev = prevScoreRef.current;
    const curr = data.workout.score;
    prevScoreRef.current = curr;

    if (curr === prev) return;

    if (curr > 85) {
      triggerHighScore();
    } else if (curr < 60) {
      triggerLowScore();
    }
  }, [data.workout.score]);

  // ── Reps reach target → workout complete ──────────────────────
  useEffect(() => {
    const curr = data.workout.reps;
    const prev = prevRepsRef.current;
    prevRepsRef.current = curr;

    if (curr >= data.workout.targetReps && prev < data.workout.targetReps && !completedRef.current) {
      completedRef.current = true;
      setTimeout(() => {
        triggerWorkoutComplete();
        setTimeout(() => {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setDurationSeconds(elapsed);
          setSnapshot({
            workout: { ...data.workout },
            biometrics: { ...data.biometrics },
          });
          setSummaryModalOpen(true);
        }, 1200);
      }, 300);
    }
  }, [data.workout.reps, data.workout.targetReps, data]);

  const environment = {
    ...data.environment,
    connectionStatus: externalData ? 'connected' : connectionStatus,
    aiActive: externalData ? true : connectionStatus === 'connected',
  };

  const handleEndWorkout = useCallback(() => {
    triggerWorkoutComplete();
    setTimeout(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setDurationSeconds(elapsed);
      setSnapshot({
        workout: { ...data.workout },
        biometrics: { ...data.biometrics },
      });
      setSummaryModalOpen(true);
    }, 600);
  }, [data]);

  const handleCloseSummary = useCallback(() => {
    setSummaryModalOpen(false);
  }, []);

  return (
    <div className="flex h-screen w-full bg-cyber-dark scanlines overflow-hidden">
      {/* ═══ LEFT: AI Coach (1/4) ═══ */}
      <div className="w-1/4 flex-shrink-0 flex flex-col">
        <LeftPanel
          data={data}
          personality={personality}
          voice={voice}
          onPersonalityChange={setPersonality}
          onVoiceChange={setVoice}
        />
      </div>

      {/* ═══ CYAN DIVIDER ═══ */}
      <div className="w-px flex-shrink-0 bg-gradient-to-b from-transparent via-cyber-cyan/40 to-transparent shadow-[0_0_6px_rgba(0,229,255,0.15)]" />

      {/* ═══ RIGHT: Data + Camera (3/4) ═══ */}
      <div className="flex-1 flex flex-col min-w-0">
        <RightPanel
          workout={data.workout}
          biometrics={data.biometrics}
          environment={environment}
          streamUrl={streamUrl}
          connectionError={error}
          onOpenPlanModal={() => setPlanModalOpen(true)}
          onEndWorkout={handleEndWorkout}
        />
      </div>

      {/* ── Custom Plan Modal ────────────────────────────────── */}
      <CustomPlanModal
        open={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        personality={personality}
      />

      {/* ── Workout Summary Modal ────────────────────────────── */}
      {snapshot && (
        <WorkoutSummaryModal
          open={summaryModalOpen}
          onClose={handleCloseSummary}
          workout={snapshot.workout}
          biometrics={snapshot.biometrics}
          personality={personality}
          durationSeconds={durationSeconds}
        />
      )}
    </div>
  );
}
