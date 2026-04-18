import { createTRPCRouter, protectedProcedure } from "../../lib/trpc/server";
import { z } from "zod";
import { db } from "../../db";
import { users, transactions } from "../../db/schema";
import { eq, sql, and, desc, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

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
    return await db
      .select()
      .from(transactions)
      .where(or(eq(transactions.fromId, userId), eq(transactions.toId, userId)))
      .orderBy(desc(transactions.createdAt))
      .limit(15);
  }),

  sendTumin: protectedProcedure
    .input(z.object({
      toId: z.string(),
      amount: z.number().positive(),
      concept: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const meId = ctx.session.user.id;
      
      if (input.toId === meId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No puedes enviarte a ti mismo" });
      }

      return await db.transaction(async (tx) => {
        // Ensure SYSTEM user exists
        const [systemUser] = await tx.select().from(users).where(eq(users.id, "SYSTEM")).limit(1);
        if (!systemUser) {
           await tx.insert(users).values({
             id: "SYSTEM",
             name: "Sistema Tumin",
             phone: "0000000000",
             nip: "SYSTEM", // Placeholder
             region: "SYSTEM",
             status: "ACTIVO",
             role: "COORDINADOR",
           });
        }

        // 1. Check sender balance
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

        // 2. Check recipient
        const [recipient] = await tx
          .select()
          .from(users)
          .where(eq(users.id, input.toId))
          .limit(1);
        
        if (!recipient) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Destinatario no encontrado" });
        }
        if (recipient.status === "CONGELADO") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "El destinatario está congelado" });
        }
        if (!recipient.productOk) {
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
          })
          .returning();

        // 4. Bono Primera Venta
        if (!recipient.firstSaleOk) {
          await tx.insert(transactions).values({
            fromId: "SYSTEM",
            toId: input.toId,
            amount: 25,
            concept: "Bono Primera Venta",
            type: "BONO",
          });
          await tx.update(users).set({ firstSaleOk: true }).where(eq(users.id, input.toId));
        }

        // 5. Bono Duplicador
        if (recipient.duplicatorBonus < 10000) {
          const bonusAmount = Math.min(input.amount, 10000 - recipient.duplicatorBonus);
          if (bonusAmount > 0) {
            await tx.insert(transactions).values({
              fromId: "SYSTEM",
              toId: input.toId,
              amount: bonusAmount,
              concept: "Bono Duplicador",
              type: "BONO",
            });
            await tx.update(users)
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
          
          if (Number(salesCount.count) <= 3) { // Including the one we just did
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
