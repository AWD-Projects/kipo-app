import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user's transaction history (last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('id, amount, category, type, transaction_date, description')
      .eq('user_id', user.id)
      .gte('transaction_date', threeMonthsAgo.toISOString())
      .order('transaction_date', { ascending: false });

    if (transactionsError) {
      return NextResponse.json(
        { error: 'Error al obtener transacciones', details: transactionsError },
        { status: 500 }
      );
    }

    // Calculate stats
    const totalTransactions = transactions?.length || 0;
    const oldestTransaction = transactions && transactions.length > 0
      ? transactions[transactions.length - 1].transaction_date
      : null;
    const newestTransaction = transactions && transactions.length > 0
      ? transactions[0].transaction_date
      : null;

    // Calculate days of history
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let daysOfHistory = 0;
    if (oldestTransaction && newestTransaction) {
      const oldest = new Date(oldestTransaction);
      const newest = new Date(newestTransaction);
      daysOfHistory = Math.floor((newest.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Check if passes validation
    const passesValidation = transactions &&
                            transactions.length >= 10 &&
                            oldestTransaction &&
                            new Date(oldestTransaction) <= sevenDaysAgo;

    // Category breakdown
    const categories = transactions?.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return NextResponse.json({
      user_id: user.id,
      total_transacciones: totalTransactions,
      transaccion_mas_antigua: oldestTransaction,
      transaccion_mas_reciente: newestTransaction,
      dias_de_historial: daysOfHistory,
      fecha_hace_7_dias: sevenDaysAgo.toISOString(),
      cumple_validacion: passesValidation,
      requisitos: {
        minimo_transacciones: 10,
        tiene_transacciones: totalTransactions,
        falta_transacciones: Math.max(0, 10 - totalTransactions),
        minimo_dias: 7,
        tiene_dias: daysOfHistory,
        necesita_transaccion_antes_de: sevenDaysAgo.toISOString().split('T')[0]
      },
      categorias: categories,
      gastos: transactions?.filter(t => t.type === 'expense').length || 0,
      ingresos: transactions?.filter(t => t.type === 'income').length || 0,
      ultimas_5_transacciones: transactions?.slice(0, 5).map(t => ({
        fecha: t.transaction_date,
        categoria: t.category,
        monto: t.amount,
        tipo: t.type
      })) || []
    });

  } catch (error: any) {
    console.error('Error in transaction stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas', message: error.message },
      { status: 500 }
    );
  }
}
