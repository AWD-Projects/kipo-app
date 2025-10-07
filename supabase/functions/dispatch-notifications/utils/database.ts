// =====================================================
// Database Utilities
// Description: Query and update notification data
// =====================================================

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// =====================================================
// Get Pending Notifications (Scheduled Mode)
// =====================================================

export async function getPendingNotifications(
  supabase: SupabaseClient,
  batchSize: number
) {
  const { data, error } = await supabase
    .from('notification_jobs')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(batchSize);

  if (error) {
    console.error('[DATABASE] Error fetching pending notifications:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  return data || [];
}

// =====================================================
// Get Failed Notifications for Retry
// =====================================================

export async function getRetryNotifications(
  supabase: SupabaseClient,
  batchSize: number
) {
  const { data, error } = await supabase
    .from('notification_jobs')
    .select('*')
    .eq('status', 'failed')
    .lt('retry_count', supabase.rpc('get_max_retries')) // Custom RPC or use direct comparison
    .order('updated_at', { ascending: true })
    .limit(batchSize);

  if (error) {
    console.error('[DATABASE] Error fetching retry notifications:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  // Filter by retry_count < max_retries manually since we don't have RPC
  const filtered = (data || []).filter(job => job.retry_count < job.max_retries);
  return filtered;
}

// =====================================================
// Update Notification Status
// =====================================================

export async function updateNotificationStatus(
  supabase: SupabaseClient,
  notificationId: string,
  status: string,
  pushStatus: string,
  emailStatus: string,
  retryCount: number
) {
  const { error } = await supabase
    .from('notification_jobs')
    .update({
      status,
      push_status: pushStatus,
      email_status: emailStatus,
      retry_count: retryCount,
      updated_at: new Date().toISOString(),
      ...(status === 'sent' && { sent_at: new Date().toISOString() }),
    })
    .eq('id', notificationId);

  if (error) {
    console.error(`[DATABASE] Error updating notification ${notificationId}:`, error);
    throw new Error(`Database error: ${error.message}`);
  }

  return true;
}

// =====================================================
// Log Notification Result
// =====================================================

export async function logNotificationResult(
  supabase: SupabaseClient,
  notificationJobId: string,
  userId: string,
  notificationType: string,
  status: 'success' | 'failure',
  metadata: Record<string, any>
) {
  const { error } = await supabase
    .from('notification_logs')
    .insert({
      notification_job_id: notificationJobId,
      user_id: userId,
      notification_type: notificationType,
      status,
      metadata,
      created_at: new Date().toISOString(),
    });

  if (error) {
    console.error('[DATABASE] Error logging notification result:', error);
    // Don't throw - logging failure shouldn't stop the process
  }

  return true;
}

// =====================================================
// Cleanup Old Notifications (30+ days old and sent/failed)
// =====================================================

export async function cleanupOldNotifications(
  supabase: SupabaseClient
): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from('notification_jobs')
    .delete()
    .in('status', ['sent', 'failed'])
    .lt('created_at', thirtyDaysAgo.toISOString())
    .select('id');

  if (error) {
    console.error('[DATABASE] Error cleaning up old notifications:', error);
    return 0;
  }

  return data?.length || 0;
}

// =====================================================
// Cleanup Invalid Push Subscriptions
// =====================================================

export async function cleanupInvalidSubscriptions(
  supabase: SupabaseClient
): Promise<number> {
  // Remove subscriptions older than 90 days that haven't been used
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { data, error } = await supabase
    .from('push_subscriptions')
    .delete()
    .lt('created_at', ninetyDaysAgo.toISOString())
    .is('last_used_at', null)
    .select('id');

  if (error) {
    console.error('[DATABASE] Error cleaning up invalid subscriptions:', error);
    return 0;
  }

  return data?.length || 0;
}

// =====================================================
// Get User Notification Preferences
// =====================================================

export async function getUserPreferences(
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error(`[DATABASE] Error fetching preferences for user ${userId}:`, error);
    return null;
  }

  return data;
}

// =====================================================
// Check if Currently in Quiet Hours
// =====================================================

export async function isInQuietHours(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const prefs = await getUserPreferences(supabase, userId);

  if (!prefs) {
    return false; // No preferences = no quiet hours
  }

  const now = new Date();
  const userTimezone = prefs.timezone || 'America/Mexico_City';

  // Convert current time to user's timezone
  const userTime = new Date(
    now.toLocaleString('en-US', { timeZone: userTimezone })
  );

  const currentHour = userTime.getHours();
  const currentMinute = userTime.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;

  // Parse quiet hours (format: "HH:MM:SS")
  const parseTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const quietStart = parseTime(prefs.quiet_hours_start);
  const quietEnd = parseTime(prefs.quiet_hours_end);

  // Check if quiet hours span midnight
  if (quietStart > quietEnd) {
    // e.g., 22:00 to 08:00 (spans midnight)
    return currentTimeMinutes >= quietStart || currentTimeMinutes < quietEnd;
  } else {
    // e.g., 01:00 to 06:00 (same day)
    return currentTimeMinutes >= quietStart && currentTimeMinutes < quietEnd;
  }
}
