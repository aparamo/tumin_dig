import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  rateLimitedPublicProcedure,
} from "../../lib/trpc/server";
import { z } from "zod";
import { db } from "../../db";
import { users, media } from "../../db/schema";
import { eq, or, and, sql, desc, ilike } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
  register: rateLimitedPublicProcedure
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

  searchByDato: protectedProcedure
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
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        phone: users.phone,
        email: users.email,
        region: users.region,
        role: users.role,
        status: users.status,
        accountTier: users.accountTier,
        avatarUrl: users.avatarUrl,
        publicName: users.publicName,
        bio: users.bio,
        publicProfile: users.publicProfile,
        showPhone: users.showPhone,
        showEmail: users.showEmail,
        showRegion: users.showRegion,
        isVerified: users.isVerified,
        referrerId: users.referrerId,
        createdAt: users.createdAt,
        // Intentionally excluded: nip, failedLoginAttempts, lockedUntil,
        // duplicatorBonus, firstSaleOk, productOk (internal fields)
      })
      .from(users)
      .where(eq(users.id, ctx.session.user.id))
      .limit(1);
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    return user;
  }),

  getPublicProfile: publicProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ input }) => {
      const [u] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!u || !u.publicProfile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Perfil no disponible" });
      }

      return {
        id: u.id,
        displayName: (u.publicName?.trim() ? u.publicName.trim() : null) ?? u.name,
        avatarUrl: u.avatarUrl ?? null,
        bio: u.bio?.trim() ? u.bio.trim() : null,
        region: u.showRegion ? u.region : null,
        phone: u.showPhone ? u.phone : null,
        email: u.showEmail ? (u.email ?? null) : null,
        accountTier: u.accountTier,
        isVerified: u.isVerified,
        createdAt: u.createdAt,
      };
    }),

  updatePrivacySettings: protectedProcedure
    .input(
      z.object({
        publicProfile: z.boolean().optional(),
        showPhone: z.boolean().optional(),
        showEmail: z.boolean().optional(),
        showRegion: z.boolean().optional(),
        publicName: z.string().max(80).nullable().optional(),
        bio: z.string().max(300).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const patch: {
        publicProfile?: boolean;
        showPhone?: boolean;
        showEmail?: boolean;
        showRegion?: boolean;
        publicName?: string | null;
        bio?: string | null;
      } = {};
      if (input.publicProfile !== undefined) patch.publicProfile = input.publicProfile;
      if (input.showPhone !== undefined) patch.showPhone = input.showPhone;
      if (input.showEmail !== undefined) patch.showEmail = input.showEmail;
      if (input.showRegion !== undefined) patch.showRegion = input.showRegion;
      if (input.publicName !== undefined) {
        patch.publicName = input.publicName === null || input.publicName.trim() === "" ? null : input.publicName.trim();
      }
      if (input.bio !== undefined) {
        patch.bio = input.bio === null || input.bio.trim() === "" ? null : input.bio.trim();
      }

      if (Object.keys(patch).length === 0) {
        return { success: true as const };
      }

      await db.update(users).set(patch).where(eq(users.id, ctx.session.user.id));
      return { success: true as const };
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
    .input(z.object({ userId: z.string(), role: z.enum(["SOCIO", "COORDINADOR_LOCAL", "COORDINADOR", "COORDINADOR_GENERAL"]) }))
    .mutation(async ({ ctx, input }) => {
      const myRole = ctx.session.user.role;
      const isGlobal = myRole === "COORDINADOR_GENERAL";
      if (myRole !== "COORDINADOR" && myRole !== "COORDINADOR_LOCAL" && !isGlobal) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "No tienes permiso para cambiar roles" });
      }

      // If COORDINADOR_LOCAL or COORDINADOR (regional), check if target user is in the same region
      if (!isGlobal) {
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

  getUnverifiedUsers: protectedProcedure
    .input(z.object({ region: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const userRole = ctx.session.user.role;
      const isGlobal = userRole === "COORDINADOR_GENERAL";
      if (userRole !== "COORDINADOR" && userRole !== "COORDINADOR_LOCAL" && !isGlobal) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Acceso restringido" });
      }

      const targetRegion = isGlobal ? (input?.region && input.region !== "Todas" ? input.region : null) : ctx.session.user.region;

      const condition = and(
        eq(users.isVerified, false),
        targetRegion ? eq(users.region, targetRegion) : undefined
      );

      return await db
        .select({ 
          id: users.id, 
          name: users.name, 
          region: users.region, 
          createdAt: users.createdAt,
          phone: users.phone,
          email: users.email,
          isVerified: users.isVerified
        })
        .from(users)
        .where(condition)
        .orderBy(desc(users.createdAt));
    }),

  verifyUserIdentity: protectedProcedure
    .input(z.object({ userId: z.string(), verified: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const userRole = ctx.session.user.role;
      const isGlobal = userRole === "COORDINADOR_GENERAL";
      if (userRole !== "COORDINADOR" && userRole !== "COORDINADOR_LOCAL" && !isGlobal) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Acceso restringido" });
      }

      // Regional boundary check — coordinators can only verify users in their region
      if (!isGlobal) {
        const [targetUser] = await db
          .select({ region: users.region })
          .from(users)
          .where(eq(users.id, input.userId))
          .limit(1);
        if (!targetUser || targetUser.region !== ctx.session.user.region) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Solo puedes verificar socios de tu región" });
        }
      }

      await db
        .update(users)
        .set({ isVerified: input.verified })
        .where(eq(users.id, input.userId));
      
      return { success: true };
    }),

  getUsersAdvanced: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      roleFilter: z.string().optional(),
      statusFilter: z.string().optional(),
      regionFilter: z.string().optional(),
      sortBy: z.enum(["name_asc", "name_desc", "date_asc", "date_desc"]).default("date_desc"),
      cursor: z.number().default(0),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const userRole = ctx.session.user.role;
      const isGlobal = userRole === "COORDINADOR_GENERAL";
      
      if (userRole !== "COORDINADOR" && userRole !== "COORDINADOR_LOCAL" && !isGlobal) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Acceso restringido" });
      }

      const targetRegion = isGlobal ? (input.regionFilter && input.regionFilter !== "Todas" ? input.regionFilter : null) : ctx.session.user.region;

      const conditions = [];
      if (targetRegion) conditions.push(eq(users.region, targetRegion));
      if (input.search) {
        conditions.push(or(
          ilike(users.name, `%${input.search}%`),
          ilike(users.phone, `%${input.search}%`),
          ilike(users.email, `%${input.search}%`)
        ));
      }
      if (input.roleFilter && input.roleFilter !== "Todos") conditions.push(eq(users.role, input.roleFilter as any));
      if (input.statusFilter && input.statusFilter !== "Todos") conditions.push(eq(users.status, input.statusFilter as any));

      const orderBys = [];
      if (input.sortBy === "name_asc") orderBys.push(sql`${users.name} ASC`);
      else if (input.sortBy === "name_desc") orderBys.push(sql`${users.name} DESC`);
      else if (input.sortBy === "date_asc") orderBys.push(sql`${users.createdAt} ASC`);
      else orderBys.push(sql`${users.createdAt} DESC`);

      const results = await db
        .select({
          id: users.id,
          name: users.name,
          role: users.role,
          region: users.region,
          status: users.status,
          createdAt: users.createdAt,
          phone: users.phone,
          email: users.email,
        })
        .from(users)
        .where(and(...conditions))
        .orderBy(...orderBys)
        .limit(input.limit + 1)
        .offset(input.cursor);

      let nextCursor: number | undefined = undefined;
      if (results.length > input.limit) {
        results.pop();
        nextCursor = input.cursor + input.limit;
      }

      return {
        items: results,
        nextCursor,
      };
    }),
});
