import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Eye,
  Globe2,
  Heart,
  ImageIcon,
  KeyRound,
  Laptop,
  LockKeyhole,
  LogOut,
  MapPin,
  Maximize2,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Timer,
  Users,
  Wifi,
  X,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { QUESTIONS } from "../lib/engine";

const STAGES = ["landing", "quiz", "analyzing", "report"] as const;
type Stage = (typeof STAGES)[number];
const STORED_PHOTO_DATA_URL = /^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/;

const STAGE_META: Record<
  Stage,
  {
    label: string;
    shortLabel: string;
    color: string;
    soft: string;
    text: string;
  }
> = {
  landing: {
    label: "Landing page",
    shortLabel: "Landing",
    color: "#c4688a",
    soft: "#faedf1",
    text: "#a54d6f",
  },
  quiz: {
    label: "Quiz in progress",
    shortLabel: "Quiz",
    color: "#c9a24b",
    soft: "#faf4e4",
    text: "#927328",
  },
  analyzing: {
    label: "Analysis in progress",
    shortLabel: "Analyzing",
    color: "#6a9daf",
    soft: "#eaf4f7",
    text: "#467786",
  },
  report: {
    label: "Report viewed",
    shortLabel: "Report",
    color: "#4d9f76",
    soft: "#e9f5ef",
    text: "#347453",
  },
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function percentage(part: number, whole: number) {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}

function formatDuration(ms: number) {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function timeAgo(date: Date | string, referenceTime: number) {
  const seconds = Math.max(
    0,
    Math.round((referenceTime - new Date(date).getTime()) / 1000)
  );
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function isMobileDevice(userAgent: string | null) {
  return Boolean(userAgent && /mobile|iphone|android/i.test(userAgent));
}

function stageMeta(stage: string | null) {
  return STAGE_META[stage as Stage] ?? STAGE_META.landing;
}

function Panel({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`overflow-hidden rounded-[22px] border border-[#e8ddda] bg-white shadow-[0_22px_60px_-46px_rgba(61,11,38,0.42)] ${className}`}
    >
      {children}
    </section>
  );
}

function PanelHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#f0e7e3] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b65678]">
          {eyebrow}
        </p>
        <h2 className="mt-1 font-sans text-lg font-semibold tracking-[-0.025em] text-[#321328]">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-[#806c78]">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  progress,
  live,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  progress?: number;
  live?: boolean;
}) {
  if (live) {
    return (
      <section className="relative overflow-hidden rounded-[22px] bg-[#3d0b26] p-5 text-white shadow-[0_22px_48px_-30px_rgba(61,11,38,0.8)] sm:p-6">
        <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-[#c4688a]/25 blur-3xl" />
        <div className="relative flex items-start justify-between">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#efb6c9] ring-1 ring-white/10">
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-[#60b98c]/15 px-2.5 py-1 text-xs font-medium text-[#9ee0bd] ring-1 ring-[#60b98c]/20">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7cd3a7] opacity-50" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#7cd3a7]" />
            </span>
            Live
          </span>
        </div>
        <p className="relative mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
          {label}
        </p>
        <p className="relative mt-1 text-3xl font-semibold tracking-[-0.05em]">
          {value}
        </p>
        <p className="relative mt-2 text-sm text-white/50">{detail}</p>
      </section>
    );
  }

  return (
    <Panel className="group relative p-5 transition-transform duration-300 hover:-translate-y-0.5 sm:p-6">
      <div className="pointer-events-none absolute -right-12 -top-14 h-32 w-32 rounded-full bg-[#f8e8ee] opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
      <div className="relative flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f8edf1] text-[#b35475]">
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </span>
        {progress !== undefined ? (
          <span className="rounded-full bg-[#f5f0ed] px-2.5 py-1 text-xs font-semibold tabular-nums text-[#65525e]">
            {progress}%
          </span>
        ) : null}
      </div>
      <p className="relative mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8d7c86]">
        {label}
      </p>
      <p className="relative mt-1 text-3xl font-semibold tracking-[-0.05em] text-[#35162b]">
        {value}
      </p>
      <p className="relative mt-2 text-sm text-[#806f79]">{detail}</p>
      {progress !== undefined ? (
        <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-[#f1ebe8]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#b95879] to-[#d48ba4] transition-[width] duration-700"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      ) : null}
    </Panel>
  );
}

function SessionDrawer({
  token,
  password,
  onClose,
}: {
  token: string;
  password: string;
  onClose: () => void;
}) {
  const detail = trpc.admin.sessionDetail.useQuery(
    { token, password },
    { retry: false, staleTime: 30_000 }
  );
  const session = detail.data?.session;
  const storedPhotoValue = detail.data?.answers.find(
    answer =>
      answer.questionId === "photo" &&
      typeof answer.value === "string" &&
      STORED_PHOTO_DATA_URL.test(answer.value)
  )?.value;
  const hasLegacyPhoto = detail.data?.answers.some(
    answer => answer.questionId === "photo" && answer.value === "[photo added]"
  );
  const textAnswers =
    detail.data?.answers.filter(answer => answer.questionId !== "photo") ?? [];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="visitor-detail-title"
    >
      <button
        type="button"
        className="absolute inset-0 h-full w-full bg-[#2a081b]/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close visitor detail"
      />
      <aside className="animate-toast-in absolute inset-y-0 right-0 flex w-full max-w-xl flex-col overflow-hidden bg-[#faf6f3] shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#e9ded9] bg-white/90 px-6 py-5 backdrop-blur">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b55576]">
              Visitor profile
            </p>
            <h2
              id="visitor-detail-title"
              className="mt-1 font-sans text-xl font-semibold tracking-[-0.03em] text-[#35162b]"
            >
              {session?.name || "Anonymous visitor"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#806c78] transition hover:bg-[#f5edeb] hover:text-[#3d0b26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b95879]/30"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6">
          {detail.isLoading ? (
            <div className="space-y-4" aria-label="Loading visitor detail">
              <div className="h-28 animate-pulse rounded-2xl bg-[#eee5e1]" />
              <div className="h-56 animate-pulse rounded-2xl bg-[#eee5e1]" />
            </div>
          ) : detail.isError || !session ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fae9ee] text-[#b34f6f]">
                <Activity className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-semibold text-[#4b3041]">
                Visitor details unavailable
              </p>
              <p className="mt-1 max-w-xs text-xs leading-5 text-[#95838d]">
                {detail.isError
                  ? "The request did not complete. Retry it without closing this visitor."
                  : "This visitor is no longer available."}
              </p>
              {detail.isError ? (
                <button
                  type="button"
                  onClick={() => void detail.refetch()}
                  disabled={detail.isFetching}
                  className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#3d0b26] px-4 text-xs font-semibold text-white transition hover:bg-[#551039] disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${detail.isFetching ? "animate-spin" : ""}`} />
                  Retry visitor details
                </button>
              ) : null}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-[#e9ded9] bg-white p-4">
                  <MapPin className="h-4 w-4 text-[#b55576]" />
                  <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#99858f]">
                    Location
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-[#3d2133]">
                    {[session.city, session.country]
                      .filter(Boolean)
                      .join(", ") || "Unknown"}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#e9ded9] bg-white p-4">
                  {isMobileDevice(session.userAgent) ? (
                    <Smartphone className="h-4 w-4 text-[#b55576]" />
                  ) : (
                    <Laptop className="h-4 w-4 text-[#b55576]" />
                  )}
                  <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#99858f]">
                    Device
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#3d2133]">
                    {isMobileDevice(session.userAgent) ? "Mobile" : "Desktop"}
                  </p>
                </div>
                <div className="col-span-2 rounded-2xl border border-[#e9ded9] bg-white p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#99858f]">
                    Contact
                  </p>
                  <div className="mt-2 grid gap-1 text-sm text-[#493040] sm:grid-cols-2">
                    <p className="truncate">
                      {session.email || "No email captured"}
                    </p>
                    <p className="truncate sm:text-right">
                      {session.phone || "No phone captured"}
                    </p>
                  </div>
                </div>
              </div>

              {storedPhotoValue ? (
                <div className="mt-6 overflow-hidden rounded-2xl border border-[#e9ded9] bg-white">
                  <div className="flex items-center justify-between gap-3 px-5 py-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b55576]">
                        Uploaded photo
                      </p>
                      <p className="mt-1 text-xs text-[#8d7884]">
                        Private · visible to authorized admins only
                      </p>
                    </div>
                    <a
                      href={storedPhotoValue}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#f7eef1] px-3 py-2 text-xs font-semibold text-[#a84f6e] transition hover:bg-[#f1e2e7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b95879]/30"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Full size
                    </a>
                  </div>
                  <div className="border-t border-[#eee5e1] bg-[#f5efec] p-3">
                    <img
                      src={storedPhotoValue}
                      alt={`${session.name || "Visitor"}'s uploaded photo`}
                      className="mx-auto max-h-[520px] w-full rounded-xl object-contain shadow-sm"
                    />
                  </div>
                </div>
              ) : hasLegacyPhoto ? (
                <div className="mt-6 rounded-2xl border border-[#ead8c3] bg-[#fff9ef] p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9c6a2d]">
                    Earlier photo submission
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#765b3b]">
                    This visitor added a photo before private photo storage was
                    enabled. The original image was never sent to Revela and
                    cannot be recovered; they would need to upload it again.
                  </p>
                </div>
              ) : null}

              <div className="mt-6 rounded-2xl border border-[#e9ded9] bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b55576]">
                      Journey
                    </p>
                    <p className="mt-1 text-sm text-[#806f79]">
                      Every meaningful step in this session
                    </p>
                  </div>
                  <span className="rounded-full bg-[#f5efec] px-2.5 py-1 text-xs font-semibold text-[#78636f]">
                    {detail.data?.events.length ?? 0} events
                  </span>
                </div>
                <div className="mt-5 space-y-0">
                  {(detail.data?.events ?? []).map((event, index, events) => {
                    const meta = stageMeta(event.stage);
                    const question = event.questionId
                      ? QUESTIONS.find(item => item.id === event.questionId)
                      : null;
                    return (
                      <div
                        key={event.id}
                        className="grid grid-cols-[18px_minmax(0,1fr)_auto] gap-3"
                      >
                        <div className="flex flex-col items-center">
                          <span
                            className="mt-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-[#f5e9ed]"
                            style={{ backgroundColor: meta.color }}
                          />
                          {index < events.length - 1 ? (
                            <span className="min-h-8 w-px flex-1 bg-[#eadfda]" />
                          ) : null}
                        </div>
                        <div className="pb-5">
                          <p className="text-sm font-medium text-[#42263a]">
                            {event.kind === "stage"
                              ? `Entered ${meta.shortLabel}`
                              : `Question ${(event.questionIndex ?? 0) + 1}`}
                          </p>
                          {question ? (
                            <p className="mt-0.5 truncate text-xs text-[#917d88]">
                              {question.title}
                            </p>
                          ) : null}
                        </div>
                        <time
                          className="pt-0.5 text-[11px] tabular-nums text-[#a08f98]"
                          dateTime={String(event.createdAt)}
                        >
                          {new Date(event.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      </div>
                    );
                  })}
                </div>
              </div>

              {textAnswers.length > 0 ? (
                <div className="mt-6 rounded-2xl border border-[#e9ded9] bg-white p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b55576]">
                    Answers
                  </p>
                  <div className="mt-4 divide-y divide-[#f0e8e4]">
                    {textAnswers.map(answer => (
                      <div
                        key={answer.id}
                        className="py-3 first:pt-0 last:pb-0"
                      >
                        <p className="text-xs leading-5 text-[#8d7884]">
                          {QUESTIONS.find(
                            question => question.id === answer.questionId
                          )?.title ?? answer.questionId}
                        </p>
                        <p className="mt-1 text-sm font-medium text-[#42263a]">
                          {answer.value || "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function LockScreen({ onUnlock }: { onUnlock: (password: string) => void }) {
  const [password, setPassword] = useState("");
  const [showError, setShowError] = useState(false);
  const check = trpc.admin.check.useQuery(
    { password },
    { enabled: false, retry: false }
  );

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password) return;
    setShowError(false);
    const result = await check.refetch();
    if (result.data?.ok) onUnlock(password);
    else setShowError(true);
  };

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#f7f1ed] p-4 sm:p-6">
      <div className="pointer-events-none absolute -left-28 -top-28 h-96 w-96 rounded-full bg-[#e7b4c4]/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-36 -right-24 h-[28rem] w-[28rem] rounded-full bg-[#d7c49b]/25 blur-3xl" />

      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-[30px] border border-white bg-white shadow-[0_40px_110px_-48px_rgba(61,11,38,0.5)] md:grid-cols-[1.05fr_1fr]">
        <div className="relative hidden min-h-[570px] overflow-hidden bg-[#3d0b26] p-10 text-white md:flex md:flex-col md:justify-between">
          <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-[#c4688a]/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-[#c9a24b]/20 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#f0b1c6] ring-1 ring-white/10">
              <Heart className="h-5 w-5" fill="currentColor" />
            </span>
            <div>
              <p className="font-display text-xl font-semibold">Revela</p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-white/40">
                Intelligence center
              </p>
            </div>
          </div>

          <div className="relative max-w-xs">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#c4688a]/15 text-[#f0b1c6] ring-1 ring-[#d985a3]/20">
              <BarChart3 className="h-5 w-5" />
            </span>
            <h1 className="mt-6 font-sans text-3xl font-semibold leading-tight tracking-[-0.045em]">
              See the human story behind every number.
            </h1>
            <p className="mt-4 text-sm leading-6 text-white/50">
              Understand where visitors engage, where they leave, and who is
              moving through the experience right now.
            </p>
          </div>

          <div className="relative flex items-center gap-2 text-xs text-white/40">
            <ShieldCheck className="h-4 w-4 text-[#d889a5]" />
            Private workspace · Authorized access only
          </div>
        </div>

        <div className="flex min-h-[530px] flex-col justify-center px-6 py-10 sm:px-12 md:min-h-[570px]">
          <div className="mb-10 flex items-center gap-3 md:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3d0b26] text-[#f0b1c6]">
              <Heart className="h-5 w-5" fill="currentColor" />
            </span>
            <div>
              <p className="font-display text-xl font-semibold text-[#3d0b26]">
                Revela
              </p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#9a818e]">
                Intelligence center
              </p>
            </div>
          </div>

          <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f8e9ee] text-[#b45374]">
            <LockKeyhole className="h-[18px] w-[18px]" />
          </span>
          <h2 className="font-sans text-2xl font-semibold tracking-[-0.035em] text-[#37182d]">
            Welcome back
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#83707a]">
            Enter your admin password to open the live dashboard.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="admin-password"
                className="mb-2 block text-xs font-semibold text-[#5e4654]"
              >
                Password
              </label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#ab939f]" />
                <input
                  id="admin-password"
                  type="password"
                  autoFocus
                  autoComplete="current-password"
                  value={password}
                  onChange={event => {
                    setPassword(event.target.value);
                    setShowError(false);
                  }}
                  aria-invalid={showError}
                  aria-describedby={
                    showError ? "admin-password-error" : undefined
                  }
                  placeholder="Enter your password"
                  className="h-12 w-full rounded-xl border border-[#ded2d4] bg-[#fcfaf9] pl-10 pr-4 text-sm text-[#3d2133] outline-none transition focus:border-[#b65678] focus:ring-4 focus:ring-[#b65678]/10"
                />
              </div>
              {showError ? (
                <p
                  id="admin-password-error"
                  role="alert"
                  className="mt-2 text-sm text-[#b23f62]"
                >
                  {check.error?.data?.code === "UNAUTHORIZED"
                    ? "That password is not correct."
                    : "Unable to verify the password. Please try again."}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={!password || check.isFetching}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#3d0b26] px-4 text-sm font-semibold text-white shadow-[0_14px_28px_-18px_rgba(61,11,38,0.9)] transition hover:bg-[#551039] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#b65678]/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {check.isFetching ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <LockKeyhole className="h-4 w-4" />
              )}
              {check.isFetching ? "Verifying…" : "Open dashboard"}
              {!check.isFetching ? (
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              ) : null}
            </button>
          </form>

          <p className="mt-8 flex items-center gap-2 text-xs text-[#a08d97]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Your password is kept for this browser session only.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function Admin() {
  const [selected, setSelected] = useState<string | null>(null);
  const [password, setPassword] = useState(
    () => sessionStorage.getItem("revela_admin_pw") ?? ""
  );

  const unlock = (nextPassword: string) => {
    sessionStorage.setItem("revela_admin_pw", nextPassword);
    setPassword(nextPassword);
  };

  const lock = () => {
    sessionStorage.removeItem("revela_admin_pw");
    setSelected(null);
    setPassword("");
  };

  if (!password) return <LockScreen onUnlock={unlock} />;

  return (
    <AdminDashboard
      password={password}
      selected={selected}
      setSelected={setSelected}
      onLock={lock}
    />
  );
}

function AdminDashboard({
  password,
  selected,
  setSelected,
  onLock,
}: {
  password: string;
  selected: string | null;
  setSelected: (token: string | null) => void;
  onLock: () => void;
}) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<"all" | Stage>("all");
  const overview = trpc.admin.overview.useQuery(
    { password },
    {
      refetchInterval: 30_000,
      refetchIntervalInBackground: false,
      staleTime: 10_000,
      retry: false,
    }
  );
  const visitors = trpc.admin.visitors.useQuery(
    { password },
    {
      refetchInterval: 30_000,
      refetchIntervalInBackground: false,
      staleTime: 10_000,
      retry: false,
    }
  );
  const images = trpc.admin.images.useInfiniteQuery(
    { password, limit: 12 },
    {
      getNextPageParam: lastPage => lastPage.nextCursor,
      staleTime: 30_000,
      retry: false,
    }
  );

  const unauthorized =
    overview.error?.data?.code === "UNAUTHORIZED" ||
    visitors.error?.data?.code === "UNAUTHORIZED" ||
    images.error?.data?.code === "UNAUTHORIZED";

  useEffect(() => {
    if (unauthorized) onLock();
  }, [onLock, unauthorized]);

  const data = overview.data;
  const funnel = useMemo(() => {
    if (!data) return [];
    const reached: Record<Stage, number> = {
      landing: data.total,
      quiz: data.total - (data.stageCounts.landing ?? 0),
      analyzing:
        (data.stageCounts.analyzing ?? 0) + (data.stageCounts.report ?? 0),
      report: data.stageCounts.report ?? 0,
    };
    return STAGES.map((stage, index) => {
      const previous = index === 0 ? data.total : reached[STAGES[index - 1]];
      return {
        stage,
        count: reached[stage],
        overallRate: percentage(reached[stage], data.total),
        stepRate: percentage(reached[stage], previous),
      };
    });
  }, [data]);

  const topDropoffs = useMemo(() => {
    if (!data) return [];
    return QUESTIONS.map((question, index) => ({
      question,
      index,
      count: data.dropByIndex[index] ?? 0,
    }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [data]);

  const filteredVisitors = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return (visitors.data ?? []).filter(visitor => {
      const matchesStage =
        stageFilter === "all" || visitor.stage === stageFilter;
      const haystack = [
        visitor.name,
        visitor.email,
        visitor.phone,
        visitor.city,
        visitor.country,
        visitor.token,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (
        matchesStage &&
        (!normalizedSearch || haystack.includes(normalizedSearch))
      );
    });
  }, [search, stageFilter, visitors.data]);
  const uploadedImages = useMemo(
    () => images.data?.pages.flatMap(page => page.items) ?? [],
    [images.data]
  );
  const totalImages = images.data?.pages[0]?.total ?? 0;

  if (unauthorized) return null;

  const completionRate = data ? percentage(data.completed, data.total) : 0;
  const quizVisitors = funnel.find(step => step.stage === "quiz")?.count ?? 0;
  const reportRate = data ? percentage(data.completed, quizVisitors) : 0;
  const isRefreshing =
    overview.isFetching || visitors.isFetching || images.isRefetching;
  const lastUpdatedAt = Math.max(
    overview.dataUpdatedAt,
    visitors.dataUpdatedAt
  );

  const refresh = () => {
    void Promise.all([
      overview.refetch(),
      visitors.refetch(),
      images.refetch(),
    ]);
  };

  return (
    <div className="min-h-[100dvh] bg-[#f7f3f0] text-[#3d2133]">
      <header className="sticky top-0 z-30 border-b border-[#eadfda]/90 bg-[#f7f3f0]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1480px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[#3d0b26] text-[#f0b1c6] shadow-sm">
              <Heart className="h-4 w-4" fill="currentColor" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-semibold leading-5 text-[#3d0b26]">
                Revela
              </p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#9c8591]">
                Intelligence center
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-[#e3d8d4] bg-white px-3 py-1.5 text-xs text-[#6e5965] sm:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#55ad80] opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#55ad80]" />
              </span>
              Auto-sync on
            </div>
            <button
              type="button"
              onClick={refresh}
              disabled={isRefreshing}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#806c78] transition hover:bg-white hover:text-[#3d0b26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b95879]/30 disabled:opacity-50"
              aria-label="Refresh dashboard"
              title="Refresh dashboard"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
            <a
              href="/"
              className="hidden h-9 items-center rounded-lg px-3 text-xs font-medium text-[#806c78] transition hover:bg-white hover:text-[#3d0b26] sm:flex"
            >
              View site
            </a>
            <span className="mx-0.5 h-5 w-px bg-[#ded2ce]" />
            <button
              type="button"
              onClick={onLock}
              className="flex h-9 items-center gap-2 rounded-lg px-2.5 text-[#806c78] transition hover:bg-white hover:text-[#a64163] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b95879]/30 sm:px-3"
              aria-label="Lock dashboard"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden text-xs font-medium sm:inline">Lock</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1480px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#b55576]">
              <Sparkles className="h-3.5 w-3.5" />
              Audience intelligence
            </div>
            <h1 className="font-sans text-3xl font-semibold tracking-[-0.045em] text-[#321328] sm:text-4xl">
              Your audience, at a glance
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#806c78]">
              Follow the complete experience from first visit to finished
              report.
              {lastUpdatedAt ? (
                <span className="ml-1 text-[#9d8b94]">
                  Updated at{" "}
                  {new Date(lastUpdatedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                  .
                </span>
              ) : null}
            </p>
          </div>
          <div className="flex w-fit items-center gap-2 rounded-xl border border-[#e3d8d4] bg-white px-3.5 py-2 text-xs text-[#715d68] shadow-sm">
            <Wifi className="h-3.5 w-3.5 text-[#4e9e75]" />
            Refreshes every 30 seconds
          </div>
        </div>

        {(overview.isError || visitors.isError) && !unauthorized ? (
          <div
            role="alert"
            className="mb-5 flex flex-col gap-3 rounded-xl border border-[#e8c3ce] bg-[#fff5f8] px-4 py-3 text-sm text-[#94405d] sm:flex-row sm:items-center"
          >
            <Activity className="mt-0.5 h-4 w-4 flex-none" />
            <p className="flex-1">
              {overview.data || visitors.data
                ? "Live refresh did not complete. The last successful figures remain visible."
                : "Dashboard data could not be loaded. Retry now; the rest of the site is unaffected."}
            </p>
            <button
              type="button"
              onClick={refresh}
              disabled={isRefreshing}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-white px-3 text-xs font-semibold text-[#8f3b58] shadow-sm ring-1 ring-[#e8c3ce] transition hover:bg-[#fffafb] disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Retry data
            </button>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            icon={Activity}
            label="Live right now"
            value={data ? formatNumber(data.liveNow) : overview.isError ? "Unavailable" : "…"}
            detail={
              !data
                ? overview.isError
                  ? "Use Retry data above"
                  : "Loading live activity"
                : data.liveNow
                ? "Visitors active in the last 90 seconds"
                : "Waiting for the next visitor"
            }
            live
          />
          <MetricCard
            icon={Users}
            label="Total visitors"
            value={data ? formatNumber(data.total) : overview.isError ? "Unavailable" : "…"}
            detail={data ? "All tracked sessions" : overview.isError ? "Use Retry data above" : "Loading session count"}
          />
          <MetricCard
            icon={CheckCircle2}
            label="Reports reached"
            value={data ? formatNumber(data.completed) : overview.isError ? "Unavailable" : "…"}
            detail={data ? `${completionRate}% of all visitors` : overview.isError ? "Use Retry data above" : "Loading report totals"}
            progress={completionRate}
          />
          <MetricCard
            icon={BarChart3}
            label="Quiz completion"
            value={data ? `${reportRate}%` : overview.isError ? "Unavailable" : "…"}
            detail={data ? "Of visitors who entered the quiz" : overview.isError ? "Use Retry data above" : "Loading completion rate"}
            progress={reportRate}
          />
          <MetricCard
            icon={Timer}
            label="Average session"
            value={data ? formatDuration(data.avgDurationMs) : overview.isError ? "Unavailable" : "…"}
            detail={data ? "Time spent in the experience" : overview.isError ? "Use Retry data above" : "Loading session time"}
          />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
          <Panel>
            <PanelHeader
              eyebrow="Conversion"
              title="Experience funnel"
              description="How visitors move from arrival to their personal report"
              action={
                <span className="flex items-center gap-1.5 text-xs text-[#8c7782]">
                  <Users className="h-3.5 w-3.5" />
                  {data ? formatNumber(data.total) : "—"} entries
                </span>
              }
            />
            <div className="p-5 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {funnel.map((step, index) => {
                  const meta = STAGE_META[step.stage];
                  const previous = funnel[index - 1];
                  const lost = previous ? previous.count - step.count : 0;
                  return (
                    <div
                      key={step.stage}
                      className="relative rounded-2xl border border-[#ece2de] bg-[#fcfaf9] p-4 sm:p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: meta.color }}
                            />
                            <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#8d7884]">
                              {meta.shortLabel}
                            </p>
                          </div>
                          <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#35162b]">
                            {formatNumber(step.count)}
                          </p>
                        </div>
                        <span
                          className="rounded-full px-2.5 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor: meta.soft,
                            color: meta.text,
                          }}
                        >
                          {step.overallRate}%
                        </span>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eee6e2]">
                        <div
                          className="h-full rounded-full transition-[width] duration-700"
                          style={{
                            width: `${step.overallRate}%`,
                            backgroundColor: meta.color,
                          }}
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-[#897580]">
                          {index === 0
                            ? "Starting audience"
                            : `${step.stepRate}% from previous step`}
                        </span>
                        {lost > 0 ? (
                          <span className="font-semibold text-[#ad4f6d]">
                            −{formatNumber(lost)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              eyebrow="Friction"
              title="Biggest drop-off points"
              description="Questions worth reviewing first"
            />
            <div className="p-5 sm:p-6">
              {topDropoffs.length === 0 ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eaf6ef] text-[#46956d]">
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-[#4c3042]">
                    No quiz drop-offs yet
                  </p>
                  <p className="mt-1 text-xs text-[#95828c]">
                    Question-level friction will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topDropoffs.map((item, index) => {
                    const maxDropoff = topDropoffs[0]?.count || 1;
                    return (
                      <div key={item.question.id}>
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#f8e9ee] text-[10px] font-bold text-[#ad4e6e]">
                              Q{item.index + 1}
                            </span>
                            <p
                              className="truncate text-xs font-medium text-[#5f4655]"
                              title={item.question.title}
                            >
                              {item.question.title}
                            </p>
                          </div>
                          <span className="flex-none text-xs font-semibold tabular-nums text-[#a54564]">
                            {item.count} left
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-[#f0e9e6]">
                          <div
                            className={`h-full rounded-full ${index === 0 ? "bg-[#a94667]" : "bg-[#d0849e]"}`}
                            style={{
                              width: `${percentage(item.count, maxDropoff)}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Panel>
        </div>

        <Panel className="mt-5">
          <PanelHeader
            eyebrow="Geography"
            title="Where visitors come from"
            description="Location mix across all recorded sessions"
            action={
              <span className="flex items-center gap-1.5 text-xs text-[#8c7782]">
                <Globe2 className="h-3.5 w-3.5" />
                {data?.countries.length ?? 0} locations
              </span>
            }
          />
          <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
            {(data?.countries ?? []).slice(0, 8).map((country, index) => {
              const share = percentage(country.count, data?.total ?? 0);
              return (
                <div
                  key={country.country}
                  className="rounded-2xl border border-[#ece2de] bg-[#fcfaf9] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#f5ece9] text-[#a95271]">
                        {index === 0 ? (
                          <Globe2 className="h-4 w-4" />
                        ) : (
                          <MapPin className="h-4 w-4" />
                        )}
                      </span>
                      <p className="truncate text-sm font-semibold text-[#4a2d3f]">
                        {country.country}
                      </p>
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-[#9d4564]">
                      {share}%
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eee6e2]">
                      <div
                        className="h-full rounded-full bg-[#c4688a]"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-[#897580]">
                      {formatNumber(country.count)}
                    </span>
                  </div>
                </div>
              );
            })}
            {data && data.countries.length === 0 ? (
              <div className="col-span-full flex min-h-28 items-center justify-center text-sm text-[#927e89]">
                Location data will appear with the first tracked visitors.
              </div>
            ) : null}
          </div>
        </Panel>

        <Panel className="mt-5">
          <PanelHeader
            eyebrow="Private media"
            title="Uploaded images"
            description="Every recoverable visitor photo, newest first"
            action={
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5efec] px-2.5 py-1 text-xs font-semibold text-[#715d68]">
                <ImageIcon className="h-3.5 w-3.5" />
                {images.isLoading
                  ? "Loading…"
                  : `${formatNumber(totalImages)} ${totalImages === 1 ? "image" : "images"}`}
              </span>
            }
          />

          <div className="p-5 sm:p-6">
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#eadfd9] bg-[#fcf9f7] px-4 py-3.5">
              <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-[#f5e8ed] text-[#aa4e6d]">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-semibold text-[#523347]">
                  Private admin gallery
                </p>
                <p className="mt-0.5 text-xs leading-5 text-[#8d7884]">
                  These images are never public. Open a visitor profile for the
                  related answers and journey.
                </p>
              </div>
            </div>

            {images.isLoading ? (
              <div
                className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
                aria-label="Loading uploaded images"
              >
                {Array.from({ length: 6 }, (_, index) => (
                  <div
                    key={index}
                    className="aspect-[4/5] animate-pulse rounded-2xl bg-[#eee5e1]"
                  />
                ))}
              </div>
            ) : images.isError ? (
              <div className="flex min-h-52 flex-col items-center justify-center text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fae9ee] text-[#b34f6f]">
                  <ImageIcon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-semibold text-[#4b3041]">
                  Uploaded images are unavailable
                </p>
                <p className="mt-1 max-w-sm text-xs leading-5 text-[#95838d]">
                  The rest of the dashboard is still available. Retry this
                  gallery without reloading the page.
                </p>
                <button
                  type="button"
                  onClick={() => void images.refetch()}
                  disabled={images.isFetching}
                  className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#3d0b26] px-4 text-xs font-semibold text-white transition hover:bg-[#551039] disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${images.isFetching ? "animate-spin" : ""}`}
                  />
                  Retry images
                </button>
              </div>
            ) : uploadedImages.length === 0 ? (
              <div className="flex min-h-52 flex-col items-center justify-center text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f5e8ed] text-[#aa4e6d]">
                  <ImageIcon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-semibold text-[#4b3041]">
                  No stored images yet
                </p>
                <p className="mt-1 max-w-sm text-xs leading-5 text-[#95838d]">
                  New visitor photos will appear here after they are uploaded
                  and the dashboard refreshes.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {uploadedImages.map(item => {
                    const visitorLabel =
                      item.name || item.email || "Anonymous visitor";
                    const location = [item.city, item.country]
                      .filter(Boolean)
                      .join(", ");
                    return (
                      <article
                        key={item.id}
                        className="group overflow-hidden rounded-2xl border border-[#e9ded9] bg-white shadow-[0_16px_36px_-30px_rgba(61,11,38,0.7)]"
                      >
                        <a
                          href={item.photo}
                          target="_blank"
                          rel="noreferrer"
                          className="relative block aspect-[4/5] overflow-hidden bg-[#f0e8e4] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#b95879]/30"
                          aria-label={`Open ${visitorLabel}'s uploaded image full size`}
                        >
                          <img
                            src={item.photo}
                            alt={`${visitorLabel}'s uploaded photo`}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                            loading="lazy"
                            decoding="async"
                          />
                          <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-xl bg-[#2d0a1e]/75 text-white opacity-100 shadow-sm backdrop-blur-sm transition sm:opacity-0 sm:group-hover:opacity-100">
                            <Maximize2 className="h-3.5 w-3.5" />
                          </span>
                        </a>
                        <div className="p-3">
                          <p className="truncate text-xs font-semibold text-[#422438]">
                            {visitorLabel}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] text-[#97838e]">
                            {location || "Location unknown"}
                          </p>
                          <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#f0e8e4] pt-2.5">
                            <time className="truncate text-[10px] text-[#9c8993]">
                              {new Date(item.uploadedAt).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </time>
                            <button
                              type="button"
                              onClick={() => setSelected(item.token)}
                              className="flex-none text-[10px] font-semibold text-[#a84f6e] transition hover:text-[#70203f] focus-visible:outline-none focus-visible:underline"
                            >
                              View visitor
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {images.hasNextPage ? (
                  <div className="mt-6 flex flex-col items-center gap-2 border-t border-[#f0e7e3] pt-5">
                    <p className="text-xs text-[#8d7884]">
                      Showing {formatNumber(uploadedImages.length)} of{" "}
                      {formatNumber(totalImages)} images
                    </p>
                    <button
                      type="button"
                      onClick={() => void images.fetchNextPage()}
                      disabled={images.isFetchingNextPage}
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dfd2ce] bg-white px-4 text-xs font-semibold text-[#5a3d4f] transition hover:border-[#cfb9c1] hover:bg-[#fcf8f7] disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${images.isFetchingNextPage ? "animate-spin" : ""}`}
                      />
                      {images.isFetchingNextPage
                        ? "Loading…"
                        : "Load more images"}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </Panel>

        <Panel className="mt-5">
          <PanelHeader
            eyebrow="Visitor stream"
            title="All visitors"
            description="Search, filter, and open any session for the complete journey"
            action={
              <span className="rounded-full bg-[#f5efec] px-2.5 py-1 text-xs font-semibold text-[#715d68]">
                {formatNumber(filteredVisitors.length)} shown
              </span>
            }
          />

          <div className="flex flex-col gap-3 border-b border-[#f0e7e3] bg-[#fcfaf9] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a48f99]" />
              <input
                type="search"
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search name, email, location…"
                aria-label="Search visitors"
                className="h-10 w-full rounded-xl border border-[#e2d7d3] bg-white pl-9 pr-3 text-sm text-[#43263a] outline-none transition placeholder:text-[#aa98a1] focus:border-[#bc627f] focus:ring-3 focus:ring-[#bc627f]/10"
              />
            </div>
            <div
              className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-[#e2d7d3] bg-white p-1"
              aria-label="Filter visitors by stage"
            >
              {(["all", ...STAGES] as const).map(stage => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => setStageFilter(stage)}
                  aria-pressed={stageFilter === stage}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b95879]/30 ${
                    stageFilter === stage
                      ? "bg-[#3d0b26] text-white shadow-sm"
                      : "text-[#806c78] hover:bg-[#f7f1ee] hover:text-[#3d2133]"
                  }`}
                >
                  {stage === "all"
                    ? "All stages"
                    : STAGE_META[stage].shortLabel}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[960px] text-left">
              <thead>
                <tr className="border-b border-[#eee5e1] text-[10px] font-semibold uppercase tracking-[0.15em] text-[#927e89]">
                  <th className="px-6 py-3.5">Visitor</th>
                  <th className="px-4 py-3.5">Location</th>
                  <th className="px-4 py-3.5">Device</th>
                  <th className="px-4 py-3.5">Current stage</th>
                  <th className="px-4 py-3.5">Progress</th>
                  <th className="px-4 py-3.5">Time</th>
                  <th className="px-6 py-3.5 text-right">Last seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1e9e5]">
                {filteredVisitors.map(visitor => {
                  const meta = stageMeta(visitor.stage);
                  const question =
                    visitor.questionIndex >= 0
                      ? QUESTIONS[visitor.questionIndex]
                      : null;
                  const live =
                    lastUpdatedAt > 0 &&
                    lastUpdatedAt - new Date(visitor.lastSeenAt).getTime() <
                      90_000;
                  return (
                    <tr
                      key={visitor.token}
                      onClick={() => setSelected(visitor.token)}
                      className="group cursor-pointer transition-colors hover:bg-[#fcf8f7]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[#f7e9ee] text-sm font-semibold text-[#a84c6c]">
                            {(visitor.name || visitor.email || "A")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="max-w-[220px] truncate text-sm font-semibold text-[#422438]">
                              {visitor.name || "Anonymous"}
                            </p>
                            <p className="mt-0.5 max-w-[220px] truncate text-[11px] text-[#97838e]">
                              {visitor.email ||
                                `${visitor.token.slice(0, 12)}…`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-[#6e5965]">
                        {[visitor.city, visitor.country]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 text-sm text-[#6e5965]">
                          {isMobileDevice(visitor.userAgent) ? (
                            <Smartphone className="h-3.5 w-3.5" />
                          ) : (
                            <Laptop className="h-3.5 w-3.5" />
                          )}
                          {isMobileDevice(visitor.userAgent)
                            ? "Mobile"
                            : "Desktop"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{
                            backgroundColor: meta.soft,
                            color: meta.text,
                          }}
                        >
                          {live ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-[#4ca776]" />
                          ) : null}
                          {meta.shortLabel}
                        </span>
                      </td>
                      <td className="max-w-[240px] px-4 py-4">
                        {visitor.completed ? (
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3f8d65]">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Finished
                          </span>
                        ) : question ? (
                          <span
                            className="block truncate text-sm text-[#6e5965]"
                            title={question.title}
                          >
                            Q{visitor.questionIndex + 1} · {question.title}
                          </span>
                        ) : (
                          <span className="text-sm text-[#a08d97]">
                            Not started
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm tabular-nums text-[#6e5965]">
                        {formatDuration(visitor.durationMs)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-2 text-xs text-[#8d7884]">
                          {timeAgo(visitor.lastSeenAt, lastUpdatedAt)}
                          <ChevronRight className="h-3.5 w-3.5 text-[#b29ea8] transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-[#f0e7e3] md:hidden">
            {filteredVisitors.map(visitor => {
              const meta = stageMeta(visitor.stage);
              const question =
                visitor.questionIndex >= 0
                  ? QUESTIONS[visitor.questionIndex]
                  : null;
              const live =
                lastUpdatedAt > 0 &&
                lastUpdatedAt - new Date(visitor.lastSeenAt).getTime() < 90_000;
              return (
                <button
                  key={visitor.token}
                  type="button"
                  onClick={() => setSelected(visitor.token)}
                  className="w-full px-5 py-4 text-left transition hover:bg-[#fcf8f7]"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#f7e9ee] text-sm font-semibold text-[#a84c6c]">
                      {(visitor.name || visitor.email || "A")
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#422438]">
                            {visitor.name || "Anonymous"}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-[#97838e]">
                            {visitor.email ||
                              [visitor.city, visitor.country]
                                .filter(Boolean)
                                .join(", ") ||
                              `${visitor.token.slice(0, 12)}…`}
                          </p>
                        </div>
                        <span
                          className="inline-flex flex-none items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
                          style={{
                            backgroundColor: meta.soft,
                            color: meta.text,
                          }}
                        >
                          {live ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-[#4ca776]" />
                          ) : null}
                          {meta.shortLabel}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#7f6a76]">
                        <span className="truncate">
                          {visitor.completed
                            ? "✓ Finished"
                            : question
                              ? `Q${visitor.questionIndex + 1} · ${question.title}`
                              : "Not started"}
                        </span>
                        <span className="flex-none tabular-nums">
                          {timeAgo(visitor.lastSeenAt, lastUpdatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {visitors.isError && !visitors.data ? (
            <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">
              <Activity className="h-5 w-5 text-[#b34f6f]" />
              <p className="mt-3 text-sm font-semibold text-[#594051]">
                Visitor stream unavailable
              </p>
              <p className="mt-1 max-w-sm text-xs leading-5 text-[#998690]">
                The request stopped before any visitor records were returned.
              </p>
              <button
                type="button"
                onClick={() => void visitors.refetch()}
                disabled={visitors.isFetching}
                className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-[#3d0b26] px-3 text-xs font-semibold text-white transition hover:bg-[#551039] disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${visitors.isFetching ? "animate-spin" : ""}`} />
                Retry visitors
              </button>
            </div>
          ) : null}

          {visitors.isSuccess && filteredVisitors.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">
              <Eye className="h-5 w-5 text-[#b39fa9]" />
              <p className="mt-3 text-sm font-semibold text-[#594051]">
                No visitors match this view
              </p>
              <p className="mt-1 text-xs text-[#998690]">
                Try a different search or stage filter.
              </p>
            </div>
          ) : null}

          {visitors.isLoading ? (
            <div className="space-y-1 p-4" aria-label="Loading visitors">
              {[0, 1, 2].map(item => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-xl bg-[#f2ebe7]"
                />
              ))}
            </div>
          ) : null}
        </Panel>

        <footer className="mt-8 flex flex-col gap-2 border-t border-[#e4d9d5] pt-5 text-[11px] text-[#9a8791] sm:flex-row sm:items-center sm:justify-between">
          <p>Revela Intelligence Center · Private analytics</p>
          <p className="flex items-center gap-1.5">
            <RefreshCw className="h-3 w-3" /> Automatic sync is active
          </p>
        </footer>
      </main>

      {selected ? (
        <SessionDrawer
          token={selected}
          password={password}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}
