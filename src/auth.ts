import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "./db";
import { users } from "./db/schema";
import { eq, or, and, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import "next-auth/jwt";
import { isSystemAccountId } from "./lib/system-user";

declare module "next-auth" {
  interface User {
    id?: string;
    role: string;
    /** Enrollment / adscripción region — coordinator jurisdiction */
    region: string;
    residenceState?: string | null;
    residenceCountry?: string | null;
    isVerified: boolean;
    avatarUrl?: string | null;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      region: string;
      residenceState?: string | null;
      residenceCountry?: string | null;
      isVerified: boolean;
      avatarUrl?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    region: string;
    residenceState?: string | null;
    residenceCountry?: string | null;
    isVerified: boolean;
    avatarUrl?: string | null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "Phone or Email", type: "text" },
        nip: { label: "NIP", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({
            identifier: z.string().min(1),
            nip: z.string().min(1),
          })
          .safeParse(credentials);

        if (!parsed.success) return null;

        const { identifier, nip } = parsed.data;

        const [user] = await db
          .select()
          .from(users)
          .where(or(eq(users.phone, identifier), eq(users.email, identifier)))
          .limit(1);

        if (!user) return null;

        // Block internal system accounts from ever logging in
        if (isSystemAccountId(user.id)) {
          return null;
        }

        // Block frozen accounts and include a regional support contact when available
        if (user.status === "CONGELADO") {
          const jurisdictionConditions = [eq(users.region, user.region)];
          if (user.residenceState) {
            jurisdictionConditions.push(eq(users.residenceState, user.residenceState));
          }

          const contacts = await db
            .select({ phone: users.phone, name: users.name })
            .from(users)
            .where(
              and(
                eq(users.status, "ACTIVO"),
                or(...jurisdictionConditions),
                or(
                  eq(users.role, "COORDINADOR"),
                  eq(users.role, "COORDINADOR_LOCAL"),
                  eq(users.role, "COORDINADOR_GENERAL")
                )
              )
            )
            .orderBy(sql`RANDOM()`)
            .limit(2);

          const contactInfo =
            contacts.length > 0
              ? ` Contacta a tus Bantúmines: ${contacts.map((c) => `${c.name} ${c.phone}`).join(" / ")}`
              : "";
          throw new Error(`Tu cuenta está suspendida.${contactInfo}`);
        }

        // Security check: Lockout
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error(`Cuenta bloqueada temporalmente hasta ${user.lockedUntil.toLocaleString()}.`);
        }

        const isNipValid = await bcrypt.compare(nip, user.nip);

        if (!isNipValid) {
          const attempts = user.failedLoginAttempts + 1;
          if (attempts >= 5) {
            const lockoutTime = new Date(Date.now() + 15 * 60000); // 15 mins
            await db.update(users)
              .set({ failedLoginAttempts: attempts, lockedUntil: lockoutTime })
              .where(eq(users.id, user.id));
            throw new Error("Demasiados intentos. Cuenta bloqueada por 15 minutos.");
          } else {
            await db.update(users)
              .set({ failedLoginAttempts: attempts })
              .where(eq(users.id, user.id));
            throw new Error(`NIP incorrecto. Intento ${attempts} de 5.`);
          }
        }

        // Reset on success
        if (user.failedLoginAttempts > 0 || user.lockedUntil) {
          await db.update(users)
            .set({ failedLoginAttempts: 0, lockedUntil: null })
            .where(eq(users.id, user.id));
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          region: user.region,
          residenceState: user.residenceState,
          residenceCountry: user.residenceCountry,
          isVerified: user.isVerified,
          avatarUrl: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.region = user.region;
        token.residenceState = user.residenceState ?? null;
        token.residenceCountry = user.residenceCountry ?? null;
        token.isVerified = user.isVerified;
        token.avatarUrl = user.avatarUrl ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.region = token.region as string;
        session.user.residenceState = (token.residenceState as string | null) ?? null;
        session.user.residenceCountry = (token.residenceCountry as string | null) ?? null;
        session.user.isVerified = token.isVerified as boolean;
        session.user.avatarUrl = (token.avatarUrl as string | null) ?? null;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
});
