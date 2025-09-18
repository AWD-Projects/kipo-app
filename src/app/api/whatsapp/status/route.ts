// src/app/api/whatsapp/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { WhatsAppStatusResponse } from '@/types'

export async function GET(request: NextRequest) {
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

    // Get user's WhatsApp link
    const { data: linkData, error: linkError } = await supabase
      .from('whatsapp_links')
      .select('status, phone_e164, last_seen_at, wa_profile_name, linked_at')
      .eq('user_id', user.id)
      .single()

    if (linkError && linkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching whatsapp link:', linkError)
      return NextResponse.json(
        { ok: false, error: 'Error al obtener el estado del vínculo' },
        { status: 500 }
      )
    }

    const response: WhatsAppStatusResponse = {
      status: linkData?.status || 'pending',
      phone_e164: linkData?.phone_e164 || null,
      last_seen_at: linkData?.last_seen_at || null,
      wa_profile_name: linkData?.wa_profile_name || null,
      linked_at: linkData?.linked_at || null
    }

    return NextResponse.json({ ok: true, data: response })

  } catch (error) {
    console.error('Error in whatsapp/status:', error)
    return NextResponse.json(
      { ok: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}