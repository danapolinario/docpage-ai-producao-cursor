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

    // Buscar landing pages otimizado: campos básicos + apenas campos específicos do JSONB
    // Usar extração direta de campos JSONB usando sintaxe PostgREST
    const { data: landingPages, error: pagesError } = await supabaseAdmin
      .from('landing_pages')
      .select(`
        id,
        subdomain,
        custom_domain,
        status,
        created_at,
        updated_at,
        published_at,
        user_id,
        briefing_data
      `)
      .order('created_at', { ascending: false })
      .limit(300) // Limite reduzido para evitar timeout e memory limit

    if (pagesError) {
      console.error('Error fetching landing pages:', pagesError)
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar landing pages', details: pagesError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extrair apenas campos necessários do briefing_data para reduzir tamanho
    // Isso evita carregar o objeto JSONB completo na memória
    const optimizedPages = (landingPages || []).map((lp: any) => {
      const briefing = lp.briefing_data || {}
      return {
        id: lp.id,
        subdomain: lp.subdomain,
        custom_domain: lp.custom_domain,
        status: lp.status,
        created_at: lp.created_at,
        updated_at: lp.updated_at,
        published_at: lp.published_at,
        user_id: lp.user_id,
        briefing_data: {
          name: briefing.name || null,
          contactEmail: briefing.contactEmail || null
        }
      }
    })

    // Buscar domínios escolhidos do pending_checkouts para cada landing page
    const landingPageIds = optimizedPages.map((lp: any) => lp.id)
    const chosenDomainsMap: Record<string, string> = {}
    
    if (landingPageIds.length > 0) {
      try {
        // Buscar domínios escolhidos por landing_page_id
        const { data: pendingCheckouts, error: pendingError } = await supabaseAdmin
          .from('pending_checkouts')
          .select('landing_page_id, domain, has_custom_domain, custom_domain')
          .in('landing_page_id', landingPageIds)
          .not('landing_page_id', 'is', null)
        
        if (!pendingError && pendingCheckouts) {
          pendingCheckouts.forEach((pc: any) => {
            if (pc.landing_page_id) {
              // Se tem domínio customizado, usar ele; senão, usar o domínio escolhido (com extensão)
              const chosenDomain = pc.has_custom_domain && pc.custom_domain
                ? pc.custom_domain
                : pc.domain // Este é o domínio escolhido pelo usuário (ex: "testefinaldocpage.com.br")
              chosenDomainsMap[pc.landing_page_id] = chosenDomain
            }
          })
        }
        
        // Se não encontrou por landing_page_id, buscar por user_id como fallback
        const userIds = [...new Set(optimizedPages.map((lp: any) => lp.user_id).filter(Boolean))]
        if (userIds.length > 0 && Object.keys(chosenDomainsMap).length < landingPageIds.length) {
          const { data: pendingByUserId, error: pendingByUserIdError } = await supabaseAdmin
            .from('pending_checkouts')
            .select('user_id, domain, has_custom_domain, custom_domain')
            .in('user_id', userIds)
            .order('created_at', { ascending: false })
          
          if (!pendingByUserIdError && pendingByUserId) {
            // Criar mapa por user_id
            const userChosenDomainsMap: Record<string, string> = {}
            pendingByUserId.forEach((pc: any) => {
              if (pc.user_id && !userChosenDomainsMap[pc.user_id]) {
                const chosenDomain = pc.has_custom_domain && pc.custom_domain
                  ? pc.custom_domain
                  : pc.domain
                userChosenDomainsMap[pc.user_id] = chosenDomain
              }
            })
            
            // Aplicar aos landing pages que não têm domínio escolhido
            optimizedPages.forEach((lp: any) => {
              if (!chosenDomainsMap[lp.id] && userChosenDomainsMap[lp.user_id]) {
                chosenDomainsMap[lp.id] = userChosenDomainsMap[lp.user_id]
              }
            })
          }
        }
      } catch (domainError) {
        console.warn('Erro ao buscar domínios escolhidos do pending_checkouts (não crítico):', domainError)
        // Não falhar se não conseguir buscar domínios escolhidos
      }
    }

    // Buscar emails dos usuários de forma eficiente (apenas IDs únicos)
    const userIds = [...new Set(optimizedPages.map((lp: any) => lp.user_id).filter(Boolean))]
    const userEmailsMap: Record<string, string> = {}
    
    if (userIds.length > 0 && userIds.length <= 100) {
      // Buscar emails apenas se houver poucos usuários (evitar timeout)
      try {
        const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
        
        if (!usersError && users && users.users) {
          users.users.forEach((user: any) => {
            if (userIds.includes(user.id) && user.email) {
              userEmailsMap[user.id] = user.email
            }
          })
        }
      } catch (emailError) {
        console.warn('Erro ao buscar emails dos usuários (não crítico):', emailError)
        // Não falhar se não conseguir buscar emails
      }
    }

    // Buscar subscriptions e criar mapa por landing_page_id
    const { data: subscriptions, error: subscriptionsError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, landing_page_id, status, plan_id, billing_period, current_period_end')
      .not('landing_page_id', 'is', null)
      .order('created_at', { ascending: false })

    if (subscriptionsError) {
      console.warn('Erro ao buscar subscriptions (não crítico):', subscriptionsError)
    }

    // Criar mapa de landing_page_id -> subscription
    const subscriptionMap = new Map<string, any>()
    if (subscriptions) {
      subscriptions.forEach((sub: any) => {
        if (sub.landing_page_id) {
          // Se já existe uma subscription para esta landing page, manter a mais recente
          if (!subscriptionMap.has(sub.landing_page_id)) {
            subscriptionMap.set(sub.landing_page_id, {
              status: sub.status,
              plan_id: sub.plan_id,
              billing_period: sub.billing_period,
              current_period_end: sub.current_period_end,
            })
          }
        }
      })
    }

    // Adicionar emails, subscriptions e domínios escolhidos aos dados formatados
    const formattedPages = optimizedPages.map((lp: any) => {
      const subscription = subscriptionMap.get(lp.id)
      const chosenDomain = chosenDomainsMap[lp.id]
      
      // Determinar o domínio a ser exibido
      // Prioridade: 1) chosenDomain (do pending_checkouts), 2) custom_domain, 3) subdomain.docpage.com.br
      let displayDomain: string
      if (chosenDomain) {
        displayDomain = chosenDomain
      } else if (lp.custom_domain) {
        displayDomain = lp.custom_domain
      } else {
        displayDomain = `${lp.subdomain}.docpage.com.br`
      }
      
      return {
        ...lp,
        user_email: userEmailsMap[lp.user_id] || null,
        subscription: subscription || undefined,
        chosen_domain: chosenDomain || null,
        display_domain: displayDomain
      }
    })

    return new Response(
      JSON.stringify({ data: formattedPages }),
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
