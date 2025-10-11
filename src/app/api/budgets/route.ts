import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/budgets
 * Get all budgets for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('active');
    const period = searchParams.get('period');
    const category = searchParams.get('category');

    // Build query
    let query = supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id);

    // Apply filters
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    if (period) {
      query = query.eq('period', period);
    }

    if (category) {
      query = query.eq('category', category);
    }

    // Order by category
    query = query.order('category', { ascending: true });

    const { data: budgets, error: budgetsError } = await query;

    if (budgetsError) {
      console.error('Error fetching budgets:', budgetsError);
      return NextResponse.json(
        { error: 'Failed to fetch budgets' },
        { status: 500 }
      );
    }

    return NextResponse.json({ budgets }, { status: 200 });

  } catch (error: any) {
    console.error('Error in GET /api/budgets:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/budgets
 * Create a new budget
 */
export async function POST(request: NextRequest) {
  try {
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
      category,
      amount,
      period = 'monthly',
      startDate,
      endDate,
      autoAdjust = false,
      adjustmentPercentage = 10,
      aiSuggested = false,
      aiConfidence,
      aiReasoning
    } = body;

    // Validate required fields
    if (!category || !amount || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields: category, amount, startDate' },
        { status: 400 }
      );
    }

    // Validate amount (BR-1: Minimum Budget Amount $100 MXN)
    if (amount < 100) {
      return NextResponse.json(
        { error: 'El monto mínimo del presupuesto es $100 MXN' },
        { status: 400 }
      );
    }

    // BR-1: Maximum Budgets per User - 20 active budgets
    const { count: activeBudgetsCount } = await supabase
      .from('budgets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (activeBudgetsCount && activeBudgetsCount >= 20) {
      return NextResponse.json(
        { error: 'Has alcanzado el límite de 20 presupuestos activos. Desactiva o elimina algunos para crear nuevos.' },
        { status: 400 }
      );
    }

    // Check for duplicate budget (same category, period, and start date)
    const { data: existingBudget } = await supabase
      .from('budgets')
      .select('id')
      .eq('user_id', user.id)
      .eq('category', category)
      .eq('period', period)
      .eq('start_date', startDate)
      .eq('is_active', true)
      .single();

    if (existingBudget) {
      return NextResponse.json(
        { error: 'A budget already exists for this category and period' },
        { status: 409 }
      );
    }

    // Create budget
    const { data: budget, error: createError } = await supabase
      .from('budgets')
      .insert({
        user_id: user.id,
        category,
        amount,
        period,
        start_date: startDate,
        end_date: endDate || null,
        auto_adjust: autoAdjust,
        adjustment_percentage: adjustmentPercentage,
        ai_suggested: aiSuggested,
        ai_confidence: aiConfidence || null,
        ai_reasoning: aiReasoning || null,
        is_active: true,
        created_by: aiSuggested ? 'ai' : 'user'
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating budget:', createError);
      return NextResponse.json(
        { error: 'Failed to create budget', details: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ budget }, { status: 201 });

  } catch (error: any) {
    console.error('Error in POST /api/budgets:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
