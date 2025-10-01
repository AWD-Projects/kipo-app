import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function updateCardPaymentAmount(supabase: any, cardId: string, userId: string) {
    // Calculate total expenses for the card
    const { data: transactions } = await supabase
        .from('transactions')
        .select('amount')
        .eq('card_id', cardId)
        .eq('type', 'expense')
        .eq('user_id', userId);

    const totalExpenses = transactions?.reduce((sum: number, t: any) => sum + t.amount, 0) || 0;

    // Update the card
    await supabase
        .from('cards')
        .update({ interest_free_payment_amount: totalExpenses })
        .eq('id', cardId)
        .eq('user_id', userId);
}

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

        // Update card payment amount if it's an expense linked to a card
        if (data.type === 'expense' && data.card_id) {
            await updateCardPaymentAmount(supabase, data.card_id, user.id);
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

        // Get the old transaction data to check if card_id changed
        const { data: oldTransaction } = await supabase
            .from('transactions')
            .select('card_id, type')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

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

        // Update card payment amounts if needed
        if (data.type === 'expense') {
            // Update old card if it changed
            if (oldTransaction?.card_id && oldTransaction.card_id !== data.card_id) {
                await updateCardPaymentAmount(supabase, oldTransaction.card_id, user.id);
            }
            // Update new card
            if (data.card_id) {
                await updateCardPaymentAmount(supabase, data.card_id, user.id);
            }
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