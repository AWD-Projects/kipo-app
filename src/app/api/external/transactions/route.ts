import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';

async function authenticateApiKey(token: string) {
    if (!token) {
        return null;
    }

    // Remove "Bearer " prefix if present
    const cleanToken = token.replace(/^Bearer\s+/, '');
    
    // Parse composite token: "keyId.plainToken"
    const parts = cleanToken.split('.');
    if (parts.length !== 2) {
        return null;
    }

    const [keyId, plainToken] = parts;
    
    // Get API key from database
    const supabase = await createClient();
    const { data: apiKey, error } = await supabase
        .from('api_keys')
        .select('id, user_id, key_hash, revoked_at, expires_at')
        .eq('id', keyId)
        .single();

    if (error || !apiKey) {
        return null;
    }

    // Check if key is revoked or expired
    if (apiKey.revoked_at || (apiKey.expires_at && new Date(apiKey.expires_at) < new Date())) {
        return null;
    }

    // Verify token hash
    const isValid = await bcrypt.compare(plainToken, apiKey.key_hash);
    if (!isValid) {
        return null;
    }

    // Update last_used_at
    await supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', keyId);

    return { userId: apiKey.user_id, keyId: apiKey.id };
}

export async function POST(request: NextRequest) {
    try {
        // Get authorization header
        const authHeader = request.headers.get('authorization');
        
        if (!authHeader) {
            return NextResponse.json(
                { error: 'Authorization header required' },
                { status: 401 }
            );
        }

        // Authenticate API key
        const auth = await authenticateApiKey(authHeader);
        
        if (!auth) {
            return NextResponse.json(
                { error: 'Invalid or expired API key' },
                { status: 401 }
            );
        }

        const body = await request.json();
        
        // Validate required fields
        if (!body.amount || !body.description || !body.type) {
            return NextResponse.json(
                { error: 'Missing required fields: amount, description, type' },
                { status: 400 }
            );
        }

        // Prepare transaction data
        const transactionData = {
            amount: parseFloat(body.amount),
            description: body.description,
            type: body.type,
            category: body.category || 'other',
            date: body.date || new Date().toISOString().split('T')[0],
            user_id: auth.userId,
            source: 'api',
            card_id: body.card_id || null,
        };
        
        // Insert the transaction using service role (bypasses RLS)
        const supabase = await createClient();
        const { data, error: insertError } = await supabase
            .from('transactions')
            .insert([transactionData])
            .select()
            .single();

        if (insertError) {
            console.error('Insert error:', insertError);
            return NextResponse.json(
                { error: 'Failed to create transaction' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            transaction: data
        });

    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}