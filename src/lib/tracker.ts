// ─────────────────────────────────────────────────────────────
// Revela visitor tracker — anonymous token, heartbeats, answers
// ─────────────────────────────────────────────────────────────

const TOKEN_KEY = 'revela_token';
const START_KEY = 'revela_started_at';

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
