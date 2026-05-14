import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../lib/trpc/server";
import { z } from "zod";
import { db } from "../../db";
import { ads, users } from "../../db/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const adsRouter = createTRPCRouter({
  createAd: protectedProcedure
    .input(z.object({ imageUrl: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return await db.insert(ads).values({
        userId,
        imageUrl: input.imageUrl,
        status: "PENDIENTE",
      }).returning();
    }),

  getPendingAds: protectedProcedure
    .input(z.object({ region: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const userRole = ctx.session.user.role;
      const isGlobal = userRole === "COORDINADOR_GENERAL";
      if (userRole !== "COORDINADOR" && userRole !== "COORDINADOR_LOCAL" && !isGlobal) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Acceso restringido" });
      }

      const targetRegion = isGlobal ? (input?.region && input.region !== "Todas" ? input.region : null) : ctx.session.user.region;

      const condition = and(
        eq(ads.status, "PENDIENTE"),
        targetRegion ? eq(users.region, targetRegion) : undefined
      );

      return await db
        .select({
          id: ads.id,
          imageUrl: ads.imageUrl,
          createdAt: ads.createdAt,
          userName: users.name,
          userId: users.id,
        })
        .from(ads)
        .innerJoin(users, eq(ads.userId, users.id))
        .where(condition)
        .orderBy(desc(ads.createdAt));
    }),

  approveAd: protectedProcedure
    .input(z.object({ adId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userRole = ctx.session.user.role;
      const isGlobal = userRole === "COORDINADOR_GENERAL";
      if (userRole !== "COORDINADOR" && userRole !== "COORDINADOR_LOCAL" && !isGlobal) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Acceso restringido" });
      }

      // Regional boundary check — coordinators can only approve ads from their region
      if (!isGlobal) {
        const [ad] = await db
          .select({ ownerRegion: users.region })
          .from(ads)
          .innerJoin(users, eq(ads.userId, users.id))
          .where(eq(ads.id, input.adId))
          .limit(1);
        if (!ad || ad.ownerRegion !== ctx.session.user.region) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Solo puedes gestionar anuncios de tu región" });
        }
      }

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      return await db
        .update(ads)
        .set({ status: "ACTIVO", expiresAt })
        .where(eq(ads.id, input.adId))
        .returning({ id: ads.id, status: ads.status, expiresAt: ads.expiresAt });
    }),

  rejectAd: protectedProcedure
    .input(z.object({ adId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userRole = ctx.session.user.role;
      const isGlobal = userRole === "COORDINADOR_GENERAL";
      if (userRole !== "COORDINADOR" && userRole !== "COORDINADOR_LOCAL" && !isGlobal) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Acceso restringido" });
      }

      // Regional boundary check — coordinators can only reject ads from their region
      if (!isGlobal) {
        const [ad] = await db
          .select({ ownerRegion: users.region })
          .from(ads)
          .innerJoin(users, eq(ads.userId, users.id))
          .where(eq(ads.id, input.adId))
          .limit(1);
        if (!ad || ad.ownerRegion !== ctx.session.user.region) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Solo puedes gestionar anuncios de tu región" });
        }
      }

      return await db
        .update(ads)
        .set({ status: "INACTIVO" })
        .where(eq(ads.id, input.adId))
        .returning({ id: ads.id, status: ads.status });
    }),

  getActiveAds: publicProcedure.query(async () => {
    const now = new Date();
    return await db
      .select({
        id: ads.id,
        imageUrl: ads.imageUrl,
        userId: ads.userId,
      })
      .from(ads)
      .where(and(
        eq(ads.status, "ACTIVO"),
        gte(ads.expiresAt, now)
      ))
      .orderBy(desc(ads.createdAt))
      .limit(5);
  }),
});
