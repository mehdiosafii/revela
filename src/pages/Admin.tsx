import { useMemo, useState } from 'react';
import { trpc } from '@/providers/trpc';
import { QUESTIONS } from '../lib/engine';

const STAGES = ['landing', 'quiz', 'analyzing', 'report'] as const;
type Stage = (typeof STAGES)[number];

const STAGE_META: Record<Stage, { label: string; color: string }> = {
  landing: { label: 'Landing', color: '#c4688a' },
  quiz: { label: 'Quiz', color: '#c9a24b' },
  analyzing: { label: 'Analyzing', color: '#78c9db' },
  report: { label: 'Report', color: '#5dcb9a' },
};

function fmtDur(ms: number) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function timeAgo(d: Date | string) {
  const s = Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function deviceOf(ua: string | null) {
  if (!ua) return '—';
  if (/mobile|iphone|android/i.test(ua)) return '📱 Mobile';
  return '💻 Desktop';
}

/* ── Detail drawer ── */
function SessionDrawer({ token, password, onClose }: { token: string; password: string; onClose: () => void }) {
  const detail = trpc.admin.sessionDetail.useQuery({ token, password }, { refetchInterval: 8000, retry: false });
  const s = detail.data?.session;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-[#3d0b26]/40 backdrop-blur-sm" />
      <div
        className="animate-toast-in relative h-full w-full max-w-lg overflow-y-auto bg-[#fbf5ef] p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-5 top-5 text-[#751545]/50 hover:text-[#751545]">✕</button>
        {!s ? (
          <p className="mt-20 text-center text-sm text-[#751545]/50">Loading…</p>
        ) : (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#c9a24b]">Visitor detail</p>
            <h2 className="font-display mt-2 text-2xl font-medium text-[#3d0b26]">
              {s.name || 'Anonymous visitor'}
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
              <div className="rounded-xl bg-white/70 p-3">
                <p className="text-[10px] uppercase tracking-wider text-[#751545]/45">Location</p>
                <p className="mt-1 font-medium text-[#3d0b26]">{[s.city, s.country].filter(Boolean).join(', ') || 'Unknown'}</p>
              </div>
              <div className="rounded-xl bg-white/70 p-3">
                <p className="text-[10px] uppercase tracking-wider text-[#751545]/45">Device</p>
                <p className="mt-1 font-medium text-[#3d0b26]">{deviceOf(s.userAgent)}</p>
              </div>
              <div className="rounded-xl bg-white/70 p-3">
                <p className="text-[10px] uppercase tracking-wider text-[#751545]/45">Email</p>
                <p className="mt-1 truncate font-medium text-[#3d0b26]">{s.email || '—'}</p>
              </div>
              <div className="rounded-xl bg-white/70 p-3">
                <p className="text-[10px] uppercase tracking-wider text-[#751545]/45">Phone</p>
                <p className="mt-1 font-medium text-[#3d0b26]">{s.phone || '—'}</p>
              </div>
            </div>

            <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#c9a24b]">Journey</p>
            <div className="mt-3 flex flex-col gap-0">
              {(detail.data?.events ?? []).map((e) => (
                <div key={e.id} className="flex items-baseline gap-3 border-l-2 border-[#c9a24b]/30 py-2 pl-4">
                  <span className="w-16 shrink-0 text-[11px] tabular-nums text-[#751545]/45">
                    {new Date(e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-[13px] text-[#3d0b26]">
                    {e.kind === 'stage' ? (
                      <>Entered <b>{STAGE_META[(e.stage as Stage) ?? 'landing'].label}</b></>
                    ) : (
                      <>
                        Question {(e.questionIndex ?? 0) + 1}
                        {e.questionId ? <span className="text-[#751545]/55"> — {QUESTIONS.find((q) => q.id === e.questionId)?.title ?? e.questionId}</span> : null}
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {(detail.data?.answers?.length ?? 0) > 0 && (
              <>
                <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#c9a24b]">Answers</p>
                <div className="mt-3 flex flex-col gap-2">
                  {detail.data!.answers.map((a) => (
                    <div key={a.id} className="rounded-xl bg-white/70 p-3">
                      <p className="text-[11px] text-[#751545]/50">
                        {QUESTIONS.find((q) => q.id === a.questionId)?.title ?? a.questionId}
                      </p>
                      <p className="mt-1 text-[13px] font-medium text-[#3d0b26]">{a.value || '—'}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Lock screen ── */
function LockScreen({ onUnlock }: { onUnlock: (pw: string) => void }) {
  const [pw, setPw] = useState('');
  const [shake, setShake] = useState(false);
  const check = trpc.admin.check.useQuery({ password: pw }, { enabled: false, retry: false });

  const submit = async () => {
    if (!pw) return;
    const res = await check.refetch();
    if (res.data?.ok) {
      onUnlock(pw);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#3d0b26] bg-grain px-6">
      <div
        className="gold-ring w-full max-w-sm rounded-[2rem] border border-[#c9a24b]/25 bg-white/95 p-10 text-center backdrop-blur"
        style={shake ? { animation: 'toast-in 0.4s ease', transform: 'translateX(0)' } : undefined}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#751545] to-[#c4688a] text-2xl text-white">
          ⚿
        </div>
        <h1 className="font-display mt-5 text-2xl font-medium text-[#3d0b26]">Revela Admin</h1>
        <p className="mt-1.5 text-[13px] text-[#751545]/55">This area is private. Enter the password.</p>
        <input
          type="password"
          value={pw}
          autoFocus
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Password"
          className="mt-6 w-full rounded-xl border-[1.5px] border-[#751545]/20 bg-white px-4 py-3 text-center text-[15px] tracking-[0.3em] text-[#3d0b26] outline-none transition-colors placeholder:tracking-normal placeholder:text-[#751545]/30 focus:border-[#751545]"
        />
        {check.isError && (
          <p className="mt-3 text-[12.5px] font-medium text-[#c43030]">Wrong password — try again.</p>
        )}
        <button
          onClick={submit}
          disabled={!pw || check.isFetching}
          className="btn-shine mt-5 w-full rounded-full py-3.5 text-[15px] font-semibold text-white disabled:opacity-40"
        >
          <span>{check.isFetching ? 'Checking…' : 'Unlock dashboard'}</span>
        </button>
      </div>
    </div>
  );
}

/* ── Admin page ── */
export default function Admin() {
  const [selected, setSelected] = useState<string | null>(null);
  const [password, setPassword] = useState<string>(() => sessionStorage.getItem('revela_admin_pw') ?? '');

  const unlock = (pw: string) => {
    sessionStorage.setItem('revela_admin_pw', pw);
    setPassword(pw);
  };

  if (!password) return <LockScreen onUnlock={unlock} />;

  return <AdminDashboard password={password} selected={selected} setSelected={setSelected} onLock={() => {
    sessionStorage.removeItem('revela_admin_pw');
    setPassword('');
  }} />;
}

function AdminDashboard({
  password,
  selected,
  setSelected,
  onLock,
}: {
  password: string;
  selected: string | null;
  setSelected: (t: string | null) => void;
  onLock: () => void;
}) {
  const overview = trpc.admin.overview.useQuery({ password }, { refetchInterval: 8000, retry: false });
  const visitors = trpc.admin.visitors.useQuery({ password }, { refetchInterval: 8000, retry: false });

  // session-cached password was wrong (e.g. password changed) → back to lock
  if (overview.error?.data?.code === 'UNAUTHORIZED') {
    onLock();
    return null;
  }

  const o = overview.data;

  // funnel math
  const funnel = useMemo(() => {
    if (!o) return [];
    const reached: Record<Stage, number> = {
      landing: o.total,
      quiz: o.total - (o.stageCounts.landing ?? 0),
      analyzing: (o.stageCounts.analyzing ?? 0) + (o.stageCounts.report ?? 0),
      report: o.stageCounts.report ?? 0,
    };
    return STAGES.map((st) => ({ stage: st, count: reached[st], pct: o.total ? Math.round((reached[st] / o.total) * 100) : 0 }));
  }, [o]);

  const maxDrop = Math.max(1, ...Object.values(o?.dropByIndex ?? {}));

  return (
    <div className="min-h-screen bg-[#fbf5ef] bg-grain">
      <header className="border-b border-[#751545]/10 bg-[#3d0b26] px-6 py-5 text-[#fbf5ef]">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-2xl font-semibold">Revela</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#edc840]">Admin · Live</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="/" className="text-[12px] text-[#fbf5ef]/60 hover:text-[#fbf5ef]">← View site</a>
            <button onClick={onLock} className="rounded-full border border-[#fbf5ef]/25 px-4 py-1.5 text-[11px] font-medium text-[#fbf5ef]/70 transition-colors hover:bg-[#fbf5ef]/10">
              Lock
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* KPI row */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            { label: 'Total visitors', value: o?.total ?? '—' },
            { label: 'Live now', value: o?.liveNow ?? '—', accent: true },
            { label: 'Finished the quiz', value: o?.completed ?? '—' },
            { label: 'Completion rate', value: o && o.total ? `${Math.round((o.completed / o.total) * 100)}%` : '—' },
            { label: 'Avg. time on site', value: o ? fmtDur(o.avgDurationMs) : '—' },
          ].map((k) => (
            <div key={k.label} className="rounded-2xl border border-[#751545]/10 bg-white/75 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#751545]/50">{k.label}</p>
              <p className={`font-display mt-2 text-3xl font-medium ${k.accent ? 'text-[#5dcb9a]' : 'text-[#3d0b26]'}`}>
                {k.value}
                {k.accent && typeof k.value === 'number' && k.value > 0 && (
                  <span className="ml-2 inline-block h-2 w-2 animate-pulse-soft rounded-full bg-[#5dcb9a]" />
                )}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Funnel */}
          <section className="rounded-2xl border border-[#751545]/10 bg-white/75 p-6">
            <h2 className="font-display text-lg font-medium text-[#3d0b26]">Conversion funnel</h2>
            <p className="mt-1 text-[12px] text-[#751545]/55">How many visitors reach each stage</p>
            <div className="mt-6 flex flex-col gap-4">
              {funnel.map((f) => (
                <div key={f.stage}>
                  <div className="flex items-baseline justify-between text-[13px]">
                    <span className="font-medium text-[#3d0b26]">{STAGE_META[f.stage].label}</span>
                    <span className="tabular-nums text-[#751545]/70">
                      {f.count} · {f.pct}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-[#751545]/8">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${f.pct}%`, background: STAGE_META[f.stage].color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Drop-off per question */}
          <section className="rounded-2xl border border-[#751545]/10 bg-white/75 p-6">
            <h2 className="font-display text-lg font-medium text-[#3d0b26]">Where they stop</h2>
            <p className="mt-1 text-[12px] text-[#751545]/55">Unfinished visitors, parked on each question</p>
            <div className="mt-6 flex max-h-72 flex-col gap-2.5 overflow-y-auto pr-1">
              {QUESTIONS.map((q, i) => {
                const n = o?.dropByIndex?.[i] ?? 0;
                return (
                  <div key={q.id} className="flex items-center gap-3">
                    <span className="w-6 shrink-0 text-right text-[11px] tabular-nums text-[#751545]/50">{i + 1}</span>
                    <div className="h-5 flex-1 overflow-hidden rounded-md bg-[#751545]/6">
                      <div
                        className="h-full rounded-md bg-gradient-to-r from-[#c4688a] to-[#751545] transition-all duration-700"
                        style={{ width: `${(n / maxDrop) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-[12px] font-semibold tabular-nums text-[#3d0b26]">{n || ''}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Countries */}
        <section className="mt-6 rounded-2xl border border-[#751545]/10 bg-white/75 p-6">
          <h2 className="font-display text-lg font-medium text-[#3d0b26]">Locations</h2>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {(o?.countries ?? []).map((c) => (
              <span key={c.country} className="rounded-full border border-[#751545]/15 bg-[#fbf5ef] px-4 py-1.5 text-[13px] text-[#3d0b26]">
                {c.country} <b className="ml-1 text-[#751545]">{c.count}</b>
              </span>
            ))}
            {o && o.countries.length === 0 && (
              <p className="text-[13px] text-[#751545]/50">No location data yet — it appears with the first visitors.</p>
            )}
          </div>
        </section>

        {/* Visitors table */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-[#751545]/10 bg-white/75">
          <div className="flex items-center justify-between px-6 pt-6">
            <h2 className="font-display text-lg font-medium text-[#3d0b26]">All visitors</h2>
            <span className="text-[11px] uppercase tracking-wider text-[#751545]/45">auto-refreshes every 8s</span>
          </div>
          <div className="mt-4 overflow-x-auto pb-4">
            <table className="w-full min-w-[860px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#751545]/10 text-[10px] uppercase tracking-[0.15em] text-[#751545]/50">
                  <th className="px-6 py-3 font-semibold">Visitor</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Device</th>
                  <th className="px-4 py-3 font-semibold">Doing now</th>
                  <th className="px-4 py-3 font-semibold">Stopped at</th>
                  <th className="px-4 py-3 font-semibold">Time</th>
                  <th className="px-6 py-3 font-semibold">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {(visitors.data ?? []).map((v) => {
                  const stoppedQ = v.questionIndex >= 0 ? QUESTIONS[v.questionIndex] : null;
                  const isLive = Date.now() - new Date(v.lastSeenAt).getTime() < 90_000;
                  return (
                    <tr
                      key={v.token}
                      onClick={() => setSelected(v.token)}
                      className="cursor-pointer border-b border-[#751545]/6 transition-colors hover:bg-[#f3e8df]/60"
                    >
                      <td className="px-6 py-3.5">
                        <p className="font-medium text-[#3d0b26]">{v.name || 'Anonymous'}</p>
                        <p className="text-[11px] text-[#751545]/50">{v.email || v.token.slice(0, 14) + '…'}</p>
                      </td>
                      <td className="px-4 py-3.5 text-[#3d0b26]/80">{[v.city, v.country].filter(Boolean).join(', ') || '—'}</td>
                      <td className="px-4 py-3.5 text-[#3d0b26]/80">{deviceOf(v.userAgent)}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
                          style={{ background: STAGE_META[(v.stage as Stage) ?? 'landing'].color }}
                        >
                          {isLive && <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-white" />}
                          {STAGE_META[(v.stage as Stage) ?? 'landing'].label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[#3d0b26]/80">
                        {v.completed ? (
                          <span className="font-medium text-[#5dcb9a]">✓ Finished</span>
                        ) : stoppedQ ? (
                          <span>Q{v.questionIndex + 1} · {stoppedQ.title.slice(0, 34)}{stoppedQ.title.length > 34 ? '…' : ''}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3.5 tabular-nums text-[#3d0b26]/80">{fmtDur(v.durationMs)}</td>
                      <td className="px-6 py-3.5 text-[#3d0b26]/60">{timeAgo(v.lastSeenAt)}</td>
                    </tr>
                  );
                })}
                {visitors.data && visitors.data.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-[#751545]/50">
                      No visitors yet — open the site in another tab and watch them appear here live.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {selected && <SessionDrawer token={selected} password={password} onClose={() => setSelected(null)} />}
    </div>
  );
}
