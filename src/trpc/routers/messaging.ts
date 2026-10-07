import { TRPCError } from "@trpc/server";
import { and, desc, eq, gt, inArray, isNull, ne, or, count } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { conversations, messages, users } from "@/db/schema";
import { loadPublicContactMethods } from "@/lib/contact-methods-server";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/server";

const MESSAGE_MAX = 2000;

function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

async function assertPeerActive(peerUserId: string) {
  const [peer] = await db
    .select({
      id: users.id,
      status: users.status,
      name: users.name,
      publicName: users.publicName,
      avatarUrl: users.avatarUrl,
      publicProfile: users.publicProfile,
    })
    .from(users)
    .where(eq(users.id, peerUserId))
    .limit(1);
  if (!peer || peer.status !== "ACTIVO") {
    throw new TRPCError({ code: "NOT_FOUND", message: "Usuario no disponible" });
  }
  return peer;
}

export const messagingRouter = createTRPCRouter({
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const me = ctx.session.user.id;
    const [{ val }] = await db
      .select({ val: count() })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(
        and(
          or(eq(conversations.userAId, me), eq(conversations.userBId, me)),
          ne(messages.senderId, me),
          isNull(messages.readAt)
        )
      );
    return { count: Number(val) };
  }),

  listConversations: protectedProcedure.query(async ({ ctx }) => {
    const me = ctx.session.user.id;
    const rows = await db
      .select({
        id: conversations.id,
        userAId: conversations.userAId,
        userBId: conversations.userBId,
        lastMessageAt: conversations.lastMessageAt,
      })
      .from(conversations)
      .where(or(eq(conversations.userAId, me), eq(conversations.userBId, me)))
      .orderBy(desc(conversations.lastMessageAt))
      .limit(100);

    const peerIds = rows.map((r) => (r.userAId === me ? r.userBId : r.userAId));
    const peerMap = new Map<
      string,
      { id: string; displayName: string; avatarUrl: string | null }
    >();

    if (peerIds.length > 0) {
      const peers = await db
        .select({
          id: users.id,
          name: users.name,
          publicName: users.publicName,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(inArray(users.id, peerIds));
      for (const p of peers) {
        peerMap.set(p.id, {
          id: p.id,
          displayName: p.publicName?.trim() || p.name,
          avatarUrl: p.avatarUrl,
        });
      }
    }

    const result = [];
    for (const row of rows) {
      const peerId = row.userAId === me ? row.userBId : row.userAId;
      const [last] = await db
        .select({
          body: messages.body,
          senderId: messages.senderId,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .where(eq(messages.conversationId, row.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      const [{ unread }] = await db
        .select({ unread: count() })
        .from(messages)
        .where(
          and(
            eq(messages.conversationId, row.id),
            ne(messages.senderId, me),
            isNull(messages.readAt)
          )
        );

      result.push({
        id: row.id,
        peer: peerMap.get(peerId) ?? {
          id: peerId,
          displayName: "Usuario",
          avatarUrl: null,
        },
        lastMessage: last
          ? {
              body: last.body,
              senderId: last.senderId,
              createdAt: last.createdAt,
            }
          : null,
        lastMessageAt: row.lastMessageAt,
        unreadCount: Number(unread),
      });
    }
    return result;
  }),

  startOrGetConversation: protectedProcedure
    .input(
      z.object({
        peerUserId: z.string().min(1),
        initialMessage: z.string().trim().min(1).max(MESSAGE_MAX).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const me = ctx.session.user.id;
      if (input.peerUserId === me) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No puedes enviarte mensajes a ti mismo",
        });
      }
      await assertPeerActive(input.peerUserId);
      const [userAId, userBId] = orderedPair(me, input.peerUserId);

      let [conv] = await db
        .select()
        .from(conversations)
        .where(and(eq(conversations.userAId, userAId), eq(conversations.userBId, userBId)))
        .limit(1);

      if (!conv) {
        [conv] = await db
          .insert(conversations)
          .values({ userAId, userBId })
          .returning();
      }

      if (input.initialMessage && conv) {
        await db.insert(messages).values({
          conversationId: conv.id,
          senderId: me,
          body: input.initialMessage,
        });
        await db
          .update(conversations)
          .set({ lastMessageAt: new Date() })
          .where(eq(conversations.id, conv.id));
      }

      return { conversationId: conv!.id };
    }),

  getThread: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().datetime().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const me = ctx.session.user.id;
      const [conv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, input.conversationId))
        .limit(1);
      if (!conv || (conv.userAId !== me && conv.userBId !== me)) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const peerId = conv.userAId === me ? conv.userBId : conv.userAId;
      const peer = await assertPeerActive(peerId);
      const contactMethods =
        (await loadPublicContactMethods([peer.id])).get(peer.id) ?? [];

      const conditions = [eq(messages.conversationId, conv.id)];
      if (input.cursor) {
        conditions.push(gt(messages.createdAt, new Date(input.cursor)));
      }

      const rows = await db
        .select({
          id: messages.id,
          senderId: messages.senderId,
          body: messages.body,
          isAutomated: messages.isAutomated,
          automatedType: messages.automatedType,
          createdAt: messages.createdAt,
          readAt: messages.readAt,
        })
        .from(messages)
        .where(and(...conditions))
        .orderBy(desc(messages.createdAt))
        .limit(input.limit);

      const items = rows.reverse();

      return {
        conversationId: conv.id,
        peer: {
          id: peer.id,
          displayName: peer.publicName?.trim() || peer.name,
          avatarUrl: peer.avatarUrl,
          publicProfile: peer.publicProfile,
          contactMethods,
        },
        messages: items,
        nextCursor:
          rows.length === input.limit
            ? rows[rows.length - 1]?.createdAt.toISOString()
            : null,
      };
    }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        body: z.string().trim().min(1).max(MESSAGE_MAX),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const me = ctx.session.user.id;
      const [conv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, input.conversationId))
        .limit(1);
      if (!conv || (conv.userAId !== me && conv.userBId !== me)) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const since = new Date(Date.now() - 60_000);
      const [{ recent }] = await db
        .select({ recent: count() })
        .from(messages)
        .where(
          and(
            eq(messages.senderId, me),
            eq(messages.conversationId, conv.id),
            gt(messages.createdAt, since)
          )
        );
      if (Number(recent) >= 20) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Demasiados mensajes. Espera un momento.",
        });
      }

      const [msg] = await db
        .insert(messages)
        .values({
          conversationId: conv.id,
          senderId: me,
          body: input.body,
        })
        .returning();

      await db
        .update(conversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversations.id, conv.id));

      return msg;
    }),

  markRead: protectedProcedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const me = ctx.session.user.id;
      const [conv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, input.conversationId))
        .limit(1);
      if (!conv || (conv.userAId !== me && conv.userBId !== me)) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await db
        .update(messages)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(messages.conversationId, conv.id),
            ne(messages.senderId, me),
            isNull(messages.readAt)
          )
        );

      return { ok: true as const };
    }),
});
