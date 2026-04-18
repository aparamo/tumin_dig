import { createTRPCRouter, publicProcedure, protectedProcedure } from "../../lib/trpc/server";
import { z } from "zod";
import { db } from "../../db";
import { users, userRoleEnum, media } from "../../db/schema";
import { eq, or, and, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(2),
        phone: z.string().min(10),
        email: z.string().email().optional().or(z.literal("")),
        region: z.string().min(2),
        nip: z.string().min(4).max(6),
        referrerId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // 1. Verify referrer exists if provided
      if (input.referrerId) {
        const [referrer] = await db
          .select()
          .from(users)
          .where(eq(users.id, input.referrerId))
          .limit(1);
        if (!referrer) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Referrer not found",
          });
        }
      }

      // 2. Check if phone already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.phone, input.phone))
        .limit(1);
      
      if (existingUser) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Phone number already registered",
        });
      }

      // 3. Hash NIP
      const hashedNip = await bcrypt.hash(input.nip, 10);

      // 4. Generate ID
      const userId = `USR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // 5. Create user
      const [user] = await db
        .insert(users)
        .values({
          id: userId,
          name: input.name,
          phone: input.phone,
          email: input.email || null,
          region: input.region,
          nip: hashedNip,
          referrerId: input.referrerId || null,
        })
        .returning();

      return {
        id: user.id,
        name: user.name,
        phone: user.phone,
      };
    }),

  searchByDato: publicProcedure
    .input(z.object({ dato: z.string().min(3) }))
    .query(async ({ input }) => {
      const [user] = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(
          or(
            eq(users.phone, input.dato),
            eq(users.email, input.dato)
          )
        )
        .limit(1);
      
      return user || null;
    }),

  me: protectedProcedure.query(({ ctx }) => {
    return ctx.session.user;
  }),

  fullMe: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await db.select().from(users).where(eq(users.id, ctx.session.user.id)).limit(1);
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    return user;
  }),

  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(2).optional(),
      email: z.string().email().optional(),
      phone: z.string().min(10).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.update(users).set(input).where(eq(users.id, ctx.session.user.id));
      return { success: true };
    }),

  updateNip: protectedProcedure
    .input(z.object({ nip: z.string().min(4).max(6) }))
    .mutation(async ({ ctx, input }) => {
      const hashedNip = await bcrypt.hash(input.nip, 10);
      await db
        .update(users)
        .set({ nip: hashedNip })
        .where(eq(users.id, ctx.session.user.id));
      return { success: true };
    }),

  getMediaUsage: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const [user] = await db.select({ tier: users.accountTier }).from(users).where(eq(users.id, userId)).limit(1);
    const [usage] = await db.select({ total: sql<number>`sum(${media.sizeBytes})` }).from(media).where(eq(media.userId, userId));
    
    return {
      tier: user?.tier || "NORMAL",
      usedBytes: Number(usage?.total || 0),
    };
  }),

  listMedia: protectedProcedure.query(async ({ ctx }) => {
    return await db.select().from(media).where(eq(media.userId, ctx.session.user.id)).orderBy(sql`${media.createdAt} DESC`);
  }),

  deleteMedia: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db.delete(media).where(and(eq(media.id, input.id), eq(media.userId, ctx.session.user.id)));
      return { success: true };
    }),

  addExternalLink: protectedProcedure
    .input(z.object({
      url: z.string().url(),
      name: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.insert(media).values({
        userId: ctx.session.user.id,
        url: input.url,
        name: input.name,
        type: "LINK",
        sizeBytes: 0,
      });
      return { success: true };
    }),

  getUsersByRegion: protectedProcedure.query(async ({ ctx }) => {
    const userRole = ctx.session.user.role;
    if (userRole !== "COORDINADOR" && userRole !== "COORDINADOR_LOCAL") {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Acceso restringido" });
    }

    return await db
      .select({ id: users.id, name: users.name, role: users.role, region: users.region })
      .from(users)
      .where(eq(users.region, ctx.session.user.region));
  }),

  updateRole: protectedProcedure
    .input(z.object({ userId: z.string(), role: z.enum(["SOCIO", "COORDINADOR_LOCAL", "COORDINADOR"]) }))
    .mutation(async ({ ctx, input }) => {
      const myRole = ctx.session.user.role;
      if (myRole !== "COORDINADOR" && myRole !== "COORDINADOR_LOCAL") {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "No tienes permiso para cambiar roles" });
      }

      // If COORDINADOR_LOCAL, check if target user is in the same region
      if (myRole === "COORDINADOR_LOCAL") {
        const [targetUser] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
        if (!targetUser || targetUser.region !== ctx.session.user.region) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Solo puedes cambiar roles en tu región" });
        }
      }

      await db
        .update(users)
        .set({ role: input.role })
        .where(eq(users.id, input.userId));
      
      return { success: true };
    }),
});
