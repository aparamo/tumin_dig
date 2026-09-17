import { z } from "zod";

export const miningBlockReasonSchema = z.enum([
  "OK",
  "NO_PRODUCT",
  "ALREADY_MINED",
]);

export const miningStatusSchema = z.object({
  canMine: z.boolean(),
  reason: miningBlockReasonSchema,
  displayStreak: z.number().int().nonnegative(),
  nextReward: z.number().positive(),
  minedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  nextAvailableAt: z.date(),
  timezone: z.literal("America/Mexico_City"),
});

export type MiningStatus = z.infer<typeof miningStatusSchema>;
export type MiningBlockReason = z.infer<typeof miningBlockReasonSchema>;
