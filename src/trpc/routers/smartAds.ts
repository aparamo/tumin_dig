import {
  createTRPCRouter,
  protectedProcedure,
  coordinatorProcedure,
} from "../../lib/trpc/server";
import { z } from "zod";
import { db } from "../../db";
import { smartAds, users } from "../../db/schema";
import { eq, and, or, gte, lte, isNull, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { isGlobalCoordinator, type UserRole } from "../../lib/trpc/authorization";
import { logAdminAction } from "../../lib/admin-log";

export const smartAdsRouter = createTRPCRouter({
  getForMe: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.session.user;
    const now = new Date();

    const regionMatches = [
      eq(smartAds.targetRegion, user.region),
      and(isNull(smartAds.targetRegion), isNull(smartAds.targetState)),
    ];
    if (user.residenceState) {
      regionMatches.push(eq(smartAds.targetState, user.residenceState));
    }

    return await db
      .select()
      .from(smartAds)
      .where(
        and(
          lte(smartAds.activeFrom, now),
          or(gte(smartAds.activeUntil, now), isNull(smartAds.activeUntil)),
          or(...regionMatches)
        )
      )
      .orderBy(desc(smartAds.createdAt))
      .limit(20);
  }),

  list: coordinatorProcedure.query(async () => {
    return await db
      .select({
        ad: smartAds,
        creator: { id: users.id, name: users.name },
      })
      .from(smartAds)
      .innerJoin(users, eq(smartAds.createdBy, users.id))
      .orderBy(desc(smartAds.createdAt));
  }),

  create: coordinatorProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        body: z.string().max(2000).optional(),
        imageUrl: z.string().url().optional(),
        linkUrl: z.string().url().optional(),
        targetRegion: z.string().optional(),
        targetState: z.string().optional(),
        activeUntil: z.coerce.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const callerRole = ctx.session.user.role as UserRole;
      const callerId = ctx.session.user.id;
      const callerRegion = ctx.session.user.region;
      const callerState = ctx.session.user.residenceState;

      if (!isGlobalCoordinator(callerRole)) {
        const targets = [input.targetRegion, input.targetState].filter(Boolean);
        const hasJurisdiction =
          targets.length === 0 ||
          targets.some((t) => t === callerRegion || (callerState && t === callerState));
        if (!hasJurisdiction) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Solo puedes publicar avisos dirigidos a tu región o estado",
          });
        }
      }

      const [ad] = await db
        .insert(smartAds)
        .values({
          title: input.title,
          body: input.body?.trim() || null,
          imageUrl: input.imageUrl?.trim() || null,
          linkUrl: input.linkUrl?.trim() || null,
          targetRegion: input.targetRegion?.trim() || null,
          targetState: input.targetState?.trim() || null,
          activeUntil: input.activeUntil || null,
          createdBy: callerId,
        })
        .returning();

      await logAdminAction(db, {
        actorId: callerId,
        action: "CREATE_SMART_AD",
        metadata: { adId: ad.id, targetRegion: input.targetRegion, targetState: input.targetState },
      });

      return ad;
    }),

  delete: coordinatorProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const callerRole = ctx.session.user.role as UserRole;
      const callerId = ctx.session.user.id;
      const callerRegion = ctx.session.user.region;
      const callerState = ctx.session.user.residenceState;

      const [ad] = await db.select().from(smartAds).where(eq(smartAds.id, input.id)).limit(1);
      if (!ad) throw new TRPCError({ code: "NOT_FOUND", message: "Aviso no encontrado" });

      const canDelete =
        isGlobalCoordinator(callerRole) ||
        ad.createdBy === callerId ||
        [ad.targetRegion, ad.targetState].some(
          (t) => t && (t === callerRegion || (callerState && t === callerState))
        );

      if (!canDelete) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "No tienes permiso para eliminar este aviso",
        });
      }

      await db.delete(smartAds).where(eq(smartAds.id, input.id));

      await logAdminAction(db, {
        actorId: callerId,
        action: "DELETE_SMART_AD",
        metadata: { adId: ad.id, title: ad.title },
      });

      return { success: true };
    }),
});
