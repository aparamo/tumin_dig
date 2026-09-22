import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  conversations,
  messages,
  type AutoMessageType,
  type AutomatedMessageMetadata,
} from "@/db/schema";

type DbClient = typeof db;

const AUTO_NOTE =
  'Este es un mensaje automatizado. Puedes desactivarlo en "Mi perfil"';

export const AUTOMATED_MESSAGE_NOTE = AUTO_NOTE;

function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export function buildPurchaseAutoMessage(params: {
  sellerDisplayName: string;
  buyerDisplayName: string;
  productName: string;
  amountTumin: number;
  priceMxn: number;
}): string {
  return `Hola ${params.sellerDisplayName}, ${params.buyerDisplayName} acaba de comprar ${params.productName} por ${params.amountTumin} Túmin digitales. El monto restante es de $${params.priceMxn}`;
}

export function buildTransferAutoMessage(params: {
  senderDisplayName: string;
  amountTumin: number;
  concept: string;
}): string {
  return `${params.senderDisplayName} te ha enviado ${params.amountTumin} Túmin digitales.\nConcepto: ${params.concept}`;
}

/** Create/get 1:1 conversation and insert an automated DM. Best-effort. */
export async function sendAutomatedMessage(
  dbOrTx: DbClient,
  params: {
    senderId: string;
    recipientId: string;
    body: string;
    automatedType: AutoMessageType;
    metadata?: AutomatedMessageMetadata;
  }
): Promise<{ conversationId: string; messageId: string } | null> {
  if (params.senderId === params.recipientId) return null;

  const [userAId, userBId] = orderedPair(params.senderId, params.recipientId);

  let [conv] = await dbOrTx
    .select()
    .from(conversations)
    .where(and(eq(conversations.userAId, userAId), eq(conversations.userBId, userBId)))
    .limit(1);

  if (!conv) {
    [conv] = await dbOrTx
      .insert(conversations)
      .values({ userAId, userBId })
      .returning();
  }

  if (!conv) return null;

  const [msg] = await dbOrTx
    .insert(messages)
    .values({
      conversationId: conv.id,
      senderId: params.senderId,
      body: params.body,
      isAutomated: true,
      automatedType: params.automatedType,
      ...(params.metadata ? { metadata: params.metadata } : {}),
    })
    .returning();

  await dbOrTx
    .update(conversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(conversations.id, conv.id));

  if (!msg) return null;
  return { conversationId: conv.id, messageId: msg.id };
}
