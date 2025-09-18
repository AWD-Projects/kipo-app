// src/app/api/whatsapp/link/init/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizePhoneE164 } from '@/lib/phone'
import { z } from 'zod'
import type { WhatsAppLinkInitRequest, WhatsAppLinkInitResponse } from '@/types'

const initRequestSchema = z.object({
  phone_e164: z.string().min(10, 'Número de teléfono requerido')
})

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

    // Parse and validate request body
    const body: WhatsAppLinkInitRequest = await request.json()
    const validatedData = initRequestSchema.parse(body)
    
    // Normalize phone number
    const normalizedPhone = normalizePhoneE164(validatedData.phone_e164)
    if (!normalizedPhone) {
      return NextResponse.json(
        { ok: false, error: 'Formato de teléfono inválido. Ejemplo: +5215550000000' },
        { status: 400 }
      )
    }

    // Check if phone is already verified for another user
    const { data: existingVerified } = await supabase
      .from('whatsapp_links')
      .select('user_id')
      .eq('phone_e164', normalizedPhone)
      .eq('status', 'verified')
      .neq('user_id', user.id)
      .single()

    if (existingVerified) {
      return NextResponse.json(
        { ok: false, error: 'Este número ya está vinculado a otra cuenta' },
        { status: 409 }
      )
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Check if user already has a link
    const { data: existingLink } = await supabase
      .from('whatsapp_links')
      .select('*')
      .eq('user_id', user.id)
      .single()

    let linkData
    let linkError

    if (existingLink) {
      // Update existing link
      const { data, error } = await supabase
        .from('whatsapp_links')
        .update({
          phone_e164: normalizedPhone,
          provider: 'twilio' as const,
          status: 'pending' as const,
          verification_code: verificationCode,
          code_expires_at: codeExpiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single()
      
      linkData = data
      linkError = error
    } else {
      // Insert new link
      const { data, error } = await supabase
        .from('whatsapp_links')
        .insert({
          user_id: user.id,
          phone_e164: normalizedPhone,
          provider: 'twilio' as const,
          status: 'pending' as const,
          verification_code: verificationCode,
          code_expires_at: codeExpiresAt.toISOString()
        })
        .select()
        .single()
      
      linkData = data
      linkError = error
    }

    if (linkError) {
      console.error('Error creating whatsapp link:', linkError)
      
      // Check if table doesn't exist
      if (linkError.code === '42P01') {
        return NextResponse.json(
          { ok: false, error: 'La tabla whatsapp_links no existe. Contacta al administrador.' },
          { status: 500 }
        )
      }
      
      // Check for permission errors
      if (linkError.code === '42501') {
        return NextResponse.json(
          { ok: false, error: 'Permisos insuficientes para crear el vínculo.' },
          { status: 403 }
        )
      }
      
      return NextResponse.json(
        { ok: false, error: `Error al crear el vínculo: ${linkError.message}` },
        { status: 500 }
      )
    }

    const response: WhatsAppLinkInitResponse = {
      status: 'pending',
      phone_e164: normalizedPhone,
      verification_code: verificationCode,
      code_expires_at: codeExpiresAt.toISOString()
    }

    return NextResponse.json({ ok: true, data: response })

  } catch (error) {
    console.error('Error in whatsapp/link/init:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: error.issues[0]?.message || 'Datos inválidos' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { ok: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}