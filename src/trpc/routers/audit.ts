import {
  createTRPCRouter,
  coordinatorProcedure,
  regionalCoordinatorProcedure,
} from "../../lib/trpc/server";
import { db } from "../../db";
import { users, transactions, products, ratings, ads, adminActionsLog, productComments, dailyMining } from "../../db/schema";
import { eq, and, desc, sql, gte, lt, inArray, max, ne, notInArray } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  buildJurisdictionCondition,
  assertNotSelf,
  isInJurisdiction,
  isGlobalCoordinator,
  isCoordinator,
  type UserRole,
} from "../../lib/trpc/authorization";
import { ensureSystemUser } from "../../lib/system-user";
import { logAdminAction } from "../../lib/admin-log";
import {
  AUDIT_REWARD_AMOUNT,
  AUDIT_REWARD_CONCEPT,
  getCurrentMonthRange,
  type AuditRewardStatus,
} from "../../lib/audit-month";

interface ConcentrationPatternRow {
  id: string;
  name: string;
  total_mined: number;
  grand_total_sent: number;
  primary_receiver_id: string;
  primary_receiver_name: string;
  last_activity: Date | null;
}

interface NonSellerRow {
  id: string;
  name: string;
  product_count: number;
  total_mined: number | null;
}

interface PossibleBotRow {
  id: string;
  name: string;
  mining_count: number;
  total_mined: number | null;
}

export const auditRouter = createTRPCRouter({
  getAuditRewardStatus: coordinatorProcedure.query(async ({ ctx }): Promise<AuditRewardStatus> => {
    const userId = ctx.session.user.id;
    const { start, end } = getCurrentMonthRange();

    const [alreadyClaimed] = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(
        and(
          eq(transactions.toId, userId),
          eq(transactions.type, "BONO"),
          eq(transactions.concept, AUDIT_REWARD_CONCEPT),
          gte(transactions.createdAt, start),
          lt(transactions.createdAt, end)
        )
      )
      .limit(1);

    if (alreadyClaimed) {
      return {
        status: "CLAIMED",
        hasActivity: true,
        hasPeerValidation: true,
        alreadyClaimed: true,
      };
    }

    const [activity] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(adminActionsLog)
      .where(
        and(
          eq(adminActionsLog.actorId, userId),
          gte(adminActionsLog.createdAt, start),
          lt(adminActionsLog.createdAt, end)
        )
      );

    const hasActivity = activity.count > 0;

    const [peerValidation] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(adminActionsLog)
      .where(
        and(
          eq(adminActionsLog.action, "VALIDATE_AUDITOR"),
          eq(adminActionsLog.targetUserId, userId),
          ne(adminActionsLog.actorId, userId),
          gte(adminActionsLog.createdAt, start),
          lt(adminActionsLog.createdAt, end)
        )
      );

    const hasPeerValidation = peerValidation.count > 0;

    let status: AuditRewardStatus["status"];
    if (!hasActivity) status = "NEEDS_ACTIVITY";
    else if (!hasPeerValidation) status = "NEEDS_PEER_VALIDATION";
    else status = "READY_TO_CLAIM";

    return {
      status,
      hasActivity,
      hasPeerValidation,
      alreadyClaimed: false,
    };
  }),

  getAuditReport: regionalCoordinatorProcedure
    .input(z.object({ region: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const userRole = ctx.session.user.role as UserRole;
      const isGlobal = isGlobalCoordinator(userRole);

      const targetRegion = isGlobal
        ? input?.region && input.region !== "Todas"
          ? input.region
          : null
        : ctx.session.user.region;

      const baseUserCondition = buildJurisdictionCondition({
        role: userRole,
        region: targetRegion ?? ctx.session.user.region,
      });

      const regionFilter = targetRegion
        ? sql`AND (u.region = ${targetRegion} OR u.residence_state = ${targetRegion})`
        : sql``;

      // 1. Top 10 duplicator bonuses
      const topDuplicators = await db
        .select({
          id: users.id,
          name: users.name,
          duplicatorBonus: users.duplicatorBonus,
        })
        .from(users)
        .where(baseUserCondition)
        .orderBy(desc(users.duplicatorBonus))
        .limit(10);

      // 2. Concentration pattern: users that mine and send almost everything to a single receiver
      const concentrationQuery = sql<ConcentrationPatternRow>`
        WITH user_sent_totals AS (
          SELECT
            from_id,
            to_id,
            SUM(amount) as total_sent
          FROM ${transactions}
          WHERE type = 'TRANSFERENCIA'
          GROUP BY from_id, to_id
        ),
        user_destinations AS (
          SELECT
            from_id,
            COUNT(DISTINCT to_id) as unique_receivers,
            SUM(total_sent) as grand_total_sent
          FROM user_sent_totals
          GROUP BY from_id
        ),
        user_mining AS (
          SELECT
            to_id as user_id,
            SUM(amount) as total_mined
          FROM ${transactions}
          WHERE type = 'MINADO'
          GROUP BY to_id
        ),
        last_activity AS (
          SELECT
            from_id as user_id,
            MAX(created_at) as last_activity
          FROM ${transactions}
          GROUP BY from_id
        )
        SELECT
          u.id,
          u.name,
          um.total_mined,
          ud.grand_total_sent,
          ust.to_id as primary_receiver_id,
          ur.name as primary_receiver_name,
          la.last_activity
        FROM ${users} u
        JOIN user_mining um ON u.id = um.user_id
        JOIN user_destinations ud ON u.id = ud.from_id
        JOIN user_sent_totals ust ON u.id = ust.from_id
        JOIN ${users} ur ON ust.to_id = ur.id
        LEFT JOIN last_activity la ON u.id = la.user_id
        WHERE ud.unique_receivers = 1
        AND ud.grand_total_sent >= um.total_mined * 0.9
        AND um.total_mined > 5
        ${regionFilter}
      `;

      const concentrationResult = await db.execute(concentrationQuery);
      const concentrationPatterns = concentrationResult as unknown as ConcentrationPatternRow[];

      // 3. Inactive users (no transactions in the last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const inactiveUsers = await db
        .select({
          id: users.id,
          name: users.name,
          status: users.status,
        })
        .from(users)
        .where(
          and(
            eq(users.status, "ACTIVO"),
            baseUserCondition,
            sql`NOT EXISTS (
              SELECT 1 FROM ${transactions}
              WHERE (${transactions.fromId} = ${users.id} OR ${transactions.toId} = ${users.id})
              AND ${transactions.createdAt} >= ${thirtyDaysAgo}
            )`
          )
        )
        .limit(20);

      // 4. Frozen users (to allow reactivation)
      const frozenUsers = await db
        .select({
          id: users.id,
          name: users.name,
          status: users.status,
        })
        .from(users)
        .where(
          and(
            eq(users.status, "CONGELADO"),
            baseUserCondition
          )
        )
        .limit(20);

      // 5. Non-sellers: active users with active products but no received transfers
      const nonSellersQuery = sql<NonSellerRow>`
        SELECT
          u.id,
          u.name,
          COUNT(DISTINCT p.id)::int as product_count,
          (SELECT SUM(amount) FROM ${transactions} WHERE to_id = u.id AND type = 'MINADO') as total_mined
        FROM ${users} u
        JOIN ${products} p ON p.seller_id = u.id AND p.status = 'ACTIVO'
        WHERE u.status = 'ACTIVO'
        AND NOT EXISTS (
          SELECT 1 FROM ${transactions}
          WHERE to_id = u.id AND type = 'TRANSFERENCIA'
        )
        ${regionFilter}
        GROUP BY u.id, u.name
        LIMIT 20
      `;

      const nonSellersResult = await db.execute(nonSellersQuery);
      const nonSellers = nonSellersResult as unknown as NonSellerRow[];

      // 6. Possible bots: many mining records, no social interaction (ratings/comments)
      const possibleBotsQuery = sql<PossibleBotRow>`
        SELECT
          u.id,
          u.name,
          COUNT(DISTINCT m.id)::int as mining_count,
          SUM(m.amount) as total_mined
        FROM ${users} u
        JOIN ${dailyMining} m ON m.user_id = u.id
        WHERE u.status = 'ACTIVO'
        AND NOT EXISTS (
          SELECT 1 FROM ${ratings} r WHERE r.seller_id = u.id
        )
        AND NOT EXISTS (
          SELECT 1 FROM ${productComments} c WHERE c.author_id = u.id
        )
        ${regionFilter}
        GROUP BY u.id, u.name
        HAVING COUNT(DISTINCT m.id) >= 10
        LIMIT 20
      `;

      const possibleBotsResult = await db.execute(possibleBotsQuery);
      const possibleBots = possibleBotsResult as unknown as PossibleBotRow[];

      // 7. Product control quality list
      const productQuality = await db
        .select({
          productId: products.id,
          productName: products.name,
          sellerName: users.name,
          avgRating: sql<number>`COALESCE(AVG(${ratings.stars}), 0)`.mapWith(Number),
          ratingCount: sql<number>`COUNT(${ratings.id})`.mapWith(Number),
        })
        .from(products)
        .innerJoin(users, eq(products.sellerId, users.id))
        .leftJoin(ratings, eq(ratings.sellerId, users.id))
        .where(baseUserCondition)
        .groupBy(products.id, products.name, users.name)
        .orderBy(sql`AVG(${ratings.stars}) ASC NULLS LAST`);

      return {
        topDuplicators,
        concentrationPatterns,
        inactiveUsers,
        frozenUsers,
        nonSellers,
        possibleBots,
        productQuality,
      };
    }),

  freezeUser: coordinatorProcedure
    .input(z.object({ userId: z.string(), status: z.enum(["ACTIVO", "CONGELADO"]) }))
    .mutation(async ({ ctx, input }) => {
      const userRole = ctx.session.user.role as UserRole;
      const callerId = ctx.session.user.id;

      assertNotSelf(callerId, input.userId);

      const [targetUser] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!targetUser) throw new TRPCError({ code: "NOT_FOUND", message: "Usuario no encontrado" });

      if (!isInJurisdiction({ role: userRole, region: ctx.session.user.region }, targetUser)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Solo puedes gestionar socios de tu jurisdicción" });
      }

      return await db.transaction(async (tx) => {
        const [updatedUser] = await tx
          .update(users)
          .set({ status: input.status })
          .where(eq(users.id, input.userId))
          .returning({ id: users.id, name: users.name, status: users.status, region: users.region });

        if (input.status === "CONGELADO") {
          await tx.update(products).set({ status: "INACTIVO" }).where(eq(products.sellerId, input.userId));
          await tx.update(ads).set({ status: "INACTIVO" }).where(eq(ads.userId, input.userId));

          const [activeCount] = await tx
            .select({ count: sql<number>`count(*)::int` })
            .from(products)
            .where(and(eq(products.sellerId, input.userId), eq(products.status, "ACTIVO")));

          if (activeCount.count === 0) {
            await tx.update(users).set({ productOk: false }).where(eq(users.id, input.userId));
          }
        }

        await logAdminAction(tx, {
          actorId: callerId,
          targetUserId: input.userId,
          action: input.status === "CONGELADO" ? "FREEZE" : "UNFREEZE",
          metadata: { previousStatus: targetUser.status },
        });

        return updatedUser;
      });
    }),

  claimAuditReward: coordinatorProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const { start, end } = getCurrentMonthRange();

    const [alreadyClaimed] = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(
        and(
          eq(transactions.toId, userId),
          eq(transactions.type, "BONO"),
          eq(transactions.concept, AUDIT_REWARD_CONCEPT),
          gte(transactions.createdAt, start),
          lt(transactions.createdAt, end)
        )
      )
      .limit(1);

    if (alreadyClaimed) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Ya has reclamado tu recompensa este mes" });
    }

    return await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT 1 FROM ${users} WHERE id = ${userId} FOR UPDATE`);

      const [alreadyClaimedPostLock] = await tx
        .select({ id: transactions.id })
        .from(transactions)
        .where(
          and(
            eq(transactions.toId, userId),
            eq(transactions.type, "BONO"),
            eq(transactions.concept, AUDIT_REWARD_CONCEPT),
            gte(transactions.createdAt, start),
            lt(transactions.createdAt, end)
          )
        )
        .limit(1);

      if (alreadyClaimedPostLock) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ya has reclamado tu recompensa este mes" });
      }

      const [activity] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(adminActionsLog)
        .where(
          and(
            eq(adminActionsLog.actorId, userId),
            gte(adminActionsLog.createdAt, start),
            lt(adminActionsLog.createdAt, end)
          )
        );

      if (activity.count === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Debes realizar al menos una acción de coordinación este mes para reclamar la recompensa",
        });
      }

      const [peerValidation] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(adminActionsLog)
        .where(
          and(
            eq(adminActionsLog.action, "VALIDATE_AUDITOR"),
            eq(adminActionsLog.targetUserId, userId),
            ne(adminActionsLog.actorId, userId),
            gte(adminActionsLog.createdAt, start),
            lt(adminActionsLog.createdAt, end)
          )
        );

      if (peerValidation.count === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Necesitas que otro coordinador valide tu auditoría mensual antes de reclamar la recompensa",
        });
      }

      await ensureSystemUser(tx);

      const [transaction] = await tx
        .insert(transactions)
        .values({
          fromId: "SYSTEM",
          toId: userId,
          amount: AUDIT_REWARD_AMOUNT,
          concept: AUDIT_REWARD_CONCEPT,
          type: "BONO",
        })
        .returning();

      await logAdminAction(tx, {
        actorId: userId,
        action: "CLAIM_AUDIT_REWARD",
        metadata: { amount: AUDIT_REWARD_AMOUNT, month: start.toISOString() },
      });

      return transaction;
    });
  }),

  getPendingAuditorValidations: coordinatorProcedure.query(async ({ ctx }) => {
    const callerId = ctx.session.user.id;
    const { start, end } = getCurrentMonthRange();

    const validatedRows = await db
      .selectDistinct({ targetUserId: adminActionsLog.targetUserId })
      .from(adminActionsLog)
      .where(
        and(
          eq(adminActionsLog.action, "VALIDATE_AUDITOR"),
          gte(adminActionsLog.createdAt, start),
          lt(adminActionsLog.createdAt, end),
          sql`${adminActionsLog.actorId} <> ${adminActionsLog.targetUserId}`
        )
      );

    const validatedIds = validatedRows
      .map((r) => r.targetUserId)
      .filter((id): id is string => id !== null);

    const claimedRows = await db
      .select({ toId: transactions.toId })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, "BONO"),
          eq(transactions.concept, AUDIT_REWARD_CONCEPT),
          gte(transactions.createdAt, start),
          lt(transactions.createdAt, end)
        )
      );

    const claimedIds = claimedRows.map((r) => r.toId);
    const excludedIds = [...new Set([...validatedIds, ...claimedIds, callerId])];

    const activityRows = await db
      .select({
        actorId: adminActionsLog.actorId,
        lastActivityAt: max(adminActionsLog.createdAt),
      })
      .from(adminActionsLog)
      .where(
        and(
          gte(adminActionsLog.createdAt, start),
          lt(adminActionsLog.createdAt, end),
          excludedIds.length > 0 ? notInArray(adminActionsLog.actorId, excludedIds) : undefined
        )
      )
      .groupBy(adminActionsLog.actorId);

    if (activityRows.length === 0) return [];

    const actorIds = activityRows.map((r) => r.actorId);
    const lastActivityById = new Map(
      activityRows.map((r) => [r.actorId, r.lastActivityAt])
    );

    const coordinatorUsers = await db
      .select({
        id: users.id,
        name: users.name,
        region: users.region,
        role: users.role,
      })
      .from(users)
      .where(
        and(
          inArray(users.id, actorIds),
          eq(users.status, "ACTIVO"),
          inArray(users.role, ["COORDINADOR_LOCAL", "COORDINADOR", "COORDINADOR_GENERAL"])
        )
      );

    return coordinatorUsers
      .map((u) => ({
        id: u.id,
        name: u.name,
        region: u.region,
        role: u.role,
        lastActivityAt: lastActivityById.get(u.id) ?? start,
      }))
      .sort((a, b) => {
        const aTime = a.lastActivityAt instanceof Date ? a.lastActivityAt.getTime() : 0;
        const bTime = b.lastActivityAt instanceof Date ? b.lastActivityAt.getTime() : 0;
        return bTime - aTime;
      });
  }),

  validateAuditor: coordinatorProcedure
    .input(z.object({ targetUserId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const callerId = ctx.session.user.id;
      const targetId = input.targetUserId;
      const { start, end } = getCurrentMonthRange();

      assertNotSelf(callerId, targetId);

      const [targetUser] = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
      if (!targetUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Coordinador no encontrado" });
      }
      if (!isCoordinator(targetUser.role as UserRole)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "El usuario no es coordinador" });
      }
      if (targetUser.status !== "ACTIVO") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "El coordinador no está activo" });
      }

      const [activity] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(adminActionsLog)
        .where(
          and(
            eq(adminActionsLog.actorId, targetId),
            gte(adminActionsLog.createdAt, start),
            lt(adminActionsLog.createdAt, end)
          )
        );

      if (activity.count === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Este coordinador aún no tiene actividad de coordinación este mes",
        });
      }

      const [alreadyValidatedByAnyone] = await db
        .select({ id: adminActionsLog.id })
        .from(adminActionsLog)
        .where(
          and(
            eq(adminActionsLog.action, "VALIDATE_AUDITOR"),
            eq(adminActionsLog.targetUserId, targetId),
            ne(adminActionsLog.actorId, targetId),
            gte(adminActionsLog.createdAt, start),
            lt(adminActionsLog.createdAt, end)
          )
        )
        .limit(1);

      if (alreadyValidatedByAnyone) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Este coordinador ya fue validado este mes",
        });
      }

      const [alreadyValidatedByCaller] = await db
        .select({ id: adminActionsLog.id })
        .from(adminActionsLog)
        .where(
          and(
            eq(adminActionsLog.action, "VALIDATE_AUDITOR"),
            eq(adminActionsLog.targetUserId, targetId),
            eq(adminActionsLog.actorId, callerId),
            gte(adminActionsLog.createdAt, start),
            lt(adminActionsLog.createdAt, end)
          )
        )
        .limit(1);

      if (alreadyValidatedByCaller) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Ya validaste a este coordinador este mes",
        });
      }

      return await db.transaction(async (tx) => {
        await logAdminAction(tx, {
          actorId: callerId,
          targetUserId: targetId,
          action: "VALIDATE_AUDITOR",
          metadata: { month: start.toISOString() },
        });

        return { success: true };
      });
    }),

  getAdminActionsLog: coordinatorProcedure
    .input(
      z.object({
        cursor: z.number().default(0),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const userRole = ctx.session.user.role as UserRole;

      const jurisdiction = buildJurisdictionCondition({
        role: userRole,
        region: ctx.session.user.region,
      });

      const rows = await db
        .select({
          log: adminActionsLog,
          actor: { id: users.id, name: users.name },
        })
        .from(adminActionsLog)
        .innerJoin(users, eq(adminActionsLog.actorId, users.id))
        .where(jurisdiction)
        .orderBy(desc(adminActionsLog.createdAt))
        .limit(input.limit)
        .offset(input.cursor);

      return rows;
    }),
});
