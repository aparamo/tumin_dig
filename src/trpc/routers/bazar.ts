import { createTRPCRouter, publicProcedure, protectedProcedure } from "../../lib/trpc/server";
import { db } from "../../db";
import { products, users, ratings, transactions, productComments } from "../../db/schema";
import { eq, and, ilike, sql, desc } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

function sellerDisplayNameSql() {
  return sql<string>`COALESCE(${users.publicName}, ${users.name})`;
}

function sellerPhonePublicSql() {
  return sql<string | null>`CASE WHEN ${users.showPhone} = true THEN ${users.phone} ELSE NULL END`;
}

export const bazarRouter = createTRPCRouter({
  getProducts: publicProcedure
    .input(
      z.object({
        name: z.string().optional(),
        category: z.string().optional(),
        region: z.string().optional(),
        sortBy: z.enum(["recientes", "menor_precio", "mayor_precio"]).default("recientes"),
        limit: z.number().min(1).max(50).default(12),
        cursor: z.number().nullish(), // offset
      })
    )
    .query(async ({ ctx, input }) => {
      const { name, category, region, sortBy, limit, cursor } = input;
      const offset = cursor ?? 0;
      const userRegion = ctx.session?.user?.region;

      const conditions = [];
      if (name) conditions.push(ilike(products.name, `%${name}%`));
      if (category) {
        conditions.push(sql`${products.categories} @> ${JSON.stringify([category])}::jsonb`);
      }
      if (region && region !== "Todas") conditions.push(eq(products.region, region));
      conditions.push(eq(products.status, "ACTIVO"));
      conditions.push(eq(products.showInProfile, true));

      const orderBys = [];

      // Proximity priority (user region first)
      if (userRegion) {
        orderBys.push(sql`CASE WHEN ${products.region} = ${userRegion} THEN 0 ELSE 1 END ASC`);
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
            region: sql<string | null>`CASE WHEN ${users.showRegion} = true THEN ${users.region} ELSE NULL END`,
            phone: sellerPhonePublicSql(),
            avatarUrl: users.avatarUrl,
            publicProfile: users.publicProfile,
            showPhone: users.showPhone,
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
      if (results.length > limit) {
        results.pop(); // remove the extra item
        nextCursor = offset + limit;
      }

      return {
        items: results,
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
            showRegion: users.showRegion,
            showEmail: users.showEmail,
            phone: sellerPhonePublicSql(),
            region: sql<string | null>`CASE WHEN ${users.showRegion} = true THEN ${users.region} ELSE NULL END`,
            email: sql<string | null>`CASE WHEN ${users.showEmail} = true THEN ${users.email} ELSE NULL END`,
          },
        })
        .from(products)
        .innerJoin(users, eq(products.sellerId, users.id))
        .where(and(eq(products.id, input.id), eq(products.status, "ACTIVO"), eq(products.showInProfile, true)))
        .limit(1);

      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Producto no encontrado" });
      }

      return row;
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userRegion = ctx.session.user.region;

      return await db.transaction(async (tx) => {
        // 0. Row-level lock the user
        await tx.execute(sql`SELECT 1 FROM ${users} WHERE id = ${userId} FOR UPDATE`);

        const [userBefore] = await tx
          .select({ productOk: users.productOk })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

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
            region: userRegion,
            imageUrl: input.imageUrl,
            imgUrls: input.imgUrls || [],
            status: "ACTIVO",
            showInProfile: input.showInProfile ?? true,
          })
          .returning();

        if (userBefore && !userBefore.productOk) {
          // Ensure SYSTEM user exists
          await tx
            .insert(users)
            .values({
              id: "SYSTEM",
              name: "Sistema Tumin",
              phone: "SYSTEM_PHONE",
              nip: "SYSTEM_NIP",
              region: "SISTEMA",
              status: "ACTIVO",
              role: "COORDINADOR",
            })
            .onConflictDoNothing({ target: users.id });

          // Give Welcome Bonus: 25 (Activation) + 5 (First product) = 30 Tumin
          await tx.insert(transactions).values({
            fromId: "SYSTEM",
            toId: userId,
            amount: 30,
            concept: "Bono de Bienvenida y Activación",
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const [product] = await db
        .select()
        .from(products)
        .where(and(eq(products.id, input.id), eq(products.sellerId, userId)))
        .limit(1);

      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Producto no encontrado o no eres el dueño" });
      }

      const [updated] = await db
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
        })
        .where(eq(products.id, input.id))
        .returning();

      return updated;
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

  deleteProduct: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const [deleted] = await db
        .delete(products)
        .where(and(eq(products.id, input.id), eq(products.sellerId, userId)))
        .returning();

      if (!deleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Producto no encontrado o no eres el dueño" });
      }
      return deleted;
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
      const userRole = ctx.session.user.role;

      const [product] = await db.select().from(products).where(eq(products.id, input.productId)).limit(1);

      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Producto no encontrado" });
      }

      // Owner or Coordinator
      const isOwner = product.sellerId === userId;
      const isCoordinator = userRole === "COORDINADOR" || userRole === "COORDINADOR_LOCAL";

      if (!isOwner && !isCoordinator) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "No tienes permiso para actualizar este producto" });
      }

      const [updatedProduct] = await db
        .update(products)
        .set({ status: input.status })
        .where(eq(products.id, input.productId))
        .returning();

      return updatedProduct;
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
