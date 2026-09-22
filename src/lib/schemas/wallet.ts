import { z } from "zod";

/** Peer transfer input (wallet.sendTumin) */
export const transferSchema = z.object({
  toId: z.string().min(1),
  amount: z.number().positive(),
  concept: z.string().min(1).max(500),
  /** Client-generated UUID — pass the same key on retries to avoid duplicates */
  idempotencyKey: z.string().uuid(),
  /** When set, marks this transfer as a bazar product purchase */
  productId: z.string().uuid().optional(),
});

export type TransferInput = z.infer<typeof transferSchema>;
