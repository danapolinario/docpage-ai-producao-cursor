// @ts-nocheck - Deno runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[GENERATE ALL STATIC HTML] Iniciando geração para todas as landing pages publicadas...');

    // Buscar todas as landing pages publicadas
    const { data: landingPages, error: fetchError } = await supabase
      .from('landing_pages')
      .select('id, subdomain, status')
      .eq('status', 'published');

    if (fetchError) {
      console.error('[GENERATE ALL STATIC HTML] Erro ao buscar landing pages:', fetchError);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar landing pages", details: fetchError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!landingPages || landingPages.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: "Nenhuma landing page publicada encontrada",
          count: 0,
          results: []
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[GENERATE ALL STATIC HTML] Encontradas ${landingPages.length} landing pages publicadas`);

    const FUNCTIONS_BASE_URL = `${SUPABASE_URL}/functions/v1`;
    const results: Array<{ landingPageId: string; subdomain: string; success: boolean; error?: string }> = [];

    // Gerar HTML estático para cada landing page
    for (const landingPage of landingPages) {
      try {
        console.log(`[GENERATE ALL STATIC HTML] Gerando HTML para: ${landingPage.subdomain} (${landingPage.id})`);
        
        const htmlResponse = await fetch(`${FUNCTIONS_BASE_URL}/generate-static-html`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ landingPageId: landingPage.id }),
        });

        const htmlData = await htmlResponse.json();

        if (htmlResponse.ok) {
          console.log(`[GENERATE ALL STATIC HTML] ✓ Sucesso para ${landingPage.subdomain}`);
          results.push({
            landingPageId: landingPage.id,
            subdomain: landingPage.subdomain,
            success: true
          });
        } else {
          console.error(`[GENERATE ALL STATIC HTML] ✗ Erro para ${landingPage.subdomain}:`, htmlData);
          results.push({
            landingPageId: landingPage.id,
            subdomain: landingPage.subdomain,
            success: false,
            error: htmlData.error || 'Erro desconhecido'
          });
        }
      } catch (error: any) {
        console.error(`[GENERATE ALL STATIC HTML] ✗ Exceção para ${landingPage.subdomain}:`, error);
        results.push({
          landingPageId: landingPage.id,
          subdomain: landingPage.subdomain,
          success: false,
          error: error.message || 'Exceção ao gerar HTML'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    console.log(`[GENERATE ALL STATIC HTML] Concluído: ${successCount} sucessos, ${errorCount} erros`);

    return new Response(
      JSON.stringify({
        message: `Processamento concluído: ${successCount} sucessos, ${errorCount} erros`,
        total: landingPages.length,
        success: successCount,
        errors: errorCount,
        results: results
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error('[GENERATE ALL STATIC HTML] Erro:', error);
    return new Response(
      JSON.stringify({ error: "Erro interno", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
