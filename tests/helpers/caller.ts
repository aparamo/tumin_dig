import type { Session } from "next-auth";
import { createCallerFactory } from "@/lib/trpc/server";
import { appRouter } from "@/trpc/routers/_app";
import type { UserRole } from "@/lib/trpc/authorization";

const createCaller = createCallerFactory(appRouter);

let ipCounter = 0;

function uniqueIp(): string {
  const i = ++ipCounter;
  return `10.${(i >> 16) & 255}.${(i >> 8) & 255}.${i & 255}`;
}

export interface FakeUserSession {
  id: string;
  role: UserRole;
  region: string;
  isVerified?: boolean;
  name?: string | null;
  email?: string | null;
  residenceState?: string | null;
  residenceCountry?: string | null;
  avatarUrl?: string | null;
}

export function makeSession(user: FakeUserSession): Session {
  return {
    expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    user: {
      id: user.id,
      name: user.name ?? "Test User",
      email: user.email ?? null,
      role: user.role,
      region: user.region,
      isVerified: user.isVerified ?? false,
      residenceState: user.residenceState ?? null,
      residenceCountry: user.residenceCountry ?? null,
      avatarUrl: user.avatarUrl ?? null,
    },
  };
}

export function createTestCaller(user: FakeUserSession | null) {
  const session = user ? makeSession(user) : null;
  const headers = new Headers({
    "x-forwarded-for": uniqueIp(),
  });
  return createCaller({ session, headers });
}
