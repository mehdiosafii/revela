// ─────────────────────────────────────────────────────────────
// Revela visitor tracker — anonymous token, heartbeats, answers
// ─────────────────────────────────────────────────────────────

const TOKEN_KEY = 'revela_token';
const START_KEY = 'revela_started_at';
const PROGRESS_KEY = 'revela_progress';

export interface SavedProgress {
  step: number;
  answers: Record<string, string>;
}

export function saveProgress(step: number, answers: Record<string, string>) {
  // photo data-URLs are too heavy for localStorage — keep everything else
  const light: Record<string, string> = {};
  for (const [k, v] of Object.entries(answers)) {
    if (k === 'photo' && v.length > 5000) continue;
    light[k] = v;
  }
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ step, answers: light }));
  } catch {
    /* storage full — non-fatal */
  }
}

export function loadProgress(): SavedProgress | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as SavedProgress;
    if (typeof p.step !== 'number' || typeof p.answers !== 'object') return null;
    return p;
  } catch {
    return null;
  }
}

export function clearProgress() {
  localStorage.removeItem(PROGRESS_KEY);
}

/* ── finished sessions: answers + AI report kept locally so the unlocked
   report page can be rebuilt exactly as she saw it after the Stripe redirect ── */
const FINISHED_KEY = 'revela_finished';

export interface FinishedSession {
  answers: Record<string, string>;
  deep: unknown | null;
}

export function saveFinished(answers: Record<string, string>, deep: unknown | null = null) {
  const light: Record<string, string> = {};
  for (const [k, v] of Object.entries(answers)) {
    if (k === 'photo' && v.length > 5000) continue;
    light[k] = v;
  }
  try {
    const raw = localStorage.getItem(FINISHED_KEY);
    const prev: FinishedSession | null = raw ? JSON.parse(raw) : null;
    localStorage.setItem(FINISHED_KEY, JSON.stringify({ answers: light, deep: deep ?? prev?.deep ?? null }));
  } catch {
    /* storage full — non-fatal */
  }
}

export function loadFinished(): FinishedSession | null {
  try {
    const raw = localStorage.getItem(FINISHED_KEY);
    if (!raw) return null;
    const f = JSON.parse(raw) as FinishedSession;
    if (typeof f.answers !== 'object' || !f.answers) return null;
    return f;
  } catch {
    return null;
  }
}

export function getToken(): string {
  let t = localStorage.getItem(TOKEN_KEY);
  if (!t) {
    t = 'rv_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(TOKEN_KEY, t);
  }
  return t;
}

export function getDurationMs(): number {
  let s = localStorage.getItem(START_KEY);
  if (!s) {
    s = String(Date.now());
    localStorage.setItem(START_KEY, s);
  }
  return Date.now() - Number(s);
}

type Stage = 'landing' | 'quiz' | 'analyzing' | 'report';

interface PingPayload {
  stage?: Stage;
  questionIndex?: number;
  questionId?: string;
  identity?: { name?: string; email?: string; phone?: string };
}

async function post(path: string, body: unknown) {
  try {
    await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: body }),
      keepalive: true,
    });
  } catch {
    /* tracking must never break the experience */
  }
}

export function ping(payload: PingPayload) {
  void post('/api/trpc/track.ping', {
    token: getToken(),
    durationMs: getDurationMs(),
    ...payload,
  });
}

export function trackAnswer(questionId: string, value: string) {
  // never upload photos — only note that one was added
  const safe = questionId === 'photo' ? (value ? '[photo added]' : '') : value.slice(0, 2000);
  void post('/api/trpc/track.answer', { token: getToken(), questionId, value: safe });
}
