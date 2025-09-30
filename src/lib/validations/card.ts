import { z } from "zod";

export const createCardSchema = z.object({
  name: z.string().min(1, "El nombre de la tarjeta es requerido"),
  card_type: z.enum(["credit", "debit"], {
    message: "El tipo de tarjeta es requerido",
  }),
  brand: z.enum(["visa", "mastercard", "amex", "discover", "other"], {
    message: "La marca de la tarjeta es requerida",
  }),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "El color debe ser un código hexadecimal válido").default("#4F46E5"),
  is_active: z.boolean().default(true),
});

export const updateCardSchema = createCardSchema.partial();

export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;