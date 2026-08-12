import app from "./app";
import { env } from "./lib/env";

// Vite dev-server entry + optional self-hosted Node server.
// On Vercel this file is never imported — api/index.ts uses server/app.ts directly.
export default app;

if (env.isProduction && !process.env.VERCEL) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
