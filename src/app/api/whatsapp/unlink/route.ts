// src/app/api/whatsapp/unlink/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Update user's WhatsApp link to revoked status
    const { error: updateError } = await supabase
      .from('whatsapp_links')
      .update({
        status: 'revoked',
        verification_code: null,
        code_expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error unlinking whatsapp:', updateError)
      return NextResponse.json(
        { ok: false, error: 'Error al desvincular WhatsApp' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      ok: true, 
      message: 'WhatsApp desvinculado exitosamente' 
    })

  } catch (error) {
    console.error('Error in whatsapp/unlink:', error)
    return NextResponse.json(
      { ok: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}