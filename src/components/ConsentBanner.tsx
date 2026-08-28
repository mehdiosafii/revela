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

  useEffect(() => {
    if (consent !== 'granted') return;
    window.revelaLoadMetaPixel?.();
    flushPendingPixelEvents();
  }, [consent]);

  if (consent) return null;

  return (
    <aside className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-2xl rounded-2xl border border-[#751545]/15 bg-[#fbf5ef]/95 p-4 shadow-[0_18px_60px_rgba(61,11,38,.22)] backdrop-blur-md sm:inset-x-6 sm:flex sm:items-center sm:gap-5 sm:p-5">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-[#3d0b26]">Your privacy choice</p>
        <p className="mt-1 text-[12px] leading-relaxed text-[#4a1230]/65">
          Essential browser storage keeps your assessment progress. With your permission, Meta Pixel helps us measure ads and purchases. We never send your assessment-answer text to Meta.{' '}
          <a href="/privacy" className="font-medium text-[#751545] underline underline-offset-2">Privacy details</a>
        </p>
      </div>
      <div className="mt-4 flex shrink-0 gap-2 sm:mt-0">
        <button
          onClick={() => {
            disableMetaTracking();
            setConsent('denied');
          }}
          className="rounded-full border border-[#751545]/20 px-4 py-2.5 text-[12px] font-semibold text-[#751545]"
        >
          Decline
        </button>
        <button
          onClick={() => {
            enableMetaTracking();
            setConsent('granted');
          }}
          className="rounded-full bg-[#751545] px-4 py-2.5 text-[12px] font-semibold text-white"
        >
          Allow measurement
        </button>
      </div>
    </aside>
  );
}
