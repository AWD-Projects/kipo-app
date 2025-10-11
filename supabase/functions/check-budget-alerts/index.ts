import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Starting budget alerts check...')

    // Get all active budgets
    const { data: budgets, error: budgetsError } = await supabaseClient
      .from('budgets')
      .select('id, user_id, category, amount, start_date, end_date, period')
      .eq('is_active', true)

    if (budgetsError) {
      console.error('Error fetching budgets:', budgetsError)
      throw budgetsError
    }

    if (!budgets || budgets.length === 0) {
      console.log('No active budgets found')
      return new Response(
        JSON.stringify({ message: 'No active budgets to check', alertsCreated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${budgets.length} active budgets`)

    let alertsCreated = 0
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    // Process each budget
    for (const budget of budgets) {
      try {
        // Calculate spending
        const startDate = new Date(budget.start_date)
        const endDate = budget.end_date ? new Date(budget.end_date) : new Date()

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.warn(`Invalid dates for budget ${budget.id}, skipping...`)
          continue
        }

        const { data: transactions } = await supabaseClient
          .from('transactions')
          .select('amount')
          .eq('user_id', budget.user_id)
          .eq('type', 'expense')
          .eq('category', budget.category)
          .gte('transaction_date', startDate.toISOString())
          .lte('transaction_date', endDate.toISOString())

        const spent = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0

        // Check if alert should be created
        let shouldCreateAlert = false
        let alertType = 'approaching'
        let thresholdPercentage = 0

        if (percentage >= 100) {
          alertType = 'exceeded'
          thresholdPercentage = 100
          shouldCreateAlert = true
        } else if (percentage >= 90) {
          alertType = 'approaching'
          thresholdPercentage = 90
          shouldCreateAlert = true
        } else if (percentage >= 70) {
          alertType = 'approaching'
          thresholdPercentage = 70
          shouldCreateAlert = true
        }

        if (!shouldCreateAlert) {
          continue
        }

        // Check if alert already exists for this budget today (max 1 per day)
        const { data: existingAlerts } = await supabaseClient
          .from('budget_alerts')
          .select('id')
          .eq('budget_id', budget.id)
          .gte('triggered_at', todayStart.toISOString())
          .limit(1)

        if (existingAlerts && existingAlerts.length > 0) {
          console.log(`Alert already exists for budget ${budget.id} today, skipping...`)
          continue
        }

        // Generate AI recommendation
        let aiRecommendation = ''
        if (alertType === 'exceeded') {
          aiRecommendation = `Has excedido tu presupuesto de ${budget.category} en $${(spent - budget.amount).toFixed(2)}. Te recomendamos reducir gastos en esta categoría o ajustar el presupuesto para el próximo período.`
        } else if (thresholdPercentage === 90) {
          aiRecommendation = `Estás cerca del límite de tu presupuesto de ${budget.category}. Te quedan solo $${(budget.amount - spent).toFixed(2)}. Considera reducir gastos no esenciales.`
        } else if (thresholdPercentage === 70) {
          aiRecommendation = `Has gastado el ${percentage.toFixed(0)}% de tu presupuesto de ${budget.category}. Mantén el control de tus gastos para no exceder el límite.`
        }

        // Create alert
        const { data: alertData, error: insertError } = await supabaseClient
          .from('budget_alerts')
          .insert({
            budget_id: budget.id,
            user_id: budget.user_id,
            alert_type: alertType,
            threshold_percentage: thresholdPercentage,
            current_spent: spent,
            budget_amount: budget.amount,
            is_predicted: false,
            ai_recommendation: aiRecommendation,
            notification_sent: false,
            notification_channels: ['push', 'email']
          })
          .select('id')
          .single()

        if (insertError) {
          console.error(`Error creating alert for budget ${budget.id}:`, insertError)
        } else {
          console.log(`Created ${alertType} alert for budget ${budget.id} (${percentage.toFixed(1)}%)`)
          alertsCreated++

          // Send notification asynchronously (fire and forget)
          try {
            const notificationUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-budget-alert-notification`
            const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

            if (notificationUrl && serviceKey) {
              fetch(notificationUrl, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${serviceKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  alert_id: alertData.id,
                  user_id: budget.user_id,
                  budget_id: budget.id,
                  alert_type: alertType,
                  threshold_percentage: thresholdPercentage,
                  current_spent: spent,
                  budget_amount: budget.amount,
                  ai_recommendation: aiRecommendation,
                }),
              }).catch(err => console.error('Error sending notification:', err))
            }
          } catch (notifError) {
            console.error('Error triggering notification:', notifError)
          }
        }
      } catch (error) {
        console.error(`Error processing budget ${budget.id}:`, error)
      }
    }

    console.log(`Budget alerts check completed. Created ${alertsCreated} new alerts.`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Budget alerts check completed successfully`,
        budgetsChecked: budgets.length,
        alertsCreated
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in check-budget-alerts function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
