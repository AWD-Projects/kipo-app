// =====================================================
// Edge Function: calculate-monthly-summaries
// Description: Calculate monthly financial summaries for users
// Triggers: Scheduled (pg_cron) or Manual (API call)
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// =====================================================
// Types
// =====================================================

interface CalculationRequest {
  mode: 'auto' | 'manual' | 'backfill';
  month?: string; // Format: 'YYYY-MM'
  start_month?: string; // For backfill
  end_month?: string; // For backfill
  user_id?: string; // For single user calculation
}

interface CalculationResponse {
  success: boolean;
  mode: string;
  timestamp: string;
  result?: any;
  error?: string;
  duration_ms?: number;
}

// =====================================================
// Main Handler
// =====================================================

serve(async (req: Request): Promise<Response> => {
  const startTime = Date.now();

  try {
    // Parse request
    let requestData: CalculationRequest;

    if (req.method === 'GET') {
      // Support GET requests for simple triggers
      const url = new URL(req.url);
      const mode = url.searchParams.get('mode') || 'auto';
      const month = url.searchParams.get('month') || undefined;

      requestData = { mode: mode as any, month };
    } else {
      // POST request with JSON body
      requestData = await req.json();
    }

    const { mode = 'auto', month, start_month, end_month, user_id } = requestData;

    console.log(`🚀 Monthly Summary Calculation Started`);
    console.log(`Mode: ${mode}`);
    console.log(`Month: ${month || 'previous month'}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let result: any;

    // Execute based on mode
    switch (mode) {
      case 'auto':
      case 'manual':
        // Calculate for all users for a specific month
        console.log(`📊 Calculating summaries for all users...`);

        const { data: allUsersData, error: allUsersError } = await supabase
          .rpc('calculate_all_monthly_summaries', {
            p_month: month || null
          });

        if (allUsersError) {
          throw new Error(`Database error: ${allUsersError.message}`);
        }

        result = allUsersData;
        console.log(`✅ Calculation complete`);
        console.log(`Users processed: ${result.users_processed}`);
        console.log(`Errors: ${result.errors}`);
        console.log(`Duration: ${result.duration_ms}ms`);
        break;

      case 'backfill':
        // Backfill multiple months
        if (!start_month) {
          throw new Error('start_month is required for backfill mode');
        }

        console.log(`📊 Backfilling from ${start_month} to ${end_month || 'previous month'}...`);

        const { data: backfillData, error: backfillError } = await supabase
          .rpc('backfill_monthly_summaries', {
            p_start_month: start_month,
            p_end_month: end_month || null
          });

        if (backfillError) {
          throw new Error(`Database error: ${backfillError.message}`);
        }

        result = backfillData;
        console.log(`✅ Backfill complete`);
        console.log(`Total users: ${result.total_users_processed}`);
        console.log(`Total errors: ${result.total_errors}`);
        console.log(`Duration: ${result.total_duration_ms}ms`);
        break;

      default:
        throw new Error(`Invalid mode: ${mode}. Use 'auto', 'manual', or 'backfill'`);
    }

    const duration = Date.now() - startTime;

    const response: CalculationResponse = {
      success: true,
      mode,
      timestamp: new Date().toISOString(),
      result,
      duration_ms: duration
    };

    console.log(`✅ Edge Function completed in ${duration}ms`);

    return new Response(
      JSON.stringify(response, null, 2),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );

  } catch (error) {
    const duration = Date.now() - startTime;

    console.error('❌ Error:', error);

    const errorResponse: CalculationResponse = {
      success: false,
      mode: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      duration_ms: duration
    };

    return new Response(
      JSON.stringify(errorResponse, null, 2),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
});

// =====================================================
// Edge Function Info
// =====================================================

/*
Usage Examples:

1. Automatic monthly calculation (pg_cron):
   POST https://YOUR-PROJECT.supabase.co/functions/v1/calculate-monthly-summaries
   Headers: Authorization: Bearer SERVICE_ROLE_KEY
   Body: { "mode": "auto" }

2. Manual calculation for specific month:
   POST https://YOUR-PROJECT.supabase.co/functions/v1/calculate-monthly-summaries
   Headers: Authorization: Bearer SERVICE_ROLE_KEY
   Body: { "mode": "manual", "month": "2025-01" }

3. Backfill historical data:
   POST https://YOUR-PROJECT.supabase.co/functions/v1/calculate-monthly-summaries
   Headers: Authorization: Bearer SERVICE_ROLE_KEY
   Body: { "mode": "backfill", "start_month": "2024-01", "end_month": "2024-12" }

4. Quick trigger via GET:
   GET https://YOUR-PROJECT.supabase.co/functions/v1/calculate-monthly-summaries?mode=auto
   Headers: Authorization: Bearer SERVICE_ROLE_KEY
*/
