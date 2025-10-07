// =====================================================
// Edge Function: dispatch-notifications
// Description: Process and dispatch payment reminder notifications
// Channels: Firebase Cloud Messaging (Push) + SendGrid (Email)
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendPushNotification } from './utils/firebase.ts';
import { sendEmailNotification } from './utils/sendgrid.ts';
import {
  getPendingNotifications,
  getRetryNotifications,
  updateNotificationStatus,
  logNotificationResult,
  cleanupOldNotifications,
  cleanupInvalidSubscriptions
} from './utils/database.ts';

// =====================================================
// Types
// =====================================================

interface NotificationJob {
  id: string;
  user_id: string;
  card_id: string;
  notification_type: string;
  channels: string[];
  scheduled_for: string;
  payload: NotificationPayload;
  retry_count: number;
  max_retries: number;
  push_status: string;
  email_status: string;
}

interface NotificationPayload {
  card_name: string;
  card_brand: string;
  payment_amount: string;
  payment_due_date: string;
  statement_closing_date?: string;
  days_until_due: number;
}

interface DispatchRequest {
  mode: 'scheduled' | 'retry' | 'cleanup';
  batch_size?: number;
  debug?: boolean;
}

interface DispatchResult {
  success: boolean;
  mode: string;
  processed: number;
  sent: number;
  failed: number;
  deferred: number;
  errors: string[];
}

// =====================================================
// Environment Variables
// =====================================================

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CRON_SECRET = Deno.env.get('CRON_SECRET')!;

// =====================================================
// Main Handler
// =====================================================

serve(async (req: Request) => {
  // CORS headers for preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  try {
    // =====================================================
    // Authentication
    // =====================================================
    const authHeader = req.headers.get('Authorization');

    // Accept either CRON_SECRET or service role key
    const isValidCronSecret = authHeader && authHeader.includes(CRON_SECRET);
    const isValidServiceRole = authHeader && authHeader.includes(SUPABASE_SERVICE_ROLE_KEY);

    if (!isValidCronSecret && !isValidServiceRole) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid credentials' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // =====================================================
    // Parse Request
    // =====================================================
    const body: DispatchRequest = await req.json();
    const { mode = 'scheduled', batch_size = 50, debug = false } = body;

    console.log(`[${mode.toUpperCase()}] Starting notification dispatch...`);
    console.log(`Batch size: ${batch_size}`);

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // =====================================================
    // Mode: Cleanup
    // =====================================================
    if (mode === 'cleanup') {
      console.log('[CLEANUP] Running cleanup tasks...');

      const oldNotifications = await cleanupOldNotifications(supabase);
      const invalidSubs = await cleanupInvalidSubscriptions(supabase);

      console.log(`[CLEANUP] Removed ${oldNotifications} old notifications`);
      console.log(`[CLEANUP] Removed ${invalidSubs} invalid push subscriptions`);

      return new Response(
        JSON.stringify({
          success: true,
          mode: 'cleanup',
          old_notifications_removed: oldNotifications,
          invalid_subscriptions_removed: invalidSubs,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // =====================================================
    // Fetch Notifications
    // =====================================================
    let notifications: NotificationJob[] = [];

    if (mode === 'scheduled') {
      notifications = await getPendingNotifications(supabase, batch_size);
      console.log(`[SCHEDULED] Found ${notifications.length} pending notifications`);
    } else if (mode === 'retry') {
      notifications = await getRetryNotifications(supabase, batch_size);
      console.log(`[RETRY] Found ${notifications.length} failed notifications to retry`);
    }

    if (notifications.length === 0) {
      console.log(`[${mode.toUpperCase()}] No notifications to process`);
      return new Response(
        JSON.stringify({
          success: true,
          mode,
          processed: 0,
          sent: 0,
          failed: 0,
          deferred: 0,
          message: 'No notifications to process',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // =====================================================
    // Process Notifications
    // =====================================================
    const result: DispatchResult = {
      success: true,
      mode,
      processed: 0,
      sent: 0,
      failed: 0,
      deferred: 0,
      errors: [],
    };

    for (const notification of notifications) {
      result.processed++;

      console.log(`\n[${notification.id}] Processing notification for user ${notification.user_id}`);
      console.log(`  Type: ${notification.notification_type}`);
      console.log(`  Channels: ${notification.channels.join(', ')}`);

      let pushSuccess = false;
      let emailSuccess = false;
      let pushError = '';
      let emailError = '';

      // =====================================================
      // Send Push Notification
      // =====================================================
      if (notification.channels.includes('push')) {
        try {
          console.log(`  [PUSH] Sending push notification...`);
          const pushResult = await sendPushNotification(
            supabase,
            notification.user_id,
            notification.payload
          );

          if (pushResult.success) {
            pushSuccess = true;
            console.log(`  [PUSH] ✅ Sent to ${pushResult.sent} device(s)`);
          } else {
            pushError = pushResult.error || 'Unknown push error';
            console.log(`  [PUSH] ❌ Failed: ${pushError}`);
          }
        } catch (error) {
          pushError = error.message;
          console.error(`  [PUSH] ❌ Exception: ${pushError}`);
        }
      }

      // =====================================================
      // Send Email Notification
      // =====================================================
      if (notification.channels.includes('email')) {
        try {
          console.log(`  [EMAIL] Sending email notification...`);
          const emailResult = await sendEmailNotification(
            supabase,
            notification.user_id,
            notification.payload,
            notification.card_id
          );

          if (emailResult.success) {
            emailSuccess = true;
            console.log(`  [EMAIL] ✅ Sent to ${emailResult.email}`);
          } else {
            emailError = emailResult.error || 'Unknown email error';
            console.log(`  [EMAIL] ❌ Failed: ${emailError}`);
          }
        } catch (error) {
          emailError = error.message;
          console.error(`  [EMAIL] ❌ Exception: ${emailError}`);
        }
      }

      // =====================================================
      // Determine Overall Status
      // =====================================================
      const channelResults = [];
      if (notification.channels.includes('push')) {
        channelResults.push(pushSuccess);
      }
      if (notification.channels.includes('email')) {
        channelResults.push(emailSuccess);
      }

      // At least one channel succeeded
      const overallSuccess = channelResults.some(r => r === true);

      // Update status
      const newStatus = overallSuccess ? 'sent' :
                       notification.retry_count >= notification.max_retries - 1 ? 'failed' :
                       'pending';

      // Update notification in database
      await updateNotificationStatus(
        supabase,
        notification.id,
        newStatus,
        pushSuccess ? 'sent' : 'failed',
        emailSuccess ? 'sent' : 'failed',
        notification.retry_count + 1
      );

      // Log the result
      await logNotificationResult(
        supabase,
        notification.id,
        notification.user_id,
        notification.notification_type,
        overallSuccess ? 'success' : 'failure',
        { pushSuccess, emailSuccess, pushError, emailError }
      );

      // Update counters
      if (overallSuccess) {
        result.sent++;
      } else if (newStatus === 'failed') {
        result.failed++;
        result.errors.push(`Notification ${notification.id}: ${pushError || emailError}`);
      } else {
        result.deferred++;
      }
    }

    // =====================================================
    // Return Results
    // =====================================================
    console.log(`\n[${mode.toUpperCase()}] Dispatch complete!`);
    console.log(`  Processed: ${result.processed}`);
    console.log(`  Sent: ${result.sent}`);
    console.log(`  Failed: ${result.failed}`);
    console.log(`  Deferred: ${result.deferred}`);

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[ERROR] Dispatch failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
