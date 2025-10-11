import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateBudgetSuggestions, isOpenAIConfigured } from '@/lib/ai/budgetAI';

/**
 * POST /api/budgets/ai-suggest
 * Generate AI-powered budget suggestions based on user's spending history
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

    // Check if OpenAI is configured
    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        {
          error: 'Las funciones de IA no están configuradas',
          message: 'Falta la clave API de OpenAI. Por favor contacta a soporte o configura tu clave API.'
        },
        { status: 503 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      period = 'monthly',
      categories,
      baseAmount,
      preferences = {},
      includeExisting = false // Nueva opción para incluir categorías con presupuesto
    } = body;

    // Fetch existing active budgets
    const { data: existingBudgets, error: budgetsError } = await supabase
      .from('budgets')
      .select('category, amount')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (budgetsError) {
      console.error('Error fetching existing budgets:', budgetsError);
    }

    const existingCategories = new Set(existingBudgets?.map(b => b.category) || []);

    // Fetch user's transaction history (last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('id, amount, category, type, transaction_date, description')
      .eq('user_id', user.id)
      .gte('transaction_date', threeMonthsAgo.toISOString())
      .order('transaction_date', { ascending: false });

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
      return NextResponse.json(
        { error: 'Error al obtener el historial de transacciones' },
        { status: 500 }
      );
    }

    // BR-1: Historical Data Requirement - Need 7 days minimum for AI suggestions
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const oldestTransaction = transactions && transactions.length > 0
      ? new Date(transactions[transactions.length - 1].transaction_date)
      : new Date();

    if (!transactions || transactions.length < 10 || oldestTransaction > sevenDaysAgo) {
      return NextResponse.json(
        {
          error: 'Datos insuficientes',
          message: 'Necesitas al menos 7 días de historial y 10 transacciones para generar sugerencias de presupuesto con IA. ¡Sigue registrando tus gastos!'
        },
        { status: 400 }
      );
    }

    // Filter by categories if specified
    let filteredTransactions = transactions;
    if (categories && categories.length > 0) {
      filteredTransactions = transactions.filter(t =>
        categories.includes(t.category)
      );
    }

    // Generate AI suggestions
    const result = await generateBudgetSuggestions(
      user.id,
      filteredTransactions,
      {
        ...preferences,
        baseAmount,
        categories
      }
    );

    // Filter out existing budgets unless includeExisting is true
    let filteredSuggestions = result.suggestions;

    if (!includeExisting) {
      filteredSuggestions = result.suggestions.filter(
        s => !existingCategories.has(s.category)
      );
    } else {
      // Mark existing budgets in suggestions
      filteredSuggestions = result.suggestions.map(s => ({
        ...s,
        hasExistingBudget: existingCategories.has(s.category),
        currentBudgetAmount: existingBudgets?.find(b => b.category === s.category)?.amount || 0
      }));
    }

    // Recalculate totals based on filtered suggestions
    const totalSuggested = filteredSuggestions.reduce((sum, s) => sum + s.suggestedAmount, 0);

    // Return suggestions with metadata
    return NextResponse.json({
      ...result,
      suggestions: filteredSuggestions,
      totalSuggested,
      excludedCategories: includeExisting ? [] : Array.from(existingCategories),
      existingBudgetsCount: existingCategories.size
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in AI budget suggestions:', error);
    return NextResponse.json(
      {
        error: 'Error al generar sugerencias',
        message: error.message || 'Ocurrió un error inesperado'
      },
      { status: 500 }
    );
  }
}
