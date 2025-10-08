// =====================================================
// SendGrid Email Helper
// Description: Send email notifications via SendGrid
// =====================================================

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// =====================================================
// Environment Variables
// =====================================================

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')!;
const SENDGRID_FROM_EMAIL = Deno.env.get('SENDGRID_FROM_EMAIL')!;
const SENDGRID_FROM_NAME = Deno.env.get('SENDGRID_FROM_NAME')!;
const APP_URL = Deno.env.get('APP_URL')!;

// =====================================================
// Types
// =====================================================

interface NotificationPayload {
  card_name: string;
  card_brand: string;
  payment_amount: string;
  payment_due_date: string;
  statement_closing_date?: string;
  days_until_due: number;
}

interface EmailResult {
  success: boolean;
  email?: string;
  error?: string;
}

// =====================================================
// Format Date for Display (Spanish)
// =====================================================

function formatDateSpanish(dateString: string): string {
  const date = new Date(dateString);
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName}, ${day} de ${month} de ${year}`;
}

// =====================================================
// Get Days Until Due Message
// =====================================================

function getDaysMessage(daysUntil: number): string {
  if (daysUntil === 0) return '¡Vence hoy!';
  if (daysUntil === 1) return '¡Vence mañana!';
  if (daysUntil < 0) return `Venció hace ${Math.abs(daysUntil)} día(s)`;
  return `Vence en ${daysUntil} días`;
}

// =====================================================
// Generate HTML Email Template
// =====================================================

function generateEmailHTML(data: {
  card_name: string;
  card_brand: string;
  card_id: string;
  payment_amount: string;
  due_date_formatted: string;
  statement_closing_date_formatted: string | null;
  days_message: string;
  app_url: string;
  current_year: string;
}): string {
  const statementDateHTML = data.statement_closing_date_formatted
    ? `<p style="margin: 12px 0 0 0; color: #666666; font-size: 13px; font-family: 'Quicksand', sans-serif;">
         Fecha de corte: ${data.statement_closing_date_formatted}
       </p>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Recordatorio de Pago - Kipo</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet">
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #F5F5F5; font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">

  <!-- Wrapper Table -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F5F5F5;">
    <tr>
      <td style="padding: 40px 20px;">

        <!-- Main Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #000000; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 28px; font-weight: 700; font-family: 'Quicksand', sans-serif; letter-spacing: -0.5px;">
                💳 Recordatorio de Pago
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">

              <!-- Greeting -->
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6; font-family: 'Quicksand', sans-serif;">
                Hola,
              </p>

              <p style="margin: 0 0 24px 0; color: #333333; font-size: 16px; line-height: 1.6; font-family: 'Quicksand', sans-serif;">
                Este es un recordatorio amigable sobre el pago de tu tarjeta de crédito.
              </p>

              <!-- Card Info Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F9F9F9; border-radius: 8px; border-left: 4px solid #000000; margin: 24px 0;">
                <tr>
                  <td style="padding: 24px;">

                    <!-- Card Name -->
                    <h3 style="margin: 0 0 8px 0; color: #000000; font-size: 20px; font-weight: 700; font-family: 'Quicksand', sans-serif;">
                      ${data.card_name}
                    </h3>

                    <!-- Card Brand -->
                    <p style="margin: 0 0 16px 0; color: #666666; font-size: 14px; font-family: 'Quicksand', sans-serif; font-weight: 500;">
                      ${data.card_brand} • Crédito
                    </p>

                    <!-- Amount -->
                    <div style="margin: 16px 0;">
                      <div style="font-size: 36px; font-weight: 700; color: #000000; line-height: 1; font-family: 'Quicksand', sans-serif;">
                        $${data.payment_amount}
                      </div>
                      <p style="margin: 8px 0 0 0; color: #666666; font-size: 14px; font-family: 'Quicksand', sans-serif;">
                        Pago para no generar intereses
                      </p>
                    </div>

                    <!-- Due Date Badge -->
                    <div style="margin: 20px 0 0 0;">
                      <span style="display: inline-block; background-color: #F0F0F0; color: #333333; padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 14px; font-family: 'Quicksand', sans-serif;">
                        📅 Vence: ${data.due_date_formatted}
                      </span>
                    </div>

                    <!-- Days Until Due -->
                    <p style="margin: 16px 0 0 0; font-size: 18px; font-weight: 700; color: #000000; font-family: 'Quicksand', sans-serif;">
                      ⏰ ${data.days_message}
                    </p>

                    <!-- Statement Closing Date -->
                    ${statementDateHTML}

                  </td>
                </tr>
              </table>

              <!-- Why It's Important -->
              <p style="margin: 24px 0 12px 0; color: #000000; font-size: 16px; font-weight: 700; font-family: 'Quicksand', sans-serif;">
                ¿Por qué es importante pagar a tiempo?
              </p>

              <ul style="margin: 0 0 24px 0; padding-left: 24px; color: #666666; font-size: 15px; line-height: 1.8; font-family: 'Quicksand', sans-serif;">
                <li style="margin-bottom: 8px;">Evitas cargos por intereses</li>
                <li style="margin-bottom: 8px;">Mantienes tu historial crediticio saludable</li>
                <li style="margin-bottom: 8px;">Evitas penalizaciones</li>
              </ul>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; padding: 20px 0;">
                    <a href="${data.app_url}/dashboard/cards?card=${data.card_id}" style="display: inline-block; background-color: #000000; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 700; font-size: 16px; font-family: 'Quicksand', sans-serif; letter-spacing: -0.3px;">
                      Ver mi tarjeta →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; text-align: center; border-top: 1px solid #E5E5E5; background-color: #FAFAFA; border-radius: 0 0 8px 8px;">

              <p style="margin: 0 0 16px 0; color: #666666; font-size: 14px; line-height: 1.6; font-family: 'Quicksand', sans-serif;">
                Puedes configurar tus preferencias de notificaciones en
                <a href="${data.app_url}/dashboard/settings/notifications" style="color: #000000; text-decoration: none; font-weight: 600;">Configuración</a>
              </p>

              <!-- Logo or Brand Name -->
              <p style="margin: 16px 0 0 0; color: #000000; font-size: 20px; font-weight: 700; font-family: 'Quicksand', sans-serif; letter-spacing: -0.5px;">
                Kipo
              </p>

              <p style="margin: 8px 0 0 0; color: #999999; font-size: 12px; font-family: 'Quicksand', sans-serif;">
                © ${data.current_year} Kipo - Tu asistente financiero personal
              </p>

              <!-- Unsubscribe Link -->
              <p style="margin: 16px 0 0 0; color: #999999; font-size: 11px; font-family: 'Quicksand', sans-serif;">
                <a href="${data.app_url}/dashboard/settings/notifications?unsubscribe=true" style="color: #999999; text-decoration: underline;">
                  Desactivar recordatorios
                </a>
              </p>

            </td>
          </tr>

        </table>

        <!-- Secondary Footer (Outside Card) -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 20px auto 0;">
          <tr>
            <td style="text-align: center; padding: 0 20px;">
              <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.6; font-family: 'Quicksand', sans-serif;">
                Kipo es un producto de <a href="https://www.amoxtli.tech" style="color: #666666; text-decoration: none; font-weight: 600;">Amoxtli Web Developers</a>
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

// =====================================================
// Send Email via SendGrid
// =====================================================

export async function sendEmailNotification(
  supabase: SupabaseClient,
  userId: string,
  payload: NotificationPayload,
  cardId: string
): Promise<EmailResult> {
  try {
    // Get user's email from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !userData?.user?.email) {
      return {
        success: false,
        error: 'User email not found',
      };
    }

    const userEmail = userData.user.email;

    // Check if user has email notifications enabled
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('email_enabled')
      .eq('user_id', userId)
      .single();

    if (!prefs?.email_enabled) {
      return {
        success: false,
        error: 'Email notifications disabled for user',
      };
    }

    // ALWAYS recalculate days until due at send time (not when notification was created)
    // This ensures the message is accurate even if notification was scheduled days ago
    let daysUntilDue = 0;
    if (payload.payment_due_date) {
      // Parse due date and ensure it's in local timezone
      const dueDate = new Date(payload.payment_due_date + 'T00:00:00');
      const today = new Date();

      // Get dates at midnight local time
      const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const dueDateMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

      // Calculate difference in days
      daysUntilDue = Math.floor((dueDateMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));

      console.log(`[SENDGRID] Date calculation:`, {
        payment_due_date: payload.payment_due_date,
        dueDate: dueDateMidnight.toISOString(),
        today: todayMidnight.toISOString(),
        daysUntilDue
      });
    }

    // Prepare template data
    const templateData = {
      card_name: payload.card_name,
      card_brand: payload.card_brand,
      card_id: cardId,
      payment_amount: payload.payment_amount,
      due_date_formatted: formatDateSpanish(payload.payment_due_date),
      statement_closing_date_formatted: payload.statement_closing_date
        ? formatDateSpanish(payload.statement_closing_date)
        : null,
      days_message: getDaysMessage(daysUntilDue || 0),
      app_url: APP_URL,
      current_year: new Date().getFullYear().toString(),
    };

    // Generate HTML email
    const htmlContent = generateEmailHTML(templateData);

    console.log(`[SENDGRID] Sending email to ${userEmail}`);
    console.log(`[SENDGRID] Days until due: ${daysUntilDue}`);

    // Send via SendGrid API with inline HTML
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: userEmail }],
          },
        ],
        from: {
          email: SENDGRID_FROM_EMAIL,
          name: SENDGRID_FROM_NAME,
        },
        subject: `💳 Recordatorio: ${payload.card_name} - ${getDaysMessage(payload.days_until_due)}`,
        content: [
          {
            type: 'text/html',
            value: htmlContent,
          },
        ],
        // Optional: Track email activity
        tracking_settings: {
          click_tracking: {
            enable: true,
            enable_text: false,
          },
          open_tracking: {
            enable: true,
          },
        },
        // Optional: Categories for analytics
        categories: [
          'payment_reminder',
          `days_until_${payload.days_until_due}`,
        ],
      }),
    });

    if (response.ok || response.status === 202) {
      // SendGrid returns 202 Accepted for successful requests
      console.log(`[SENDGRID] ✅ Email sent successfully to ${userEmail}`);
      return {
        success: true,
        email: userEmail,
      };
    } else {
      const errorText = await response.text();
      console.error(`[SENDGRID] ❌ Failed to send email:`, errorText);
      return {
        success: false,
        error: `SendGrid API error: ${response.status} - ${errorText}`,
      };
    }

  } catch (error) {
    console.error('[SENDGRID] Exception:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
