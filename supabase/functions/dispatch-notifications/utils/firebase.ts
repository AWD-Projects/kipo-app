// =====================================================
// Firebase Cloud Messaging (FCM) Helper
// Description: Send push notifications via Firebase
// =====================================================

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// =====================================================
// Environment Variables
// =====================================================

const FIREBASE_API_KEY = Deno.env.get('FIREBASE_API_KEY')!;
const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID')!;
const FIREBASE_MESSAGING_SENDER_ID = Deno.env.get('FIREBASE_MESSAGING_SENDER_ID')!;

// =====================================================
// Types
// =====================================================

interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  user_agent?: string;
  created_at: string;
  last_used_at?: string;
}

interface NotificationPayload {
  card_name: string;
  card_brand: string;
  payment_amount: string;
  payment_due_date: string;
  days_until_due: number;
}

interface PushResult {
  success: boolean;
  sent: number;
  failed: number;
  error?: string;
}

// =====================================================
// Get User's Active Push Subscriptions
// =====================================================

async function getUserPushSubscriptions(
  supabase: SupabaseClient,
  userId: string
): Promise<PushSubscription[]> {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[FIREBASE] Error fetching push subscriptions:', error);
    return [];
  }

  return data || [];
}

// =====================================================
// Extract FCM Token from Endpoint
// =====================================================

function extractFCMToken(endpoint: string): string | null {
  // Firebase endpoints look like:
  // https://fcm.googleapis.com/fcm/send/{token}
  const match = endpoint.match(/fcm\/send\/([^\/]+)$/);
  return match ? match[1] : null;
}

// =====================================================
// Send Push Notification via Firebase FCM
// =====================================================

export async function sendPushNotification(
  supabase: SupabaseClient,
  userId: string,
  payload: NotificationPayload
): Promise<PushResult> {
  const result: PushResult = {
    success: false,
    sent: 0,
    failed: 0,
  };

  try {
    // Get user's push subscriptions
    const subscriptions = await getUserPushSubscriptions(supabase, userId);

    if (subscriptions.length === 0) {
      result.error = 'No push subscriptions found for user';
      return result;
    }

    console.log(`[FIREBASE] Found ${subscriptions.length} subscription(s) for user ${userId}`);

    // Check if user has push notifications enabled
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('push_enabled')
      .eq('user_id', userId)
      .single();

    if (!prefs?.push_enabled) {
      result.error = 'Push notifications disabled for user';
      return result;
    }

    // Prepare notification content
    const daysMessage = payload.days_until_due === 0
      ? '¡Vence hoy!'
      : payload.days_until_due === 1
      ? '¡Vence mañana!'
      : `Vence en ${payload.days_until_due} días`;

    const notificationData = {
      notification: {
        title: '💳 Recordatorio de Pago',
        body: `${payload.card_name} - ${daysMessage} - $${payload.payment_amount}`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: `payment-reminder-${payload.card_name}`,
        requireInteraction: payload.days_until_due <= 1, // Show prominent if due soon
      },
      data: {
        card_name: payload.card_name,
        card_brand: payload.card_brand,
        payment_amount: payload.payment_amount,
        payment_due_date: payload.payment_due_date,
        days_until_due: payload.days_until_due.toString(),
        url: `https://kipo-app-sepia.vercel.app/dashboard/cards`,
        timestamp: new Date().toISOString(),
      },
    };

    // Send to each subscription
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        const fcmToken = extractFCMToken(sub.endpoint);

        if (!fcmToken) {
          console.error(`[FIREBASE] Invalid endpoint format: ${sub.endpoint}`);
          result.failed++;
          return;
        }

        // Send via Firebase Cloud Messaging HTTP v1 API
        const response = await fetch(
          `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${FIREBASE_API_KEY}`,
            },
            body: JSON.stringify({
              message: {
                token: fcmToken,
                notification: notificationData.notification,
                data: notificationData.data,
                webpush: {
                  headers: {
                    Urgency: payload.days_until_due <= 1 ? 'high' : 'normal',
                  },
                  fcm_options: {
                    link: notificationData.data.url,
                  },
                },
              },
            }),
          }
        );

        if (response.ok) {
          result.sent++;
          console.log(`[FIREBASE] ✅ Sent to subscription ${sub.id}`);

          // Update last_used_at
          await supabase
            .from('push_subscriptions')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', sub.id);

        } else {
          result.failed++;
          const errorData = await response.json();
          console.error(`[FIREBASE] ❌ Failed to send to subscription ${sub.id}:`, errorData);

          // If subscription is invalid (410 Gone or 404), remove it
          if (response.status === 404 || response.status === 410) {
            console.log(`[FIREBASE] Removing invalid subscription ${sub.id}`);
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', sub.id);
          }
        }
      } catch (error) {
        result.failed++;
        console.error(`[FIREBASE] Exception sending to subscription ${sub.id}:`, error);
      }
    });

    await Promise.all(sendPromises);

    // Overall success if at least one sent
    result.success = result.sent > 0;

    if (!result.success) {
      result.error = `Failed to send to all ${result.failed} subscription(s)`;
    }

    return result;

  } catch (error) {
    console.error('[FIREBASE] Unexpected error:', error);
    result.error = error.message;
    return result;
  }
}
