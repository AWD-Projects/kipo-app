import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get the current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            );
        }

        let body;
        try {
            body = await request.json();
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            return NextResponse.json(
                { error: 'Formato de datos inválido' },
                { status: 400 }
            );
        }

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
                {
                    error: 'Error al crear transacción',
                    message: insertError.message,
                    details: insertError.details
                },
                { status: 500 }
            );
        }

        // Update card payment amount if it's an expense linked to a card
        if (data.type === 'expense' && data.card_id) {
            // Get the current card amount
            const { data: card } = await supabase
                .from('cards')
                .select('interest_free_payment_amount')
                .eq('id', data.card_id)
                .eq('user_id', user.id)
                .single();

            // ADD the new expense to the existing amount instead of recalculating
            const currentAmount = card?.interest_free_payment_amount || 0;
            const newAmount = currentAmount + data.amount;

            await supabase
                .from('cards')
                .update({ interest_free_payment_amount: newAmount })
                .eq('id', data.card_id)
                .eq('user_id', user.id);
        }

        return NextResponse.json(data);

    } catch (error: any) {
        console.error('API error (POST):', error);
        return NextResponse.json(
            {
                error: 'Error interno del servidor',
                message: error?.message || 'Error desconocido'
            },
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
                { error: 'No autorizado' },
                { status: 401 }
            );
        }

        let body;
        try {
            body = await request.json();
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            return NextResponse.json(
                { error: 'Formato de datos inválido' },
                { status: 400 }
            );
        }

        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Se requiere el ID de la transacción' },
                { status: 400 }
            );
        }

        // Get the old transaction data BEFORE updating (including amount)
        const { data: oldTransaction } = await supabase
            .from('transactions')
            .select('card_id, type, amount')
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
                {
                    error: 'Error al actualizar transacción',
                    message: updateError.message,
                    details: updateError.details
                },
                { status: 500 }
            );
        }

        // Update card payment amounts if needed
        if (data.type === 'expense' || oldTransaction?.type === 'expense') {
            // If card_id changed, we need to:
            // 1. Subtract from old card (if it was an expense)
            // 2. Add to new card (if it's an expense)

            // Handle old card - subtract the old amount
            if (oldTransaction?.card_id && oldTransaction.card_id !== data.card_id && oldTransaction.type === 'expense') {
                const { data: oldCard } = await supabase
                    .from('cards')
                    .select('interest_free_payment_amount')
                    .eq('id', oldTransaction.card_id)
                    .eq('user_id', user.id)
                    .single();

                // Use the old transaction amount we fetched earlier
                const oldAmount = oldCard?.interest_free_payment_amount || 0;
                const newOldCardAmount = Math.max(0, oldAmount - oldTransaction.amount);

                await supabase
                    .from('cards')
                    .update({ interest_free_payment_amount: newOldCardAmount })
                    .eq('id', oldTransaction.card_id)
                    .eq('user_id', user.id);
            }

            // Handle new card - add the new amount
            if (data.card_id && data.type === 'expense') {
                const { data: newCard } = await supabase
                    .from('cards')
                    .select('interest_free_payment_amount')
                    .eq('id', data.card_id)
                    .eq('user_id', user.id)
                    .single();

                // If card didn't change but amount did, we need to adjust
                if (oldTransaction?.card_id === data.card_id) {
                    // Same card, different amount - adjust the difference
                    // Use the old amount we already fetched before the update
                    const currentAmount = newCard?.interest_free_payment_amount || 0;
                    const oldTxAmount = oldTransaction?.amount || 0;
                    const difference = data.amount - oldTxAmount;
                    const newAmount = currentAmount + difference;

                    await supabase
                        .from('cards')
                        .update({ interest_free_payment_amount: Math.max(0, newAmount) })
                        .eq('id', data.card_id)
                        .eq('user_id', user.id);
                } else {
                    // Different card, just add the new amount
                    const currentAmount = newCard?.interest_free_payment_amount || 0;
                    const newAmount = currentAmount + data.amount;

                    await supabase
                        .from('cards')
                        .update({ interest_free_payment_amount: newAmount })
                        .eq('id', data.card_id)
                        .eq('user_id', user.id);
                }
            }
        }

        return NextResponse.json(data);

    } catch (error: any) {
        console.error('API error (PUT):', error);
        return NextResponse.json(
            {
                error: 'Error interno del servidor',
                message: error?.message || 'Error desconocido'
            },
            { status: 500 }
        );
    }
}