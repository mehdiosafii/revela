import { useEffect, useState } from 'react';
import { disableMetaTracking, enableMetaTracking, flushPendingPixelEvents } from '../lib/fbpixel';

const CONSENT_KEY = 'revela_marketing_consent';
type Consent = 'granted' | 'denied' | null;

function readConsent(): Consent {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

export default function ConsentBanner() {
  const [consent, setConsent] = useState<Consent>(readConsent);
  const [open, setOpen] = useState(() => readConsent() === null);

  useEffect(() => {
    if (consent !== 'granted') return;
    window.revelaLoadMetaPixel?.();
    flushPendingPixelEvents();
  }, [consent]);

  const choose = (next: Exclude<Consent, null>) => {
    if (next === 'granted') enableMetaTracking();
    else disableMetaTracking();
    setConsent(next);
    setOpen(false);
  };

  return (
    <>
      {open && (
        <aside className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-2xl rounded-2xl border border-[#751545]/15 bg-[#fbf5ef]/97 p-4 shadow-[0_18px_60px_rgba(61,11,38,.22)] backdrop-blur-md sm:inset-x-6 sm:flex sm:items-center sm:gap-5 sm:p-5">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-[#3d0b26]">Your privacy choice</p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#4a1230]/65">
              Essential browser storage keeps assessment progress. With permission, Meta Pixel helps measure ads and verified purchases. Revela does not send assessment-answer text to Meta.{' '}
              <a href="/privacy" className="font-medium text-[#751545] underline underline-offset-2">Privacy details</a>
            </p>
          </div>
          <div className="mt-4 flex shrink-0 gap-2 sm:mt-0">
            <button onClick={() => choose('denied')} className="rounded-full border border-[#751545]/20 px-4 py-2.5 text-[12px] font-semibold text-[#751545]">
              Decline
            </button>
            <button onClick={() => choose('granted')} className="rounded-full bg-[#751545] px-4 py-2.5 text-[12px] font-semibold text-white">
              Allow measurement
            </button>
          </div>
        </aside>
      )}

      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="no-print fixed bottom-3 left-3 z-[75] rounded-full border border-[#751545]/12 bg-[#fbf5ef]/92 px-3 py-2 text-[10.5px] font-semibold text-[#751545]/65 shadow-sm backdrop-blur-md hover:text-[#751545]"
          aria-label="Open privacy settings"
        >
          Privacy settings
        </button>
      )}
    </>
  );
}
