import {
  createTRPCRouter,
  protectedProcedure,
  rateLimitedProtectedProcedure,
} from "../../lib/trpc/server";
import { z } from "zod";
import { db } from "../../db";
import { users, transactions, products } from "../../db/schema";
import { eq, sql, and, desc, or, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { ensureSystemUser } from "../../lib/system-user";
import { LIMITS } from "../../lib/limits";

export const walletRouter = createTRPCRouter({
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Sum received
    const [received] = await db
      .select({ total: sql<number>`sum(${transactions.amount})` })
      .from(transactions)
      .where(eq(transactions.toId, userId));

    // Sum sent
    const [sent] = await db
      .select({ total: sql<number>`sum(${transactions.amount})` })
      .from(transactions)
      .where(eq(transactions.fromId, userId));

    const balance = (Number(received?.total) || 0) - (Number(sent?.total) || 0);
    return { balance };
  }),

  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const rows = await db
      .select()
      .from(transactions)
      .where(or(eq(transactions.fromId, userId), eq(transactions.toId, userId)))
      .orderBy(desc(transactions.createdAt))
      .limit(15);
    return rows.map((tx) => ({ ...tx, isIngreso: tx.toId === userId }));
  }),

  sendTumin: rateLimitedProtectedProcedure
    .input(
      z.object({
        toId: z.string(),
        amount: z.number().positive(),
        concept: z.string().min(1).max(500),
        /** Client-generated UUID — pass the same key on retries to avoid duplicates */
        idempotencyKey: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const meId = ctx.session.user.id;

      if (input.toId === meId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No puedes enviarte a ti mismo" });
      }

      return await db.transaction(async (tx) => {
        await ensureSystemUser(tx);

        // Idempotency check — return existing transaction on retry/double-submit
        const [existing] = await tx
          .select()
          .from(transactions)
          .where(eq(transactions.idempotencyKey, input.idempotencyKey))
          .limit(1);
        if (existing) return existing;

        // 0. Row-level lock users in a consistent alphabetical order to prevent deadlocks
        const [lockId1, lockId2] = [meId, input.toId].sort();
        await tx.execute(sql`SELECT 1 FROM ${users} WHERE id = ${lockId1} FOR UPDATE`);
        await tx.execute(sql`SELECT 1 FROM ${users} WHERE id = ${lockId2} FOR UPDATE`);

        // 1. Check sender balance and verification status
        const [sender] = await tx.select().from(users).where(eq(users.id, meId)).limit(1);
        if (!sender) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Remitente no encontrado" });
        }

        if (!sender.isVerified && input.amount > LIMITS.MAX_TRANSFER_UNVERIFIED) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Los socios no verificados pueden transferir máximo ${LIMITS.MAX_TRANSFER_UNVERIFIED} Ŧ. Completa tu verificación con un coordinador.`,
          });
        }

        const [received] = await tx
          .select({ total: sql<number>`sum(${transactions.amount})` })
          .from(transactions)
          .where(eq(transactions.toId, meId));
        const [sent] = await tx
          .select({ total: sql<number>`sum(${transactions.amount})` })
          .from(transactions)
          .where(eq(transactions.fromId, meId));

        const myBalance = (Number(received?.total) || 0) - (Number(sent?.total) || 0);
        if (myBalance < input.amount) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Saldo insuficiente" });
        }

        // 2. Fetch recipient + live product count in same transaction
        const [recipient] = await tx.select().from(users).where(eq(users.id, input.toId)).limit(1);

        if (!recipient) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Destinatario no encontrado" });
        }
        if (recipient.status === "CONGELADO") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "El destinatario está congelado" });
        }

        const [{ activeProducts }] = await tx
          .select({ activeProducts: count() })
          .from(products)
          .where(and(eq(products.sellerId, input.toId), eq(products.status, "ACTIVO")));

        if (Number(activeProducts) === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "El destinatario debe tener un producto activo" });
        }

        // 3. Perform main transaction
        const [mainTx] = await tx
          .insert(transactions)
          .values({
            fromId: meId,
            toId: input.toId,
            amount: input.amount,
            concept: input.concept,
            type: "TRANSFERENCIA",
            idempotencyKey: input.idempotencyKey,
          })
          .returning();

        // 4. Bono Primera Venta
        if (!recipient.firstSaleOk) {
          await tx.insert(transactions).values({
            fromId: "SYSTEM",
            toId: input.toId,
            amount: LIMITS.FIRST_SALE_BONUS,
            concept: "Bono Primera Venta",
            type: "BONO",
          });
          await tx.update(users).set({ firstSaleOk: true }).where(eq(users.id, input.toId));
        }

        // 5. Bono Duplicador
        if (recipient.duplicatorBonus < LIMITS.DUPLICATOR_CAP) {
          const bonusAmount = Math.min(input.amount, LIMITS.DUPLICATOR_CAP - recipient.duplicatorBonus);
          if (bonusAmount > 0) {
            await tx.insert(transactions).values({
              fromId: "SYSTEM",
              toId: input.toId,
              amount: bonusAmount,
              concept: "Bono Duplicador",
              type: "BONO",
            });
            await tx
              .update(users)
              .set({ duplicatorBonus: recipient.duplicatorBonus + bonusAmount })
              .where(eq(users.id, input.toId));
          }
        }

        // 6. Bono Referidos
        if (recipient.referrerId) {
          const [salesCount] = await tx
            .select({ count: sql<number>`count(*)` })
            .from(transactions)
            .where(and(eq(transactions.toId, input.toId), eq(transactions.type, "TRANSFERENCIA")));

          if (Number(salesCount.count) <= 3) {
            // Including the one we just did
            const referralBonus = input.amount * 0.05;
            await tx.insert(transactions).values({
              fromId: "SYSTEM",
              toId: recipient.referrerId,
              amount: referralBonus,
              concept: `Bono Referido por venta de ${recipient.name}`,
              type: "BONO",
            });
          }
        }

        return mainTx;
      });
    }),
});
