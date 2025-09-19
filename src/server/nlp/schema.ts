import { z } from 'zod';

export const TxSchema = z.object({
  type: z.enum(['expense', 'income']),
  amount: z.number().positive(),
  currency: z.enum(['MXN', 'USD', 'EUR']).optional(),
  description: z.string().min(1),
  category: z.string().optional(),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  confidence: z.number().min(0).max(1),
});

export type ParsedTx = z.infer<typeof TxSchema>;

export interface NlpContext {
  language: 'es' | 'en';
  defaultCurrency: 'MXN' | 'USD' | 'EUR';
  timezone: string;
  allowedCategories: string[];
}