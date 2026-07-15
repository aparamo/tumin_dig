import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import { type Context } from "../../trpc/context";
import superjson from "superjson";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  isCoordinator,
  isRegionalCoordinator,
  type UserRole,
} from "./authorization";

export const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    // Prefer Zod issue messages (Spanish when schema defines them) over raw JSON dumps
    const zodMessage =
      error.cause instanceof ZodError
        ? error.cause.issues.map((issue) => issue.message).filter(Boolean).join(". ")
        : null;

    return {
      ...shape,
      message: zodMessage || shape.message,
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

const isAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  // Revalidate current user state against the database on every protected call.
  // This ensures that sessions are invalidated immediately when a user is frozen
  // or when their role/region changes, even though the JWT itself may still be
  // technically valid until it expires.
  const [dbUser] = await db
    .select({
      id: users.id,
      role: users.role,
      region: users.region,
      status: users.status,
    })
    .from(users)
    .where(eq(users.id, ctx.session.user.id))
    .limit(1);

  if (!dbUser || dbUser.status !== "ACTIVO") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Cuenta suspendida o eliminada",
    });
  }

  if (
    dbUser.role !== ctx.session.user.role ||
    dbUser.region !== ctx.session.user.region
  ) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Tu rol o región cambiaron. Inicia sesión de nuevo.",
    });
  }

  return next({
    ctx: {
      session: {
        ...ctx.session,
        user: { ...ctx.session.user, role: dbUser.role, region: dbUser.region },
      },
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);

export const coordinatorProcedure = protectedProcedure.use(({ ctx, next }) => {
  const role = ctx.session.user.role as UserRole;
  if (!isCoordinator(role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Se requiere rol de coordinador",
    });
  }
  return next({ ctx });
});

export const regionalCoordinatorProcedure = protectedProcedure.use(
  ({ ctx, next }) => {
    const role = ctx.session.user.role as UserRole;
    if (!isRegionalCoordinator(role) && role !== "COORDINADOR_GENERAL") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Se requiere rol regional",
      });
    }
    return next({ ctx });
  }
);

export const generalCoordinatorProcedure = protectedProcedure.use(
  ({ ctx, next }) => {
    if (ctx.session.user.role !== "COORDINADOR_GENERAL") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Se requiere rol de Coordinador General",
      });
    }
    return next({ ctx });
  }
);

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
const MAX_REQUESTS = 30; // per IP per window

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
  .use(isAuthed)
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
