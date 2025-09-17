// src/app/api/api-keys/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { z } from 'zod';

const createApiKeySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').default('iOS Shortcut Token'),
});

// GET - List user's API keys
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('id, name, created_at, last_used_at, revoked_at, expires_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Error al obtener las API keys' }, { status: 500 });
    }

    return NextResponse.json({ api_keys: apiKeys });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Create new API key
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = createApiKeySchema.parse(body);

    // Generate a random token (32 bytes = 64 characters hex)
    const plainToken = randomBytes(32).toString('hex');
    
    // Hash the token for storage
    const keyHash = await bcrypt.hash(plainToken, 12);

    // Insert into database using RLS (user must be authenticated)
    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        name,
        key_hash: keyHash,
      })
      .select('id, name, created_at, last_used_at, revoked_at, expires_at')
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Error al crear la API key' }, { status: 500 });
    }

    // Return the composite token: "keyId.plainToken"
    const compositeToken = `${apiKey.id}.${plainToken}`;

    return NextResponse.json({
      token: compositeToken,
      api_key: apiKey,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}