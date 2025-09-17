import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        
        // Get the current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        
        // Prepare transaction data
        const transactionData = {
            ...body,
            user_id: user.id,
            source: 'web',
            card_id: body.card_id || null,
        };
        
        // Insert the transaction
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

        return NextResponse.json(data);

    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();
        
        // Get the current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id, ...updateData } = await request.json();
        
        if (!id) {
            return NextResponse.json(
                { error: 'Transaction ID is required' },
                { status: 400 }
            );
        }

        // Prepare transaction data
        const transactionData = {
            ...updateData,
            card_id: updateData.card_id || null,
        };
        
        // Update the transaction
        const { data, error: updateError } = await supabase
            .from('transactions')
            .update(transactionData)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (updateError) {
            console.error('Update error:', updateError);
            return NextResponse.json(
                { error: 'Failed to update transaction' },
                { status: 500 }
            );
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}