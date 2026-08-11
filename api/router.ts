import { createRouter, publicQuery } from "./middleware";
import { trackRouter, adminRouter, publicRouter } from "./queries/tracking";
import { reportRouter } from "./queries/report";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  track: trackRouter,
  admin: adminRouter,
  public: publicRouter,
  report: reportRouter,
});

export type AppRouter = typeof appRouter;
