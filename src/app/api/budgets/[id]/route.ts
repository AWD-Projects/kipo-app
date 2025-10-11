import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/budgets/[id]
 * Get a specific budget by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get budget
    const { data: budget, error: budgetError } = await supabase
      .from('budgets')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (budgetError || !budget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      );
    }

    // Get current spending using the database function
    const { data: statusData, error: statusError } = await supabase
      .rpc('get_budget_status', {
        p_budget_id: id,
        p_user_id: user.id
      });

    if (statusError) {
      console.error('Error getting budget status:', statusError);
      // Return budget without status if there's an error
      return NextResponse.json({ budget }, { status: 200 });
    }

    const status = statusData && statusData.length > 0 ? statusData[0] : null;

    return NextResponse.json({
      budget: {
        ...budget,
        spent: status ? parseFloat(status.spent) : 0,
        remaining: status ? parseFloat(status.remaining) : budget.amount,
        percentage: status ? parseFloat(status.percentage) : 0,
        status: status ? status.status : 'on_track',
        daysRemaining: status ? status.days_remaining : null
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in GET /api/budgets/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/budgets/[id]
 * Update a budget
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      amount,
      category,
      period,
      startDate,
      endDate,
      isActive,
      autoAdjust,
      adjustmentPercentage
    } = body;

    // Verify budget exists and belongs to user
    const { data: existingBudget, error: fetchError } = await supabase
      .from('budgets')
      .select('id, amount')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingBudget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      );
    }

    // Build update object (only include provided fields)
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (amount !== undefined) {
      if (amount <= 0) {
        return NextResponse.json(
          { error: 'Amount must be greater than 0' },
          { status: 400 }
        );
      }
      updateData.amount = amount;
    }

    if (category !== undefined) updateData.category = category;
    if (period !== undefined) updateData.period = period;
    if (startDate !== undefined) updateData.start_date = startDate;
    if (endDate !== undefined) updateData.end_date = endDate;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (autoAdjust !== undefined) updateData.auto_adjust = autoAdjust;
    if (adjustmentPercentage !== undefined) updateData.adjustment_percentage = adjustmentPercentage;

    // Update budget
    const { data: budget, error: updateError } = await supabase
      .from('budgets')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating budget:', updateError);
      return NextResponse.json(
        { error: 'Failed to update budget', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ budget }, { status: 200 });

  } catch (error: any) {
    console.error('Error in PUT /api/budgets/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/budgets/[id]
 * Delete a budget
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify budget exists and belongs to user
    const { data: existingBudget, error: fetchError } = await supabase
      .from('budgets')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingBudget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      );
    }

    // Delete budget (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting budget:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete budget', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Budget deleted successfully' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error in DELETE /api/budgets/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
