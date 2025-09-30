import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCardSchema } from '@/lib/validations/card';

export const dynamic = 'force-dynamic';

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
        
        // Validate the data
        const validatedData = createCardSchema.parse(body);
        
        // Insert the card
        const { data, error: insertError } = await supabase
            .from('cards')
            .insert([{
                ...validatedData,
                user_id: user.id,
            }])
            .select()
            .single();

        if (insertError) {
            console.error('Insert error:', insertError);
            return NextResponse.json(
                { error: 'Failed to create card' },
                { status: 500 }
            );
        }

        return NextResponse.json(data);

    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Invalid data provided' },
                { status: 400 }
            );
        }
        
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
                { error: 'Card ID is required' },
                { status: 400 }
            );
        }

        // Validate the data
        const validatedData = createCardSchema.parse(updateData);
        
        // Update the card
        const { data, error: updateError } = await supabase
            .from('cards')
            .update(validatedData)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (updateError) {
            console.error('Update error:', updateError);
            return NextResponse.json(
                { error: 'Failed to update card' },
                { status: 500 }
            );
        }

        return NextResponse.json(data);

    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Invalid data provided' },
                { status: 400 }
            );
        }
        
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}