import type {
  HealthResponse,
  PipelineAnalyzeRequest,
  PipelineAnalyzeResponse,
  RealtimeCoachRequest,
  RealtimeCoachResponse,
} from './types';

const DEFAULT_BASE = 'http://127.0.0.1:8000';

let _baseUrl = DEFAULT_BASE;

export function setBaseUrl(url: string) {
  _baseUrl = url.replace(/\/+$/, '');
}

export function getBaseUrl(): string {
  return _baseUrl;
}

// ── Generic fetch wrapper ────────────────────────────────────────
async function request<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${_baseUrl}${path}`;
  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Backend ${res.status} ${res.statusText}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ── Public API ───────────────────────────────────────────────────

/** Check if backend is alive and model is loaded. */
export function checkHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('GET', '/health');
}

/** Send pose keypoints + health data, get algorithm result. */
export function pipelineAnalyze(
  payload: PipelineAnalyzeRequest,
): Promise<PipelineAnalyzeResponse> {
  return request<PipelineAnalyzeResponse>('POST', '/pipeline/analyze', payload);
}

/** Generate real-time coach commentary from algorithm result. */
export function realtimeCoach(
  payload: RealtimeCoachRequest,
): Promise<RealtimeCoachResponse> {
  return request<RealtimeCoachResponse>('POST', '/llm/realtime-coach', payload);
}
