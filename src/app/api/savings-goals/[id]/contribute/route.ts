import { createClient } from '@/lib/supabase/server';

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST /api/savings-goals/:id/contribute - Add contribution to goal
export async function POST(
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
    const {
      amount,
      contribution_date = new Date().toISOString().split('T')[0],
      notes,
      source_type = 'manual',
      transaction_id,
    } = body;

    // Validate
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Verify goal exists and belongs to user
    const { data: goal, error: goalError } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', user.id)
      .single();

    if (goalError || !goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Add contribution
    const { data: contribution, error: contributionError } = await supabase
      .from('goal_contributions')
      .insert({
        goal_id: goalId,
        user_id: user.id,
        amount,
        contribution_date,
        notes,
        source_type,
        transaction_id,
      })
      .select()
      .single();

    if (contributionError) {
      console.error('Error adding contribution:', contributionError);
      return NextResponse.json(
        { error: contributionError.message },
        { status: 500 }
      );
    }

    // Fetch updated goal (trigger will have updated current_amount)
    const { data: updatedGoal } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('id', goalId)
      .single();

    // Check for newly achieved milestones
    const { data: newlyAchievedMilestones } = await supabase
      .from('goal_milestones')
      .select('*')
      .eq('goal_id', goalId)
      .eq('achieved', true)
      .gte(
        'achieved_at',
        new Date(Date.now() - 5000).toISOString() // Last 5 seconds
      );

    // Calculate progress
    const progressPercentage = updatedGoal
      ? (updatedGoal.current_amount / updatedGoal.target_amount) * 100
      : 0;

    return NextResponse.json({
      contribution,
      goal: {
        id: updatedGoal?.id,
        current_amount: updatedGoal?.current_amount,
        progress_percentage: Math.round(progressPercentage * 100) / 100,
        status: updatedGoal?.status,
      },
      milestones_achieved: newlyAchievedMilestones || [],
    });
  } catch (error: any) {
    console.error('Error in POST /api/savings-goals/:id/contribute:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
