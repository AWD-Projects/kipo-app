import { z } from "zod";

export const createTransactionSchema = z.object({
  type: z.enum(["income", "expense"], {
    message: "El tipo de transacción es requerido",
  }),
  amount: z.coerce
    .number({ message: "El monto es requerido" })
    .positive("El monto debe ser mayor a 0"),
  category: z.string().min(1, "La categoría es requerida"),
  description: z.string().optional(),
  transaction_date: z.string().min(1, "La fecha es requerida"),
  card_id: z.string().uuid().optional(),
  is_recurring: z.boolean().default(false),
  recurring_frequency: z.enum(["none", "daily", "weekly", "monthly", "yearly"]).default("none"),
  tags: z.array(z.string()).default([]),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;