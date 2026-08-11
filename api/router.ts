import { createRouter, publicQuery } from "./middleware";
import { trackRouter, adminRouter } from "./queries/tracking";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  track: trackRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
