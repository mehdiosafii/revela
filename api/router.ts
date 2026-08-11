import { createRouter, publicQuery } from "./middleware";
import { trackRouter, adminRouter, publicRouter } from "./queries/tracking";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  track: trackRouter,
  admin: adminRouter,
  public: publicRouter,
});

export type AppRouter = typeof appRouter;
