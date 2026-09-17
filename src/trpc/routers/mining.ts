import { createTRPCRouter, protectedProcedure } from "../../lib/trpc/server";
import { db } from "../../db";
import { users, dailyMining, products } from "../../db/schema";
import { eq, desc, and, count, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { issueFromSystem } from "../../lib/system-ledger";
import {
  MINING_TIMEZONE,
  evaluateMiningClaim,
  miningIdempotencyKey,
} from "../../lib/mining-day";
import { isPgUniqueViolation } from "../../lib/pg-error";

export const miningRouter = createTRPCRouter({
  getMiningStatus: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const now = new Date();

    const [productCount] = await db
      .select({ val: count() })
      .from(products)
      .where(and(eq(products.sellerId, userId), eq(products.status, "ACTIVO")));

    const [lastMining] = await db
      .select()
      .from(dailyMining)
      .where(eq(dailyMining.userId, userId))
      .orderBy(desc(dailyMining.claimedAt))
      .limit(1);

    const evaluation = evaluateMiningClaim({
      now,
      last: lastMining
        ? { minedOn: lastMining.minedOn, streak: lastMining.streak }
        : null,
      hasActiveProduct: productCount.val > 0,
    });

    return {
      canMine: evaluation.canMine,
      reason: evaluation.reason,
      displayStreak: evaluation.displayStreak,
      nextReward: evaluation.nextReward,
      minedOn: lastMining?.minedOn ?? null,
      nextAvailableAt: evaluation.nextAvailableAt,
      timezone: MINING_TIMEZONE,
    };
  }),

  claimMining: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    try {
      return await db.transaction(async (tx) => {
        await tx.execute(sql`SELECT 1 FROM ${users} WHERE id = ${userId} FOR UPDATE`);

        const [user] = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Usuario no encontrado" });
        }

        const [productCount] = await tx
          .select({ val: count() })
          .from(products)
          .where(
            and(eq(products.sellerId, userId), eq(products.status, "ACTIVO"))
          );

        const [lastMining] = await tx
          .select()
          .from(dailyMining)
          .where(eq(dailyMining.userId, userId))
          .orderBy(desc(dailyMining.claimedAt))
          .limit(1);

        const now = new Date();
        const evaluation = evaluateMiningClaim({
          now,
          last: lastMining
            ? { minedOn: lastMining.minedOn, streak: lastMining.streak }
            : null,
          hasActiveProduct: productCount.val > 0,
        });

        if (evaluation.reason === "NO_PRODUCT") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "¡Órale! Debes tener al menos un producto activo en el bazar para poder minar.",
          });
        }

        if (evaluation.reason === "ALREADY_MINED") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Ya has minado hoy" });
        }

        const { today, nextStreak, nextReward } = evaluation;

        // Insert first so UNIQUE(user_id, mined_on) rejects races before minting.
        await tx.insert(dailyMining).values({
          userId,
          claimedAt: now,
          minedOn: today,
          streak: nextStreak,
          amount: nextReward,
        });

        await issueFromSystem(tx, {
          toId: userId,
          amount: nextReward,
          concept: `Minado Diario - Racha ${nextStreak}`,
          type: "MINADO",
          idempotencyKey: miningIdempotencyKey(userId, today),
        });

        return { streak: nextStreak, reward: nextReward };
      });
    } catch (err) {
      if (err instanceof TRPCError) throw err;
      if (isPgUniqueViolation(err)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ya has minado hoy" });
      }
      throw err;
    }
  }),
});
