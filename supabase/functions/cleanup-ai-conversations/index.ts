// Supabase Edge Function: cleanup-ai-conversations
// BR-6: Clean up AI conversations older than 90 days
// Schedule: Run daily via cron

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // BR-6: Delete conversations older than 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: deletedConversations, error: deleteError } = await supabaseClient
      .from('budget_ai_conversations')
      .delete()
      .lt('created_at', ninetyDaysAgo.toISOString())
      .select('id');

    if (deleteError) {
      console.error('Error deleting conversations:', deleteError);
      return new Response(
        JSON.stringify({
          success: false,
          error: deleteError.message,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    const deletedCount = deletedConversations?.length || 0;

    console.log(`Deleted ${deletedCount} AI conversations older than 90 days`);

    return new Response(
      JSON.stringify({
        success: true,
        deletedCount,
        message: `Se eliminaron ${deletedCount} conversaciones de IA con más de 90 días`,
        cutoffDate: ninetyDaysAgo.toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error inesperado',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
