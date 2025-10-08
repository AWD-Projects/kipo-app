// =====================================================
// Create Notification Job for Card Payment Reminder
// =====================================================

import { createClient } from '@/lib/supabase/server';

interface CardData {
  id: string;
  user_id: string;
  name: string;
  card_type: 'credit' | 'debit';
  brand: string;
  payment_due_date?: string | null;
  statement_closing_date?: string | null;
  interest_free_payment_amount?: number | null;
  reminder_days_before?: number | null;
  reminder_time?: string | null;
  is_active?: boolean | null;
}

/**
 * Creates a notification job for a credit card payment reminder
 * @param cardData - The card data
 * @returns The created notification job or null if not applicable
 */
export async function createCardPaymentNotification(cardData: CardData) {
  // Only create notifications for active credit cards with payment dates
  if (
    cardData.card_type !== 'credit' ||
    !cardData.payment_due_date ||
    !cardData.is_active ||
    !cardData.interest_free_payment_amount ||
    cardData.interest_free_payment_amount <= 0
  ) {
    console.log('[NOTIFICATION] Skipping notification creation:', {
      type: cardData.card_type,
      hasPaymentDate: !!cardData.payment_due_date,
      isActive: cardData.is_active,
      hasAmount: !!cardData.interest_free_payment_amount,
    });
    return null;
  }

  const supabase = await createClient();

  // Parse due date in local timezone (not UTC)
  // Adding 'T00:00:00' ensures it's parsed as local time, not UTC
  const dueDate = new Date(cardData.payment_due_date + 'T00:00:00');
  const today = new Date();

  // Get dates at midnight local time
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dueDateMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  // Calculate days until due
  const daysUntilDue = Math.floor((dueDateMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));

  // Get reminder configuration (defaults: 1 day before at 09:00)
  const daysBefore = cardData.reminder_days_before || 1;
  const reminderTime = cardData.reminder_time || '09:00:00';

  // Calculate scheduled_for date (X days before due date)
  const scheduledDate = new Date(dueDateMidnight);
  scheduledDate.setDate(scheduledDate.getDate() - daysBefore);

  // Parse reminder time (HH:MM:SS or HH:MM)
  const [hours, minutes] = reminderTime.split(':').map(Number);
  scheduledDate.setHours(hours, minutes, 0, 0);

  // Format payment amount with commas
  const formattedAmount = cardData.interest_free_payment_amount
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // Create notification job payload
  const payload = {
    card_name: cardData.name,
    card_brand: cardData.brand.toUpperCase(),
    payment_amount: formattedAmount,
    payment_due_date: cardData.payment_due_date,
    statement_closing_date: cardData.statement_closing_date || null,
    days_until_due: daysUntilDue,
  };

  try {
    // Check if a notification already exists for this card and scheduled date
    const { data: existing } = await supabase
      .from('notification_jobs')
      .select('id')
      .eq('card_id', cardData.id)
      .eq('notification_type', 'card_payment_reminder')
      .eq('status', 'pending')
      .gte('scheduled_for', scheduledDate.toISOString().split('T')[0]) // Same day
      .lte('scheduled_for', new Date(scheduledDate.getTime() + 86400000).toISOString()) // Within 24 hours
      .single();

    if (existing) {
      console.log('[NOTIFICATION] Notification already exists for card:', cardData.name);
      return existing;
    }

    // Create the notification job
    const { data, error } = await supabase
      .from('notification_jobs')
      .insert({
        user_id: cardData.user_id,
        card_id: cardData.id,
        notification_type: 'card_payment_reminder',
        channels: ['push', 'email'],
        scheduled_for: scheduledDate.toISOString(),
        payload,
        status: 'pending',
        retry_count: 0,
        max_retries: 3,
      })
      .select()
      .single();

    if (error) {
      console.error('[NOTIFICATION] Failed to create notification job:', error);
      return null;
    }

    console.log('[NOTIFICATION] Created notification job:', {
      cardName: cardData.name,
      scheduledFor: scheduledDate.toISOString(),
      daysUntilDue,
    });

    return data;
  } catch (error) {
    console.error('[NOTIFICATION] Error creating notification:', error);
    return null;
  }
}

/**
 * Cancels/deletes pending notification jobs for a card
 * @param cardId - The card ID
 */
export async function cancelCardNotifications(cardId: string) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('notification_jobs')
      .delete()
      .eq('card_id', cardId)
      .eq('notification_type', 'card_payment_reminder')
      .eq('status', 'pending');

    if (error) {
      console.error('[NOTIFICATION] Failed to cancel notifications:', error);
      return false;
    }

    console.log('[NOTIFICATION] Cancelled pending notifications for card:', cardId);
    return true;
  } catch (error) {
    console.error('[NOTIFICATION] Error cancelling notifications:', error);
    return false;
  }
}
