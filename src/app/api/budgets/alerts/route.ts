import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { predictOverspending } from '@/lib/ai/budgetAI';

/**
 * GET /api/budgets/alerts
 * Get budget alerts for the authenticated user
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
    const acknowledged = searchParams.get('acknowledged');
    const alertType = searchParams.get('type');

    // Build query for alerts
    let query = supabase
      .from('budget_alerts')
      .select('*, budgets(*)')
      .eq('user_id', user.id)
      .order('triggered_at', { ascending: false });

    // Filter by acknowledged status
    if (acknowledged === 'false') {
      query = query.is('acknowledged_at', null);
    } else if (acknowledged === 'true') {
      query = query.not('acknowledged_at', 'is', null);
    }

    // Filter by alert type
    if (alertType) {
      query = query.eq('alert_type', alertType);
    }

    const { data: alerts, error: alertsError } = await query.limit(50);

    if (alertsError) {
      console.error('Error fetching alerts:', alertsError);
      return NextResponse.json(
        { error: 'Error al obtener las alertas' },
        { status: 500 }
      );
    }

    return NextResponse.json({ alerts: alerts || [] }, { status: 200 });

  } catch (error: any) {
    console.error('Error in GET /api/budgets/alerts:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/budgets/alerts/check
 * Check all budgets and create alerts if necessary (BR-3: Alert Rules)
 * This should be called by a cron job or manually
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

    // Fetch active budgets
    const { data: budgets, error: budgetsError } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (budgetsError) {
      console.error('Error fetching budgets:', budgetsError);
      return NextResponse.json(
        { error: 'Error al obtener presupuestos' },
        { status: 500 }
      );
    }

    if (!budgets || budgets.length === 0) {
      return NextResponse.json({
        message: 'No hay presupuestos activos para verificar',
        alertsCreated: 0
      }, { status: 200 });
    }

    const newAlerts = [];

    // Check each budget
    for (const budget of budgets) {
      // Calculate current spending
      const startDate = new Date(budget.start_date);
      const endDate = budget.end_date ? new Date(budget.end_date) : new Date();
      const now = new Date();

      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .eq('category', budget.category)
        .gte('transaction_date', startDate.toISOString())
        .lte('transaction_date', now.toISOString());

      const spent = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      // BR-3: Check existing alerts for this budget today (max 1 alert per day)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: existingAlerts } = await supabase
        .from('budget_alerts')
        .select('id')
        .eq('budget_id', budget.id)
        .gte('triggered_at', todayStart.toISOString())
        .limit(1);

      // Skip if alert already sent today
      if (existingAlerts && existingAlerts.length > 0) {
        continue;
      }

      // BR-3: Alert Escalation
      let alertType: string | null = null;
      let thresholdPercentage = 0;

      if (percentage >= 100) {
        alertType = 'exceeded';
        thresholdPercentage = 100;
      } else if (percentage >= 90) {
        alertType = 'approaching';
        thresholdPercentage = 90;
      } else if (percentage >= 70) {
        alertType = 'approaching';
        thresholdPercentage = 70;
      }

      // Check for predicted overspend
      let isPredicted = false;
      let predictedAmount = null;
      let predictedDate = null;
      let aiRecommendation = null;

      if (alertType === null && percentage > 50) {
        // Calculate days remaining
        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysRemaining > 0) {
          try {
            // Get recent transactions for prediction
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { data: recentTransactions } = await supabase
              .from('transactions')
              .select('*')
              .eq('user_id', user.id)
              .eq('type', 'expense')
              .eq('category', budget.category)
              .gte('transaction_date', sevenDaysAgo.toISOString())
              .order('transaction_date', { ascending: false});

            const prediction = await predictOverspending(
              budget.id,
              budget.amount,
              spent,
              daysRemaining,
              recentTransactions || []
            );

            if (prediction.likelyToExceed && prediction.confidenceLevel > 0.7) {
              alertType = 'predicted_overspend';
              thresholdPercentage = percentage;
              isPredicted = true;
              predictedAmount = prediction.predictedAmount;
              predictedDate = prediction.daysUntilExceed
                ? new Date(Date.now() + prediction.daysUntilExceed * 24 * 60 * 60 * 1000)
                : null;
              aiRecommendation = prediction.recommendation;
            }
          } catch (error) {
            console.error('Error predicting overspend:', error);
            // Continue without prediction
          }
        }
      }

      // Create alert if threshold exceeded
      if (alertType) {
        const { data: newAlert, error: alertError } = await supabase
          .from('budget_alerts')
          .insert({
            budget_id: budget.id,
            user_id: user.id,
            alert_type: alertType,
            threshold_percentage: thresholdPercentage,
            current_spent: spent,
            budget_amount: budget.amount,
            is_predicted: isPredicted,
            predicted_overspend_amount: predictedAmount,
            predicted_overspend_date: predictedDate?.toISOString().split('T')[0] || null,
            ai_recommendation: aiRecommendation,
            notification_sent: false,
            notification_channels: ['push'] // Default to push notifications
          })
          .select()
          .single();

        if (alertError) {
          console.error('Error creating alert:', alertError);
        } else {
          newAlerts.push(newAlert);
        }
      }
    }

    return NextResponse.json({
      message: `Se verificaron ${budgets.length} presupuestos`,
      alertsCreated: newAlerts.length,
      alerts: newAlerts
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in POST /api/budgets/alerts:', error);
    return NextResponse.json(
      { error: 'Error al verificar alertas', message: error.message },
      { status: 500 }
    );
  }
}
