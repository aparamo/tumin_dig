import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import { type Context } from "../../trpc/context";
import superjson from "superjson";

export const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        // Only expose field-level Zod details in development
        zodError:
          process.env.NODE_ENV !== "production" && error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

// ---------------------------------------------------------------------------
// In-memory rate limiter (no external dependency required)
// Sliding-window counter per IP address, resets every WINDOW_MS milliseconds.
// For multi-instance/production deployments, swap this for Upstash Redis.
// ---------------------------------------------------------------------------
interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 30;  // per IP per window

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, windowStart: now });
    return true;
  }

  entry.count += 1;
  if (entry.count > MAX_REQUESTS) return false;
  return true;
}

// Periodically purge stale entries to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now - entry.windowStart > WINDOW_MS * 2) rateLimitStore.delete(ip);
  }
}, WINDOW_MS * 2);

/** Rate-limited public procedure — applies to sensitive unauthenticated endpoints */
export const rateLimitedPublicProcedure = t.procedure.use(async ({ ctx, next }) => {
  const ip =
    ctx.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    ctx.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(ip)) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Demasiadas solicitudes. Por favor espera un momento.",
    });
  }
  return next({ ctx });
});

/** Rate-limited protected procedure — for sensitive authenticated mutations */
export const rateLimitedProtectedProcedure = t.procedure
  .use(({ ctx, next }) => {
    if (!ctx.session || !ctx.session.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  })
  .use(async ({ ctx, next }) => {
    const ip =
      ctx.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      ctx.headers.get("x-real-ip") ??
      "unknown";

    if (!checkRateLimit(ip)) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Demasiadas solicitudes. Por favor espera un momento.",
      });
    }
    return next({ ctx });
  });
