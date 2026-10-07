import {
  createTRPCRouter,
  protectedProcedure,
  rateLimitedProtectedProcedure,
} from "../../lib/trpc/server";
import { db } from "../../db";
import { users, transactions, products, type ProductPurchaseSnapshot } from "../../db/schema";
import {
  eq,
  sql,
  and,
  desc,
  or,
  gte,
  lte,
  count,
  isNotNull,
  isNull,
  ilike,
  type SQL,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ensureSystemUser } from "../../lib/system-user";
import { assertPeerTransferParties, issueFromSystem } from "../../lib/system-ledger";
import { LIMITS } from "../../lib/limits";
import { transferSchema } from "../../lib/schemas/wallet";
import {
  buildPurchaseAutoMessage,
  buildTransferAutoMessage,
  sendAutomatedMessage,
} from "../../lib/auto-messages";
import {
  buildHistoryProduct,
  buildTransactionParty,
  historyFlowSchema,
  historyKindFilterSchema,
  historyTimeRangeSchema,
  resolveTransactionKind,
  sanitizeHistorySearch,
  type HistoryTransaction,
  type TransactionLedgerType,
} from "../../lib/transaction-presentation";

const fromUser = alias(users, "tx_from");
const toUser = alias(users, "tx_to");

type HistoryRow = {
  id: string;
  amount: number;
  concept: string;
  type: TransactionLedgerType;
  productId: string | null;
  productSnapshot: ProductPurchaseSnapshot | null;
  createdAt: Date;
  fromId: string;
  toId: string;
  fromName: string;
  fromPublicName: string | null;
  fromPublicProfile: boolean;
  toName: string;
  toPublicName: string | null;
  toPublicProfile: boolean;
};

function mapHistoryRow(row: HistoryRow, userId: string): HistoryTransaction {
  const kind = resolveTransactionKind({
    type: row.type,
    productId: row.productId,
    productSnapshot: row.productSnapshot,
  });
  return {
    id: row.id,
    amount: row.amount,
    concept: row.concept,
    createdAt: row.createdAt,
    isIngreso: row.toId === userId,
    type: row.type,
    kind,
    from: buildTransactionParty({
      id: row.fromId,
      name: row.fromName,
      publicName: row.fromPublicName,
      publicProfile: row.fromPublicProfile,
    }),
    to: buildTransactionParty({
      id: row.toId,
      name: row.toName,
      publicName: row.toPublicName,
      publicProfile: row.toPublicProfile,
    }),
    product: buildHistoryProduct(row.productId, row.productSnapshot, row.concept),
  };
}

const historySelect = {
  id: transactions.id,
  amount: transactions.amount,
  concept: transactions.concept,
  type: transactions.type,
  productId: transactions.productId,
  productSnapshot: transactions.productSnapshot,
  createdAt: transactions.createdAt,
  fromId: transactions.fromId,
  toId: transactions.toId,
  fromName: fromUser.name,
  fromPublicName: fromUser.publicName,
  fromPublicProfile: fromUser.publicProfile,
  toName: toUser.name,
  toPublicName: toUser.publicName,
  toPublicProfile: toUser.publicProfile,
};

function displayNameOf(u: { name: string; publicName: string | null }): string {
  return u.publicName?.trim() || u.name;
}

const salesTimeRangeSchema = z.enum(["7d", "30d", "90d", "all"]);

function startDateForRange(
  range: z.infer<typeof salesTimeRangeSchema> | "1y"
): Date | null {
  if (range === "all") return null;
  const days =
    range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function mexicoCityDateKey(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function fillSalesByDay(
  rows: Array<{ date: string; count: number; revenue: number }>,
  range: z.infer<typeof salesTimeRangeSchema>
): Array<{ date: string; count: number; revenue: number }> {
  if (range === "all") {
    return rows.map((r) => ({
      date: r.date,
      count: Number(r.count) || 0,
      revenue: Number(r.revenue) || 0,
    }));
  }
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const byDate = new Map(
    rows.map((r) => [r.date, { count: Number(r.count) || 0, revenue: Number(r.revenue) || 0 }])
  );
  const out: Array<{ date: string; count: number; revenue: number }> = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = mexicoCityDateKey(d);
    const hit = byDate.get(key);
    out.push({ date: key, count: hit?.count ?? 0, revenue: hit?.revenue ?? 0 });
  }
  return out;
}

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
      .select(historySelect)
      .from(transactions)
      .innerJoin(fromUser, eq(transactions.fromId, fromUser.id))
      .innerJoin(toUser, eq(transactions.toId, toUser.id))
      .where(or(eq(transactions.fromId, userId), eq(transactions.toId, userId)))
      .orderBy(desc(transactions.createdAt))
      .limit(15);
    return rows.map((row) => mapHistoryRow(row, userId));
  }),

  listHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.number().min(0).default(0),
        search: z.string().max(80).optional(),
        flow: historyFlowSchema.default("all"),
        kind: historyKindFilterSchema.default("all"),
        timeRange: historyTimeRangeSchema.default("all"),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const conditions: SQL[] = [];

      if (input.flow === "in") {
        conditions.push(eq(transactions.toId, userId));
      } else if (input.flow === "out") {
        conditions.push(eq(transactions.fromId, userId));
      } else {
        conditions.push(
          or(eq(transactions.fromId, userId), eq(transactions.toId, userId))!
        );
      }

      if (input.kind === "bazar") {
        conditions.push(isNotNull(transactions.productId));
      } else if (input.kind === "envio") {
        conditions.push(eq(transactions.type, "TRANSFERENCIA"));
        conditions.push(isNull(transactions.productId));
      } else if (input.kind === "bono") {
        conditions.push(eq(transactions.type, "BONO"));
        conditions.push(isNull(transactions.productId));
      } else if (input.kind === "minado") {
        conditions.push(eq(transactions.type, "MINADO"));
        conditions.push(isNull(transactions.productId));
      } else if (input.kind === "pago_trabajo") {
        conditions.push(eq(transactions.type, "PAGO_TRABAJO"));
        conditions.push(isNull(transactions.productId));
      }

      const start = startDateForRange(input.timeRange);
      if (start) {
        conditions.push(gte(transactions.createdAt, start));
      }

      const search = input.search ? sanitizeHistorySearch(input.search) : "";
      if (search.length > 0) {
        const pattern = `%${search}%`;
        conditions.push(
          or(
            ilike(transactions.concept, pattern),
            ilike(fromUser.name, pattern),
            ilike(fromUser.publicName, pattern),
            ilike(toUser.name, pattern),
            ilike(toUser.publicName, pattern),
            sql`coalesce(${transactions.productSnapshot}->>'name', '') ILIKE ${pattern}`
          )!
        );
      }

      const rows = await db
        .select(historySelect)
        .from(transactions)
        .innerJoin(fromUser, eq(transactions.fromId, fromUser.id))
        .innerJoin(toUser, eq(transactions.toId, toUser.id))
        .where(and(...conditions))
        .orderBy(desc(transactions.createdAt))
        .limit(input.limit + 1)
        .offset(input.cursor);

      const hasMore = rows.length > input.limit;
      const page = hasMore ? rows.slice(0, input.limit) : rows;

      return {
        items: page.map((row) => mapHistoryRow(row, userId)),
        nextCursor: hasMore ? input.cursor + input.limit : null,
      };
    }),

  getMyPurchases: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const rows = await db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          concept: transactions.concept,
          productId: transactions.productId,
          productSnapshot: transactions.productSnapshot,
          createdAt: transactions.createdAt,
          sellerId: transactions.toId,
          sellerName: users.name,
          sellerPublicName: users.publicName,
          sellerAvatarUrl: users.avatarUrl,
          sellerPublicProfile: users.publicProfile,
          productStatus: products.status,
          productImageUrl: products.imageUrl,
          productImgUrls: products.imgUrls,
        })
        .from(transactions)
        .innerJoin(users, eq(transactions.toId, users.id))
        .leftJoin(products, eq(transactions.productId, products.id))
        .where(and(eq(transactions.fromId, userId), isNotNull(transactions.productId)))
        .orderBy(desc(transactions.createdAt))
        .limit(input.limit + 1)
        .offset(input.cursor);

      const hasMore = rows.length > input.limit;
      const page = hasMore ? rows.slice(0, input.limit) : rows;

      return {
        items: page.map((row) => {
          const snap = row.productSnapshot;
          const liveImage =
            row.productImgUrls && row.productImgUrls.length > 0
              ? row.productImgUrls[0]
              : row.productImageUrl;
          return {
            id: row.id,
            amount: row.amount,
            concept: row.concept,
            productId: row.productId!,
            productName: snap?.name ?? row.concept.replace(/^Compra:\s*/i, ""),
            priceMxn: snap?.priceMxn ?? null,
            priceTumin: snap?.priceTumin ?? row.amount,
            imageUrl: snap?.imageUrl ?? liveImage ?? null,
            productStillActive: row.productStatus === "ACTIVO",
            createdAt: row.createdAt,
            seller: {
              id: row.sellerId,
              displayName: row.sellerPublicName?.trim() || row.sellerName,
              avatarUrl: row.sellerAvatarUrl,
              publicProfile: row.sellerPublicProfile,
            },
          };
        }),
        nextCursor: hasMore ? input.cursor + input.limit : null,
      };
    }),

  getMySales: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.number().min(0).default(0),
        productId: z.string().uuid().optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        minAmount: z.number().positive().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const conditions = [
        eq(transactions.toId, userId),
        isNotNull(transactions.productId),
      ];
      if (input.productId) {
        conditions.push(eq(transactions.productId, input.productId));
      }
      if (input.startDate) {
        conditions.push(gte(transactions.createdAt, input.startDate));
      }
      if (input.endDate) {
        conditions.push(lte(transactions.createdAt, input.endDate));
      }
      if (input.minAmount != null) {
        conditions.push(gte(transactions.amount, input.minAmount));
      }

      const whereClause = and(...conditions);

      const [agg] = await db
        .select({
          totalSales: sql<number>`count(*)::int`,
          totalRevenueTumin: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
          totalRevenueMxn: sql<number>`coalesce(sum(coalesce((${transactions.productSnapshot}->>'priceMxn')::float, 0)), 0)`,
        })
        .from(transactions)
        .where(whereClause);

      const rows = await db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          concept: transactions.concept,
          productId: transactions.productId,
          productSnapshot: transactions.productSnapshot,
          createdAt: transactions.createdAt,
          buyerId: transactions.fromId,
          buyerName: users.name,
          buyerPublicName: users.publicName,
          buyerAvatarUrl: users.avatarUrl,
          buyerPublicProfile: users.publicProfile,
          productStatus: products.status,
          productImageUrl: products.imageUrl,
          productImgUrls: products.imgUrls,
        })
        .from(transactions)
        .innerJoin(users, eq(transactions.fromId, users.id))
        .leftJoin(products, eq(transactions.productId, products.id))
        .where(whereClause)
        .orderBy(desc(transactions.createdAt))
        .limit(input.limit + 1)
        .offset(input.cursor);

      const hasMore = rows.length > input.limit;
      const page = hasMore ? rows.slice(0, input.limit) : rows;

      return {
        items: page.map((row) => {
          const snap = row.productSnapshot;
          const liveImage =
            row.productImgUrls && row.productImgUrls.length > 0
              ? row.productImgUrls[0]
              : row.productImageUrl;
          return {
            id: row.id,
            amount: row.amount,
            concept: row.concept,
            productId: row.productId!,
            productName: snap?.name ?? row.concept.replace(/^Compra:\s*/i, ""),
            priceMxn: snap?.priceMxn ?? null,
            priceTumin: snap?.priceTumin ?? row.amount,
            imageUrl: snap?.imageUrl ?? liveImage ?? null,
            productStillActive: row.productStatus === "ACTIVO",
            createdAt: row.createdAt,
            buyer: {
              id: row.buyerId,
              displayName: row.buyerPublicName?.trim() || row.buyerName,
              avatarUrl: row.buyerAvatarUrl,
              publicProfile: row.buyerPublicProfile,
            },
          };
        }),
        nextCursor: hasMore ? input.cursor + input.limit : null,
        stats: {
          totalSales: Number(agg?.totalSales) || 0,
          totalRevenueTumin: Number(agg?.totalRevenueTumin) || 0,
          totalRevenueMxn: Number(agg?.totalRevenueMxn) || 0,
        },
      };
    }),

  getMySalesStats: protectedProcedure
    .input(
      z.object({
        timeRange: salesTimeRangeSchema.default("30d"),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const start = startDateForRange(input.timeRange);

      const baseConditions = [
        eq(transactions.toId, userId),
        isNotNull(transactions.productId),
      ];
      if (start) {
        baseConditions.push(gte(transactions.createdAt, start));
      }
      const whereClause = and(...baseConditions);

      const [summary] = await db
        .select({
          totalSales: sql<number>`count(*)::int`,
          totalRevenueTumin: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
          totalRevenueMxn: sql<number>`coalesce(sum(coalesce((${transactions.productSnapshot}->>'priceMxn')::float, 0)), 0)`,
          uniqueBuyers: sql<number>`count(distinct ${transactions.fromId})::int`,
          avgSaleAmount: sql<number>`coalesce(avg(${transactions.amount}), 0)`,
        })
        .from(transactions)
        .where(whereClause);

      const topProductRows = await db
        .select({
          productId: transactions.productId,
          productName: sql<string>`coalesce(${transactions.productSnapshot}->>'name', ${products.name}, 'Producto')`,
          salesCount: sql<number>`count(*)::int`,
          totalRevenue: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
        })
        .from(transactions)
        .leftJoin(products, eq(transactions.productId, products.id))
        .where(whereClause)
        .groupBy(
          transactions.productId,
          sql`coalesce(${transactions.productSnapshot}->>'name', ${products.name}, 'Producto')`
        )
        .orderBy(sql`count(*) desc`)
        .limit(5);

      const dayRows = await db
        .select({
          date: sql<string>`to_char(date_trunc('day', ${transactions.createdAt} AT TIME ZONE 'America/Mexico_City'), 'YYYY-MM-DD')`,
          count: sql<number>`count(*)::int`,
          revenue: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
        })
        .from(transactions)
        .where(whereClause)
        .groupBy(sql`date_trunc('day', ${transactions.createdAt} AT TIME ZONE 'America/Mexico_City')`)
        .orderBy(sql`date_trunc('day', ${transactions.createdAt} AT TIME ZONE 'America/Mexico_City')`);

      const totalSales = Number(summary?.totalSales) || 0;

      return {
        summary: {
          totalSales,
          totalRevenueTumin: Number(summary?.totalRevenueTumin) || 0,
          totalRevenueMxn: Number(summary?.totalRevenueMxn) || 0,
          uniqueBuyers: Number(summary?.uniqueBuyers) || 0,
          avgSaleAmount: Number(summary?.avgSaleAmount) || 0,
        },
        topProducts: topProductRows.map((r) => ({
          productId: r.productId!,
          productName: r.productName,
          salesCount: Number(r.salesCount) || 0,
          totalRevenue: Number(r.totalRevenue) || 0,
        })),
        salesByDay: fillSalesByDay(dayRows, input.timeRange),
      };
    }),

  sendTumin: rateLimitedProtectedProcedure
    .input(transferSchema)
    .mutation(async ({ ctx, input }) => {
      const meId = ctx.session.user.id;

      assertPeerTransferParties(meId, input.toId);

      const result = await db.transaction(async (tx) => {
        await ensureSystemUser(tx);

        // Idempotency check — return existing transaction on retry/double-submit
        const [existing] = await tx
          .select()
          .from(transactions)
          .where(eq(transactions.idempotencyKey, input.idempotencyKey))
          .limit(1);
        if (existing) {
          return {
            mainTx: existing,
            isNew: false as const,
          };
        }

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

        let productSnap: ProductPurchaseSnapshot | null = null;
        let productId: string | null = null;

        if (input.productId) {
          const [product] = await tx
            .select()
            .from(products)
            .where(and(eq(products.id, input.productId), eq(products.sellerId, input.toId)))
            .limit(1);
          if (!product || product.status !== "ACTIVO") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "El producto no está disponible para compra",
            });
          }
          productId = product.id;
          const imageUrl =
            product.imgUrls && product.imgUrls.length > 0
              ? product.imgUrls[0]
              : product.imageUrl;
          productSnap = {
            name: product.name,
            priceMxn: product.priceMxn,
            priceTumin: product.priceTumin,
            imageUrl: imageUrl ?? null,
          };
        }

        // 3. Perform main transaction (peer only — fromId is always the authenticated user)
        const [mainTx] = await tx
          .insert(transactions)
          .values({
            fromId: meId,
            toId: input.toId,
            amount: input.amount,
            concept: input.concept,
            type: "TRANSFERENCIA",
            idempotencyKey: input.idempotencyKey,
            productId,
            productSnapshot: productSnap,
          })
          .returning();

        // 4. Bono Primera Venta
        if (!recipient.firstSaleOk) {
          await issueFromSystem(tx, {
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
            await issueFromSystem(tx, {
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
            const referralBonus = input.amount * 0.05;
            await issueFromSystem(tx, {
              toId: recipient.referrerId,
              amount: referralBonus,
              concept: `Bono Referido por venta de ${recipient.name}`,
              type: "BONO",
            });
          }
        }

        return {
          mainTx,
          isNew: true as const,
          productSnap,
          sender,
          recipient,
        };
      });

      // Best-effort automated DM after successful NEW payment (never blocks / fails the transfer)
      if (result.isNew && result.mainTx) {
        try {
          const isPurchase = Boolean(input.productId && result.productSnap);
          const recipientWantsMessage = isPurchase
            ? result.recipient.autoMessagePurchase
            : result.recipient.autoMessageTransfer;

          if (recipientWantsMessage) {
            const buyerName = displayNameOf(result.sender);
            const sellerName = displayNameOf(result.recipient);

            if (isPurchase && result.productSnap) {
              const body = buildPurchaseAutoMessage({
                sellerDisplayName: sellerName,
                buyerDisplayName: buyerName,
                productName: result.productSnap.name,
                amountTumin: input.amount,
                priceMxn: result.productSnap.priceMxn,
              });
              await sendAutomatedMessage(db, {
                senderId: meId,
                recipientId: input.toId,
                body,
                automatedType: "PURCHASE",
                metadata: {
                  productId: input.productId,
                  productName: result.productSnap.name,
                  amount: input.amount,
                  priceMxn: result.productSnap.priceMxn,
                  transactionId: result.mainTx.id,
                },
              });
            } else {
              const body = buildTransferAutoMessage({
                senderDisplayName: buyerName,
                amountTumin: input.amount,
                concept: input.concept,
              });
              await sendAutomatedMessage(db, {
                senderId: meId,
                recipientId: input.toId,
                body,
                automatedType: "TRANSFER",
                metadata: {
                  amount: input.amount,
                  transactionId: result.mainTx.id,
                },
              });
            }
          }
        } catch (err) {
          // Payment already committed — ignore messaging failures but log
          console.error("[sendTumin] Auto-message failed:", err);
        }
      }

      return result.mainTx;
    }),
});
