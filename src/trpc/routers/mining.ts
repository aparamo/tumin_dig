import { createTRPCRouter, protectedProcedure } from "../../lib/trpc/server";
import { db } from "../../db";
import { users, transactions, dailyMining } from "../../db/schema";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const miningRouter = createTRPCRouter({
  claimMining: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Usuario no encontrado" });
    }
    if (!user.productOk) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Debes tener un producto activo para minar" });
    }

    return await db.transaction(async (tx) => {
      // Ensure SYSTEM user exists
      const [systemUser] = await tx.select().from(users).where(eq(users.id, "SYSTEM")).limit(1);
      if (!systemUser) {
         await tx.insert(users).values({
           id: "SYSTEM",
           name: "Sistema Tumin",
           phone: "0000000000",
           nip: "SYSTEM", 
           region: "SYSTEM",
           status: "ACTIVO",
           role: "COORDINADOR",
         });
      }

      // Get last mining record
      const [lastMining] = await tx
        .select()
        .from(dailyMining)
        .where(eq(dailyMining.userId, userId))
        .orderBy(desc(dailyMining.date))
        .limit(1);

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      let newStreak = 1;
      let alreadyMined = false;

      if (lastMining) {
        const lastDate = new Date(lastMining.date);
        const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
        
        if (lastDay.getTime() === today.getTime()) {
          alreadyMined = true;
        } else {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);

          if (lastDay.getTime() === yesterday.getTime()) {
            newStreak = lastMining.streak + 1;
          } else {
            newStreak = 1;
          }
        }
      }

      if (alreadyMined) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ya has minado hoy" });
      }

      let reward = 1;
      if (newStreak >= 30) reward = 10;
      else if (newStreak >= 15) reward = 7;
      else if (newStreak >= 7) reward = 5;
      else if (newStreak >= 3) reward = 3;
      else reward = 1;

      await tx.insert(transactions).values({
        fromId: "SYSTEM",
        toId: userId,
        amount: reward,
        concept: `Minado Diario - Racha ${newStreak}`,
        type: "MINADO",
      });

      await tx.insert(dailyMining).values({
        userId,
        date: now,
        streak: newStreak,
        amount: reward,
      });

      return { streak: newStreak, reward };
    });
  }),
});
