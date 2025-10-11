import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * PATCH /api/budgets/alerts/[id]
 * Acknowledge or dismiss a budget alert
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: alertId } = await params;

    // Parse request body
    const body = await request.json();
    const { action } = body; // 'acknowledge' or 'dismiss'

    if (!action || !['acknowledge', 'dismiss'].includes(action)) {
      return NextResponse.json(
        { error: 'Acción inválida. Usa "acknowledge" o "dismiss"' },
        { status: 400 }
      );
    }

    // Verify alert belongs to user
    const { data: existingAlert, error: fetchError } = await supabase
      .from('budget_alerts')
      .select('*')
      .eq('id', alertId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingAlert) {
      return NextResponse.json(
        { error: 'Alerta no encontrada' },
        { status: 404 }
      );
    }

    // Update alert
    const updateData: any = {};

    if (action === 'acknowledge') {
      updateData.acknowledged_at = new Date().toISOString();
    } else if (action === 'dismiss') {
      updateData.dismissed_at = new Date().toISOString();
    }

    const { data: updatedAlert, error: updateError } = await supabase
      .from('budget_alerts')
      .update(updateData)
      .eq('id', alertId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating alert:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar la alerta' },
        { status: 500 }
      );
    }

    return NextResponse.json({ alert: updatedAlert }, { status: 200 });

  } catch (error: any) {
    console.error('Error in PATCH /api/budgets/alerts/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/budgets/alerts/[id]
 * Delete a budget alert
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: alertId } = await params;

    // Delete alert
    const { error: deleteError } = await supabase
      .from('budget_alerts')
      .delete()
      .eq('id', alertId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting alert:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar la alerta' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Alerta eliminada exitosamente' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error in DELETE /api/budgets/alerts/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', message: error.message },
      { status: 500 }
    );
  }
}
