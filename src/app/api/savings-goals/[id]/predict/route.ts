import { createClient } from '@/lib/supabase/server';

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/savings-goals/:id/predict - Generate AI prediction for goal completion
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

    // Get goal details
    const { data: goal, error: goalError } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', user.id)
      .single();

    if (goalError || !goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Get contribution history (last 12 months)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const { data: contributions } = await supabase
      .from('goal_contributions')
      .select('*')
      .eq('goal_id', goalId)
      .gte('contribution_date', oneYearAgo.toISOString().split('T')[0])
      .order('contribution_date', { ascending: true });

    // Get financial trends
    const { data: recentTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('transaction_date', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
      .order('transaction_date', { ascending: false });

    // Get active savings rules
    const { data: rules } = await supabase
      .from('savings_rules')
      .select('*')
      .eq('goal_id', goalId)
      .eq('is_active', true);

    // Get all other active goals for context
    const { data: otherGoals } = await supabase
      .from('savings_goals')
      .select('name, target_amount, current_amount, priority, target_date')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .neq('id', goalId);

    // Get active budgets for spending context
    const { data: budgets } = await supabase
      .from('budgets')
      .select('category, amount, spent')
      .eq('user_id', user.id)
      .eq('is_active', true);

    // Get monthly summaries for historical context
    const { data: monthlySummaries } = await supabase
      .from('monthly_summary')
      .select('month, income, expenses, net')
      .eq('user_id', user.id)
      .order('month', { ascending: false })
      .limit(6);

    // Calculate statistics
    const contributionStats = calculateContributionStats(contributions || []);
    const financialTrends = calculateFinancialTrends(recentTransactions || []);
    const historicalContext = calculateHistoricalContext(monthlySummaries || []);
    const competingGoalsImpact = calculateCompetingGoalsImpact(otherGoals || []);
    const budgetUtilization = calculateBudgetUtilization(budgets || []);

    // Call OpenAI for prediction
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Eres un analista financiero experto. Analiza los patrones de contribución, tendencias de ingresos/gastos, y reglas de ahorro para predecir cuándo se completará una meta de ahorro.

Proporciona:
1. Fecha de completación predicha
2. Nivel de confianza (0-1) basado en la consistencia de los datos
3. Monto mensual recomendado para alcanzar la meta a tiempo
4. Monto mensual mínimo necesario
5. Insights sobre el progreso actual
6. Factores de riesgo potenciales
7. Oportunidades para acelerar el ahorro

Sé realista pero motivador. Responde en español (México).`,
        },
        {
          role: 'user',
          content: `Predice la completación de esta meta de ahorro considerando TODOS los factores contextuales:

**Meta Actual:**
- Nombre: ${goal.name}
- Monto objetivo: $${goal.target_amount}
- Monto actual: $${goal.current_amount}
- Fecha objetivo: ${goal.target_date || 'No definida'}
- Restante: $${goal.target_amount - goal.current_amount}
- Prioridad: ${goal.priority} (1=Muy Alta, 5=Baja)

**Estadísticas de Contribución (últimos 12 meses):**
${JSON.stringify(contributionStats, null, 2)}

**Tendencias Financieras Globales (últimos 6 meses):**
${JSON.stringify(financialTrends, null, 2)}

**Contexto Histórico (últimos 6 meses):**
${JSON.stringify(historicalContext, null, 2)}

**Impacto de Metas Competidoras:**
${JSON.stringify(competingGoalsImpact, null, 2)}

**Utilización de Presupuestos:**
${JSON.stringify(budgetUtilization, null, 2)}

**Reglas de Ahorro Automático Activas:**
${JSON.stringify(rules, null, 2)}

IMPORTANTE: Considera el impacto de las otras metas activas, la capacidad de ahorro real después de presupuestos, y la consistencia histórica del usuario. Sé muy preciso y realista en tu predicción.

Responde en formato JSON.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Lower temperature for more consistent predictions
      max_tokens: 1500,
    });

    const aiPrediction = JSON.parse(completion.choices[0].message.content || '{}');

    const remaining = goal.target_amount - goal.current_amount;

    let predictedDate: string;
    let recommendedMonthly: number;
    let confidenceScore: number;

    // PRIORITY 1: If user set a target_date, USE THAT DATE
    if (goal.target_date) {
      predictedDate = goal.target_date;

      // Calculate recommended monthly based on target_date
      const targetDate = new Date(goal.target_date);
      const now = new Date();

      // Calculate months correctly: difference in years * 12 + difference in months
      const yearsDiff = targetDate.getFullYear() - now.getFullYear();
      const monthsDiff = targetDate.getMonth() - now.getMonth();
      const monthsToTarget = Math.max(1, yearsDiff * 12 + monthsDiff);

      recommendedMonthly = Math.ceil(remaining / monthsToTarget);

      // High confidence because user set the date
      confidenceScore = 0.95;
    } else {
      // PRIORITY 2: No target_date, calculate based on actual data
      const monthlyAvg = contributionStats.monthly_average || financialTrends.monthly_surplus || 1000;
      const monthsNeeded = Math.ceil(remaining / monthlyAvg);
      const calculatedDate = new Date();
      calculatedDate.setMonth(calculatedDate.getMonth() + monthsNeeded);

      predictedDate = calculatedDate.toISOString().split('T')[0];
      recommendedMonthly = Math.ceil(monthlyAvg);

      // Confidence based on data consistency
      confidenceScore = contributionStats.consistency_score || 0.5;
    }

    // Format prediction
    const prediction = {
      predicted_completion_date: predictedDate,
      confidence_score: confidenceScore,
      current_trajectory: {
        monthly_average: contributionStats.monthly_average,
        trend: contributionStats.trend,
        monthly_projections: generateMonthlyProjections(
          goal.current_amount,
          goal.target_amount,
          recommendedMonthly
        ),
      },
      recommended_monthly_amount: recommendedMonthly,
      minimum_monthly_amount: Math.ceil(recommendedMonthly * 0.75),
      ai_insights: aiPrediction.insights || aiPrediction.insights_es || [],
      risk_factors: aiPrediction.risk_factors || aiPrediction.factores_riesgo || [],
      opportunities: aiPrediction.opportunities || aiPrediction.oportunidades || [],
    };

    // Store prediction in database
    const { error: storageError } = await supabase
      .from('goal_predictions')
      .insert({
        goal_id: goalId,
        user_id: user.id,
        predicted_completion_date: prediction.predicted_completion_date,
        confidence_score: prediction.confidence_score,
        current_trajectory: prediction.current_trajectory,
        recommended_monthly_amount: prediction.recommended_monthly_amount,
        minimum_monthly_amount: prediction.minimum_monthly_amount,
        ai_insights: prediction.ai_insights,
        risk_factors: prediction.risk_factors,
        opportunities: prediction.opportunities,
        model_version: 'gpt-4o-mini',
        prediction_factors: { contributionStats, financialTrends, rulesCount: rules?.length || 0 },
      });

    if (storageError) {
      console.error('Error storing prediction:', storageError);
    }

    return NextResponse.json({ prediction });
  } catch (error: any) {
    console.error('Error in POST /api/savings-goals/:id/predict:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper: Calculate contribution statistics
function calculateContributionStats(contributions: any[]) {
  if (contributions.length === 0) {
    return {
      total: 0,
      count: 0,
      monthly_average: 0,
      trend: 'no_data',
      consistency_score: 0,
    };
  }

  const total = contributions.reduce((sum, c) => sum + c.amount, 0);
  const count = contributions.length;

  // Group by month
  const monthlyTotals: Record<string, number> = {};
  contributions.forEach((c) => {
    const month = c.contribution_date.substring(0, 7); // YYYY-MM
    monthlyTotals[month] = (monthlyTotals[month] || 0) + c.amount;
  });

  const monthlyValues = Object.values(monthlyTotals);
  const monthly_average = monthlyValues.length > 0
    ? monthlyValues.reduce((sum, v) => sum + v, 0) / monthlyValues.length
    : 0;

  // Calculate trend (comparing first half vs second half)
  const midpoint = Math.floor(monthlyValues.length / 2);
  const firstHalfAvg = monthlyValues.slice(0, midpoint).reduce((sum, v) => sum + v, 0) / midpoint || 0;
  const secondHalfAvg = monthlyValues.slice(midpoint).reduce((sum, v) => sum + v, 0) / (monthlyValues.length - midpoint) || 0;

  let trend = 'stable';
  if (secondHalfAvg > firstHalfAvg * 1.1) trend = 'increasing';
  else if (secondHalfAvg < firstHalfAvg * 0.9) trend = 'decreasing';

  // Consistency score (standard deviation)
  const mean = monthly_average;
  const variance = monthlyValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / monthlyValues.length;
  const stdDev = Math.sqrt(variance);
  const consistency_score = mean > 0 ? Math.max(0, 1 - (stdDev / mean)) : 0;

  return {
    total,
    count,
    monthly_average: Math.round(monthly_average),
    trend,
    consistency_score: Math.round(consistency_score * 100) / 100,
  };
}

// Helper: Calculate financial trends
function calculateFinancialTrends(transactions: any[]) {
  const income = transactions.filter(t => t.type === 'income');
  const expenses = transactions.filter(t => t.type === 'expense');

  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

  const months = 6;
  const monthlyIncome = totalIncome / months;
  const monthlyExpenses = totalExpenses / months;
  const monthlySurplus = monthlyIncome - monthlyExpenses;

  return {
    monthly_income: Math.round(monthlyIncome),
    monthly_expenses: Math.round(monthlyExpenses),
    monthly_surplus: Math.round(monthlySurplus),
    income_trend: calculateTrend(income),
    expense_trend: calculateTrend(expenses),
  };
}

// Helper: Calculate trend direction
function calculateTrend(transactions: any[]) {
  if (transactions.length < 2) return 'stable';

  // Group by month
  const monthlyTotals: Record<string, number> = {};
  transactions.forEach((t) => {
    const month = t.transaction_date.substring(0, 7);
    monthlyTotals[month] = (monthlyTotals[month] || 0) + t.amount;
  });

  const values = Object.values(monthlyTotals);
  if (values.length < 2) return 'stable';

  const midpoint = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, midpoint).reduce((sum, v) => sum + v, 0) / midpoint;
  const secondHalf = values.slice(midpoint).reduce((sum, v) => sum + v, 0) / (values.length - midpoint);

  if (secondHalf > firstHalf * 1.15) return 'increasing';
  if (secondHalf < firstHalf * 0.85) return 'decreasing';
  return 'stable';
}

// Helper: Generate monthly projections
function generateMonthlyProjections(current: number, target: number, monthlyAvg: number) {
  const projections = [];
  let projected = current;
  const now = new Date();

  for (let i = 1; i <= 12 && projected < target; i++) {
    projected += monthlyAvg;
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    projections.push({
      month: date.toISOString().substring(0, 7),
      projected_amount: Math.round(Math.min(projected, target)),
    });
  }

  return projections;
}

// Helper: Calculate historical context from monthly summaries
function calculateHistoricalContext(summaries: any[]) {
  if (summaries.length === 0) {
    return {
      average_monthly_net: 0,
      net_trend: 'no_data',
      volatility: 'unknown',
      savings_rate_avg: 0,
    };
  }

  const avgNet = summaries.reduce((sum, s) => sum + (s.net || 0), 0) / summaries.length;
  const avgIncome = summaries.reduce((sum, s) => sum + (s.income || 0), 0) / summaries.length;
  const savingsRate = avgIncome > 0 ? (avgNet / avgIncome) * 100 : 0;

  // Calculate net trend
  const firstHalf = summaries.slice(Math.floor(summaries.length / 2));
  const secondHalf = summaries.slice(0, Math.floor(summaries.length / 2));
  const firstAvg = firstHalf.reduce((sum, s) => sum + (s.net || 0), 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, s) => sum + (s.net || 0), 0) / secondHalf.length;

  let netTrend = 'stable';
  if (secondAvg > firstAvg * 1.15) netTrend = 'improving';
  else if (secondAvg < firstAvg * 0.85) netTrend = 'declining';

  // Calculate volatility
  const stdDev = Math.sqrt(
    summaries.reduce((sum, s) => sum + Math.pow((s.net || 0) - avgNet, 2), 0) / summaries.length
  );
  const volatility = avgNet > 0 && stdDev / Math.abs(avgNet) > 0.3 ? 'high' : 'low';

  return {
    average_monthly_net: Math.round(avgNet),
    net_trend: netTrend,
    volatility,
    savings_rate_avg: Math.round(savingsRate * 10) / 10,
  };
}

// Helper: Calculate impact of competing goals
function calculateCompetingGoalsImpact(otherGoals: any[]) {
  if (otherGoals.length === 0) {
    return {
      competing_goals_count: 0,
      total_competing_target: 0,
      high_priority_competitors: 0,
      estimated_monthly_allocation_pressure: 0,
    };
  }

  const totalTarget = otherGoals.reduce((sum, g) => sum + (g.target_amount - g.current_amount), 0);
  const highPriorityCount = otherGoals.filter(g => g.priority <= 2).length;

  // Estimate monthly pressure based on other goals' target dates
  let monthlyPressure = 0;
  otherGoals.forEach(g => {
    const remaining = g.target_amount - g.current_amount;
    if (g.target_date && remaining > 0) {
      const targetDate = new Date(g.target_date);
      const now = new Date();
      const monthsLeft = Math.max(1, (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth()));
      monthlyPressure += remaining / monthsLeft;
    }
  });

  return {
    competing_goals_count: otherGoals.length,
    total_competing_target: Math.round(totalTarget),
    high_priority_competitors: highPriorityCount,
    estimated_monthly_allocation_pressure: Math.round(monthlyPressure),
  };
}

// Helper: Calculate budget utilization
function calculateBudgetUtilization(budgets: any[]) {
  if (budgets.length === 0) {
    return {
      total_budgeted: 0,
      total_spent: 0,
      utilization_rate: 0,
      budget_discipline: 'unknown',
    };
  }

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
  const utilizationRate = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  let discipline = 'good';
  if (utilizationRate > 100) discipline = 'overspending';
  else if (utilizationRate > 90) discipline = 'tight';
  else if (utilizationRate < 50) discipline = 'conservative';

  return {
    total_budgeted: Math.round(totalBudgeted),
    total_spent: Math.round(totalSpent),
    utilization_rate: Math.round(utilizationRate * 10) / 10,
    budget_discipline: discipline,
  };
}
