import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AlertPayload {
  alert_id: string
  user_id: string
  budget_id: string
  alert_type: string
  threshold_percentage: number
  current_spent: number
  budget_amount: number
  ai_recommendation: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    const payload: AlertPayload = await req.json()
    console.log('Sending notification for alert:', payload.alert_id)

    // Get user information
    const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(payload.user_id)

    if (userError || !userData) {
      console.error('Error fetching user:', userError)
      throw new Error('User not found')
    }

    const userEmail = userData.user.email
    const userName = userData.user.user_metadata?.full_name || userEmail?.split('@')[0] || 'Usuario'

    // Get user profile for push notification settings
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('push_subscription')
      .eq('id', payload.user_id)
      .single()

    const notifications: Array<Promise<any>> = []

    // 1. Send Email Notification (if configured)
    if (userEmail && Deno.env.get('RESEND_API_KEY')) {
      const emailPromise = sendEmailNotification({
        to: userEmail,
        userName,
        alertType: payload.alert_type,
        thresholdPercentage: payload.threshold_percentage,
        currentSpent: payload.current_spent,
        budgetAmount: payload.budget_amount,
        aiRecommendation: payload.ai_recommendation,
      })
      notifications.push(emailPromise)
    }

    // 2. Send Push Notification (if user has subscription)
    if (profile?.push_subscription) {
      const pushPromise = sendPushNotification({
        subscription: profile.push_subscription,
        alertType: payload.alert_type,
        thresholdPercentage: payload.threshold_percentage,
        currentSpent: payload.current_spent,
        budgetAmount: payload.budget_amount,
      })
      notifications.push(pushPromise)
    }

    // Wait for all notifications to be sent
    const results = await Promise.allSettled(notifications)

    const successCount = results.filter(r => r.status === 'fulfilled').length
    const failureCount = results.filter(r => r.status === 'rejected').length

    console.log(`Notifications sent: ${successCount} successful, ${failureCount} failed`)

    // Update alert as notification sent
    await supabaseClient
      .from('budget_alerts')
      .update({
        notification_sent: true,
        notification_channels: notifications.length > 0 ? ['email', 'push'].slice(0, notifications.length) : []
      })
      .eq('id', payload.alert_id)

    return new Response(
      JSON.stringify({
        success: true,
        notificationsSent: successCount,
        notificationsFailed: failureCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in send-budget-alert-notification:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function sendEmailNotification(params: {
  to: string
  userName: string
  alertType: string
  thresholdPercentage: number
  currentSpent: number
  budgetAmount: number
  aiRecommendation: string
}) {
  const apiKey = Deno.env.get('SENDGRID_API_KEY')
  if (!apiKey) {
    console.warn('SENDGRID_API_KEY not configured, skipping email')
    return
  }

  const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL') || 'noreply@kipoinc.com'

  const subject = params.alertType === 'exceeded'
    ? '🚨 Has excedido tu presupuesto'
    : `⚠️ Alerta de Presupuesto (${params.thresholdPercentage}%)`

  const emoji = params.alertType === 'exceeded' ? '🚨' : params.thresholdPercentage >= 90 ? '⚠️' : '💡'

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px 20px; border-radius: 0 0 10px 10px; }
    .alert-box { background: white; border-left: 4px solid ${params.alertType === 'exceeded' ? '#ef4444' : '#f59e0b'}; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .progress-bar { width: 100%; height: 30px; background: #e5e7eb; border-radius: 15px; overflow: hidden; margin: 10px 0; }
    .progress-fill { height: 100%; background: ${params.alertType === 'exceeded' ? '#ef4444' : params.thresholdPercentage >= 90 ? '#f59e0b' : '#fbbf24'}; transition: width 0.3s; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${emoji} Alerta de Presupuesto</h1>
      <p>Hola ${params.userName},</p>
    </div>
    <div class="content">
      <div class="alert-box">
        <h2>Estado de tu Presupuesto</h2>
        <p><strong>Gastado:</strong> $${params.currentSpent.toFixed(2)} de $${params.budgetAmount.toFixed(2)}</p>
        <p><strong>Porcentaje:</strong> ${params.thresholdPercentage.toFixed(0)}%</p>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${Math.min(params.thresholdPercentage, 100)}%"></div>
        </div>
      </div>

      <p><strong>Recomendación:</strong></p>
      <p>${params.aiRecommendation}</p>

      <a href="${Deno.env.get('APP_URL') || 'https://kipo.kipoinc.com'}/dashboard/sobres" class="button">
        Ver Sobres
      </a>

      <div class="footer">
        <p>Este es un correo automático de Kipo Finance Tracker</p>
        <p>Puedes desactivar estas notificaciones en tu configuración</p>
      </div>
    </div>
  </div>
</body>
</html>
  `

  // SendGrid API v3 format
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: params.to }],
          subject: subject,
        }
      ],
      from: {
        email: fromEmail,
        name: 'Kipo Finance'
      },
      content: [
        {
          type: 'text/html',
          value: html
        }
      ]
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('SendGrid email send failed:', error)
    throw new Error(`Failed to send email via SendGrid: ${error}`)
  }

  console.log(`Email sent successfully via SendGrid to ${params.to}`)
  return { success: true }
}

async function sendPushNotification(params: {
  subscription: any
  alertType: string
  thresholdPercentage: number
  currentSpent: number
  budgetAmount: number
}) {
  // This requires web-push library and VAPID keys
  // For now, we'll log that push notifications are configured
  console.log('Push notification would be sent to subscription:', params.subscription)

  // TODO: Implement actual push notification using web-push
  // You would need to:
  // 1. Generate VAPID keys
  // 2. Install web-push npm package in Deno
  // 3. Send push notification using the subscription

  return { success: true, message: 'Push notification placeholder' }
}
