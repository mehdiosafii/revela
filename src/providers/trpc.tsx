import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink, splitLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import superjson from "superjson";
import type { AppRouter } from "../../server/router";
import type { ReactNode } from "react";

export const trpc = createTRPCReact<AppRouter>();

const queryClient = new QueryClient();
const fetchWithTimeout = (input: RequestInfo | URL, init?: RequestInit) => {
  const timeout = AbortSignal.timeout(20_000);
  const signal = init?.signal
    ? AbortSignal.any([init.signal, timeout])
    : timeout;
  return globalThis.fetch(input, {
    ...(init ?? {}),
    credentials: "include",
    signal,
  });
};

const trpcClient = trpc.createClient({
  links: [
    splitLink({
      condition: operation => operation.path.startsWith("admin."),
      true: httpBatchLink({
        url: "/api/trpc",
        transformer: superjson,
        maxItems: 1,
        methodOverride: "POST",
        fetch: fetchWithTimeout,
      }),
      false: httpBatchLink({
        url: "/api/trpc",
        transformer: superjson,
        maxItems: 10,
        fetch: fetchWithTimeout,
      }),
    }),
  ],
});

export function TRPCProvider({ children }: { children: ReactNode }) {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
