import { db } from "@/db";
import { adminActionsLog, adminActionEnum } from "@/db/schema";

type AdminAction = (typeof adminActionEnum.enumValues)[number];

type Tx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

interface LogAdminActionInput {
  actorId: string;
  targetUserId?: string;
  targetProductId?: string;
  targetAdId?: string;
  action: AdminAction;
  metadata?: Record<string, unknown>;
}

export async function logAdminAction(tx: Tx, input: LogAdminActionInput) {
  await tx.insert(adminActionsLog).values({
    actorId: input.actorId,
    targetUserId: input.targetUserId ?? null,
    targetProductId: input.targetProductId ?? null,
    targetAdId: input.targetAdId ?? null,
    action: input.action,
    metadata: input.metadata ?? {},
  });
}
