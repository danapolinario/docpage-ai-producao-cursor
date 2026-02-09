// @ts-nocheck
// Edge Function (Deno runtime). The declarations below keep the web build TypeScript checker happy.
declare const Deno: {
  env: { get: (key: string) => string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" }) : null;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Criar landing page após pagamento confirmado
async function createLandingPageFromCheckout(session: Stripe.Checkout.Session) {
  try {
    const userId = session.metadata?.userId;
    if (!userId) {
      throw new Error("userId não encontrado na metadata da sessão");
    }

    // Tentar recuperar dados completos da tabela pending_checkouts primeiro
    let landingPageData;
    let domain = session.metadata?.domain || "";
    let hasCustomDomain = session.metadata?.hasCustomDomain === "true";
    let customDomain = session.metadata?.customDomain || null;
    let pendingCheckout: any = null;
    
    const { data: pendingCheckoutData, error: pendingError } = await supabase
      .from("pending_checkouts")
      .select("*")
      .eq("stripe_session_id", session.id)
      .eq("processed", false)
      .single();
    
    let cpfFromPending: string | null = null;
    
    if (pendingCheckoutData && !pendingError) {
      pendingCheckout = pendingCheckoutData;
      // Usar dados completos da tabela
      landingPageData = pendingCheckout.landing_page_data;
      domain = pendingCheckout.domain || domain;
      hasCustomDomain = pendingCheckout.has_custom_domain || hasCustomDomain;
      customDomain = pendingCheckout.custom_domain || customDomain;
      // Garantir que CPF seja apenas números (limpar qualquer formatação)
      cpfFromPending = pendingCheckout.cpf ? String(pendingCheckout.cpf).replace(/\D/g, '') : null;
    } else {
      
      // Fallback: tentar usar metadata (pode estar truncado)
      const landingPageDataStr = session.metadata?.landingPageData;
      
      if (!landingPageDataStr) {
        throw new Error("Dados da landing page não encontrados na metadata nem em pending_checkouts");
      }

      try {
        landingPageData = JSON.parse(landingPageDataStr);
      } catch (parseError: any) {
        console.error(`stripe-webhook: Erro ao fazer parse do landingPageData da metadata:`, {
          error: parseError.message,
          landingPageDataStr: landingPageDataStr.substring(0, 200),
        });
        throw new Error(`Erro ao fazer parse dos dados da landing page: ${parseError.message}`);
      }
    }
    

    // Determinar chosen_domain (domínio completo escolhido pelo usuário com extensão)
    // Este valor vem de pending_checkouts.domain e sempre deve ter extensão completa
    let chosenDomainToSave: string | null = null;
    if (hasCustomDomain && customDomain) {
      chosenDomainToSave = customDomain.trim();
    } else if (domain) {
      // domain de pending_checkouts já contém o domínio completo com extensão
      chosenDomainToSave = domain.trim();
    }

    // Gerar subdomínio
    let finalSubdomain: string;
    let customDomainToSave: string | null = null;

    if (hasCustomDomain && customDomain) {
      // Domínio próprio - extrair nome do domínio (sem extensão) para usar como subdomain
      customDomainToSave = customDomain.trim();
      const domainName = customDomain
        .replace(/^www\./, "")
        .replace(/\.(com\.br|com|med\.br|net|org|br)$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      
      // Verificar disponibilidade do subdomain gerado
      let baseSubdomain = domainName;
      let counter = 0;
      let isAvailable = false;
      
      while (!isAvailable && counter < 10) {
        const subdomainToCheck = counter === 0 ? baseSubdomain : `${baseSubdomain}-${counter}`;
        
        // Verificar disponibilidade usando função SQL
        const { data: available, error: checkError } = await supabase.rpc('check_subdomain_available', {
          check_subdomain: subdomainToCheck
        });
        
        if (checkError) {
          // Se a função RPC falhar, verificar diretamente na tabela
          const { data: existing } = await supabase
            .from('landing_pages')
            .select('id')
            .eq('subdomain', subdomainToCheck.toLowerCase())
            .maybeSingle();
          
          isAvailable = !existing;
        } else {
          isAvailable = available === true;
        }
        
        if (isAvailable) {
          finalSubdomain = subdomainToCheck;
        } else {
          counter++;
        }
      }
      
      // Se não encontrou disponível após 10 tentativas, usar timestamp como fallback
      if (!isAvailable) {
        const timestamp = Date.now().toString(36);
        finalSubdomain = `${baseSubdomain}-${timestamp}`.substring(0, 50);
      }
    } else {
      // Domínio normal
      finalSubdomain = domain
        .replace(/^www\./, "")
        .replace(/\.(com|com\.br|med\.br)$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    }

    // IMPORTANTE: Buscar landing page existente do usuário ANTES de criar nova
    // A landing page já foi criada no CheckoutFlow antes do pagamento
    const { data: existingLandingPage, error: findError } = await supabase
      .from("landing_pages")
      .select("id, subdomain, custom_domain, cpf, chosen_domain")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let landingPage;

    if (existingLandingPage && !findError) {
      // Landing page já existe - usar ela
      // SEMPRE atualizar chosen_domain e CPF se temos os valores (mesmo que já tenham valores)
      // Isso garante que o domínio escolhido e CPF sejam sempre os mais recentes de pending_checkouts
      const updateData: any = {};
      if (chosenDomainToSave) {
        updateData.chosen_domain = chosenDomainToSave;
      }
      if (cpfFromPending) {
        updateData.cpf = cpfFromPending;
      }
      
      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from("landing_pages")
          .update(updateData)
          .eq("id", existingLandingPage.id);
        
        if (updateError) {
          console.error(`stripe-webhook: Erro ao atualizar dados na landing page existente:`, updateError);
        }
      }
      
      landingPage = existingLandingPage;
    } else {
      // Landing page não existe - criar nova (fallback para casos antigos)

      // Criar slug único
      const slug = `${finalSubdomain}-${Date.now()}`;

      // Criar landing page
      const { data: newLandingPage, error: createError } = await supabase
        .from("landing_pages")
        .insert({
          user_id: userId,
          subdomain: finalSubdomain,
          custom_domain: customDomainToSave,
          chosen_domain: chosenDomainToSave, // Domínio completo escolhido pelo usuário (com extensão)
          cpf: cpfFromPending || null, // Salvar CPF do pending_checkouts (já limpo, apenas números)
          slug,
          briefing_data: landingPageData.briefing || {},
          content_data: landingPageData.content || {},
          design_settings: landingPageData.design || {},
          section_visibility: landingPageData.visibility || {},
          layout_variant: landingPageData.layoutVariant || 1,
          photo_url: landingPageData.photoUrl || null,
          about_photo_url: landingPageData.aboutPhotoUrl || null,
          status: "draft", // Admin precisa publicar
        })
        .select()
        .single();

      if (createError) {
        console.error(`stripe-webhook: Erro ao inserir landing page:`, {
          error: createError.message,
          code: createError.code,
          details: createError.details,
          hint: createError.hint,
        });
        throw new Error(`Erro ao criar landing page: ${createError.message}`);
      }

      
      landingPage = newLandingPage;
    }

    // Marcar pending_checkout como processado
    if (pendingCheckout) {
      const { error: updateError } = await supabase
        .from("pending_checkouts")
        .update({
          processed: true,
          landing_page_id: landingPage.id,
        })
        .eq("id", pendingCheckout.id);
      
      if (updateError) {
        console.warn(`stripe-webhook: Erro ao marcar pending_checkout como processado:`, updateError);
      } else {
      }
    }

    return landingPage;
  } catch (error: any) {
    console.error("Erro ao criar landing page:", error);
    throw error;
  }
}

// Criar ou atualizar subscription
async function upsertSubscription(
  subscription: Stripe.Subscription,
  customerId: string,
  userId: string,
  landingPageId?: string
) {
  try {
    const planId = subscription.metadata?.planId || "starter";
    const billingPeriod = subscription.metadata?.billingPeriod || "monthly";
    const priceId = subscription.items.data[0]?.price.id || "";

    // Buscar cupom aplicado (se houver)
    let couponId: string | undefined;
    let couponName: string | undefined;
    if (subscription.discount) {
      couponId = subscription.discount.coupon.id;
      couponName = subscription.discount.coupon.name || undefined;
    }

    // Mapear status do Stripe para status válido no banco
    // O banco aceita: 'active', 'canceled', 'past_due', 'unpaid', 'trialing'
    // O Stripe pode retornar: 'active', 'canceled', 'past_due', 'unpaid', 'trialing', 'incomplete', 'incomplete_expired', 'paused'
    let mappedStatus = subscription.status;
    if (!['active', 'canceled', 'past_due', 'unpaid', 'trialing'].includes(subscription.status)) {
      // Mapear status não suportados para o mais próximo
      if (subscription.status === 'incomplete' || subscription.status === 'incomplete_expired') {
        mappedStatus = 'unpaid';
      } else if (subscription.status === 'paused') {
        mappedStatus = 'active'; // Tratar como ativa
      } else {
        mappedStatus = 'active'; // Default
      }
    }

    const subscriptionData = {
      user_id: userId,
      landing_page_id: landingPageId || null,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      plan_id: planId,
      billing_period: billingPeriod,
      status: mappedStatus,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      coupon_id: couponId || null,
      coupon_name: couponName || null,
      metadata: {
        stripe_subscription: subscription.id,
        original_status: subscription.status, // Guardar status original
      },
    };


    // Verificar se subscription já existe
    const { data: existing, error: findError } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("stripe_subscription_id", subscription.id)
      .maybeSingle();

    if (findError && findError.code !== 'PGRST116') {
      console.error(`stripe-webhook: Erro ao buscar subscription existente:`, findError);
      throw new Error(`Erro ao buscar subscription: ${findError.message}`);
    }

    if (existing) {
      // Atualizar
      const { data: updated, error: updateError } = await supabase
        .from("subscriptions")
        .update(subscriptionData)
        .eq("stripe_subscription_id", subscription.id)
        .select();

      if (updateError) {
        console.error(`stripe-webhook: Erro ao atualizar subscription:`, {
          error: updateError.message,
          code: updateError.code,
          details: updateError.details,
          hint: updateError.hint,
        });
        throw new Error(`Erro ao atualizar subscription: ${updateError.message}`);
      }
      console.log(`stripe-webhook: Subscription atualizada com sucesso`, {
        subscriptionId: existing.id,
        rowsUpdated: updated?.length || 0,
      });
    } else {
      // Criar
      const { data: inserted, error: insertError } = await supabase
        .from("subscriptions")
        .insert(subscriptionData)
        .select();

      if (insertError) {
        console.error(`stripe-webhook: Erro ao criar subscription:`, {
          error: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
          subscriptionData: JSON.stringify(subscriptionData, null, 2),
        });
        throw new Error(`Erro ao criar subscription: ${insertError.message}`);
      }
    }
  } catch (error: any) {
    console.error("stripe-webhook: Erro ao criar/atualizar subscription:", {
      error: error.message,
      stack: error.stack,
      subscriptionId: subscription.id,
    });
    throw error;
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log("============================================");
  console.log("stripe-webhook: Request recebido", {
    method: req.method,
    url: req.url,
    hasBody: !!req.body,
    timestamp: new Date().toISOString(),
    headers: {
      hasStripeSignature: !!req.headers.get("stripe-signature"),
      contentType: req.headers.get("content-type"),
      origin: req.headers.get("origin"),
    },
  });
  console.log("============================================");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    console.error("stripe-webhook: Stripe não configurado", {
      hasStripe: !!stripe,
      hasWebhookSecret: !!STRIPE_WEBHOOK_SECRET,
    });
    return new Response(
      JSON.stringify({ error: "Stripe não configurado" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    // Obter assinatura do webhook do header
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      // Se for uma requisição GET (acesso direto via navegador), retornar mensagem informativa
      if (req.method === "GET") {
        return new Response(
          JSON.stringify({ 
            message: "Este endpoint é um webhook do Stripe e só pode ser acessado pelo Stripe.",
            hint: "Configure este URL no Stripe Dashboard → Developers → Webhooks",
            url: req.url,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: "Assinatura do webhook não encontrada",
          hint: "Este endpoint deve ser chamado apenas pelo Stripe. Verifique se o webhook está configurado corretamente no Stripe Dashboard."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Obter body como texto RAW (crucial para validação da assinatura)
    // IMPORTANTE: Não usar req.json() pois isso altera o body e quebra a validação
    const body = await req.text();

    // Validar assinatura do webhook (usar versão assíncrona para Deno/Edge Functions)
    let event: Stripe.Event;
    try {
      // No Deno/Edge Functions, precisamos usar constructEventAsync ao invés de constructEvent
      // O body DEVE ser o texto raw exatamente como recebido do Stripe
      event = await stripe.webhooks.constructEventAsync(
        body, 
        signature, 
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error("stripe-webhook: Erro ao validar assinatura do webhook:", {
        error: err.message,
        errorType: err.constructor?.name,
        signatureLength: signature.length,
        bodyLength: body.length,
        bodyFirstChars: body.substring(0, 50),
        bodyLastChars: body.substring(Math.max(0, body.length - 50)),
      });
      return new Response(
        JSON.stringify({ 
          error: `Webhook signature verification failed: ${err.message}`,
          hint: "Verifique se STRIPE_WEBHOOK_SECRET está correto e se o body está sendo passado como texto raw"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Processar eventos
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // Verificar se é uma subscription
        if (session.mode === "subscription" && session.subscription) {
          console.log(`stripe-webhook: É uma subscription, processando...`);
          
          // Buscar subscription completa
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const userId = session.metadata?.userId;


          if (!userId) {
            console.error("stripe-webhook: userId não encontrado na metadata da sessão", {
              sessionId: session.id,
              metadata: session.metadata,
            });
            break;
          }

          // Buscar ou criar landing page
          let landingPage = null;
          try {
            console.log(`stripe-webhook: Buscando ou criando landing page...`);
            landingPage = await createLandingPageFromCheckout(session);
          } catch (error: any) {
            console.error("stripe-webhook: Erro ao buscar/criar landing page:", {
              error: error.message,
              stack: error.stack,
              sessionId: session.id,
              userId,
            });
            
            // Se falhar, tentar buscar landing page existente diretamente
            const { data: fallbackLandingPage } = await supabase
              .from("landing_pages")
              .select("id, subdomain")
              .eq("user_id", userId)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (fallbackLandingPage) {
              landingPage = fallbackLandingPage;
            }
          }

          // Criar subscription no banco (sempre associar com landing page se disponível)

          // Validar customerId
          if (!session.customer || typeof session.customer !== 'string') {
            console.error("stripe-webhook: customerId inválido na sessão", {
              customer: session.customer,
              customerType: typeof session.customer,
            });
            throw new Error(`customerId inválido: ${session.customer}`);
          }

          // Validar userId
          if (!userId || typeof userId !== 'string') {
            console.error("stripe-webhook: userId inválido", {
              userId,
              userIdType: typeof userId,
            });
            throw new Error(`userId inválido: ${userId}`);
          }

          try {
            await upsertSubscription(
              subscription,
              session.customer as string,
              userId,
              landingPage?.id || undefined
            );
          } catch (error: any) {
            console.error("stripe-webhook: Erro ao criar/atualizar subscription:", {
              error: error.message,
              stack: error.stack,
              subscriptionId: subscription.id,
              customerId: session.customer,
              userId,
            });
            // NÃO silenciar o erro - propagar para que o webhook retorne erro
            throw error;
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        
        
        // Buscar subscription no banco
        const { data: existingSub } = await supabase
          .from("subscriptions")
          .select("user_id, landing_page_id")
          .eq("stripe_subscription_id", subscription.id)
          .maybeSingle();

        if (existingSub) {
          // Se não tem landing_page_id, tentar buscar a mais recente do usuário
          let landingPageId = existingSub.landing_page_id;
          if (!landingPageId) {
            const { data: userLandingPage } = await supabase
              .from("landing_pages")
              .select("id")
              .eq("user_id", existingSub.user_id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (userLandingPage) {
              landingPageId = userLandingPage.id;
            }
          }
          
          // Validar customerId
          const customerId = typeof subscription.customer === 'string' 
            ? subscription.customer 
            : (subscription.customer as any)?.id || null;
          
          if (!customerId) {
            console.error("stripe-webhook: customerId inválido na subscription", {
              customer: subscription.customer,
              customerType: typeof subscription.customer,
            });
            throw new Error(`customerId inválido na subscription: ${subscription.id}`);
          }

          await upsertSubscription(
            subscription,
            customerId,
            existingSub.user_id,
            landingPageId || undefined
          );
        } else {
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Atualizar status para canceled
        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            canceled_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription) {
          // Buscar subscription no banco
          const { data: existingSub } = await supabase
            .from("subscriptions")
            .select("id")
            .eq("stripe_subscription_id", invoice.subscription as string)
            .single();

          if (existingSub) {
            // Atualizar período atual
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
            await supabase
              .from("subscriptions")
              .update({
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                status: subscription.status,
              })
              .eq("stripe_subscription_id", subscription.id);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription) {
          // Atualizar status para past_due
          await supabase
            .from("subscriptions")
            .update({
              status: "past_due",
            })
            .eq("stripe_subscription_id", invoice.subscription as string);
        }
        break;
      }

      default:
        console.log(`Evento não processado: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("Erro ao processar webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao processar webhook" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
};

Deno.serve(handler);
