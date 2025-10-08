// =====================================================
// Script to create notification_jobs for existing cards
// Run this once after deploying the new API code
// =====================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function createNotificationsForExistingCards() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  console.log('🔍 Fetching credit cards without notifications...');

  // Get all active credit cards with payment dates
  const { data: cards, error: cardsError } = await supabase
    .from('cards')
    .select('*')
    .eq('card_type', 'credit')
    .eq('is_active', true)
    .not('payment_due_date', 'is', null)
    .gt('interest_free_payment_amount', 0);

  if (cardsError) {
    console.error('❌ Error fetching cards:', cardsError);
    return;
  }

  console.log(`📋 Found ${cards?.length || 0} credit cards`);

  let created = 0;
  let skipped = 0;

  for (const card of cards || []) {
    // Check if notification already exists
    const { data: existing } = await supabase
      .from('notification_jobs')
      .select('id')
      .eq('card_id', card.id)
      .eq('notification_type', 'card_payment_reminder')
      .eq('status', 'pending')
      .single();

    if (existing) {
      console.log(`⏭️  Skipping ${card.name} - notification exists`);
      skipped++;
      continue;
    }

    // Calculate days until due (using local timezone)
    const dueDate = new Date(card.payment_due_date + 'T00:00:00');
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dueDateMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const daysUntilDue = Math.floor((dueDateMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));

    // Get reminder configuration
    const daysBefore = card.reminder_days_before || 1;
    const reminderTime = card.reminder_time || '09:00:00';

    // Calculate scheduled_for
    const scheduledDate = new Date(dueDateMidnight);
    scheduledDate.setDate(scheduledDate.getDate() - daysBefore);
    const [hours, minutes] = reminderTime.split(':').map(Number);
    scheduledDate.setHours(hours, minutes, 0, 0);

    // Format payment amount
    const formattedAmount = card.interest_free_payment_amount
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    // Create payload
    const payload = {
      card_name: card.name,
      card_brand: card.brand.toUpperCase(),
      payment_amount: formattedAmount,
      payment_due_date: card.payment_due_date,
      statement_closing_date: card.statement_closing_date || null,
      days_until_due: daysUntilDue,
    };

    // Insert notification job
    const { error: insertError } = await supabase
      .from('notification_jobs')
      .insert({
        user_id: card.user_id,
        card_id: card.id,
        notification_type: 'card_payment_reminder',
        channels: ['push', 'email'],
        scheduled_for: scheduledDate.toISOString(),
        payload,
        status: 'pending',
        retry_count: 0,
        max_retries: 3,
      });

    if (insertError) {
      console.error(`❌ Failed to create notification for ${card.name}:`, insertError);
      continue;
    }

    console.log(`✅ Created notification for ${card.name} (scheduled: ${scheduledDate.toLocaleString()})`);
    created++;
  }

  console.log('\n📊 Summary:');
  console.log(`   • Created: ${created}`);
  console.log(`   • Skipped: ${skipped}`);
  console.log(`   • Total cards: ${cards?.length || 0}`);
}

// Run the script
createNotificationsForExistingCards()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
