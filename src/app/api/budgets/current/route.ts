import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/budgets/current
 * Get all active budgets with current spending and status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Get query parameter for predictions
    const { searchParams } = new URL(request.url);
    const includePredictions = searchParams.get('predictions') === 'true';

    // Fetch all active budgets
    const { data: budgets, error: budgetsError } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (budgetsError) {
      console.error('Error fetching budgets:', budgetsError);
      return NextResponse.json(
        { error: 'Error al obtener presupuestos', details: budgetsError.message },
        { status: 500 }
      );
    }

    // Calculate spending for each budget
    const budgetsWithSpending = await Promise.all(
      (budgets || []).map(async (budget) => {
        // Get transactions for this budget's category and period
        // Validate dates before using them
        const startDate = budget.start_date ? new Date(budget.start_date) : null;
        const endDate = budget.end_date ? new Date(budget.end_date) : new Date();

        let spent = 0;

        // Only fetch transactions if we have valid dates
        if (startDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          const { data: transactions } = await supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', user.id)
            .eq('type', 'expense')
            .eq('category', budget.category)
            .gte('transaction_date', startDate.toISOString())
            .lte('transaction_date', endDate.toISOString());

          // Calculate total spent
          spent = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
        }
        const remaining = budget.amount - spent;
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

        // Determine status
        let status: string;
        if (percentage >= 100) {
          status = 'exceeded';
        } else if (percentage >= 90) {
          status = 'critical';
        } else if (percentage >= 75) {
          status = 'warning';
        } else {
          status = 'on_track';
        }

        // Calculate days remaining
        let daysRemaining: number | null = null;
        if (budget.end_date) {
          const now = new Date();
          const end = new Date(budget.end_date);
          const diffTime = end.getTime() - now.getTime();
          daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        return {
          id: budget.id,
          category: budget.category,
          amount: budget.amount,
          spent,
          remaining,
          percentage,
          status,
          period: budget.period,
          start_date: budget.start_date,
          end_date: budget.end_date,
          daysRemaining,
          aiSuggested: budget.ai_suggested || false,
          autoAdjust: budget.auto_adjust || false,
          created_at: budget.created_at,
          // Add prediction placeholder if requested
          aiPrediction: includePredictions ? {
            likelyToExceed: percentage > 90,
            predictedOverage: percentage > 100 ? spent - budget.amount : 0,
            recommendation: getRecommendation(status, percentage)
          } : undefined
        };
      })
    );

    return NextResponse.json({ budgets: budgetsWithSpending }, { status: 200 });

  } catch (error: any) {
    console.error('Error in GET /api/budgets/current:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Helper function to generate recommendations based on budget status
 */
function getRecommendation(status: string, percentage: number): string {
  switch (status) {
    case 'exceeded':
      return 'Has excedido tu presupuesto. Considera reducir gastos en esta categoría.';
    case 'critical':
      return `Estás al ${percentage.toFixed(0)}% de tu presupuesto. Reduce gastos para evitar excederlo.`;
    case 'warning':
      return `Has gastado el ${percentage.toFixed(0)}% de tu presupuesto. Mantén el control de tus gastos.`;
    case 'on_track':
    default:
      return 'Vas bien encaminado. Continúa así para cumplir tu presupuesto.';
  }
}
