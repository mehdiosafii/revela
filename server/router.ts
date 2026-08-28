import { createRouter, publicQuery } from './middleware';
import { adminRouter } from './queries/tracking';
import { trackRouter } from './queries/tracking-fast';
import { reportRouter } from './queries/report-safe';
import { checkoutRouter } from './queries/checkout';
import { illustrationsRouter } from './queries/illustrations';

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  track: trackRouter,
  admin: adminRouter,
  report: reportRouter,
  checkout: checkoutRouter,
  illustrations: illustrationsRouter,
});

export type AppRouter = typeof appRouter;
