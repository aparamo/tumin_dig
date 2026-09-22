import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { contactMethods, users } from "@/db/schema";
import {
  contactChannelSchema,
  contactMethodUpsertSchema,
  normalizeContactValue,
} from "@/lib/contact-links";
import { loadMyContactMethods } from "@/lib/contact-methods-server";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/server";

export const contactMethodsRouter = createTRPCRouter({
  listMine: protectedProcedure.query(async ({ ctx }) => {
    const [privacy] = await db
      .select({ showContactMethods: users.showContactMethods })
      .from(users)
      .where(eq(users.id, ctx.session.user.id))
      .limit(1);

    const methods = await loadMyContactMethods(ctx.session.user.id);
    return {
      showContactMethods: privacy?.showContactMethods ?? false,
      methods,
    };
  }),

  setShowContactMethods: protectedProcedure
    .input(z.object({ showContactMethods: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(users)
        .set({ showContactMethods: input.showContactMethods })
        .where(eq(users.id, ctx.session.user.id));
      return { ok: true as const };
    }),

  upsert: protectedProcedure
    .input(contactMethodUpsertSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      let normalized;
      try {
        normalized = normalizeContactValue(input.channel, input.value, input.label);
      } catch (e) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: e instanceof Error ? e.message : "Valor inválido",
        });
      }

      if (input.id) {
        const [existing] = await db
          .select()
          .from(contactMethods)
          .where(and(eq(contactMethods.id, input.id), eq(contactMethods.userId, userId)))
          .limit(1);
        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Método no encontrado" });
        }
        const [updated] = await db
          .update(contactMethods)
          .set({
            channel: input.channel,
            value: normalized.value,
            label: normalized.label,
            isEnabled: input.isEnabled ?? existing.isEnabled,
            isPublic: input.isPublic ?? existing.isPublic,
            sortOrder: input.sortOrder ?? existing.sortOrder,
            updatedAt: new Date(),
          })
          .where(eq(contactMethods.id, input.id))
          .returning();
        return updated;
      }

      if (input.channel !== "other") {
        const [dup] = await db
          .select({ id: contactMethods.id })
          .from(contactMethods)
          .where(
            and(eq(contactMethods.userId, userId), eq(contactMethods.channel, input.channel))
          )
          .limit(1);
        if (dup) {
          const [updated] = await db
            .update(contactMethods)
            .set({
              value: normalized.value,
              label: normalized.label,
              isEnabled: input.isEnabled ?? true,
              isPublic: input.isPublic ?? false,
              sortOrder: input.sortOrder ?? 0,
              updatedAt: new Date(),
            })
            .where(eq(contactMethods.id, dup.id))
            .returning();
          return updated;
        }
      }

      const [created] = await db
        .insert(contactMethods)
        .values({
          userId,
          channel: input.channel,
          value: normalized.value,
          label: normalized.label,
          isEnabled: input.isEnabled ?? true,
          isPublic: input.isPublic ?? false,
          sortOrder: input.sortOrder ?? 0,
        })
        .returning();
      return created;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await db
        .delete(contactMethods)
        .where(
          and(eq(contactMethods.id, input.id), eq(contactMethods.userId, ctx.session.user.id))
        )
        .returning({ id: contactMethods.id });
      if (deleted.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Método no encontrado" });
      }
      return { ok: true as const };
    }),

  setMethodPublic: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        isPublic: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(contactMethods)
        .set({ isPublic: input.isPublic, updatedAt: new Date() })
        .where(
          and(eq(contactMethods.id, input.id), eq(contactMethods.userId, ctx.session.user.id))
        )
        .returning();
      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Método no encontrado" });
      }
      return updated;
    }),

  /** Quick add from profile: ensure channel exists with login phone (whatsapp/phone/sms) */
  addFromLoginPhone: protectedProcedure
    .input(z.object({ channel: z.enum(["whatsapp", "phone", "sms"]) }))
    .mutation(async ({ ctx, input }) => {
      const [u] = await db
        .select({ phone: users.phone })
        .from(users)
        .where(eq(users.id, ctx.session.user.id))
        .limit(1);
      if (!u?.phone) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No hay teléfono en la cuenta" });
      }
      const normalized = normalizeContactValue(input.channel, u.phone);
      const [dup] = await db
        .select({ id: contactMethods.id })
        .from(contactMethods)
        .where(
          and(
            eq(contactMethods.userId, ctx.session.user.id),
            eq(contactMethods.channel, input.channel)
          )
        )
        .limit(1);
      if (dup) {
        const [updated] = await db
          .update(contactMethods)
          .set({ value: normalized.value, updatedAt: new Date() })
          .where(eq(contactMethods.id, dup.id))
          .returning();
        return updated;
      }
      const [created] = await db
        .insert(contactMethods)
        .values({
          userId: ctx.session.user.id,
          channel: input.channel,
          value: normalized.value,
          isEnabled: true,
          isPublic: false,
        })
        .returning();
      return created;
    }),

  reorder: protectedProcedure
    .input(
      z.object({
        orderedIds: z.array(z.string().uuid()).max(40),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const mine = await loadMyContactMethods(ctx.session.user.id);
      const mineIds = new Set(mine.map((m) => m.id));
      for (const id of input.orderedIds) {
        if (!mineIds.has(id)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Método inválido" });
        }
      }
      await db.transaction(async (tx) => {
        for (let i = 0; i < input.orderedIds.length; i++) {
          await tx
            .update(contactMethods)
            .set({ sortOrder: i, updatedAt: new Date() })
            .where(
              and(
                eq(contactMethods.id, input.orderedIds[i]!),
                eq(contactMethods.userId, ctx.session.user.id)
              )
            );
        }
      });
      return { ok: true as const };
    }),

  availableChannels: protectedProcedure.query(async ({ ctx }) => {
    const mine = await loadMyContactMethods(ctx.session.user.id);
    const used = new Set(mine.filter((m) => m.channel !== "other").map((m) => m.channel));
    return {
      used: [...used],
      schema: contactChannelSchema.options,
    };
  }),
});
