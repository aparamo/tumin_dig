import { z } from "zod";

/**
 * Túmin price must be at least 10% of the combined (MXN + Túmin) total.
 * Applied on create/update only — never retroactively.
 */
export function refineTuminShare(
  data: { priceMxn: number; priceTumin: number },
  ctx: z.RefinementCtx
) {
  const total = data.priceMxn + data.priceTumin;
  if (total > 0 && data.priceTumin < total * 0.1) {
    ctx.addIssue({
      code: "custom",
      message: "El precio en Túmin debe ser al menos el 10% del total.",
      path: ["priceTumin"],
    });
  }
}

const productPriceFields = {
  name: z.string().min(3),
  description: z.string().max(8000).optional(),
  extraInfo: z.string().max(16000).optional().nullable(),
  priceMxn: z.number().min(0),
  priceTumin: z.number().min(0),
  categories: z.array(z.string()),
};

export const productCreateSchema = z
  .object({
    ...productPriceFields,
    imageUrl: z.string().optional(),
    imgUrls: z.array(z.string().url()).optional(),
    showInProfile: z.boolean().optional().default(true),
    isStarred: z.boolean().optional().default(false),
  })
  .superRefine(refineTuminShare);

export const productUpdateSchema = z
  .object({
    id: z.string().uuid(),
    ...productPriceFields,
    imgUrls: z.array(z.string().url()),
    status: z.enum(["ACTIVO", "INACTIVO"]),
    showInProfile: z.boolean(),
    isStarred: z.boolean(),
  })
  .superRefine(refineTuminShare);

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
