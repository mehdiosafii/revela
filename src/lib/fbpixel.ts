/* Meta Pixel helper — safe no-op if fbq hasn't loaded (ad blockers etc.) */
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function fbTrack(event: string, params?: Record<string, unknown>) {
  try {
    window.fbq?.('track', event, params ?? {});
  } catch {
    /* never break the app over analytics */
  }
}

export function fbTrackCustom(event: string, params?: Record<string, unknown>) {
  try {
    window.fbq?.('trackCustom', event, params ?? {});
  } catch {
    /* noop */
  }
}

/* Purchase must fire once per browser, not on every revisit of ?unlocked=1 */
export function fbTrackPurchaseOnce(value: number, currency: string) {
  try {
    if (localStorage.getItem('revela_fb_purchase')) return;
    localStorage.setItem('revela_fb_purchase', '1');
    window.fbq?.('track', 'Purchase', { value, currency });
  } catch {
    /* noop */
  }
}
