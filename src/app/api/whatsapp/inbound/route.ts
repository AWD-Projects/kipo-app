// src/app/api/whatsapp/inbound/route.ts
export const runtime = "nodejs"; // evita Edge; necesitamos req.text()
export const dynamic = "force-dynamic"; // Asegura que se ejecute en tiempo de solicitud

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// --- ADMIN client (service role) ----
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // server-only
  { auth: { persistSession: false } }
);

// Custom Twilio signature validation (to avoid import issues)
function validateTwilioSignature(authToken: string, signature: string, url: string, params: Record<string, string>): boolean {
  try {
    // Create the expected signature
    const sortedParams = Object.keys(params).sort().map(key => `${key}${params[key]}`).join('');
    const data = url + sortedParams;
    const expectedSignature = crypto.createHmac('sha1', authToken).update(data, 'utf-8').digest('base64');
    return signature === expectedSignature;
  } catch (error) {
    console.error('Signature validation error:', error);
    return false;
  }
}

// Normaliza "whatsapp:+52..." -> "+52..."
function toE164Strict(s: string) {
  const x = (s || "").trim().replace(/^whatsapp:/, "");
  if (!/^\+\d{7,15}$/.test(x)) throw new Error("BAD_PHONE");
  return x;
}

// TwiML helper: responder directamente a WhatsApp
function twiml(message: string) {
  if (!message) return new NextResponse("", { status: 200 });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response><Message>${message}</Message></Response>`;
  return new NextResponse(xml, { status: 200, headers: { "Content-Type": "text/xml" } });
}

export async function POST(req: NextRequest) {
  // 1) URL EXACTA que Twilio llamó (¡no uses PUBLIC_BASE_URL!)
  const fullUrl = req.nextUrl.href;

  // 2) Firma + body crudo (x-www-form-urlencoded)
  const signature = req.headers.get("x-twilio-signature") || "";
  const rawBody = await req.text();
  const params = Object.fromEntries(new URLSearchParams(rawBody));

  // 3) Verificar firma (permite bypass temporal si pones TWILIO_WEBHOOK_SKIP_VERIFY=1)
  if (process.env.TWILIO_WEBHOOK_SKIP_VERIFY !== "1") {
    const ok = validateTwilioSignature(
      process.env.TWILIO_AUTH_TOKEN as string,
      signature,
      fullUrl,
      params
    );
    if (!ok) {
      console.error("[Twilio] invalid_signature", { fullUrl, signature });
      return NextResponse.json({ error: "invalid_signature" }, { status: 403 });
    }
  } else {
    console.warn("[Twilio] SKIPPING SIGNATURE VERIFY (dev only)");
  }

  // 4) Extraer campos
  const from = toE164Strict(String(params.From || ""));
  const to = toE164Strict(String(params.To || ""));
  const body = String(params.Body || "").trim();
  const sid = String(params.MessageSid || "");
  const waId = String(params.WaId || "");
  const profile = String(params.ProfileName || "");

  // 5) Log idempotente (opcional - solo si existe la tabla)
  try {
    const { error: logErr } = await supabaseAdmin
      .from("whatsapp_inbox_log")
      .insert({
        provider: "twilio",
        message_sid: sid,
        from_phone: from,
        to_phone: to,
        body,
        wa_user_id: waId || null,
        wa_profile_name: profile || null,
        received_at: new Date().toISOString()
      });

    // Si la tabla tiene unique(provider, message_sid) y ya existe, ignoramos el error 23505
    if (logErr && logErr.code !== "23505" && logErr.code !== "PGRST205") {
      console.error("inbox_log error", logErr);
    }
  } catch (err) {
    // Table doesn't exist, that's fine
    console.log("inbox_log table not found, skipping log");
  }

  // 6) Comando de vinculación: LINK 123456
  const m = body.match(/^link\s+(\d{4,8})$/i);
  if (m) {
    const code = m[1];
    console.log(`[LINK] from=${from}, code=${code}, body="${body}"`);

    // First, check what records exist for this phone
    const { data: allLinks } = await supabaseAdmin
      .from("whatsapp_links")
      .select("*")
      .eq("phone_e164", from);
    
    console.log(`[LINK] All links for ${from}:`, allLinks);

    // Buscar pending para este phone + code no expirado
    const { data: link, error: linkErr } = await supabaseAdmin
      .from("whatsapp_links")
      .select("id,user_id,status,code_expires_at,verification_code,phone_e164")
      .eq("phone_e164", from)
      .eq("status", "pending")
      .eq("verification_code", code)
      .gt("code_expires_at", new Date().toISOString())
      .maybeSingle();

    console.log(`[LINK] query result:`, { link, linkErr, currentTime: new Date().toISOString() });

    if (linkErr || !link) {
      // ¿Ya verificado para otro user?
      const { data: clash } = await supabaseAdmin
        .from("whatsapp_links")
        .select("user_id")
        .eq("phone_e164", from)
        .eq("status", "verified");
      if (clash && clash.length) {
        return twiml("Este número ya está vinculado a otra cuenta.");
      }
      return twiml("Código inválido o expirado. Genera uno nuevo desde la web.");
    }

    const { error: upErr } = await supabaseAdmin
      .from("whatsapp_links")
      .update({
        status: "verified",
        linked_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        wa_user_id: waId || null,
        wa_profile_name: profile || null,
        verification_code: null,
        code_expires_at: null,
        last_message_sid: sid,
        updated_at: new Date().toISOString()
      })
      .eq("id", link.id);

    if (upErr) {
      console.error("update link error", upErr);
      return twiml("Error al verificar el vínculo. Intenta de nuevo.");
    }

    return twiml("✅ Tu WhatsApp quedó vinculado. Ya puedes enviar: gasto 120 café");
  }

  // 7) Comando de gasto: "gasto 120 café" 
  const expenseMatch = body.match(/^gasto\s+(\d+(?:\.\d{2})?)\s+(.+)$/i);
  if (expenseMatch) {
    const amount = parseFloat(expenseMatch[1]);
    const description = expenseMatch[2].trim();
    
    // Verificar que el número esté vinculado
    const { data: verifiedLink } = await supabaseAdmin
      .from("whatsapp_links")
      .select("user_id")
      .eq("phone_e164", from)
      .eq("status", "verified")
      .single();

    if (!verifiedLink) {
      return twiml("Para registrar gastos, primero vincula tu WhatsApp desde la web.");
    }

    console.log(`[EXPENSE] user=${verifiedLink.user_id}, amount=${amount}, description=${description}`);
    
    // Insertar el gasto en la tabla de transacciones
    const transactionData = {
      user_id: verifiedLink.user_id,
      type: "expense",
      amount: amount,
      category: "WhatsApp", // Default category for WhatsApp expenses
      description: description,
      transaction_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      source: "web",
      is_recurring: false,
      recurring_frequency: "none",
      tags: ["whatsapp"],
      card_id: null
    };

    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from("transactions")
      .insert(transactionData)
      .select()
      .single();

    if (transactionError) {
      console.error("Error creating transaction:", transactionError);
      return twiml("❌ Error al registrar el gasto. Intenta de nuevo.");
    }

    console.log(`[EXPENSE] Transaction created:`, transaction);
    
    return twiml(`✅ Gasto registrado: $${amount} - ${description}`);
  }

  // 8) Mantén last_seen_at para números verificados
  await supabaseAdmin
    .from("whatsapp_links")
    .update({ last_seen_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("phone_e164", from)
    .eq("status", "verified");

  // 9) Mensaje por defecto
  return twiml('Para registrar gastos envía: "gasto 120 café"\nPara vincular tu cuenta visita la web de Kipo.');
}
