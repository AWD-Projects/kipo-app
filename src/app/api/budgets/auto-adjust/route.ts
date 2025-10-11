import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/budgets/auto-adjust
 * Trigger AI auto-adjustment of budgets (BR-4: Auto-Adjustment Rules)
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
      budgetId,
      reason = 'seasonal_change', // 'seasonal_change', 'income_change', 'lifestyle_change'
      forceAdjust = false // Skip approval requirement
    } = body;

    if (!budgetId) {
      return NextResponse.json(
        { error: 'budgetId es requerido' },
        { status: 400 }
      );
    }

    // Fetch budget
    const { data: budget, error: budgetError } = await supabase
      .from('budgets')
      .select('*')
      .eq('id', budgetId)
      .eq('user_id', user.id)
      .single();

    if (budgetError || !budget) {
      return NextResponse.json(
        { error: 'Presupuesto no encontrado' },
        { status: 404 }
      );
    }

    // BR-4: Check if auto-adjust is enabled
    if (!budget.auto_adjust && !forceAdjust) {
      return NextResponse.json(
        {
          error: 'Auto-ajuste no habilitado',
          message: 'Este presupuesto no tiene el auto-ajuste habilitado. Actívalo en la configuración o usa forceAdjust=true.'
        },
        { status: 400 }
      );
    }

    // BR-4: Minimum History - 3 completed periods before auto-adjust
    const periodDuration = getPeriodDuration(budget.period);
    const minHistoryDate = new Date(budget.start_date);
    minHistoryDate.setDate(minHistoryDate.getDate() - (periodDuration * 3));

    const { data: historicalTransactions, error: txError } = await supabase
      .from('transactions')
      .select('amount, transaction_date')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .eq('category', budget.category)
      .gte('transaction_date', minHistoryDate.toISOString())
      .order('transaction_date', { ascending: false });

    if (txError) {
      console.error('Error fetching transactions:', txError);
      return NextResponse.json(
        { error: 'Error al obtener historial de transacciones' },
        { status: 500 }
      );
    }

    if (!historicalTransactions || historicalTransactions.length < 10) {
      return NextResponse.json(
        {
          error: 'Historial insuficiente',
          message: 'Se necesitan al menos 3 períodos de historial completos para el auto-ajuste'
        },
        { status: 400 }
      );
    }

    // Calculate average spending for the last 3 periods
    const periodSpending = calculatePeriodSpending(
      historicalTransactions,
      budget.period,
      3
    );

    const averageSpending = periodSpending.reduce((sum, amount) => sum + amount, 0) / periodSpending.length;

    // Apply adjustment factor based on reason
    let adjustmentFactor = 1.0;
    switch (reason) {
      case 'seasonal_change':
        adjustmentFactor = 1.05; // 5% increase for seasonal changes
        break;
      case 'income_change':
        adjustmentFactor = 1.10; // 10% increase for income changes
        break;
      case 'lifestyle_change':
        adjustmentFactor = 1.15; // 15% increase for lifestyle changes
        break;
      default:
        adjustmentFactor = 1.0;
    }

    const suggestedAmount = Math.round(averageSpending * adjustmentFactor);

    // BR-4: Max Adjustment ±20% of original budget per month
    const maxAdjustmentPercentage = budget.adjustment_percentage || 20;
    const maxIncrease = budget.amount * (1 + maxAdjustmentPercentage / 100);
    const maxDecrease = budget.amount * (1 - maxAdjustmentPercentage / 100);

    let newAmount = suggestedAmount;
    if (newAmount > maxIncrease) {
      newAmount = maxIncrease;
    } else if (newAmount < maxDecrease) {
      newAmount = maxDecrease;
    }

    // Round to nearest 100
    newAmount = Math.round(newAmount / 100) * 100;

    const adjustmentPercentage = ((newAmount - budget.amount) / budget.amount) * 100;

    // BR-4: User Approval Required for adjustments >10%
    const requiresApproval = Math.abs(adjustmentPercentage) > 10 && !forceAdjust;

    if (requiresApproval) {
      return NextResponse.json({
        requiresApproval: true,
        currentAmount: budget.amount,
        suggestedAmount: newAmount,
        adjustmentPercentage: adjustmentPercentage.toFixed(2),
        reason,
        message: 'Este ajuste requiere tu aprobación porque excede el 10%. Usa forceAdjust=true para aplicarlo.',
        averageHistoricalSpending: Math.round(averageSpending)
      }, { status: 200 });
    }

    // Check if already adjusted this period (BR-4: Max once per period)
    const periodStart = new Date(budget.start_date);
    const { data: recentHistory } = await supabase
      .from('budget_history')
      .select('*')
      .eq('budget_id', budgetId)
      .eq('change_type', 'auto_adjusted')
      .gte('created_at', periodStart.toISOString())
      .limit(1);

    if (recentHistory && recentHistory.length > 0) {
      return NextResponse.json({
        error: 'Ajuste ya realizado',
        message: 'Este presupuesto ya fue auto-ajustado en este período. Solo se permite un ajuste por período.'
      }, { status: 400 });
    }

    // Apply adjustment
    const { data: updatedBudget, error: updateError } = await supabase
      .from('budgets')
      .update({
        amount: newAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', budgetId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating budget:', updateError);
      return NextResponse.json(
        { error: 'Error al ajustar el presupuesto' },
        { status: 500 }
      );
    }

    // Log in history (will be auto-created by trigger, but we can add extra info)
    await supabase
      .from('budget_history')
      .insert({
        budget_id: budgetId,
        user_id: user.id,
        change_type: 'auto_adjusted',
        old_amount: budget.amount,
        new_amount: newAmount,
        changed_by: 'ai',
        reason: `Auto-ajuste por ${reason}. Promedio histórico: $${Math.round(averageSpending)}`
      });

    return NextResponse.json({
      success: true,
      budget: updatedBudget,
      adjustment: {
        oldAmount: budget.amount,
        newAmount: newAmount,
        percentage: adjustmentPercentage.toFixed(2),
        reason,
        averageHistoricalSpending: Math.round(averageSpending)
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in POST /api/budgets/auto-adjust:', error);
    return NextResponse.json(
      { error: 'Error al procesar auto-ajuste', message: error.message },
      { status: 500 }
    );
  }
}

// Helper functions

function getPeriodDuration(period: string): number {
  switch (period) {
    case 'weekly':
      return 7;
    case 'monthly':
      return 30;
    case 'yearly':
      return 365;
    default:
      return 30;
  }
}

function calculatePeriodSpending(
  transactions: any[],
  period: string,
  numPeriods: number
): number[] {
  const periodDuration = getPeriodDuration(period);
  const periodSpending: number[] = [];

  for (let i = 0; i < numPeriods; i++) {
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() - (i * periodDuration));

    const periodStart = new Date(periodEnd);
    periodStart.setDate(periodStart.getDate() - periodDuration);

    const periodTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.transaction_date);
      return txDate >= periodStart && txDate < periodEnd;
    });

    const periodTotal = periodTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    periodSpending.push(periodTotal);
  }

  return periodSpending;
}
