import {
  createTRPCRouter,
  protectedProcedure,
  coordinatorProcedure,
  regionalCoordinatorProcedure,
} from "../../lib/trpc/server";
import { z } from "zod";
import { db } from "../../db";
import { ads, users, products } from "../../db/schema";
import { eq, and, desc, gte, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  buildJurisdictionCondition,
  isInJurisdiction,
  type UserRole,
} from "../../lib/trpc/authorization";

export const adsRouter = createTRPCRouter({
  createAd: protectedProcedure
    .input(z.object({
      imageUrl: z.string().url("URL de imagen no válida"),
      productId: z.string().uuid().optional(),
      description: z.string().max(120, "La descripción no puede tener más de 120 caracteres").optional(),
      requestedUntil: z.date().optional(),
      /** GENERAL = toda la red; omitir o enviar la región de adscripción del socio */
      targetRegion: z.string().min(1).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userRegion = ctx.session.user.region;
      const resolvedRegion = input.targetRegion ?? userRegion;

      if (resolvedRegion !== "GENERAL" && resolvedRegion !== userRegion) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "El alcance del anuncio solo puede ser tu región o toda la red",
        });
      }

      if (input.productId) {
        const [product] = await db
          .select({ sellerId: products.sellerId })
          .from(products)
          .where(and(eq(products.id, input.productId), eq(products.sellerId, userId)))
          .limit(1);
        if (!product) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Producto no encontrado o no te pertenece" });
        }
      }

      const [ad] = await db.insert(ads).values({
        userId,
        imageUrl: input.imageUrl,
        productId: input.productId ?? null,
        description: input.description ?? null,
        requestedUntil: input.requestedUntil ?? null,
        targetRegion: resolvedRegion,
        status: "PENDIENTE",
      }).returning();

      return ad;
    }),

  getMyAds: protectedProcedure.query(async ({ ctx }) => {
    return await db
      .select({
        id: ads.id,
        imageUrl: ads.imageUrl,
        description: ads.description,
        status: ads.status,
        targetRegion: ads.targetRegion,
        expiresAt: ads.expiresAt,
        requestedUntil: ads.requestedUntil,
        createdAt: ads.createdAt,
        productName: products.name,
      })
      .from(ads)
      .leftJoin(products, eq(ads.productId, products.id))
      .where(eq(ads.userId, ctx.session.user.id))
      .orderBy(desc(ads.createdAt));
  }),

  getPendingAds: regionalCoordinatorProcedure
    .input(z.object({ region: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const userRole = ctx.session.user.role as UserRole;
      const isGlobal = userRole === "COORDINADOR_GENERAL" || userRole === "COORDINADOR";

      const targetRegion = isGlobal
        ? input?.region && input.region !== "Todas"
          ? input.region
          : null
        : ctx.session.user.region;

      const jurisdiction = buildJurisdictionCondition({
        role: userRole,
        region: targetRegion ?? ctx.session.user.region,
      });

      const condition = and(
        eq(ads.status, "PENDIENTE"),
        jurisdiction
      );

      return await db
        .select({
          id: ads.id,
          imageUrl: ads.imageUrl,
          createdAt: ads.createdAt,
          targetRegion: ads.targetRegion,
          userName: users.name,
          userId: users.id,
        })
        .from(ads)
        .innerJoin(users, eq(ads.userId, users.id))
        .where(condition)
        .orderBy(desc(ads.createdAt));
    }),

  approveAd: coordinatorProcedure
    .input(z.object({ adId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userRole = ctx.session.user.role as UserRole;
      const userRegion = ctx.session.user.region;
      const isGlobal = userRole === "COORDINADOR_GENERAL" || userRole === "COORDINADOR";

      const [ad] = await db
        .select({ owner: users })
        .from(ads)
        .innerJoin(users, eq(ads.userId, users.id))
        .where(eq(ads.id, input.adId))
        .limit(1);

      if (!ad) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Anuncio no encontrado" });
      }

      if (!isGlobal && !isInJurisdiction({ role: userRole, region: userRegion }, ad.owner)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Solo puedes gestionar anuncios de tu jurisdicción" });
      }

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      return await db
        .update(ads)
        .set({ status: "ACTIVO", expiresAt })
        .where(eq(ads.id, input.adId))
        .returning({ id: ads.id, status: ads.status, expiresAt: ads.expiresAt });
    }),

  rejectAd: coordinatorProcedure
    .input(z.object({ adId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userRole = ctx.session.user.role as UserRole;
      const userRegion = ctx.session.user.region;
      const isGlobal = userRole === "COORDINADOR_GENERAL" || userRole === "COORDINADOR";

      const [ad] = await db
        .select({ owner: users })
        .from(ads)
        .innerJoin(users, eq(ads.userId, users.id))
        .where(eq(ads.id, input.adId))
        .limit(1);

      if (!ad) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Anuncio no encontrado" });
      }

      if (!isGlobal && !isInJurisdiction({ role: userRole, region: userRegion }, ad.owner)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Solo puedes gestionar anuncios de tu jurisdicción" });
      }

      return await db
        .update(ads)
        .set({ status: "INACTIVO" })
        .where(eq(ads.id, input.adId))
        .returning({ id: ads.id, status: ads.status });
    }),

  getActiveAds: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const viewerRegion = ctx.session.user.region;

    const [ad] = await db
      .select({
        id: ads.id,
        imageUrl: ads.imageUrl,
        description: ads.description,
        productId: ads.productId,
        userId: ads.userId,
        targetRegion: ads.targetRegion,
      })
      .from(ads)
      .where(and(
        eq(ads.status, "ACTIVO"),
        gte(ads.expiresAt, now),
        or(
          eq(ads.targetRegion, "GENERAL"),
          eq(ads.targetRegion, viewerRegion)
        )
      ))
      .orderBy(sql`RANDOM()`)
      .limit(1);

    return ad ?? null;
  }),
});
