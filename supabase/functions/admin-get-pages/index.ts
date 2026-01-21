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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  // Validar método HTTP
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Método não permitido. Use POST.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Verificar variáveis de ambiente
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Variáveis de ambiente não configuradas:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      })
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Validar e fazer parse do body
    let body: any = {}
    try {
      // Tentar fazer parse do JSON
      body = await req.json()
    } catch (parseError: any) {
      // Se o body estiver vazio ou não for JSON válido
      console.error('Erro ao fazer parse do body:', {
        error: parseError?.message,
        stack: parseError?.stack,
        bodyExists: !!req.body
      })
      // Se o body estiver vazio, retornar erro específico
      if (parseError?.message?.includes('Unexpected end of JSON input')) {
        return new Response(
          JSON.stringify({ error: 'Body vazio. userId é obrigatório.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return new Response(
        JSON.stringify({ error: 'Body inválido ou malformado', details: parseError?.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SOLUÇÃO DEFINITIVA: Recebe user_id diretamente do body
    const { userId } = body || {}
    
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
        JSON.stringify({ error: 'Acesso negado. Apenas administradores podem acessar.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar todas as landing pages usando service role (bypass RLS)
    const { data: landingPages, error: pagesError } = await supabaseAdmin
      .from('landing_pages')
      .select('*')
      .order('created_at', { ascending: false })

    if (pagesError) {
      console.error('Error fetching landing pages:', pagesError)
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar landing pages', details: pagesError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ data: landingPages || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Admin get pages error:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      error: error
    })
    
    // Retornar erro mais detalhado em desenvolvimento, genérico em produção
    const errorMessage = error?.message || 'Erro interno do servidor'
    const errorDetails = error?.stack ? { details: error.stack } : {}
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        ...errorDetails
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
