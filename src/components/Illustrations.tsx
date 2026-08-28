import { useEffect, useMemo, useState } from 'react';
import { downscalePhoto } from '../lib/photo';
import { getToken } from '../lib/tracker';
import { trpc } from '../providers/trpc';
import type { Answers } from '../lib/engine';

type Illustration = { id: string; caption: string; image: string | null };

export function useIllustrations(answers: Answers) {
  const cacheKey = useMemo(() => `revela_illustrations_v2_${getToken()}`, []);
  const [photo, setPhoto] = useState<string | null>(
    typeof answers.photo === 'string' && answers.photo.startsWith('data:image/') ? answers.photo : null,
  );
  const [images, setImages] = useState<Illustration[] | null>(() => {
    try {
      const raw = localStorage.getItem(cacheKey);
      return raw ? (JSON.parse(raw) as Illustration[]) : null;
    } catch {
      return null;
    }
  });
  const [failed, setFailed] = useState(false);
  const generation = trpc.illustrations.generate.useMutation();

  useEffect(() => {
    if (images || failed || generation.isPending || !photo) return;
    downscalePhoto(photo)
      .then((small) => generation.mutateAsync({ token: getToken(), photo: small }))
      .then((result) => {
        if (!result.images.some((item) => item.image)) {
          setFailed(true);
          return;
        }
        setImages(result.images);
        try {
          localStorage.setItem(cacheKey, JSON.stringify(result.images));
        } catch {
          // Browser caching is optional; the images still work in this session.
        }
      })
      .catch(() => setFailed(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo, images, failed]);

  const setFromFile = (file: File) => {
    setFailed(false);
    setImages(null);
    try {
      localStorage.removeItem(cacheKey);
    } catch {
      // Non-fatal.
    }
    const reader = new FileReader();
    reader.onload = () => {
      downscalePhoto(String(reader.result)).then(setPhoto).catch(() => setFailed(true));
    };
    reader.readAsDataURL(file);
  };

  const byId = (id: string) => images?.find((item) => item.id === id) ?? null;
  return {
    photo,
    images,
    byId,
    loading: Boolean(photo && !images && !failed),
    failed,
    setFromFile,
  };
}

export type IllustrationsState = ReturnType<typeof useIllustrations>;

export function Scene({ id, state }: { id: string; state: IllustrationsState }) {
  const item = state.byId(id);
  if ((!state.photo && !item) || (state.failed && !item)) return null;

  if (state.loading || !item?.image) {
    if (!state.loading) return null;
    return (
      <div className="mx-auto mt-10 max-w-md animate-pulse rounded-3xl border border-[#751545]/10 bg-white/70 p-3">
        <div className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-[#f3e8df] to-[#e9d9cc]" />
        <div className="mx-auto mb-2 mt-4 h-3 w-2/3 rounded bg-[#e9d9cc]" />
      </div>
    );
  }

  return (
    <figure className="mx-auto mt-10 max-w-md rounded-3xl border border-[#751545]/10 bg-white/85 p-3 shadow-sm">
      <img src={item.image} alt={item.caption} className="aspect-[4/5] w-full rounded-2xl object-cover" loading="lazy" />
      <figcaption className="px-2 py-4 text-center">
        <span className="font-display block text-[15px] italic text-[#3d0b26]">{item.caption}</span>
        <span className="mt-1 block text-[10px] uppercase tracking-[0.15em] text-[#4a1230]/35">
          Optional creative illustration · not a memory or prediction
        </span>
      </figcaption>
    </figure>
  );
}

export function ScenePhotoPrompt({ state, name }: { state: IllustrationsState; name?: string }) {
  if (state.photo || state.images) return null;

  return (
    <section className="no-print mx-auto max-w-2xl px-6 pt-14">
      <label className="group flex cursor-pointer flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-[#751545]/25 bg-white/60 p-9 text-center transition hover:border-[#751545]/60">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#751545]/10 text-2xl text-[#751545]/60">✦</div>
        <p className="text-[15px] font-medium text-[#3d0b26]">
          {name ? `${name}, add` : 'Add'} a photo to create four optional reflection illustrations
        </p>
        <p className="max-w-lg text-[12px] leading-relaxed text-[#751545]/50">
          The source photo is processed for this request and is not written to Revela’s database or permanent server storage. It is sent to our image-generation provider; generated images may be cached in this browser. See the Privacy Policy.
        </p>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) state.setFromFile(file);
          }}
        />
      </label>
    </section>
  );
}
