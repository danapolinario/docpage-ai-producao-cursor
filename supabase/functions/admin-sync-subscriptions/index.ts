// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

// @ts-ignore
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Max-Age': '86400',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Método não permitido. Use POST.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey || !stripeSecretKey) {
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

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' })

    // Validar body
    let body: any = {}
    try {
      body = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ error: 'Body inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

    // Buscar todas as subscriptions
    const { data: subscriptions, error: subsError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, stripe_subscription_id, user_id, landing_page_id')
      .order('created_at', { ascending: false })

    if (subsError) {
      console.error('Erro ao buscar subscriptions:', subsError)
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Nenhuma subscription encontrada', updated: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sincronizar status do Stripe para cada subscription
    let updated = 0
    let associated = 0
    const errors: string[] = []
    const updateDetails: any[] = []

    console.log(`Iniciando sincronização de ${subscriptions.length} subscriptions`)

    for (const sub of subscriptions) {
      if (!sub.stripe_subscription_id) {
        console.log(`Subscription ${sub.id} sem stripe_subscription_id, pulando`)
        continue
      }

      try {
        // Se não tem landing_page_id, tentar associar com a landing page mais recente do usuário
        if (!sub.landing_page_id && sub.user_id) {
          console.log(`Subscription ${sub.id} sem landing_page_id, buscando landing page do usuário ${sub.user_id}...`)
          const { data: userLandingPage } = await supabaseAdmin
            .from('landing_pages')
            .select('id')
            .eq('user_id', sub.user_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          
          if (userLandingPage) {
            console.log(`Associando subscription ${sub.id} com landing page ${userLandingPage.id}`)
            const { error: assocError } = await supabaseAdmin
              .from('subscriptions')
              .update({ landing_page_id: userLandingPage.id })
              .eq('id', sub.id)
            
            if (!assocError) {
              associated++
              sub.landing_page_id = userLandingPage.id
              console.log(`Subscription ${sub.id} associada com sucesso`)
            } else {
              console.error(`Erro ao associar subscription ${sub.id}:`, assocError)
            }
          } else {
            console.log(`Nenhuma landing page encontrada para o usuário ${sub.user_id}`)
          }
        }

        // Buscar subscription do Stripe
        console.log(`Buscando subscription do Stripe: ${sub.stripe_subscription_id}`)
        const stripeSubscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id)
        
        console.log(`Status do Stripe para ${sub.stripe_subscription_id}:`, stripeSubscription.status)

        // Verificar se o status mudou
        const { data: currentSub } = await supabaseAdmin
          .from('subscriptions')
          .select('status')
          .eq('id', sub.id)
          .single()

        const statusChanged = !currentSub || currentSub.status !== stripeSubscription.status
        console.log(`Status atual no banco: ${currentSub?.status}, Status no Stripe: ${stripeSubscription.status}, Mudou: ${statusChanged}`)

        // Atualizar status na tabela (manter landing_page_id se já foi associado)
        const updateData: any = {
          status: stripeSubscription.status,
          current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: stripeSubscription.cancel_at_period_end,
          canceled_at: stripeSubscription.canceled_at 
            ? new Date(stripeSubscription.canceled_at * 1000).toISOString() 
            : null,
          updated_at: new Date().toISOString(),
        }

        // Se associamos uma landing page, incluir no update
        if (sub.landing_page_id) {
          updateData.landing_page_id = sub.landing_page_id
        }

        const { data: updatedSub, error: updateError } = await supabaseAdmin
          .from('subscriptions')
          .update(updateData)
          .eq('id', sub.id)
          .select()
          .single()

        if (updateError) {
          console.error(`Erro ao atualizar subscription ${sub.id}:`, updateError)
          errors.push(`Subscription ${sub.id}: ${updateError.message}`)
        } else {
          updated++
          updateDetails.push({
            id: sub.id,
            stripe_subscription_id: sub.stripe_subscription_id,
            oldStatus: currentSub?.status,
            newStatus: stripeSubscription.status,
            landingPageId: sub.landing_page_id || 'null',
          })
          console.log(`Subscription ${sub.id} atualizada: ${currentSub?.status} -> ${stripeSubscription.status}`)
        }
      } catch (stripeError: any) {
        console.error(`Erro ao buscar subscription do Stripe ${sub.stripe_subscription_id}:`, stripeError)
        errors.push(`Stripe ${sub.stripe_subscription_id}: ${stripeError.message}`)
      }
    }

    console.log(`Sincronização concluída: ${updated}/${subscriptions.length} atualizadas`)

    return new Response(
      JSON.stringify({ 
        message: 'Sincronização concluída',
        total: subscriptions.length,
        updated,
        associated,
        errors: errors.length > 0 ? errors : undefined,
        details: updateDetails.length > 0 ? updateDetails : undefined
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Erro na função admin-sync-subscriptions:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
