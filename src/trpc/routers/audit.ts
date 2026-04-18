import { createTRPCRouter, protectedProcedure } from "../../lib/trpc/server";
import { db } from "../../db";
import { users, transactions, products, ratings } from "../../db/schema";
import { eq, and, desc, sql, gte, lt } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

interface ParasiteRow {
  id: string;
  name: string;
  total_mined: number;
  grand_total_sent: number;
  primary_receiver_id: string;
  primary_receiver_name: string;
}

export const auditRouter = createTRPCRouter({
  getAuditReport: protectedProcedure.query(async ({ ctx }) => {
    const userRole = ctx.session.user.role;
    if (userRole !== "COORDINADOR" && userRole !== "COORDINADOR_LOCAL") {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Solo los coordinadores pueden ver reportes de auditoría" });
    }

    // 1. Top 10 duplicator bonuses
    const topDuplicators = await db
      .select({
        id: users.id,
        name: users.name,
        duplicatorBonus: users.duplicatorBonus,
      })
      .from(users)
      .orderBy(desc(users.duplicatorBonus))
      .limit(10);

    // 2. "Parasite" detection
    // Users who mine and send all to one person.
    const query = sql<ParasiteRow>`
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
      )
      SELECT 
        u.id, 
        u.name, 
        um.total_mined,
        ud.grand_total_sent,
        ust.to_id as primary_receiver_id,
        ur.name as primary_receiver_name
      FROM ${users} u
      JOIN user_mining um ON u.id = um.user_id
      JOIN user_destinations ud ON u.id = ud.from_id
      JOIN user_sent_totals ust ON u.id = ust.from_id
      JOIN ${users} ur ON ust.to_id = ur.id
      WHERE ud.unique_receivers = 1 
      AND ud.grand_total_sent >= um.total_mined * 0.9
    `;

    const parasitesResult = await db.execute(query);
    const parasites = parasitesResult as unknown as ParasiteRow[];

    // 3. Product control quality list
    const productQuality = await db
      .select({
        productId: products.id,
        productName: products.name,
        sellerName: users.name,
        avgRating: sql<number>`AVG(${ratings.stars})`.mapWith(Number),
        ratingCount: sql<number>`COUNT(${ratings.id})`.mapWith(Number),
      })
      .from(products)
      .innerJoin(users, eq(products.sellerId, users.id))
      .leftJoin(ratings, eq(ratings.sellerId, users.id))
      .groupBy(products.id, products.name, users.name)
      .orderBy(sql`AVG(${ratings.stars}) ASC NULLS LAST`);

    return {
      topDuplicators,
      parasites,
      productQuality,
    };
  }),

  freezeUser: protectedProcedure
    .input(z.object({ userId: z.string(), status: z.enum(["ACTIVO", "CONGELADO"]) }))
    .mutation(async ({ ctx, input }) => {
      const userRole = ctx.session.user.role;
      if (userRole !== "COORDINADOR" && userRole !== "COORDINADOR_LOCAL") {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Solo los coordinadores pueden congelar usuarios" });
      }

      const [updatedUser] = await db
        .update(users)
        .set({ status: input.status })
        .where(eq(users.id, input.userId))
        .returning();

      return updatedUser;
    }),

  claimAuditReward: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const userRole = ctx.session.user.role;

    if (userRole !== "COORDINADOR" && userRole !== "COORDINADOR_LOCAL") {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Solo los coordinadores pueden reclamar recompensa de auditoría" });
    }

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Check if already claimed this month
    const [alreadyClaimed] = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.toId, userId),
          eq(transactions.type, "BONO"),
          eq(transactions.concept, "Recompensa de Auditoría Mensual"),
          gte(transactions.createdAt, firstDayOfMonth),
          lt(transactions.createdAt, lastDayOfMonth)
        )
      )
      .limit(1);

    if (alreadyClaimed) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Ya has reclamado tu recompensa este mes" });
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

       const [transaction] = await tx
         .insert(transactions)
         .values({
           fromId: "SYSTEM",
           toId: userId,
           amount: 30,
           concept: "Recompensa de Auditoría Mensual",
           type: "BONO",
         })
         .returning();

       return transaction;
    });
  }),
});
