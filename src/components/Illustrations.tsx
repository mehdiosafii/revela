import { useEffect, useState } from 'react';
import { trpc } from '../providers/trpc';
import { getToken } from '../lib/tracker';
import type { Answers } from '../lib/engine';

type Illus = { id: string; caption: string; image: string | null };

const CACHE_KEY = 'revela_illustrations_v1';

/* Envisioned — four personalized scenes generated from her photo.
   Runs only for unlocked reports with a photo; result cached in localStorage
   so the API is called once per visitor. */
export default function Illustrations({ answers }: { answers: Answers }) {
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
    const photo = answers.photo;
    if (!photo || typeof photo !== 'string' || !photo.startsWith('data:image/')) return;
    gen
      .mutateAsync({ token: getToken(), photo })
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
          /* cache full — fine, images still shown this session */
        }
      })
      .catch(() => setFailed(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers.photo, images, failed]);

  if (!answers.photo) return null;
  if (failed && !images) return null;

  const loading = !images;
  const shown = (images ?? []).filter((i) => i.image);

  return (
    <section className="mx-auto max-w-3xl px-6 pt-20">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c4688a]">Reading VII</p>
        <h2 className="font-display mt-3 text-3xl font-medium text-[#3d0b26]">See it, {answers.name || 'love'}</h2>
        <p className="mx-auto mt-3 max-w-xl text-[14.5px] leading-relaxed text-[#4a1230]/70">
          Four scenes from the life on the other side of the pattern — created from your photo, so the woman in them is unmistakably you.
        </p>
      </div>

      {loading ? (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-3xl border border-[#751545]/10 bg-white/70 p-3">
              <div className="aspect-[4/5] w-full rounded-2xl bg-gradient-to-br from-[#f3e8df] to-[#e9d9cc]" />
              <div className="mx-auto mt-4 mb-2 h-3 w-2/3 rounded bg-[#e9d9cc]" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {shown.map((img) => (
            <figure key={img.id} className="rounded-3xl border border-[#751545]/10 bg-white/85 p-3 shadow-sm">
              <img
                src={img.image!}
                alt={img.caption}
                className="aspect-[4/5] w-full rounded-2xl object-cover"
                loading="lazy"
              />
              <figcaption className="px-2 py-4 text-center font-display text-[15px] italic text-[#3d0b26]">
                {img.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <p className="mt-6 text-center text-[11px] leading-relaxed text-[#4a1230]/45">
        Artistic illustrations created from your photo to help you visualize the path — not photographs, promises, or predictions.
        Your photo is used only for this and is never stored.
      </p>
    </section>
  );
}
