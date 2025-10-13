import { createClient } from '@/lib/supabase/server';

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/savings-goals - Get all savings goals for user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const includePredictions = searchParams.get('include_predictions') === 'true';

    // Build query
    let query = supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', parseInt(priority));
    }

    const { data: goals, error } = await query;

    if (error) {
      console.error('Error fetching goals:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich goals with additional data
    const enrichedGoals = await Promise.all(
      (goals || []).map(async (goal) => {
        // Calculate progress percentage
        const progressPercentage = goal.target_amount > 0
          ? (goal.current_amount / goal.target_amount) * 100
          : 0;

        // Get active rules count
        const { count: activeRulesCount } = await supabase
          .from('savings_rules')
          .select('*', { count: 'exact', head: true })
          .eq('goal_id', goal.id)
          .eq('is_active', true);

        // Get milestones
        const { data: milestones } = await supabase
          .from('goal_milestones')
          .select('*')
          .eq('goal_id', goal.id)
          .order('target_percentage', { ascending: true });

        let latestPrediction = null;
        if (includePredictions) {
          const { data: prediction } = await supabase
            .from('goal_predictions')
            .select('*')
            .eq('goal_id', goal.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          latestPrediction = prediction;
        }

        return {
          ...goal,
          progress_percentage: Math.round(progressPercentage * 100) / 100,
          active_rules_count: activeRulesCount || 0,
          milestones: milestones || [],
          latest_prediction: latestPrediction,
        };
      })
    );

    return NextResponse.json({ goals: enrichedGoals });
  } catch (error: any) {
    console.error('Error in GET /api/savings-goals:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/savings-goals - Create new savings goal
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      target_amount,
      target_date,
      icon = 'piggy-bank',
      color = '#3b82f6',
      priority = 3,
      initial_contribution,
      ai_suggested = false,
      ai_confidence,
      ai_reasoning,
      ai_category,
    } = body;

    // Validate required fields
    if (!name || !target_amount) {
      return NextResponse.json(
        { error: 'Name and target_amount are required' },
        { status: 400 }
      );
    }

    if (target_amount <= 0) {
      return NextResponse.json(
        { error: 'Target amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Create the goal
    const { data: goal, error: goalError } = await supabase
      .from('savings_goals')
      .insert({
        user_id: user.id,
        name,
        description,
        target_amount,
        target_date,
        icon,
        color,
        priority,
        current_amount: 0,
        status: 'active',
        ai_suggested,
        ai_confidence,
        ai_reasoning,
        ai_category,
      })
      .select()
      .single();

    if (goalError) {
      console.error('Error creating goal:', goalError);
      return NextResponse.json({ error: goalError.message }, { status: 500 });
    }

    // Add initial contribution if provided
    if (initial_contribution && initial_contribution > 0) {
      const { error: contributionError } = await supabase
        .from('goal_contributions')
        .insert({
          goal_id: goal.id,
          user_id: user.id,
          amount: initial_contribution,
          contribution_date: new Date().toISOString().split('T')[0],
          source_type: 'manual',
          notes: 'Initial contribution',
        });

      if (contributionError) {
        console.error('Error adding initial contribution:', contributionError);
      }
    }

    // Create default milestones
    const milestones = [
      { percentage: 25, name: '25% - ¡Primer Logro!' },
      { percentage: 50, name: '50% - ¡A Mitad de Camino!' },
      { percentage: 75, name: '75% - ¡Casi Ahí!' },
      { percentage: 100, name: '100% - ¡Meta Completada!' },
    ];

    const milestonesToInsert = milestones.map((m) => ({
      goal_id: goal.id,
      user_id: user.id,
      name: m.name,
      target_amount: (target_amount * m.percentage) / 100,
      target_percentage: m.percentage,
      achieved: false,
    }));

    await supabase.from('goal_milestones').insert(milestonesToInsert);

    // Generate AI suggestions for the goal
    const aiSuggestions = await generateGoalSuggestions(goal, user.id, supabase);

    // Generate initial prediction if there's enough data
    let prediction = null;
    if (initial_contribution || (await hasTransactionHistory(user.id, supabase))) {
      try {
        const predictionResponse = await fetch(`${request.url}/${goal.id}/predict`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || '',
          },
        });

        if (predictionResponse.ok) {
          const predictionData = await predictionResponse.json();
          prediction = predictionData.prediction;
        }
      } catch (error) {
        console.log('Could not generate initial prediction:', error);
        // Non-critical, continue without prediction
      }
    }

    return NextResponse.json({
      goal: {
        ...goal,
        progress_percentage: initial_contribution
          ? (initial_contribution / target_amount) * 100
          : 0,
      },
      ai_suggestions: aiSuggestions,
      prediction,
    });
  } catch (error: any) {
    console.error('Error in POST /api/savings-goals:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to check if user has transaction history
async function hasTransactionHistory(userId: string, supabase: any): Promise<boolean> {
  try {
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return (count || 0) >= 5; // At least 5 transactions
  } catch (error) {
    return false;
  }
}

// Helper function to generate AI suggestions for a new goal
async function generateGoalSuggestions(goal: any, userId: string, supabase: any) {
  try {
    // Get user's income data from last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const { data: incomeTransactions } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'income')
      .gte('transaction_date', threeMonthsAgo.toISOString());

    const totalIncome = incomeTransactions?.reduce((sum: number, t: any) => sum + t.amount, 0) || 0;
    const avgMonthlyIncome = totalIncome / 3;

    // Calculate recommended monthly amount
    const monthsToTarget = goal.target_date
      ? Math.max(
          1,
          Math.ceil(
            (new Date(goal.target_date).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24 * 30)
          )
        )
      : 12;

    const recommendedMonthlyAmount = Math.ceil(goal.target_amount / monthsToTarget);

    // Suggest savings rules
    const suggestedRules = [];

    // Rule 1: Percentage of income (if we have income data)
    if (avgMonthlyIncome > 0) {
      const percentage = Math.min(20, Math.ceil((recommendedMonthlyAmount / avgMonthlyIncome) * 100));
      suggestedRules.push({
        type: 'percentage_of_income',
        config: { percentage },
        expected_monthly: (avgMonthlyIncome * percentage) / 100,
      });
    }

    // Rule 2: Fixed monthly amount
    suggestedRules.push({
      type: 'fixed_amount',
      config: { amount: recommendedMonthlyAmount },
      expected_monthly: recommendedMonthlyAmount,
    });

    return {
      recommended_monthly_amount: recommendedMonthlyAmount,
      months_to_target: monthsToTarget,
      suggested_rules: suggestedRules,
      milestones: [
        { name: '25% - Primer Logro', target_amount: goal.target_amount * 0.25 },
        { name: '50% - A Mitad de Camino', target_amount: goal.target_amount * 0.5 },
        { name: '75% - Casi Ahí', target_amount: goal.target_amount * 0.75 },
      ],
    };
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    return null;
  }
}
