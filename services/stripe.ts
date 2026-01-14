/**
 * Serviço de integração com Stripe
 * 
 * NOTA: Este é um exemplo básico. Em produção, você precisa:
 * 1. Criar um backend API para processar pagamentos (evitar expor chave secreta)
 * 2. Usar Stripe Checkout Session ou Payment Intent
 * 3. Implementar webhooks para confirmar pagamentos
 */

// Para desenvolvimento, use a chave pública do Stripe
// Em produção, crie um backend API que usa a chave secreta

export interface StripeConfig {
  publishableKey: string;
  apiKey?: string; // Para backend (nunca exponha no frontend!)
}

// Função loadStripe removida - não está sendo usada e causava erro de import
// Se precisar usar Stripe no futuro, adicione @stripe/stripe-js ao package.json e descomente:
//
// import { loadStripe as loadStripeSDK } from '@stripe/stripe-js';
//
// export async function loadStripe(publishableKey: string) {
//   if (typeof window === 'undefined') return null;
//   return loadStripeSDK(publishableKey);
// }

/**
 * Criar checkout session no backend
 * Em produção, chame sua API backend que cria a sessão no Stripe
 */
export async function createCheckoutSession(data: {
  planId: string;
  planPrice: number;
  email: string;
  landingPageData: any;
  domain: string;
}) {
  // TODO: Implementar chamada para backend API
  // Exemplo:
  // const response = await fetch('/api/stripe/create-checkout', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(data)
  // });
  // return response.json();
  
  // Por enquanto, retorna mock
  return {
    sessionId: 'mock_session_id',
    url: '#',
  };
}

/**
 * Processar pagamento (mock para desenvolvimento)
 * Em produção, use Stripe Checkout ou Payment Intents via backend
 */
export async function processPayment(data: {
  planId: string;
  planPrice: number;
  email: string;
  name: string;
  domain: string;
  landingPageData: any;
  paymentMethod?: any; // Stripe Payment Method
}): Promise<{
  success: boolean;
  paymentId?: string;
  error?: string;
}> {
  // TODO: Implementar processamento real via backend
  // Por enquanto, simula sucesso após 2 segundos
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        paymentId: `pay_mock_${Date.now()}`,
      });
    }, 2000);
  });
}
