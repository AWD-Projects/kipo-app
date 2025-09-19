import Anthropic from '@anthropic-ai/sdk';
import { ParsedTx, NlpContext } from './schema';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function extractWithClaude(
  text: string,
  ctx: NlpContext
): Promise<ParsedTx | null> {
  try {
    const systemPrompt = `Eres un extractor de UNA sola transacción desde mensajes de WhatsApp en ${ctx.language === 'es' ? 'español' : 'inglés'}.
Devuelve EXCLUSIVAMENTE JSON que cumpla el siguiente esquema:
{
  "type": "expense" | "income",
  "amount": number,
  "currency": "MXN" | "USD" | "EUR" (opcional),
  "description": string,
  "category": string (opcional),
  "transaction_date": "YYYY-MM-DD" (opcional),
  "confidence": number entre 0 y 1
}
Reglas:
- "expense" si es gasto, "income" si es ingreso.
- "amount": convierte "350,50" a 350.50. No incluyas signos ni moneda.
- "currency": si no aparece en el texto, usa ${ctx.defaultCurrency}.
- "transaction_date": si el texto dice "hoy" o "ayer", calcula la fecha en la zona horaria ${ctx.timezone} con formato YYYY-MM-DD.
- "category": elige sólo si estás seguro, y debe ser UNA de: ${ctx.allowedCategories.join(', ')}. Si no estás seguro, omite "category".
- Si el mensaje no habla de una transacción, devuelve null (literal).
- No inventes datos. "confidence" debe reflejar tu certeza general.`;

    const userContent = `Mensaje: """${text}"""`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 512,
      temperature: 0.1,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userContent,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      console.error('Claude response is not text');
      return null;
    }

    const responseText = content.text.trim();
    
    // Handle null response
    if (responseText === 'null' || responseText.toLowerCase() === 'null') {
      return null;
    }

    // Try to parse JSON
    try {
      const parsed = JSON.parse(responseText);
      return parsed;
    } catch (parseError) {
      console.error('Failed to parse Claude JSON response:', responseText);
      return null;
    }
  } catch (error) {
    console.error('Claude API error:', error);
    return null;
  }
}