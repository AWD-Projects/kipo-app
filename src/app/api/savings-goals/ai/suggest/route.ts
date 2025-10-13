import { createClient } from '@/lib/supabase/server';

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/savings-goals/ai/suggest - Get AI-powered goal suggestions
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      analysis_period_months = 6,
      user_preferences = {},
    } = body;

    // Get user's financial data
    const financialData = await getUserFinancialSummary(
      user.id,
      analysis_period_months,
      supabase
    );

    // Get existing goals
    const { data: existingGoals } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'paused']);

    // Call OpenAI for suggestions
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Eres un asesor financiero experto especializado en metas de ahorro para usuarios mexicanos. Analiza los datos financieros del usuario y sugiere 2-4 metas de ahorro realistas y personalizadas.

Prioridades:
1. Si no tiene fondo de emergencia, sugiérelo primero (6 meses de gastos)
2. Considera el contexto cultural y financiero mexicano
3. Las metas deben ser SMART (específicas, medibles, alcanzables, relevantes, temporales)
4. Balancea metas a corto, mediano y largo plazo

Para cada meta sugiere:
- Nombre descriptivo
- Descripción clara
- Monto objetivo realista
- Fecha objetivo
- Categoría (emergency_fund, vacation, purchase, education, etc.)
- Nivel de confianza (0-1)
- Razonamiento detallado
- Monto mensual sugerido
- Reglas de ahorro automático

Responde en formato JSON.`,
        },
        {
          role: 'user',
          content: `Analiza estos datos financieros y sugiere metas de ahorro:

**Datos Financieros (últimos ${analysis_period_months} meses):**
${JSON.stringify(financialData, null, 2)}

**Metas Existentes:**
${JSON.stringify(existingGoals, null, 2)}

**Preferencias del Usuario:**
${JSON.stringify(user_preferences, null, 2)}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');

    // Debug logs
    console.log('=== AI SUGGESTIONS DEBUG ===');
    console.log('Financial Data:', JSON.stringify(financialData, null, 2));
    console.log('Existing Goals:', existingGoals?.length || 0);
    console.log('AI Response:', JSON.stringify(aiResponse, null, 2));
    console.log('============================');

    // Format response - handle multiple possible response formats from AI
    const suggestions = aiResponse.suggestions || aiResponse.metas || aiResponse.metas_de_ahorro || aiResponse.goals || [];
    const formattedSuggestions = suggestions.map((s: any) => {
      // Calculate timeline in months from fecha_objetivo/target_date if provided
      let suggested_timeline = s.suggested_timeline || s.plazo_sugerido;
      const dateField = s.fecha_objetivo || s.target_date;
      if (!suggested_timeline && dateField) {
        const targetDate = new Date(dateField);
        const now = new Date();
        const monthsDiff = (targetDate.getFullYear() - now.getFullYear()) * 12 +
                          (targetDate.getMonth() - now.getMonth());
        suggested_timeline = Math.max(1, monthsDiff);
      }

      // Map category to appropriate icon
      const categoryIconMap: Record<string, string> = {
        'emergency_fund': 'shield',
        'vacation': 'plane',
        'purchase': 'car',
        'education': 'graduation-cap',
        'home': 'home',
        'vehicle': 'car',
        'retirement': 'piggy-bank',
        'investment': 'briefcase',
        'personal_development': 'laptop',
        'debt_payoff': 'target',
        'other': 'target',
      };

      const category = s.category || s.categoria || 'other';
      const defaultIcon = categoryIconMap[category] || 'target';

      // Map category to appropriate color
      const categoryColorMap: Record<string, string> = {
        'emergency_fund': '#ef4444', // red
        'vacation': '#3b82f6', // blue
        'purchase': '#8b5cf6', // purple
        'education': '#f59e0b', // amber
        'home': '#10b981', // green
        'vehicle': '#6366f1', // indigo
        'retirement': '#ec4899', // pink
        'investment': '#14b8a6', // teal
        'personal_development': '#f97316', // orange
        'debt_payoff': '#ef4444', // red
        'other': '#3b82f6', // blue
      };

      const defaultColor = categoryColorMap[category] || '#3b82f6';

      return {
        name: s.name || s.nombre,
        description: s.description || s.descripcion,
        target_amount: s.target_amount || s.monto_objetivo,
        recommended_target_date: s.recommended_target_date || s.fecha_objetivo || s.target_date,
        priority: s.priority || s.prioridad || 3,
        ai_confidence: s.ai_confidence || s.confianza || s.nivel_de_confianza || s.confidence_level || 0.8,
        confidence_score: s.confidence_score || s.ai_confidence || s.confianza || s.nivel_de_confianza || s.confidence_level || 0.8,
        reasoning: s.reasoning || s.razonamiento,
        category,
        suggested_monthly_amount: s.suggested_monthly_amount || s.monto_mensual || s.monto_mensual_sugerido || s.monthly_savings,
        recommended_monthly_amount: s.recommended_monthly_amount || s.suggested_monthly_amount || s.monto_mensual || s.monto_mensual_sugerido || s.monthly_savings,
        suggested_rules: s.suggested_rules || s.reglas_sugeridas || s.reglas_de_ahorro_automatico || s.automatic_savings_rules || [],
        suggested_timeline,
        icon: s.icon || s.icono || defaultIcon,
        color: s.color || defaultColor,
      };
    });

    return NextResponse.json({
      suggestions: formattedSuggestions,
      analysis: {
        current_financial_health: financialData.financial_health || 'moderate',
        monthly_surplus: financialData.monthly_surplus || 0,
        savings_capacity: financialData.savings_capacity || 0,
        risk_factors: aiResponse.risk_factors || aiResponse.factores_riesgo || [],
        opportunities: aiResponse.opportunities || aiResponse.oportunidades || [],
      },
    });
  } catch (error: any) {
    console.error('Error in POST /api/savings-goals/ai/suggest:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to get user's financial summary
async function getUserFinancialSummary(
  userId: string,
  months: number,
  supabase: any
) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  // Get transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .gte('transaction_date', startDate.toISOString());

  // Get budgets
  const { data: budgets } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  // Calculate summary
  const income = transactions?.filter((t: any) => t.type === 'income') || [];
  const expenses = transactions?.filter((t: any) => t.type === 'expense') || [];

  const totalIncome = income.reduce((sum: number, t: any) => sum + t.amount, 0);
  const totalExpenses = expenses.reduce((sum: number, t: any) => sum + t.amount, 0);

  const monthlyIncome = totalIncome / months;
  const monthlyExpenses = totalExpenses / months;
  const monthlySurplus = monthlyIncome - monthlyExpenses;

  // Category breakdown
  const categoryBreakdown: Record<string, number> = {};
  expenses.forEach((t: any) => {
    const category = t.category || 'Sin categoría';
    categoryBreakdown[category] = (categoryBreakdown[category] || 0) + t.amount;
  });

  // Determine financial health
  let financial_health = 'moderate';
  const savingsRate = monthlyIncome > 0 ? (monthlySurplus / monthlyIncome) * 100 : 0;

  if (savingsRate >= 20) financial_health = 'good';
  else if (savingsRate < 5) financial_health = 'needs_attention';

  return {
    monthly_income: monthlyIncome,
    monthly_expenses: monthlyExpenses,
    monthly_surplus: monthlySurplus,
    savings_capacity: Math.max(0, monthlySurplus * 0.8), // 80% of surplus is safe to save
    total_income: totalIncome,
    total_expenses: totalExpenses,
    category_breakdown: categoryBreakdown,
    active_budgets_count: budgets?.length || 0,
    financial_health,
    savings_rate: savingsRate,
    analysis_period_months: months,
  };
}
