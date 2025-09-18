// src/app/api/entries/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const createTransactionSchema = z.object({
  type: z.enum(['income', 'expense'], {
    message: 'El tipo es requerido',
  }),
  title: z.string().min(1, 'El título es requerido'),
  amount: z.coerce
    .number({ message: 'El monto es requerido' })
    .positive('El monto debe ser mayor a 0'),
  category: z.string().min(1, 'La categoría es requerida'),
  description: z.string().optional(),
  transaction_date: z.string().optional().default(() => new Date().toISOString().split('T')[0]),
  card_id: z.string().uuid().optional(),
});

type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

// POST - Create transaction from iOS Shortcuts
export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    // Parse composite token: "keyId.plainToken"
    const tokenParts = token.split('.');
    if (tokenParts.length !== 2) {
      return NextResponse.json({ error: 'Formato de token inválido' }, { status: 401 });
    }

    const [keyId, plainToken] = tokenParts;

    // Validate keyId is a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(keyId)) {
      return NextResponse.json({ error: 'ID de token inválido' }, { status: 401 });
    }

    // Use admin client to bypass RLS for API key validation
    const supabase = createAdminClient();

    // Get the API key from database
    const { data: apiKey, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('id, user_id, key_hash, revoked_at, expires_at')
      .eq('id', keyId)
      .is('revoked_at', null)
      .single();

    if (apiKeyError || !apiKey) {
      console.error('API key lookup error:', apiKeyError);
      return NextResponse.json({ error: 'Token inválido o revocado' }, { status: 401 });
    }

    // Check if token is expired
    if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Token expirado' }, { status: 401 });
    }

    // Verify the plain token against the stored hash
    const isValidToken = await bcrypt.compare(plainToken, apiKey.key_hash);
    
    if (!isValidToken) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const transactionData: CreateTransactionInput = createTransactionSchema.parse(body);

    // Create the transaction using admin client (bypassing RLS)
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: apiKey.user_id,
        title: transactionData.title,
        type: transactionData.type,
        amount: transactionData.amount,
        category: transactionData.category,
        description: transactionData.description || '',
        transaction_date: transactionData.transaction_date,
        card_id: transactionData.card_id || null,
        source: 'shortcut',
        is_recurring: false,
        recurring_frequency: 'none',
        tags: [],
      })
      .select('id')
      .single();

    if (transactionError) {
      console.error('Transaction creation error:', transactionError);
      return NextResponse.json({ error: 'Error al crear la transacción' }, { status: 500 });
    }

    // Update last_used_at for the API key
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyId);

    return NextResponse.json({
      ok: true,
      id: transaction.id,
      message: 'Transacción creada exitosamente',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Datos inválidos', 
        details: error.issues 
      }, { status: 400 });
    }

    console.error('Unexpected error in /api/entries:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}