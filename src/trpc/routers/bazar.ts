import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  coordinatorProcedure,
} from "../../lib/trpc/server";
import { db } from "../../db";
import { products, users, ratings, transactions, productComments } from "../../db/schema";
import { eq, and, ilike, sql, desc, count } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  formatCompactLocation,
  formatPublicLocation,
  isMexicoCountry,
  MEXICO_COUNTRY,
} from "../../lib/location";
import { isInJurisdiction, type UserRole } from "../../lib/trpc/authorization";
import { logAdminAction } from "../../lib/admin-log";
import { LIMITS } from "../../lib/limits";
import { MAX_STARRED_PRODUCTS } from "../../lib/product-categories";
import { issueFromSystem } from "../../lib/system-ledger";

type DrizzleTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Re-calculates and persists productOk for a given seller based on live ACTIVO product count. */
async function syncProductOk(tx: DrizzleTx, sellerId: string) {
  const [{ val }] = await tx
    .select({ val: count() })
    .from(products)
    .where(and(eq(products.sellerId, sellerId), eq(products.status, "ACTIVO")));
  await tx.update(users).set({ productOk: Number(val) > 0 }).where(eq(users.id, sellerId));
}

function sellerDisplayNameSql() {
  return sql<string>`COALESCE(${users.publicName}, ${users.name})`;
}

function sellerPhonePublicSql() {
  return sql<string | null>`CASE WHEN ${users.showPhone} = true THEN ${users.phone} ELSE NULL END`;
}

function sellerResidenceFields() {
  return {
    residenceCountry: users.residenceCountry,
    residenceState: users.residenceState,
    residenceCity: users.residenceCity,
    residencePostalCode: users.residencePostalCode,
    showRegion: users.showRegion,
  };
}

function mapSellerLocation<T extends {
  showRegion: boolean;
  residenceCountry: string | null;
  residenceState: string | null;
  residenceCity: string | null;
  residencePostalCode: string | null;
}>(seller: T) {
  const residence = {
    residenceCountry: seller.residenceCountry,
    residenceState: seller.residenceState,
    residenceCity: seller.residenceCity,
    residencePostalCode: seller.residencePostalCode,
  };
  return {
    ...seller,
    location: seller.showRegion ? formatPublicLocation(residence) : null,
    locationCompact: seller.showRegion ? formatCompactLocation(residence) : null,
  };
}

export const bazarRouter = createTRPCRouter({
  getProducts: publicProcedure
    .input(
      z.object({
        name: z.string().optional(),
        category: z.string().optional(),
        /** @deprecated use locationState */
        region: z.string().optional(),
        locationState: z.string().optional(),
        locationCountry: z.string().optional(),
        sortBy: z.enum(["recientes", "menor_precio", "mayor_precio"]).default("recientes"),
        limit: z.number().min(1).max(50).default(12),
        cursor: z.number().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { name, category, sortBy, limit, cursor } = input;
      const offset = cursor ?? 0;
      const locationState = input.locationState ?? (input.region && input.region !== "Todas" ? input.region : undefined);
      const locationCountry = input.locationCountry;

      const sessionUserId = ctx.session?.user?.id;
      let viewerResidenceState: string | null = ctx.session?.user?.residenceState ?? null;
      let viewerResidenceCountry: string | null = ctx.session?.user?.residenceCountry ?? null;

      if (sessionUserId && (!viewerResidenceState && !viewerResidenceCountry)) {
        const [viewer] = await db
          .select({
            residenceState: users.residenceState,
            residenceCountry: users.residenceCountry,
          })
          .from(users)
          .where(eq(users.id, sessionUserId))
          .limit(1);
        viewerResidenceState = viewer?.residenceState ?? null;
        viewerResidenceCountry = viewer?.residenceCountry ?? null;
      }

      const conditions = [];
      if (name) conditions.push(ilike(products.name, `%${name}%`));
      if (category) {
        conditions.push(sql`${products.categories} @> ${JSON.stringify([category])}::jsonb`);
      }
      if (locationState && locationState !== "Todas") {
        conditions.push(eq(users.residenceState, locationState));
      } else if (locationCountry && locationCountry !== "Todas") {
        conditions.push(eq(users.residenceCountry, locationCountry));
      }
      conditions.push(eq(products.status, "ACTIVO"));
      conditions.push(eq(products.showInProfile, true));
      conditions.push(eq(users.publicProfile, true));

      const orderBys = [];

      if (viewerResidenceState) {
        orderBys.push(
          sql`CASE WHEN ${users.residenceState} = ${viewerResidenceState} THEN 0 ELSE 1 END ASC`
        );
      } else if (viewerResidenceCountry) {
        orderBys.push(
          sql`CASE WHEN ${users.residenceCountry} = ${viewerResidenceCountry} THEN 0 ELSE 1 END ASC`
        );
      }

      if (sortBy === "recientes") {
        orderBys.push(sql`${products.createdAt} DESC`);
      } else if (sortBy === "menor_precio") {
        orderBys.push(sql`${products.priceMxn} + ${products.priceTumin} ASC`);
      } else if (sortBy === "mayor_precio") {
        orderBys.push(sql`${products.priceMxn} + ${products.priceTumin} DESC`);
      }

      const results = await db
        .select({
          product: products,
          seller: {
            id: users.id,
            displayName: sellerDisplayNameSql(),
            phone: sellerPhonePublicSql(),
            avatarUrl: users.avatarUrl,
            publicProfile: users.publicProfile,
            showPhone: users.showPhone,
            ...sellerResidenceFields(),
          },
          avgRating: sql<number>`COALESCE((SELECT AVG(${ratings.stars}) FROM ${ratings} WHERE ${ratings.sellerId} = ${products.sellerId}), 0)`.mapWith(
            Number
          ),
        })
        .from(products)
        .innerJoin(users, eq(products.sellerId, users.id))
        .where(and(...conditions))
        .orderBy(...orderBys)
        .limit(limit + 1)
        .offset(offset);

      let nextCursor: typeof cursor | undefined = undefined;
      const sliced = [...results];
      if (sliced.length > limit) {
        sliced.pop();
        nextCursor = offset + limit;
      }

      const items = sliced.map((row) => ({
        ...row,
        seller: mapSellerLocation(row.seller),
        product: {
          ...row.product,
          locationLabel: mapSellerLocation(row.seller).locationCompact ?? row.product.region,
        },
      }));

      return {
        items,
        nextCursor,
      };
    }),

  getProduct: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const [row] = await db
        .select({
          product: products,
          seller: {
            id: users.id,
            displayName: sellerDisplayNameSql(),
            avatarUrl: users.avatarUrl,
            publicProfile: users.publicProfile,
            showPhone: users.showPhone,
            showEmail: users.showEmail,
            phone: sellerPhonePublicSql(),
            email: sql<string | null>`CASE WHEN ${users.showEmail} = true THEN ${users.email} ELSE NULL END`,
            residenceCountry: users.residenceCountry,
            residenceState: users.residenceState,
            residenceCity: users.residenceCity,
            residencePostalCode: users.residencePostalCode,
            showRegion: users.showRegion,
          },
        })
        .from(products)
        .innerJoin(users, eq(products.sellerId, users.id))
        .where(and(
          eq(products.id, input.id),
          eq(products.status, "ACTIVO"),
          eq(products.showInProfile, true),
          eq(users.publicProfile, true),
        ))
        .limit(1);

      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Producto no encontrado" });
      }

      const sellerMapped = mapSellerLocation(row.seller);
      return {
        product: {
          ...row.product,
          locationLabel: sellerMapped.locationCompact ?? row.product.region,
        },
        seller: sellerMapped,
      };
    }),

  getComments: publicProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .query(async ({ input }) => {
      const [p] = await db
        .select({ id: products.id })
        .from(products)
        .where(
          and(
            eq(products.id, input.productId),
            eq(products.status, "ACTIVO"),
            eq(products.showInProfile, true)
          )
        )
        .limit(1);
      if (!p) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Producto no encontrado" });
      }

      return await db
        .select({
          id: productComments.id,
          productId: productComments.productId,
          authorId: productComments.authorId,
          body: productComments.body,
          createdAt: productComments.createdAt,
          updatedAt: productComments.updatedAt,
          authorDisplayName: sql<string>`COALESCE(${users.publicName}, ${users.name})`,
          authorAvatarUrl: users.avatarUrl,
        })
        .from(productComments)
        .innerJoin(users, eq(productComments.authorId, users.id))
        .where(eq(productComments.productId, input.productId))
        .orderBy(desc(productComments.createdAt));
    }),

  addComment: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        body: z.string().min(1).max(4000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [p] = await db
        .select({ id: products.id })
        .from(products)
        .where(
          and(
            eq(products.id, input.productId),
            eq(products.status, "ACTIVO"),
            eq(products.showInProfile, true)
          )
        )
        .limit(1);
      if (!p) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Producto no encontrado" });
      }

      const [created] = await db
        .insert(productComments)
        .values({
          productId: input.productId,
          authorId: ctx.session.user.id,
          body: input.body.trim(),
        })
        .returning();

      return created;
    }),

  editComment: protectedProcedure
    .input(
      z.object({
        commentId: z.string().uuid(),
        body: z.string().min(1).max(4000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await db
        .select()
        .from(productComments)
        .where(eq(productComments.id, input.commentId))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Comentario no encontrado" });
      }
      if (existing.authorId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No puedes editar este comentario" });
      }

      const [updated] = await db
        .update(productComments)
        .set({ body: input.body.trim(), updatedAt: new Date() })
        .where(eq(productComments.id, input.commentId))
        .returning();

      return updated;
    }),

  deleteComment: protectedProcedure
    .input(z.object({ commentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await db
        .select()
        .from(productComments)
        .where(eq(productComments.id, input.commentId))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Comentario no encontrado" });
      }
      if (existing.authorId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No puedes eliminar este comentario" });
      }

      await db.delete(productComments).where(eq(productComments.id, input.commentId));
      return { success: true as const };
    }),

  getMyProducts: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return await db
      .select()
      .from(products)
      .where(eq(products.sellerId, userId))
      .orderBy(sql`${products.createdAt} DESC`);
  }),

  createProduct: protectedProcedure
    .input(
      z.object({
        name: z.string().min(3),
        description: z.string().max(8000).optional(),
        extraInfo: z.string().max(16000).optional().nullable(),
        priceMxn: z.number().min(0),
        priceTumin: z.number().min(0),
        categories: z.array(z.string()),
        imageUrl: z.string().optional(),
        imgUrls: z.array(z.string().url()).optional(),
        showInProfile: z.boolean().optional().default(true),
        isStarred: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      return await db.transaction(async (tx) => {
        await tx.execute(sql`SELECT 1 FROM ${users} WHERE id = ${userId} FOR UPDATE`);

        const [userBefore] = await tx
          .select({
            productOk: users.productOk,
            region: users.region,
            residenceState: users.residenceState,
            residenceCountry: users.residenceCountry,
          })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        const wantStarred = input.isStarred ?? false;
        if (wantStarred) {
          const [{ val: starredCount }] = await tx
            .select({ val: count() })
            .from(products)
            .where(and(eq(products.sellerId, userId), eq(products.isStarred, true)));
          if (Number(starredCount) >= MAX_STARRED_PRODUCTS) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Solo puedes marcar hasta ${MAX_STARRED_PRODUCTS} productos estrella`,
            });
          }
        }

        const productRegion =
          userBefore?.residenceState ??
          (isMexicoCountry(userBefore?.residenceCountry ?? null) ? null : userBefore?.residenceCountry) ??
          userBefore?.region ??
          ctx.session.user.region;

        const [newProduct] = await tx
          .insert(products)
          .values({
            sellerId: userId,
            name: input.name,
            description: input.description?.trim() ? input.description.trim() : null,
            extraInfo: input.extraInfo?.trim() ? input.extraInfo.trim() : null,
            priceMxn: input.priceMxn,
            priceTumin: input.priceTumin,
            categories: input.categories,
            region: productRegion ?? MEXICO_COUNTRY,
            imageUrl: input.imageUrl,
            imgUrls: input.imgUrls || [],
            status: "ACTIVO",
            showInProfile: input.showInProfile ?? true,
            isStarred: wantStarred,
          })
          .returning();

        if (userBefore && !userBefore.productOk) {
          await issueFromSystem(tx, {
            toId: userId,
            amount: LIMITS.FIRST_PRODUCT_BONUS,
            concept: "Bono Primer Producto",
            type: "BONO",
          });

          await tx.update(users).set({ productOk: true }).where(eq(users.id, userId));
        }

        return newProduct;
      });
    }),

  updateProduct: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(3),
        description: z.string().max(8000).optional(),
        extraInfo: z.string().max(16000).optional().nullable(),
        priceMxn: z.number().min(0),
        priceTumin: z.number().min(0),
        categories: z.array(z.string()),
        imgUrls: z.array(z.string().url()),
        status: z.enum(["ACTIVO", "INACTIVO"]),
        showInProfile: z.boolean(),
        isStarred: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return await db.transaction(async (tx) => {
        const [product] = await tx
          .select()
          .from(products)
          .where(and(eq(products.id, input.id), eq(products.sellerId, userId)))
          .limit(1);

        if (!product) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Producto no encontrado o no eres el dueño" });
        }

        if (input.isStarred && !product.isStarred) {
          const [{ val: starredCount }] = await tx
            .select({ val: count() })
            .from(products)
            .where(and(eq(products.sellerId, userId), eq(products.isStarred, true)));
          if (Number(starredCount) >= MAX_STARRED_PRODUCTS) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Solo puedes marcar hasta ${MAX_STARRED_PRODUCTS} productos estrella`,
            });
          }
        }

        const [updated] = await tx
          .update(products)
          .set({
            name: input.name,
            description: input.description?.trim() ? input.description.trim() : null,
            extraInfo: input.extraInfo?.trim() ? input.extraInfo.trim() : null,
            priceMxn: input.priceMxn,
            priceTumin: input.priceTumin,
            categories: input.categories,
            imgUrls: input.imgUrls,
            status: input.status,
            showInProfile: input.showInProfile,
            isStarred: input.isStarred,
          })
          .where(eq(products.id, input.id))
          .returning();

        await syncProductOk(tx, userId);
        return updated;
      });
    }),

  toggleShowInProfile: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        showInProfile: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const [product] = await db
        .select()
        .from(products)
        .where(and(eq(products.id, input.productId), eq(products.sellerId, userId)))
        .limit(1);

      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Producto no encontrado o no eres el dueño" });
      }

      const [updated] = await db
        .update(products)
        .set({ showInProfile: input.showInProfile })
        .where(eq(products.id, input.productId))
        .returning();

      return updated;
    }),

  toggleIsStarred: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        isStarred: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return await db.transaction(async (tx) => {
        const [product] = await tx
          .select()
          .from(products)
          .where(and(eq(products.id, input.productId), eq(products.sellerId, userId)))
          .limit(1);

        if (!product) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Producto no encontrado o no eres el dueño" });
        }

        if (input.isStarred && !product.isStarred) {
          const [{ val: starredCount }] = await tx
            .select({ val: count() })
            .from(products)
            .where(and(eq(products.sellerId, userId), eq(products.isStarred, true)));
          if (Number(starredCount) >= MAX_STARRED_PRODUCTS) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Solo puedes marcar hasta ${MAX_STARRED_PRODUCTS} productos estrella`,
            });
          }
        }

        const [updated] = await tx
          .update(products)
          .set({ isStarred: input.isStarred })
          .where(eq(products.id, input.productId))
          .returning();

        return updated;
      });
    }),

  deleteProduct: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return await db.transaction(async (tx) => {
        const [deleted] = await tx
          .delete(products)
          .where(and(eq(products.id, input.id), eq(products.sellerId, userId)))
          .returning();

        if (!deleted) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Producto no encontrado o no eres el dueño" });
        }
        await syncProductOk(tx, userId);
        return deleted;
      });
    }),

  updateProductStatus: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        status: z.enum(["ACTIVO", "INACTIVO"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userRole = ctx.session.user.role as UserRole;

      return await db.transaction(async (tx) => {
        const [product] = await tx.select().from(products).where(eq(products.id, input.productId)).limit(1);

        if (!product) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Producto no encontrado" });
        }

        const isOwner = product.sellerId === userId;

        if (!isOwner) {
          const [seller] = await tx.select().from(users).where(eq(users.id, product.sellerId)).limit(1);
          if (!seller || !isInJurisdiction({ role: userRole, region: ctx.session.user.region }, seller)) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "No tienes permiso para actualizar este producto" });
          }
          // Coordinators can only deactivate products that do not belong to them.
          if (input.status === "ACTIVO") {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Solo puedes desactivar productos ajenos" });
          }
        }

        const [updatedProduct] = await tx
          .update(products)
          .set({ status: input.status })
          .where(eq(products.id, input.productId))
          .returning();

        await syncProductOk(tx, product.sellerId);
        return updatedProduct;
      });
    }),

  deactivateProduct: coordinatorProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userRole = ctx.session.user.role as UserRole;
      const callerId = ctx.session.user.id;

      return await db.transaction(async (tx) => {
        const [product] = await tx.select().from(products).where(eq(products.id, input.productId)).limit(1);
        if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Producto no encontrado" });

        const [seller] = await tx.select().from(users).where(eq(users.id, product.sellerId)).limit(1);
        if (!seller) throw new TRPCError({ code: "NOT_FOUND", message: "Vendedor no encontrado" });

        if (!isInJurisdiction({ role: userRole, region: ctx.session.user.region }, seller)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Producto fuera de tu jurisdicción" });
        }

        await tx.update(products).set({ status: "INACTIVO" }).where(eq(products.id, input.productId));

        await syncProductOk(tx, product.sellerId);

        await logAdminAction(tx, {
          actorId: callerId,
          targetUserId: product.sellerId,
          targetProductId: product.id,
          action: "DEACTIVATE_PRODUCT",
          metadata: { productName: product.name },
        });

        return { success: true };
      });
    }),

  rateSeller: protectedProcedure
    .input(
      z.object({
        sellerId: z.string(),
        stars: z.number().min(1).max(5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const voterId = ctx.session.user.id;

      if (voterId === input.sellerId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No puedes calificarte a ti mismo" });
      }

      // Check if rating already exists
      const [existing] = await db
        .select()
        .from(ratings)
        .where(and(eq(ratings.voterId, voterId), eq(ratings.sellerId, input.sellerId)))
        .limit(1);

      if (existing) {
        const [updated] = await db
          .update(ratings)
          .set({ stars: input.stars })
          .where(eq(ratings.id, existing.id))
          .returning();
        return updated;
      } else {
        const [created] = await db
          .insert(ratings)
          .values({
            voterId,
            sellerId: input.sellerId,
            stars: input.stars,
          })
          .returning();
        return created;
      }
    }),
});
