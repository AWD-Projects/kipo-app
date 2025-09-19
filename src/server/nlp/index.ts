import { extractWithClaude } from './claude';
import { TxSchema, ParsedTx, NlpContext } from './schema';

export async function extractTransaction(
  text: string,
  ctx: NlpContext
): Promise<ParsedTx | null> {
  try {
    // Extract using Claude
    const rawResult = await extractWithClaude(text, ctx);
    
    if (!rawResult) {
      return null;
    }

    // Validate with Zod
    const validation = TxSchema.safeParse(rawResult);
    
    if (!validation.success) {
      console.error('Validation failed:', validation.error);
      return null;
    }

    const parsed = validation.data;

    // Normalize the data
    const normalized: ParsedTx = {
      ...parsed,
      // Round amount to 2 decimals
      amount: Math.round(parsed.amount * 100) / 100,
      // Remove category if not in allowed list
      category: parsed.category && ctx.allowedCategories.includes(parsed.category) 
        ? parsed.category 
        : undefined,
      // Set default currency if not provided
      currency: parsed.currency || ctx.defaultCurrency,
    };

    return normalized;
  } catch (error) {
    console.error('Error in extractTransaction:', error);
    return null;
  }
}

export type { ParsedTx, NlpContext };