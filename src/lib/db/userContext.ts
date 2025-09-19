import { createClient } from "@supabase/supabase-js";

// Admin client for server operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export interface UserNlpContext {
  language: 'es' | 'en';
  defaultCurrency: 'MXN' | 'USD' | 'EUR';
  timezone: string;
  allowedCategories: string[];
}

export async function getUserNlpContext(userId: string): Promise<UserNlpContext> {
  try {
    // Get user profile settings
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('language, currency, timezone')
      .eq('id', userId)
      .single();

    // Get available categories
    const { data: categories } = await supabaseAdmin
      .from('categories')
      .select('name')
      .order('name');

    // Extract category names
    const allowedCategories = categories?.map(cat => cat.name) || [
      'Comida',
      'Transporte', 
      'Facturas',
      'Entretenimiento',
      'Salud',
      'Educación',
      'Compras',
      'Otros'
    ];

    return {
      language: (profile?.language as 'es' | 'en') || 'es',
      defaultCurrency: (profile?.currency as 'MXN' | 'USD' | 'EUR') || 'MXN',
      timezone: profile?.timezone || 'America/Mexico_City',
      allowedCategories
    };
  } catch (error) {
    console.error('Error getting user NLP context:', error);
    
    // Return default context if there's an error
    return {
      language: 'es',
      defaultCurrency: 'MXN',
      timezone: 'America/Mexico_City',
      allowedCategories: [
        'Comida',
        'Transporte', 
        'Facturas',
        'Entretenimiento',
        'Salud',
        'Educación',
        'Compras',
        'Otros'
      ]
    };
  }
}