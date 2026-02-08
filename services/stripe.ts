/**
 * Serviço de integração com Stripe
 * 
 * Este serviço chama as Edge Functions do Supabase para criar
 * Checkout Sessions do Stripe de forma segura (sem expor chave secreta).
 */

import { supabase } from '../lib/supabase';

export interface StripeConfig {
  publishableKey: string;
}

export interface CreateCheckoutSessionData {
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
    chosenDomain?: string; // Domínio completo escolhido pelo usuário (com extensão) para usar no email
    hasCustomDomain?: boolean;
    customDomain?: string | null;
  };
}

export interface CreateCheckoutSessionResponse {
  sessionId: string;
  url: string;
}

/**
 * Criar checkout session no Stripe via Edge Function
 */
export async function createCheckoutSession(
  data: CreateCheckoutSessionData
): Promise<CreateCheckoutSessionResponse> {
  try {
    
    // Log detalhado antes de chamar a Edge Function
    console.log('stripe.ts: Chamando Edge Function com dados:', {
      planId: data.planId,
      billingPeriod: data.billingPeriod,
      userId: data.userId,
      userEmail: data.userEmail,
      hasCoupon: !!data.couponCode,
      hasCpf: !!data.cpf,
    });
    
    const { data: response, error } = await supabase.functions.invoke('stripe-create-checkout', {
      body: data,
    });
    
    // Log da resposta
    console.log('stripe.ts: Resposta da Edge Function:', {
      hasResponse: !!response,
      hasError: !!error,
      responseData: response,
      errorData: error,
    });

    if (error) {
      console.error('Erro ao criar checkout session:', error);
      const detailedErrorStatus = (error as any)?.status || (error as any)?.context?.status || (error as any)?.response?.status || undefined;
      
      // Mensagem de erro mais específica para 401
      if (detailedErrorStatus === 401 || error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        throw new Error('A Edge Function stripe-create-checkout não foi encontrada ou não está acessível. Por favor, faça o deploy da função no Supabase usando: npx supabase functions deploy stripe-create-checkout --project-ref ezbwoibhtwiqzgedoajr');
      }
      
      // Mensagem genérica com mais detalhes
      throw new Error(error.message || `Erro ao criar sessão de checkout (Status: ${detailedErrorStatus || 'desconhecido'})`);
    }

    if (!response || !response.sessionId || !response.url) {
      throw new Error('Resposta inválida da Edge Function');
    }

    return {
      sessionId: response.sessionId,
      url: response.url,
    };
  } catch (error: any) {
    console.error('Erro ao criar checkout session:', error);
    throw new Error(error.message || 'Erro ao criar sessão de checkout');
  }
}

/**
 * Processar pagamento (DEPRECATED - não usado mais)
 * O pagamento agora é processado via Stripe Checkout e webhook
 * Mantido apenas para compatibilidade
 */
export async function processPayment(data: {
  planId: string;
  planPrice: number;
  email: string;
  name: string;
  domain: string;
  landingPageData: any;
  paymentMethod?: any;
}): Promise<{
  success: boolean;
  paymentId?: string;
  error?: string;
}> {
  // Esta função não é mais usada - o pagamento é processado via Stripe Checkout
  console.warn('processPayment está deprecated. Use createCheckoutSession e redirecione para Stripe Checkout.');
  
  return {
    success: false,
    error: 'Esta função está deprecated. Use createCheckoutSession.',
  };
}
