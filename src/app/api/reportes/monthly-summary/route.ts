import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/monthly-summary
 * Trigger monthly summary calculations
 *
 * Body options:
 * - { "action": "calculate", "month": "2025-01" } - Calculate specific month
 * - { "action": "calculate" } - Calculate previous month
 * - { "action": "backfill", "start_month": "2024-01", "end_month": "2024-12" } - Backfill range
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
    const { action, month, start_month, end_month } = body;

    let result: any;

    if (action === 'calculate') {
      // Call PostgreSQL function directly to calculate for this user's month
      const targetMonth = month || null;

      console.log(`Calculating monthly summary for user ${user.id}, month: ${targetMonth || 'previous month'}`);

      const { data, error } = await supabase.rpc('calculate_monthly_summary', {
        p_user_id: user.id,
        p_month: targetMonth
      });

      if (error) {
        console.error('Calculate error:', error);
        return NextResponse.json(
          { error: 'Failed to calculate monthly summary', details: error.message },
          { status: 500 }
        );
      }

      // Check if the function returned no_transactions status
      if (data && data.status === 'no_transactions') {
        const monthName = data.month || targetMonth || 'el mes seleccionado';
        return NextResponse.json(
          {
            error: 'No se puede generar el reporte',
            details: `No hay transacciones registradas para ${monthName}`
          },
          { status: 400 }
        );
      }

      // Get the calculated month from result or default to previous month
      const calculatedMonth = targetMonth || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);

      result = {
        month: calculatedMonth,
        users_processed: 1,
        errors: 0,
        duration_ms: 0,
        status: 'success'
      };

    } else if (action === 'backfill') {
      if (!start_month) {
        return NextResponse.json(
          { error: 'start_month is required for backfill' },
          { status: 400 }
        );
      }

      console.log(`Backfilling from ${start_month} to ${end_month || 'previous month'}`);

      const { data, error } = await supabase.rpc('backfill_monthly_summaries', {
        p_start_month: start_month,
        p_end_month: end_month || null
      });

      if (error) {
        console.error('Backfill error:', error);
        return NextResponse.json(
          { error: 'Failed to backfill', details: error.message },
          { status: 500 }
        );
      }

      result = data;

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "calculate" or "backfill"' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      action,
      result
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/monthly-summary
 * Get monthly summary data for analysis
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12');
    const month = searchParams.get('month');

    let query = supabase
      .from('monthly_summary')
      .select('*')
      .order('month', { ascending: false });

    if (month) {
      query = query.eq('month', month);
    } else {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch monthly summaries' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      count: data.length
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
