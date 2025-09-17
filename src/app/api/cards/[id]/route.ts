import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
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

        const { is_active } = await request.json();
        const { id: cardId } = await params;

        // Verify the card belongs to the user and update it
        const { data: card, error: fetchError } = await supabase
            .from('cards')
            .select('id, user_id')
            .eq('id', cardId)
            .eq('user_id', user.id)
            .single();

        if (fetchError || !card) {
            return NextResponse.json(
                { error: 'Card not found or unauthorized' },
                { status: 404 }
            );
        }

        // Update the card
        const { error: updateError } = await supabase
            .from('cards')
            .update({ is_active })
            .eq('id', cardId)
            .eq('user_id', user.id);

        if (updateError) {
            console.error('Update error:', updateError);
            return NextResponse.json(
                { error: 'Failed to update card' },
                { status: 500 }
            );
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

        const { id: cardId } = await params;

        // Verify the card belongs to the user and delete it
        const { error: deleteError } = await supabase
            .from('cards')
            .delete()
            .eq('id', cardId)
            .eq('user_id', user.id);

        if (deleteError) {
            console.error('Delete error:', deleteError);
            return NextResponse.json(
                { error: 'Failed to delete card' },
                { status: 500 }
            );
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