import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';


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
            .select('card_id, type, amount')
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
        // SUBTRACT the deleted expense from the card total
        if (transaction?.type === 'expense' && transaction.card_id) {
            const { data: card } = await supabase
                .from('cards')
                .select('interest_free_payment_amount')
                .eq('id', transaction.card_id)
                .eq('user_id', user.id)
                .single();

            const currentAmount = card?.interest_free_payment_amount || 0;
            const newAmount = Math.max(0, currentAmount - transaction.amount);

            await supabase
                .from('cards')
                .update({ interest_free_payment_amount: newAmount })
                .eq('id', transaction.card_id)
                .eq('user_id', user.id);
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