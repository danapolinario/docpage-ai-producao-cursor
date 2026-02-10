// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// @ts-ignore
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // SOLUÇÃO DEFINITIVA: Recebe userId, landingPageId e status do body
    const { userId, landingPageId, status } = await req.json()
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se o usuário existe
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (userError || !user) {
      console.error('Erro ao buscar usuário:', userError)
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se é admin usando service role (bypass RLS)
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single()

    if (roleError || !roleData) {
      console.error('Erro ao verificar role admin:', roleError)
      return new Response(
        JSON.stringify({ error: 'Acesso negado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!landingPageId || !status) {
      return new Response(
        JSON.stringify({ error: 'landingPageId e status são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!landingPageId || !status) {
      return new Response(
        JSON.stringify({ error: 'landingPageId e status são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const updateData: any = { status }
    if (status === 'published') {
      updateData.published_at = new Date().toISOString()
    }

    const { error: updateError } = await supabaseAdmin
      .from('landing_pages')
      .update(updateData)
      .eq('id', landingPageId)

    if (updateError) {
      console.error('Error updating status:', updateError)
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar status', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Se status mudou para 'published', enviar email de notificação e gerar HTML estático
    if (status === 'published') {
      try {
        console.log('Enviando email de notificação de publicação (via Edge Function):', landingPageId)
        const FUNCTIONS_BASE_URL = `${Deno.env.get('SUPABASE_URL')}/functions/v1`
        const notifyResponse = await fetch(`${FUNCTIONS_BASE_URL}/notify-site-published`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ landingPageId }),
        })
        
        const notifyData = await notifyResponse.json()
        
        if (!notifyResponse.ok) {
          console.error('Erro ao enviar email de notificação:', {
            status: notifyResponse.status,
            statusText: notifyResponse.statusText,
            error: notifyData.error || notifyData,
            landingPageId,
          })
          // Não falhar a atualização se o email falhar
        } else {
          console.log('Email de notificação enviado com sucesso:', {
            landingPageId,
            response: notifyData,
          })
        }
      } catch (notifyError: any) {
        console.error('Erro ao enviar email de notificação:', {
          landingPageId,
          error: notifyError.message || notifyError,
          stack: notifyError.stack,
        })
        // Não falhar a atualização se o email falhar
      }

      // Gerar HTML estático quando status muda para 'published'
      try {
        console.log('Gerando HTML estático para landing page publicada:', landingPageId)
        const FUNCTIONS_BASE_URL = `${Deno.env.get('SUPABASE_URL')}/functions/v1`
        const htmlResponse = await fetch(`${FUNCTIONS_BASE_URL}/generate-static-html`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ landingPageId }),
        })
        
        const htmlData = await htmlResponse.json()
        
        if (!htmlResponse.ok) {
          console.error('Erro ao gerar HTML estático:', {
            status: htmlResponse.status,
            statusText: htmlResponse.statusText,
            error: htmlData.error || htmlData,
            landingPageId,
          })
          // Não falhar a atualização se a geração de HTML falhar
        } else {
          console.log('HTML estático gerado com sucesso:', {
            landingPageId,
            publicUrl: htmlData.publicUrl,
            subdomain: htmlData.subdomain,
          })
        }
      } catch (htmlError: any) {
        console.error('Erro ao gerar HTML estático:', {
          landingPageId,
          error: htmlError.message || htmlError,
          stack: htmlError.stack,
        })
        // Não falhar a atualização se a geração de HTML falhar
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Admin update status error:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
