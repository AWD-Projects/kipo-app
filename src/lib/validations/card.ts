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
  interest_free_payment_amount: z.number().min(0, "El monto debe ser mayor o igual a 0").optional(),
  payment_due_date: z.string().optional().nullable(),
  statement_closing_date: z.string().optional().nullable(),
  reminder_days_before: z.number().min(1, "Los días de recordatorio deben ser al menos 1").max(30, "Los días de recordatorio no pueden ser más de 30").default(1),
});

// Update schema without defaults to avoid overwriting existing values
export const updateCardSchema = z.object({
  name: z.string().min(1, "El nombre de la tarjeta es requerido").optional(),
  card_type: z.enum(["credit", "debit"], {
    message: "El tipo de tarjeta es requerido",
  }).optional(),
  brand: z.enum(["visa", "mastercard", "amex", "discover", "other"], {
    message: "La marca de la tarjeta es requerida",
  }).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "El color debe ser un código hexadecimal válido").optional(),
  is_active: z.boolean().optional(),
  interest_free_payment_amount: z.number().min(0, "El monto debe ser mayor o igual a 0").optional(),
  payment_due_date: z.string().optional().nullable(),
  statement_closing_date: z.string().optional().nullable(),
  reminder_days_before: z.number().min(1, "Los días de recordatorio deben ser al menos 1").max(30, "Los días de recordatorio no pueden ser más de 30").optional(),
});

export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;