const CONSENT_KEY = 'revela_marketing_consent';
const PURCHASED_KEY = 'revela_fb_purchase';
const PENDING_PURCHASE_KEY = 'revela_fb_purchase_pending';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    revelaLoadMetaPixel?: () => void;
  }
}

function hasMarketingConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'granted';
  } catch {
    return false;
  }
}

export function enableMetaTracking() {
  try {
    localStorage.setItem(CONSENT_KEY, 'granted');
  } catch {
    // The loader still works for this page even if storage is unavailable.
  }
  window.revelaLoadMetaPixel?.();
  flushPendingPixelEvents();
}

export function disableMetaTracking() {
  try {
    localStorage.setItem(CONSENT_KEY, 'denied');
    localStorage.removeItem(PENDING_PURCHASE_KEY);
  } catch {
    // Non-fatal.
  }
}

export function fbTrack(event: string, params?: Record<string, unknown>) {
  if (!hasMarketingConsent()) return;
  try {
    window.fbq?.('track', event, params ?? {});
  } catch {
    // Analytics must never break the experience.
  }
}

export function fbTrackCustom(event: string, params?: Record<string, unknown>) {
  if (!hasMarketingConsent()) return;
  try {
    window.fbq?.('trackCustom', event, params ?? {});
  } catch {
    // Non-fatal.
  }
}

export function fbTrackPurchaseOnce(value: number, currency: string) {
  try {
    if (localStorage.getItem(PURCHASED_KEY)) return;
    if (!hasMarketingConsent()) {
      localStorage.setItem(PENDING_PURCHASE_KEY, JSON.stringify({ value, currency }));
      return;
    }
    window.revelaLoadMetaPixel?.();
    window.fbq?.('track', 'Purchase', { value, currency });
    localStorage.setItem(PURCHASED_KEY, '1');
    localStorage.removeItem(PENDING_PURCHASE_KEY);
  } catch {
    // Non-fatal.
  }
}

export function flushPendingPixelEvents() {
  if (!hasMarketingConsent()) return;
  try {
    const raw = localStorage.getItem(PENDING_PURCHASE_KEY);
    if (!raw || localStorage.getItem(PURCHASED_KEY)) return;
    const parsed = JSON.parse(raw) as { value?: number; currency?: string };
    if (typeof parsed.value !== 'number' || typeof parsed.currency !== 'string') return;
    window.revelaLoadMetaPixel?.();
    window.fbq?.('track', 'Purchase', { value: parsed.value, currency: parsed.currency });
    localStorage.setItem(PURCHASED_KEY, '1');
    localStorage.removeItem(PENDING_PURCHASE_KEY);
  } catch {
    // Non-fatal.
  }
}
