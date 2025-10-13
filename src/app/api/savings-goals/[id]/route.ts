import { createClient } from '@/lib/supabase/server';

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/savings-goals/:id - Get single goal with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: goalId } = await params;

    // Get goal details using the database function
    const { data, error } = await supabase.rpc('get_goal_complete_details', {
      p_goal_id: goalId,
    });

    if (error) {
      console.error('Error fetching goal details:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Verify ownership
    if (data.goal && data.goal.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in GET /api/savings-goals/:id:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/savings-goals/:id - Update goal
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: goalId } = await params;
    const body = await request.json();

    // Verify ownership
    const { data: existingGoal, error: fetchError } = await supabase
      .from('savings_goals')
      .select('user_id')
      .eq('id', goalId)
      .single();

    if (fetchError || !existingGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (existingGoal.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Extract updateable fields
    const {
      name,
      description,
      target_amount,
      target_date,
      icon,
      color,
      priority,
      status,
    } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (target_amount !== undefined) {
      if (target_amount <= 0) {
        return NextResponse.json(
          { error: 'Target amount must be greater than 0' },
          { status: 400 }
        );
      }
      updateData.target_amount = target_amount;
    }
    if (target_date !== undefined) updateData.target_date = target_date;
    if (icon !== undefined) updateData.icon = icon;
    if (color !== undefined) updateData.color = color;
    if (priority !== undefined) {
      if (priority < 1 || priority > 5) {
        return NextResponse.json(
          { error: 'Priority must be between 1 and 5' },
          { status: 400 }
        );
      }
      updateData.priority = priority;
    }
    if (status !== undefined) {
      if (!['active', 'paused', 'completed', 'abandoned'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      updateData.status = status;
    }

    // Update the goal
    const { data: updatedGoal, error: updateError } = await supabase
      .from('savings_goals')
      .update(updateData)
      .eq('id', goalId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating goal:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ goal: updatedGoal });
  } catch (error: any) {
    console.error('Error in PUT /api/savings-goals/:id:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/savings-goals/:id - Delete goal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: goalId } = await params;

    // Verify ownership
    const { data: existingGoal, error: fetchError } = await supabase
      .from('savings_goals')
      .select('user_id')
      .eq('id', goalId)
      .single();

    if (fetchError || !existingGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (existingGoal.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the goal (cascade will delete related records)
    const { error: deleteError } = await supabase
      .from('savings_goals')
      .delete()
      .eq('id', goalId);

    if (deleteError) {
      console.error('Error deleting goal:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/savings-goals/:id:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
