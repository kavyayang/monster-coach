import { useState, useCallback, useRef } from 'react';
import Spline from '@splinetool/react-spline';
import type { DashboardData } from '../types/dashboard';
import {
  MONSTER_MODELS,
  computeIntensity,
  pickModel,
  getModelById,
} from '../data/monsters';
import type { MonsterModel } from '../data/monsters';

// ── Props ──────────────────────────────────────────────────────────
interface AIAssistantProps {
  data: DashboardData;
}

// ── Intensity → color helper ───────────────────────────────────────
function intensityColor(i: number): string {
  if (i <= 2) return 'from-cyan-400 to-blue-500';
  if (i <= 4) return 'from-green-400 to-cyan-400';
  if (i <= 6) return 'from-yellow-400 to-orange-500';
  if (i <= 8) return 'from-orange-500 to-red-500';
  return 'from-red-600 to-red-800';
}

// ── Monster card inside popup ──────────────────────────────────────
function MonsterCard({
  model,
  isActive,
  onSelect,
}: {
  model: MonsterModel;
  isActive: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(model.id)}
      className={`
        relative group flex flex-col items-center gap-1.5 p-2.5 rounded-xl
        border transition-all duration-200
        ${isActive
          ? 'border-cyber-cyan bg-cyber-cyan/10 shadow-[0_0_12px_rgba(0,229,255,0.25)]'
          : 'border-slate-700/50 bg-slate-800/60 hover:border-slate-500 hover:bg-slate-700/60'
        }
      `}
    >
      <div
        className={`w-full h-1.5 rounded-full bg-gradient-to-r ${intensityColor(model.intensity)}`}
      />
      <span
        className={`text-xs font-medium truncate w-full text-center ${
          isActive ? 'text-cyber-cyan' : 'text-slate-300'
        }`}
      >
        {model.name}
      </span>
      <span className="text-[10px] text-slate-500 tabular-nums">
        Lv.{model.intensity}
      </span>
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export default function AIAssistant({ data }: AIAssistantProps) {
  const { assistant, biometrics, workout } = data;

  const autoIntensity = computeIntensity(
    biometrics.heartRate,
    biometrics.hrThreshold,
    workout.isFormDeformed,
  );
  const autoModel = pickModel(autoIntensity);

  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [manualId, setManualId] = useState<string>(autoModel.id);
  const [popupOpen, setPopupOpen] = useState(false);
  const [splineLoading, setSplineLoading] = useState(true);
  const splineKey = useRef(0);

  const activeModel = mode === 'auto' ? autoModel : getModelById(manualId);
  const currentUrl = activeModel.url;

  // ── Handlers ───────────────────────────────────────────────────
  const handleSplineLoad = useCallback(() => {
    setSplineLoading(false);
  }, []);

  const handleSelectModel = useCallback((id: string) => {
    setMode('manual');
    setManualId(id);
    setPopupOpen(false);
    splineKey.current += 1;
    setSplineLoading(true);
  }, []);

  const handleAutoMode = useCallback(() => {
    setMode('auto');
    setPopupOpen(false);
    if (autoModel.id !== activeModel.id) {
      splineKey.current += 1;
      setSplineLoading(true);
    }
  }, [autoModel, activeModel]);

  // ── Render ─────────────────────────────────────────────────────
  return (
    <>
      {/* ================================================================
          Bottom-left: 3D Avatar + Chat Bubble
          Avatar sits at the bottom; bubble floats at its upper-right.
          ================================================================ */}
      <div className="absolute bottom-6 left-6 z-40 flex items-start gap-5">

        {/* ── 3D Avatar — 2× larger, transparent ────────────────── */}
        <div className="relative flex-shrink-0" style={{ width: 256, height: 320 }}>
          <Spline
            key={splineKey.current}
            scene={currentUrl}
            onLoad={handleSplineLoad}
            style={{ width: '100%', height: '100%' }}
          />

          {/* Floor glow */}
          <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-cyber-cyan/25 via-cyber-cyan/5 to-transparent pointer-events-none" />
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-28 h-2 rounded-full bg-cyber-cyan/35 blur-[5px] pointer-events-none" />

          {/* Loading overlay */}
          {splineLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-cyber-cyan/30 border-t-cyber-cyan rounded-full animate-spin" />
              <span className="mt-2 text-[11px] text-cyber-cyan/60 tracking-wider font-mono">
                LOADING
              </span>
            </div>
          )}

          {/* Model name tag */}
          <div className="absolute bottom-1 left-2 right-2 z-20 text-[11px] text-cyber-cyan/80 text-center truncate pointer-events-none font-mono tracking-wider">
            {activeModel.name}
          </div>

          {/* Top-right controls */}
          <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5">
            <button
              onClick={() => setPopupOpen((v) => !v)}
              className="w-6 h-6 rounded-full border border-cyber-cyan/40 bg-cyber-dark/60 flex items-center justify-center hover:border-cyber-cyan hover:bg-cyber-dark/80 transition-all"
              title="切换怪兽"
            >
              <svg
                className="w-3 h-3 text-cyber-cyan"
                fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3.75 6h16.5M3.75 12h16.5M12 17.25h8.25" />
              </svg>
            </button>
            <div
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                mode === 'auto'
                  ? 'bg-cyber-cyan shadow-[0_0_6px_rgba(0,229,255,0.7)]'
                  : 'bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.5)]'
              }`}
              title={mode === 'auto' ? '自动模式' : '手动模式'}
            />
          </div>
        </div>

        {/* ── Chat Bubble — floated to upper-right of avatar ────── */}
        <div
          className={`relative max-w-[220px] rounded-xl border backdrop-blur-md p-3.5 mt-20 ${
            assistant.isAlert
              ? 'bubble-tail-alert border-red-700/40 bg-red-950/80 shadow-[0_0_20px_rgba(220,38,38,0.45)]'
              : 'bubble-tail border-slate-700/40 bg-slate-900/50'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider ${
                assistant.isAlert ? 'text-red-400' : 'text-cyber-cyan'
              }`}
            >
              {'⚠'} {assistant.isAlert ? '注意' : '提示'}
            </span>
          </div>
          <p className="text-sm text-white leading-relaxed">
            "{assistant.message}"
          </p>
        </div>
      </div>

      {/* ================================================================
          Model Selector Popup
          ================================================================ */}
      {popupOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-start p-6"
          onClick={() => setPopupOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg mb-32 ml-4 rounded-2xl border border-slate-700/60 bg-slate-900/85 backdrop-blur-xl shadow-2xl p-5 animate-slide-up"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white tracking-wide">
                选择 AI 教练形象
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleAutoMode}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${
                    mode === 'auto'
                      ? 'border-cyber-cyan/50 bg-cyber-cyan/15 text-cyber-cyan'
                      : 'border-slate-600/50 bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  AUTO
                </button>
                <button
                  onClick={() => setPopupOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors text-lg leading-none"
                >
                  ✕
                </button>
              </div>
            </div>

            {mode === 'auto' && (
              <p className="text-[11px] text-slate-500 mb-3">
                自动匹配 · 强度指数 {autoIntensity}/10 · 当前 {autoModel.name}
              </p>
            )}

            <div className="grid grid-cols-4 gap-2.5">
              {MONSTER_MODELS.map((m) => (
                <MonsterCard
                  key={m.id}
                  model={m}
                  isActive={activeModel.id === m.id && mode === 'manual'}
                  onSelect={handleSelectModel}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
