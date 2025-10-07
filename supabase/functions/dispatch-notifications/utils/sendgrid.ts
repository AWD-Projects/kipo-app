// =====================================================
// SendGrid Email Helper
// Description: Send email notifications via SendGrid
// =====================================================

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// =====================================================
// Environment Variables
// =====================================================

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')!;
const SENDGRID_TEMPLATE_ID = Deno.env.get('SENDGRID_TEMPLATE_ID')!;
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
      days_message: getDaysMessage(payload.days_until_due),
      app_url: APP_URL,
      current_year: new Date().getFullYear().toString(),
    };

    console.log(`[SENDGRID] Sending email to ${userEmail}`);
    console.log(`[SENDGRID] Template: ${SENDGRID_TEMPLATE_ID}`);

    // Send via SendGrid API
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
            dynamic_template_data: templateData,
          },
        ],
        from: {
          email: SENDGRID_FROM_EMAIL,
          name: SENDGRID_FROM_NAME,
        },
        template_id: SENDGRID_TEMPLATE_ID,
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
    return {
      success: false,
      error: error.message,
    };
  }
}
