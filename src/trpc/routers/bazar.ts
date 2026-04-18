import { createTRPCRouter, publicProcedure, protectedProcedure } from "../../lib/trpc/server";
import { db } from "../../db";
import { products, users, ratings } from "../../db/schema";
import { eq, and, ilike, sql, or } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const bazarRouter = createTRPCRouter({
  getProducts: publicProcedure
    .input(
      z.object({
        name: z.string().optional(),
        category: z.string().optional(),
        region: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { name, category, region } = input;

      const conditions = [];
      if (name) conditions.push(ilike(products.name, `%${name}%`));
      if (category) {
          // categories is jsonb string[]
          conditions.push(sql`${products.categories} @> ${JSON.stringify([category])}::jsonb`);
      }
      if (region) conditions.push(eq(products.region, region));
      conditions.push(eq(products.status, "ACTIVO"));

      const results = await db
        .select({
          product: products,
          seller: {
            id: users.id,
            name: users.name,
            region: users.region,
          },
          avgRating: sql<number>`COALESCE((SELECT AVG(${ratings.stars}) FROM ${ratings} WHERE ${ratings.sellerId} = ${products.sellerId}), 0)`.mapWith(Number),
        })
        .from(products)
        .innerJoin(users, eq(products.sellerId, users.id))
        .where(and(...conditions));

      return results;
    }),

  createProduct: protectedProcedure
    .input(
      z.object({
        name: z.string().min(3),
        priceMxn: z.number().min(0),
        priceTumin: z.number().min(0),
        categories: z.array(z.string()),
        imageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userRegion = ctx.session.user.region;

      return await db.transaction(async (tx) => {
        const [newProduct] = await tx
          .insert(products)
          .values({
            sellerId: userId,
            name: input.name,
            priceMxn: input.priceMxn,
            priceTumin: input.priceTumin,
            categories: input.categories,
            region: userRegion,
            imageUrl: input.imageUrl,
            status: "ACTIVO",
          })
          .returning();

        // Update user productOk status
        await tx
          .update(users)
          .set({ productOk: true })
          .where(eq(users.id, userId));

        return newProduct;
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
      const userRole = ctx.session.user.role;

      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, input.productId))
        .limit(1);

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
