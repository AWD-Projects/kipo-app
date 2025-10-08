import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/monthly-summary
 * Manually trigger monthly summary calculation for current user
 * Query params:
 *   - month: Optional 'YYYY-MM' format (defaults to previous month)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get optional month parameter
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    // Call the PostgreSQL function to calculate summary
    const { data, error } = await supabase.rpc('calculate_monthly_summary', {
      p_user_id: user.id,
      p_month: month || undefined
    });

    if (error) {
      console.error('Monthly summary calculation error:', error);
      return NextResponse.json(
        { error: 'Failed to calculate monthly summary' },
        { status: 500 }
      );
    }

    // Fetch the calculated summary
    const { data: summary, error: fetchError } = await supabase
      .from('monthly_summary')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', month || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7))
      .single();

    if (fetchError) {
      console.error('Fetch summary error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch monthly summary' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      summary
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/monthly-summary/backfill
 * Backfill monthly summaries for a date range (admin only)
 * Body: { start_month: 'YYYY-MM', end_month?: 'YYYY-MM' }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { start_month, end_month } = body;

    if (!start_month) {
      return NextResponse.json(
        { error: 'start_month is required (format: YYYY-MM)' },
        { status: 400 }
      );
    }

    // Validate month format
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(start_month) || (end_month && !monthRegex.test(end_month))) {
      return NextResponse.json(
        { error: 'Invalid month format. Use YYYY-MM' },
        { status: 400 }
      );
    }

    // Call the backfill function (only for current user for security)
    // For admin backfill of all users, this would need additional permission checks
    const { data, error } = await supabase.rpc('backfill_monthly_summaries', {
      p_start_month: start_month,
      p_end_month: end_month || undefined
    });

    if (error) {
      console.error('Backfill error:', error);
      return NextResponse.json(
        { error: 'Failed to backfill monthly summaries' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      results: data
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
