import { createRouter, publicQuery } from "./middleware";
import { trackRouter, adminRouter, publicRouter } from "./queries/tracking";
import { reportRouter } from "./queries/report";
import { illustrationsRouter } from "./queries/illustrations";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  track: trackRouter,
  admin: adminRouter,
  public: publicRouter,
  report: reportRouter,
  illustrations: illustrationsRouter,
});

export type AppRouter = typeof appRouter;
