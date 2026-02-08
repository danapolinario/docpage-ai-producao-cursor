// @ts-nocheck
// Edge Function (Deno runtime). The declarations below keep the web build TypeScript checker happy.
declare const Deno: {
  env: { get: (key: string) => string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" }) : null;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapeamento direto de planos para Price IDs do Stripe
// CORRIGIDO conforme especificação do usuário
const PLAN_PRICE_MAP: Record<string, Record<string, string>> = {
  starter: {
    monthly: "price_1SxQTF1zmyrvN5yEs7pJHOOX", // Starter mensal = R$ 147/mês
    annual: "price_1SxQTL1zmyrvN5yEwtG3azA7",   // Starter anual = R$ 97/mês
    // monthly: "price_1SwRK21zmyrvN5yEE7e96JFg", TEST Starter mensal = R$ 147/mês
    // annual: "price_1SwRJE1zmyrvN5yEqbtPHdJK",   TEST Starter anual = R$ 97/mês
  },
  pro: {
    monthly: "price_1SxDwP1zmyrvN5yEJRZuIwyt", // Profissional mensal = R$ 297/mês
    annual: "price_1SxQTC1zmyrvN5yECtoyxRWm",   // Profissional anual = R$ 197/mês
    // monthly: "price_1SwRKy1zmyrvN5yEgOLRU4R8", TEST Profissional mensal = R$ 297/mês
    // annual: "price_1SwRKV1zmyrvN5yEW4NcN91J",   TEST Profissional anual = R$ 197/mês
  },
};

interface CreateCheckoutRequest {
  planId: string; // 'starter' ou 'pro'
  billingPeriod: 'monthly' | 'annual';
  couponCode?: string;
  userId: string;
  userEmail: string; // Email do usuário autenticado (do Step 1)
  cpf?: string; // CPF (solicitado no Step 2 quando não há domínio próprio)
  landingPageData: {
    briefing: any;
    content: any;
    design: any;
    visibility: any;
    layoutVariant: number;
    photoUrl?: string | null;
    aboutPhotoUrl?: string | null;
    domain: string;
    hasCustomDomain?: boolean;
    customDomain?: string | null;
  };
}

const handler = async (req: Request): Promise<Response> => {
  console.log("stripe-create-checkout: Request received", {
    method: req.method,
    url: req.url,
    hasAuthHeader: !!req.headers.get("authorization"),
    hasApikeyHeader: !!req.headers.get("apikey"),
    origin: req.headers.get("origin"),
  });
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!stripe) {
    console.error("stripe-create-checkout: STRIPE_SECRET_KEY ausente");
    const hasKey = !!Deno.env.get("STRIPE_SECRET_KEY");
    const keyPrefix = Deno.env.get("STRIPE_SECRET_KEY")?.substring(0, 7) || "não encontrada";
    return new Response(
      JSON.stringify({ 
        error: "Stripe não configurado. STRIPE_SECRET_KEY ausente. Configure no Supabase Dashboard > Settings > Edge Functions > Secrets",
        debug: {
          hasKey,
          keyPrefix,
          supabaseUrl: SUPABASE_URL ? "configurado" : "ausente",
          supabaseServiceKey: SUPABASE_SERVICE_ROLE_KEY ? "configurado" : "ausente"
        }
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  
  // Verificar se a chave é de produção (começa com sk_live_) ou teste (sk_test_)
  const keyPrefix = STRIPE_SECRET_KEY?.substring(0, 7);
  console.log("stripe-create-checkout: Stripe configurado", { 
    keyPrefix,
    isProduction: keyPrefix === "sk_live",
    isTest: keyPrefix === "sk_test"
  });

  try {
    console.log("stripe-create-checkout: Parsing request body");
    
    let requestBody: CreateCheckoutRequest;
    try {
      requestBody = await req.json();
    } catch (parseError: any) {
      console.error("stripe-create-checkout: Erro ao fazer parse do body:", parseError.message);
      return new Response(
        JSON.stringify({ error: "Erro ao processar requisição. Body inválido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const {
      planId,
      billingPeriod,
      couponCode,
      userId,
      userEmail,
      cpf,
      landingPageData,
    } = requestBody;

    // LOG CRÍTICO: Verificar exatamente o que foi recebido
    // Usar um único console.log com objeto para garantir que tudo seja exibido
    const debugInfo = {
      "=== DADOS RECEBIDOS ===": "",
      planId: planId,
      planIdType: typeof planId,
      billingPeriod: billingPeriod,
      billingPeriodType: typeof billingPeriod,
      userId: userId,
      userEmail: userEmail,
      "PLAN_PRICE_MAP": PLAN_PRICE_MAP,
      "Price ID esperado": PLAN_PRICE_MAP[planId]?.[billingPeriod],
      "Mapeamento starter/annual": PLAN_PRICE_MAP.starter?.annual,
      "Mapeamento starter/monthly": PLAN_PRICE_MAP.starter?.monthly,
      "Mapeamento pro/annual": PLAN_PRICE_MAP.pro?.annual,
      "Mapeamento pro/monthly": PLAN_PRICE_MAP.pro?.monthly,
    };
    console.log(JSON.stringify(debugInfo, null, 2));

    console.log("stripe-create-checkout: Request parsed", {
      planId,
      billingPeriod,
      hasCouponCode: !!couponCode,
      userId,
      userEmail,
      hasCpf: !!cpf,
      hasLandingPageData: !!landingPageData,
      // Log do mapeamento para debug
      expectedPriceId: PLAN_PRICE_MAP[planId]?.[billingPeriod],
      allPriceIds: JSON.stringify(PLAN_PRICE_MAP, null, 2),
    });

    // Validar userEmail
    if (!userEmail || !userEmail.includes('@')) {
      return new Response(
        JSON.stringify({ error: "userEmail é obrigatório e deve ser um email válido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Validações
    if (!planId || !billingPeriod || !userId) {
      return new Response(
        JSON.stringify({ error: "planId, billingPeriod e userId são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!['starter', 'pro'].includes(planId)) {
      return new Response(
        JSON.stringify({ error: "planId deve ser 'starter' ou 'pro'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!['monthly', 'annual'].includes(billingPeriod)) {
      return new Response(
        JSON.stringify({ error: "billingPeriod deve ser 'monthly' ou 'annual'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Obter Price ID diretamente do mapeamento
    const priceId = PLAN_PRICE_MAP[planId]?.[billingPeriod];
    if (!priceId) {
      console.error(`stripe-create-checkout: Price ID não encontrado para ${planId} ${billingPeriod}`);
      console.error(`stripe-create-checkout: PLAN_PRICE_MAP disponível:`, JSON.stringify(PLAN_PRICE_MAP, null, 2));
      return new Response(
        JSON.stringify({ 
          error: `Price ID não encontrado para plano ${planId} (${billingPeriod}). Verifique a configuração.`,
          debug: {
            planId,
            billingPeriod,
            priceMap: PLAN_PRICE_MAP
          }
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`stripe-create-checkout: Usando Price ID: ${priceId} para ${planId} ${billingPeriod}`);
    console.log(`stripe-create-checkout: Mapeamento verificado - planId: ${planId}, billingPeriod: ${billingPeriod}, priceId: ${priceId}`);

    // Verificar cupom/promotion code se fornecido
    let promotionCodeId: string | undefined;
    if (couponCode) {
      console.log(`stripe-create-checkout: Verificando cupom/promotion code: ${couponCode}`);
      
      // Se começa com "promo_", é um Promotion Code ID - usar diretamente
      if (couponCode.trim().startsWith('promo_')) {
        promotionCodeId = couponCode.trim();
        console.log(`stripe-create-checkout: Usando Promotion Code ID diretamente: ${promotionCodeId}`);
      } else {
        // Tentar buscar como Promotion Code pelo código (ex: "CUMPOM10")
        try {
          const promotionCodes = await stripe.promotionCodes.list({ 
            limit: 100,
          });
          
          const foundPromo = promotionCodes.data.find(p => 
            p.code?.toUpperCase() === couponCode.toUpperCase().trim() && p.active
          );
          
          if (foundPromo) {
            promotionCodeId = foundPromo.id;
            console.log(`stripe-create-checkout: Promotion Code encontrado pelo código "${couponCode}": ${promotionCodeId}`);
          } else {
            // Se não encontrou como Promotion Code, tentar como Coupon
            try {
              const coupon = await stripe.coupons.retrieve(couponCode.trim());
              if (coupon.valid) {
                // Para coupons, usar diretamente o ID do coupon
                promotionCodeId = coupon.id;
                console.log(`stripe-create-checkout: Coupon válido encontrado: ${promotionCodeId}`);
              }
            } catch (couponError: any) {
              // Tentar buscar na lista de coupons
              const coupons = await stripe.coupons.list({ limit: 100 });
              const foundCoupon = coupons.data.find(c => 
                (c.name === couponCode.trim() || c.id === couponCode.trim()) && c.valid
              );
              if (foundCoupon) {
                promotionCodeId = foundCoupon.id;
                console.log(`stripe-create-checkout: Coupon encontrado na lista: ${promotionCodeId}`);
              } else {
                console.warn("stripe-create-checkout: Cupom/Promotion Code não encontrado:", couponCode);
              }
            }
          }
        } catch (searchError: any) {
          console.warn("stripe-create-checkout: Erro ao buscar Promotion Code:", couponCode, searchError.message);
        }
      }
    }

    // Obter URL base do frontend (para redirects)
    const origin = req.headers.get("origin") || "https://docpage.com.br";
    const successUrl = `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/checkout?canceled=true`;

    console.log("stripe-create-checkout: URLs configuradas", { origin, successUrl, cancelUrl });

    // Determinar nome do plano para exibição no Stripe
    const planName = planId === 'pro' ? 'Profissional' : 'Starter';
    const billingPeriodName = billingPeriod === 'annual' ? 'Anual' : 'Mensal';
    const displayName = `${planName} DocPage AI - ${billingPeriodName}`;
    
    // Criar Checkout Session primeiro (para obter session_id)
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ 
        price: priceId, 
        quantity: 1,
      }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: userEmail || undefined,
      metadata: {
        userId,
        planId,
        billingPeriod,
        planName: displayName,
        domain: landingPageData.domain,
        hasCustomDomain: String(landingPageData.hasCustomDomain || false),
        customDomain: landingPageData.customDomain || "",
        cpf: cpf || "",
        // Não incluir landingPageData aqui - será salvo na tabela pending_checkouts
      },
      subscription_data: {
        metadata: { 
          userId, 
          planId, 
          billingPeriod,
          planName: displayName, // Adicionar nome do plano na metadata da subscription
        },
      },
    };
    
    console.log("stripe-create-checkout: Session params configurados", {
      priceId,
      planName: displayName,
      planId,
      billingPeriod,
    });

    if (promotionCodeId) {
      // Se for um Promotion Code (começa com promo_), usar promotion_code
      // Se for um Coupon ID, usar coupon
      if (promotionCodeId.startsWith('promo_')) {
        sessionParams.discounts = [{ promotion_code: promotionCodeId }];
        console.log("stripe-create-checkout: Promotion Code aplicado ao session params:", promotionCodeId);
      } else {
        sessionParams.discounts = [{ coupon: promotionCodeId }];
        console.log("stripe-create-checkout: Coupon aplicado ao session params:", promotionCodeId);
      }
    }

    console.log("stripe-create-checkout: Creating Stripe session", { 
      priceId, 
      hasPromotionCode: !!promotionCodeId,
      promotionCodeId: promotionCodeId,
      customerEmail: sessionParams.customer_email,
      metadataKeys: Object.keys(sessionParams.metadata || {}),
      discounts: sessionParams.discounts,
      successUrl: sessionParams.success_url,
      cancelUrl: sessionParams.cancel_url,
    });
    
    try {
      console.log("stripe-create-checkout: Chamando stripe.checkout.sessions.create...");
      const session = await stripe.checkout.sessions.create(sessionParams);
      console.log("stripe-create-checkout: Session created successfully", { sessionId: session.id, url: session.url });
      
      // Salvar dados completos da landing page na tabela pending_checkouts
      // Isso evita truncamento na metadata do Stripe (limite de 500 chars)
      try {
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.49.1");
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        const { error: insertError } = await supabase
          .from("pending_checkouts")
          .insert({
            user_id: userId,
            stripe_session_id: session.id,
            landing_page_data: landingPageData,
            domain: landingPageData.domain,
            has_custom_domain: landingPageData.hasCustomDomain || false,
            custom_domain: landingPageData.customDomain || null,
            cpf: cpf || null,
          });
        
        if (insertError) {
          console.error("stripe-create-checkout: Erro ao salvar pending_checkout:", insertError);
          // Continuar mesmo se falhar - o webhook pode tentar recuperar pelos metadados básicos
        } else {
          console.log("stripe-create-checkout: Dados salvos em pending_checkouts com sucesso");
        }
      } catch (dbError: any) {
        console.error("stripe-create-checkout: Erro ao conectar ao banco para salvar pending_checkout:", dbError);
        // Continuar mesmo se falhar
      }
      
      return new Response(
        JSON.stringify({ sessionId: session.id, url: session.url }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (stripeError: any) {
      console.error("stripe-create-checkout: Erro ao criar session no Stripe:", {
        message: stripeError.message,
        type: stripeError.type,
        code: stripeError.code,
        param: stripeError.param,
        decline_code: stripeError.decline_code,
        statusCode: stripeError.statusCode,
        raw: stripeError.raw ? JSON.stringify(stripeError.raw).substring(0, 500) : undefined,
      });
      
      // Se for erro de Price ID inválido, retornar erro mais específico
      if (stripeError.code === 'resource_missing' || stripeError.message?.includes('No such price')) {
        return new Response(
          JSON.stringify({ 
            error: `Price ID inválido ou não encontrado: ${priceId}. Verifique se o Price ID está correto e ativo no Stripe Dashboard (modo Live).`,
            details: {
              priceId,
              planId,
              billingPeriod,
              stripeError: stripeError.message,
              code: stripeError.code
            }
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      
      throw stripeError;
    }
  } catch (error: any) {
    console.error("stripe-create-checkout: Error", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      type: error.type,
      code: error.code,
      param: error.param,
    });
    
    // Mensagem de erro mais específica
    let errorMessage = error.message || "Erro ao criar sessão de checkout";
    if (error.type === "StripeInvalidRequestError") {
      errorMessage = `Erro na requisição ao Stripe: ${error.message}. Verifique se os Price IDs estão corretos e ativos.`;
    } else if (error.message?.includes("No such price")) {
      errorMessage = `Price ID inválido. Verifique se os Price IDs estão corretos no Stripe.`;
    } else if (error.message?.includes("STRIPE_SECRET_KEY")) {
      errorMessage = `STRIPE_SECRET_KEY não configurada. Configure no Supabase Dashboard > Settings > Edge Functions > Secrets`;
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error.type || error.name,
        code: error.code,
        param: error.param,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
};

Deno.serve(handler);
