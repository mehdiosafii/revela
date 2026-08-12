import { useEffect, useState } from 'react';
import { downscalePhoto } from '../lib/photo';
import { trpc } from '../providers/trpc';
import { getToken } from '../lib/tracker';
import type { Answers } from '../lib/engine';

type Illus = { id: string; caption: string; image: string | null };

const CACHE_KEY = 'revela_illustrations_v1';

/* downscale to max 1024px JPEG before upload — keeps requests small and generation fast */
function downscale(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const max = 1024;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      if (scale === 1 && dataUrl.length < 1_500_000) return resolve(dataUrl);
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}


/* Envisioned — four personalized scenes generated from her photo.
   Runs only for unlocked reports with a photo; result cached in localStorage
   so the API is called once per visitor. */
export default function Illustrations({ answers }: { answers: Answers }) {
  const [photo, setPhoto] = useState<string | null>((answers.photo as string) || null);
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
    if (!photo || !photo.startsWith('data:image/')) return;
    downscale(photo)
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
          /* cache full — fine, images still shown this session */
        }
      })
      .catch(() => setFailed(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo, images, failed]);

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

      {!photo && !images ? (
        <label className="group mx-auto mt-10 flex max-w-md cursor-pointer flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-[#751545]/25 bg-white/60 p-10 text-center transition-colors hover:border-[#751545]/60">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#751545]/10 to-[#c4688a]/15 text-2xl text-[#751545]/60 transition-transform group-hover:scale-110">✦</div>
          <p className="text-[15px] font-medium text-[#3d0b26]">Add your photo to create your four scenes</p>
          <p className="text-[12px] text-[#751545]/50">Used only for these illustrations · never stored, never published</p>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const reader = new FileReader();
              reader.onload = () => downscalePhoto(String(reader.result)).then(setPhoto);
              reader.readAsDataURL(f);
            }}
          />
        </label>
      ) : loading ? (
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
