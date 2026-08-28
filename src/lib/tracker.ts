// ─────────────────────────────────────────────────────────────
// Revela visitor tracker — anonymous token, heartbeats, answers
// ─────────────────────────────────────────────────────────────

const TOKEN_KEY = 'revela_token';
const START_KEY = 'revela_started_at';
const PROGRESS_KEY = 'revela_progress';
const MAX_STORED_PHOTO_LENGTH = 1_200_000;
const PHOTO_DATA_URL = /^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/;
const VALID_TOKEN = /^rv_[a-z0-9]{8,60}$/i;

export interface SavedProgress {
  step: number;
  answers: Record<string, string>;
}

export function saveProgress(step: number, answers: Record<string, string>) {
  // photo data-URLs are too heavy for localStorage — keep everything else
  const light: Record<string, string> = {};
  for (const [k, v] of Object.entries(answers)) {
    if (k === 'photo' && v.length > 1_200_000) continue; // downscaled photos (~200-500KB) are kept
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
    if (k === 'photo' && v.length > 1_200_000) continue; // downscaled photos (~200-500KB) are kept
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

let memoryToken: string | null = null;

function createSecureToken(): string {
  const webCrypto = globalThis.crypto;
  if (!webCrypto?.getRandomValues) {
    throw new Error('A secure browser context is required to create a Revela session.');
  }
  const bytes = new Uint8Array(24);
  webCrypto.getRandomValues(bytes);
  return `rv_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

export function getToken(): string {
  if (memoryToken) return memoryToken;
  try {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored && VALID_TOKEN.test(stored)) {
      memoryToken = stored;
      return stored;
    }
  } catch {
    // A memory-only session still works when browser storage is unavailable.
  }

  memoryToken = createSecureToken();
  try {
    localStorage.setItem(TOKEN_KEY, memoryToken);
  } catch {
    // Keep the cryptographically secure token in memory for this page session.
  }
  return memoryToken;
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
    const payload = JSON.stringify({ json: body });
    await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: payload,
      // Browsers cap keepalive bodies at roughly 64KB, below most uploaded photos.
      keepalive: payload.length < 60_000,
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
  const safe = questionId === 'photo'
    ? value.length <= MAX_STORED_PHOTO_LENGTH && PHOTO_DATA_URL.test(value) ? value : ''
    : value.slice(0, 2000);
  void post('/api/trpc/track.answer', { token: getToken(), questionId, value: safe });
}
