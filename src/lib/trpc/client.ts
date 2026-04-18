import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../../trpc/routers/_app";
import superjson from "superjson";

export const client = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      transformer: superjson,
      url: "/api/trpc",
    }),
  ],
});
