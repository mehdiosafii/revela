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
  // Photo data URLs can be too heavy for localStorage; keep everything else.
  const light: Record<string, string> = {};
  for (const [key, value] of Object.entries(answers)) {
    if (key === 'photo' && value.length > MAX_STORED_PHOTO_LENGTH) continue;
    light[key] = value;
  }
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ step, answers: light }));
  } catch {
    // Storage can be unavailable or full. The current in-memory assessment still works.
  }
}

export function loadProgress(): SavedProgress | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    const progress = JSON.parse(raw) as SavedProgress;
    if (typeof progress.step !== 'number' || typeof progress.answers !== 'object' || !progress.answers) return null;
    return progress;
  } catch {
    return null;
  }
}

export function clearProgress() {
  try {
    localStorage.removeItem(PROGRESS_KEY);
  } catch {
    // Clearing optional resume data must never block the assessment.
  }
}

/* Finished sessions are stored locally so the paid return can rebuild the
   exact answer set while server-side entitlement remains the access authority. */
const FINISHED_KEY = 'revela_finished';

export interface FinishedSession {
  answers: Record<string, string>;
  deep: unknown | null;
}

export function saveFinished(answers: Record<string, string>, deep: unknown | null = null) {
  const light: Record<string, string> = {};
  for (const [key, value] of Object.entries(answers)) {
    if (key === 'photo' && value.length > MAX_STORED_PHOTO_LENGTH) continue;
    light[key] = value;
  }
  try {
    const raw = localStorage.getItem(FINISHED_KEY);
    const previous: FinishedSession | null = raw ? JSON.parse(raw) : null;
    localStorage.setItem(
      FINISHED_KEY,
      JSON.stringify({ answers: light, deep: deep ?? previous?.deep ?? null }),
    );
  } catch {
    // Local restore is a convenience; paid entitlement is stored server-side.
  }
}

export function loadFinished(): FinishedSession | null {
  try {
    const raw = localStorage.getItem(FINISHED_KEY);
    if (!raw) return null;
    const finished = JSON.parse(raw) as FinishedSession;
    if (typeof finished.answers !== 'object' || !finished.answers) return null;
    return finished;
  } catch {
    return null;
  }
}

let memoryToken: string | null = null;
let memoryStartedAt: number | null = null;

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
  const now = Date.now();
  if (memoryStartedAt !== null) return Math.max(0, now - memoryStartedAt);

  try {
    const raw = localStorage.getItem(START_KEY);
    const stored = raw ? Number(raw) : Number.NaN;
    if (Number.isFinite(stored) && stored > 0 && stored <= now) {
      memoryStartedAt = stored;
      return now - stored;
    }
  } catch {
    // Fall back to an in-memory clock below.
  }

  memoryStartedAt = now;
  try {
    localStorage.setItem(START_KEY, String(now));
  } catch {
    // A memory-only duration is sufficient for non-critical analytics.
  }
  return 0;
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
      // Browsers cap keepalive bodies at roughly 64 KB, below most uploaded photos.
      keepalive: payload.length < 60_000,
    });
  } catch {
    // Tracking must never break the product experience.
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
