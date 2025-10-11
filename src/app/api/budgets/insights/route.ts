import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateInsights, isOpenAIConfigured } from '@/lib/ai/budgetAI';

/**
 * GET /api/budgets/insights
 * Get AI-generated insights about spending patterns
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
    const generateNew = searchParams.get('generate') === 'true';

    // First, try to get existing non-expired insights from database
    const { data: existingInsights, error: insightsError } = await supabase
      .from('budget_insights')
      .select('*')
      .eq('user_id', user.id)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (insightsError) {
      console.error('Error fetching insights:', insightsError);
    }

    // If we have recent insights and not forcing generation, return them
    if (existingInsights && existingInsights.length > 0 && !generateNew) {
      const formattedInsights = existingInsights.map(insight => ({
        id: insight.id,
        type: insight.insight_type,
        title: insight.title,
        description: insight.description,
        category: insight.category,
        impact: insight.potential_savings ? 'high' : 'medium',
        potentialSavings: insight.potential_savings ? parseFloat(insight.potential_savings) : 0,
        recommendations: insight.recommendations || [],
        createdAt: insight.created_at,
        viewed: !!insight.viewed_at
      }));

      return NextResponse.json({ insights: formattedInsights }, { status: 200 });
    }

    // Generate new insights if requested or no existing insights
    if (!isOpenAIConfigured()) {
      return NextResponse.json({
        insights: existingInsights || [],
        message: 'La generación de insights con IA no está disponible. Mostrando solo insights existentes.'
      }, { status: 200 });
    }

    // Fetch recent transactions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('id, amount, category, type, transaction_date, description')
      .eq('user_id', user.id)
      .gte('transaction_date', thirtyDaysAgo.toISOString())
      .order('transaction_date', { ascending: false });

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
      return NextResponse.json(
        { error: 'Error al obtener transacciones' },
        { status: 500 }
      );
    }

    // Fetch active budgets
    const { data: budgets, error: budgetsError } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (budgetsError) {
      console.error('Error fetching budgets:', budgetsError);
    }

    // Generate AI insights
    const aiInsights = await generateInsights(user.id, transactions || [], budgets || []);

    // BR-5: Filter by relevance (>$100 impact) and limit to 5 insights
    const relevantInsights = aiInsights
      .filter(insight => {
        const potentialSavings = insight.recommendations?.reduce((sum, rec) => sum + (rec.impact || 0), 0) || 0;
        return potentialSavings > 100;
      })
      .slice(0, 5);

    // Store insights in database
    const insightsToStore = relevantInsights.map(insight => ({
      user_id: user.id,
      insight_type: insight.type,
      title: insight.title,
      description: insight.description,
      ai_analysis: JSON.stringify(insight),
      recommendations: insight.recommendations,
      potential_savings: insight.recommendations.reduce((sum, rec) => sum + (rec.impact || 0), 0),
      period_start: thirtyDaysAgo.toISOString(),
      period_end: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Expire in 30 days
    }));

    if (insightsToStore.length > 0) {
      const { error: insertError } = await supabase
        .from('budget_insights')
        .insert(insightsToStore);

      if (insertError) {
        console.error('Error storing insights:', insertError);
        // Continue even if storage fails
      }
    }

    // Format and return insights
    const formattedInsights = relevantInsights.map(insight => ({
      type: insight.type,
      title: insight.title,
      description: insight.description,
      actionable: insight.actionable,
      impact: insight.recommendations.length > 0 ? 'high' : 'medium',
      potentialSavings: insight.recommendations.reduce((sum, rec) => sum + (rec.impact || 0), 0),
      recommendations: insight.recommendations,
      createdAt: new Date().toISOString()
    }));

    return NextResponse.json({ insights: formattedInsights }, { status: 200 });

  } catch (error: any) {
    console.error('Error in GET /api/budgets/insights:', error);
    return NextResponse.json(
      { error: 'Error al generar insights', message: error.message },
      { status: 500 }
    );
  }
}
