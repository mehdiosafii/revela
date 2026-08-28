import type { HttpBindings } from '@hono/node-server';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { createContext } from './context';
import { appRouter } from './router';

const app = new Hono<{ Bindings: HttpBindings }>();

// The largest legitimate request is an optional, downscaled paid illustration photo.
app.use('/api/*', bodyLimit({ maxSize: 6 * 1024 * 1024 }));
app.use('/api/*', async (context, next) => {
  await next();
  context.header('cache-control', 'no-store');
  context.header('x-content-type-options', 'nosniff');
  context.header('referrer-policy', 'strict-origin-when-cross-origin');
});

app.get('/api/health', (context) => context.json({ ok: true, ts: Date.now() }));
app.use('/api/trpc/*', async (context) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req: context.req.raw,
    router: appRouter,
    createContext,
    allowMethodOverride: true,
  }),
);
app.all('/api/*', (context) => context.json({ error: 'Not Found' }, 404));

export default app;
