import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "./db";
import { users } from "./db/schema";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id?: string;
    role: string;
    region: string;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      region: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    region: string;
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
        if (!credentials?.identifier || !credentials?.nip) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(
            or(
              eq(users.phone, credentials.identifier as string),
              eq(users.email, credentials.identifier as string)
            )
          )
          .limit(1);

        if (!user) return null;

        // Security check: Lockout
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error(`Cuenta bloqueada temporalmente hasta ${user.lockedUntil.toLocaleString()}.`);
        }

        const isNipValid = await bcrypt.compare(
          credentials.nip as string,
          user.nip
        );

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
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.region = token.region as string;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
});
