import { useEffect, useState } from 'react';
import { downscalePhoto } from '../lib/photo';
import { trpc } from '../providers/trpc';
import { getToken } from '../lib/tracker';
import type { Answers } from '../lib/engine';

type Illus = { id: string; caption: string; image: string | null };

const CACHE_KEY = 'revela_illustrations_v1';

/* Shared generation state: fetches the 4 personalized scenes once
   (cached in localStorage), exposes them by id so each scene can live
   inside the report chapter it belongs to. */
export function useIllustrations(answers: Answers) {
  const [photo, setPhoto] = useState<string | null>(
    typeof answers.photo === 'string' && answers.photo.startsWith('data:image/') ? answers.photo : null,
  );
  const [images, setImages] = useState<Illus[] | null>(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? (JSON.parse(raw) as Illus[]) : null;
    } catch {
      return null;
    }
  });
  const [failed, setFailed] = useState(false);
  const gen = trpc.illustrations.generate.useMutation();

  useEffect(() => {
    if (images || failed || gen.isPending) return;
    if (!photo) return;
    downscalePhoto(photo)
      .then((small) => gen.mutateAsync({ token: getToken(), photo: small }))
      .then((res) => {
        const ok = res.images.filter((i) => i.image);
        if (!ok.length) {
          setFailed(true);
          return;
        }
        setImages(res.images);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(res.images));
        } catch {
          /* cache full — still shown this session */
        }
      })
      .catch(() => setFailed(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo, images, failed]);

  const setFromFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => downscalePhoto(String(reader.result)).then(setPhoto);
    reader.readAsDataURL(f);
  };

  const byId = (id: string) => images?.find((i) => i.id === id) ?? null;
  const loading = !!photo && !images && !failed;

  return { photo, images, byId, loading, failed, setFromFile };
}

export type IllustrationsState = ReturnType<typeof useIllustrations>;

/* One scene, embedded inside its chapter. Shows a shimmer while
   generating; renders nothing if no photo / generation failed. */
export function Scene({ id, state }: { id: string; state: IllustrationsState }) {
  const item = state.byId(id);
  if (!state.photo && !item) return null;
  if (state.failed && !item) return null;
  if (state.loading || !item?.image) {
    if (!state.loading) return null;
    return (
      <div className="mx-auto mt-10 max-w-md animate-pulse rounded-3xl border border-[#751545]/10 bg-white/70 p-3">
        <div className="aspect-[4/5] w-full rounded-2xl bg-gradient-to-br from-[#f3e8df] to-[#e9d9cc]" />
        <div className="mx-auto mt-4 mb-2 h-3 w-2/3 rounded bg-[#e9d9cc]" />
      </div>
    );
  }
  return (
    <figure className="mx-auto mt-10 max-w-md rounded-3xl border border-[#751545]/10 bg-white/85 p-3 shadow-sm">
      <img src={item.image} alt={item.caption} className="aspect-[4/5] w-full rounded-2xl object-cover" loading="lazy" />
      <figcaption className="px-2 py-4 text-center">
        <span className="font-display block text-[15px] italic text-[#3d0b26]">{item.caption}</span>
        <span className="mt-1 block text-[10px] uppercase tracking-[0.15em] text-[#4a1230]/35">
          Illustration created from your photo · not a prediction
        </span>
      </figcaption>
    </figure>
  );
}

/* Shown once, early in the report, when no photo exists yet. */
export function ScenePhotoPrompt({ state, name }: { state: IllustrationsState; name?: string }) {
  if (state.photo || state.images) return null;
  return (
    <section className="mx-auto max-w-2xl px-6 pt-14">
      <label className="group flex cursor-pointer flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-[#751545]/25 bg-white/60 p-9 text-center transition-colors hover:border-[#751545]/60">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#751545]/10 to-[#c4688a]/15 text-2xl text-[#751545]/60 transition-transform group-hover:scale-110">
          ✦
        </div>
        <p className="text-[15px] font-medium text-[#3d0b26]">
          {name ? `${name}, add` : 'Add'} a photo of yourself to see four scenes from the life past the pattern — woven through your reading
        </p>
        <p className="text-[12px] text-[#751545]/50">Used only for these illustrations · never stored, never published</p>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) state.setFromFile(f);
          }}
        />
      </label>
    </section>
  );
}
