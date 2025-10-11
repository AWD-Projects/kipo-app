import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleBudgetQuery, isOpenAIConfigured } from '@/lib/ai/budgetAI';
import { randomUUID } from 'crypto';

/**
 * POST /api/budgets/chat
 * Handle natural language questions about budgets using AI
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
          error: 'El chat de IA no está configurado',
          message: 'La funcionalidad de chat requiere configuración de OpenAI API.'
        },
        { status: 503 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      message,
      sessionId,
      includeRecommendations = true,
      context = 'budgets' // Can be 'budgets', 'savings', or 'general'
    } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'El mensaje es requerido' },
        { status: 400 }
      );
    }

    // Use provided session ID or create new one
    const currentSessionId = sessionId || randomUUID();

    // Fetch conversation history for this session (last 10 messages)
    const { data: conversationHistory, error: historyError } = await supabase
      .from('budget_ai_conversations')
      .select('message_role, message_content')
      .eq('user_id', user.id)
      .eq('session_id', currentSessionId)
      .order('created_at', { ascending: true })
      .limit(10);

    if (historyError) {
      console.error('Error fetching conversation history:', historyError);
    }

    // Fetch ALL user data for comprehensive analysis

    // 1. Fetch ALL budgets (active and inactive)
    const { data: budgets, error: budgetsError } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (budgetsError) {
      console.error('Error fetching budgets:', budgetsError);
    }

    // 2. Fetch ALL transactions (last 6 months for better analysis)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('transaction_date', sixMonthsAgo.toISOString())
      .order('transaction_date', { ascending: false });

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
    }

    // 3. Fetch user's cards
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (cardsError) {
      console.error('Error fetching cards:', cardsError);
    }

    // 4. Fetch savings goals (if exists)
    const { data: savingsGoals, error: savingsError } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (savingsError) {
      console.error('Error fetching savings goals:', savingsError);
    }

    // 5. Fetch budget alerts
    const { data: budgetAlerts, error: alertsError } = await supabase
      .from('budget_alerts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (alertsError) {
      console.error('Error fetching budget alerts:', alertsError);
    }

    // 6. Get user profile info
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
    }

    // Build conversation context
    const conversationMessages = (conversationHistory || []).map(msg => ({
      role: msg.message_role,
      content: msg.message_content
    }));

    // Call AI to handle the query with COMPLETE user data
    const startTime = Date.now();
    const result = await handleBudgetQuery(
      user.id,
      message,
      conversationMessages,
      {
        budgets: budgets || [],
        transactions: transactions || [],
        cards: cards || [],
        savingsGoals: savingsGoals || [],
        budgetAlerts: budgetAlerts || [],
        profile: profile || null,
        // Add statistics
        stats: {
          totalTransactions: transactions?.length || 0,
          totalBudgets: budgets?.filter(b => b.is_active).length || 0,
          totalCards: cards?.length || 0,
          activeSavingsGoals: savingsGoals?.filter((g: any) => g.status === 'active').length || 0,
          unreadAlerts: budgetAlerts?.length || 0,
        }
      },
      context // Pass the context (budgets/savings/general)
    );
    const responseTime = Date.now() - startTime;

    // Store user message in database
    await supabase
      .from('budget_ai_conversations')
      .insert({
        user_id: user.id,
        session_id: currentSessionId,
        message_role: 'user',
        message_content: message,
        model_used: 'gpt-4o-mini',
        created_at: new Date().toISOString()
      });

    // Store AI response in database
    await supabase
      .from('budget_ai_conversations')
      .insert({
        user_id: user.id,
        session_id: currentSessionId,
        message_role: 'assistant',
        message_content: result.response,
        model_used: 'gpt-4o-mini',
        response_time_ms: responseTime,
        created_at: new Date().toISOString()
      });

    return NextResponse.json({
      response: result.response,
      data: result.data,
      suggestedActions: includeRecommendations ? result.suggestedActions : undefined,
      sessionId: currentSessionId
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in POST /api/budgets/chat:', error);
    return NextResponse.json(
      { error: 'Error al procesar tu pregunta', message: error.message },
      { status: 500 }
    );
  }
}
