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

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id: transactionId } = await params;

        // Get the transaction data before deleting to update card if needed
        const { data: transaction } = await supabase
            .from('transactions')
            .select('card_id, type')
            .eq('id', transactionId)
            .eq('user_id', user.id)
            .single();

        // Verify the transaction belongs to the user and delete it
        const { error: deleteError } = await supabase
            .from('transactions')
            .delete()
            .eq('id', transactionId)
            .eq('user_id', user.id);

        if (deleteError) {
            console.error('Delete error:', deleteError);
            return NextResponse.json(
                { error: 'Failed to delete transaction' },
                { status: 500 }
            );
        }

        // Update card payment amount if the transaction was an expense linked to a card
        if (transaction?.type === 'expense' && transaction.card_id) {
            await updateCardPaymentAmount(supabase, transaction.card_id, user.id);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}