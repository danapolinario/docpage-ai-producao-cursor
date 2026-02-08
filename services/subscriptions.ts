/**
 * Serviço de Subscriptions
 * 
 * Fornece funções para buscar informações de assinaturas do Stripe
 */

import { supabase } from '../lib/supabase';

export interface Subscription {
  id: string;
  user_id: string;
  landing_page_id: string | null;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string;
  plan_id: 'starter' | 'pro';
  billing_period: 'monthly' | 'annual';
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  coupon_id: string | null;
  coupon_name: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Obter assinatura do usuário atual
 */
export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Nenhuma assinatura encontrada
      return null;
    }
    console.error('Error fetching user subscription:', error);
    throw error;
  }

  return data;
}

/**
 * Obter todas as assinaturas de um usuário (incluindo canceladas)
 */
export async function getUserSubscriptions(userId: string): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user subscriptions:', error);
    throw error;
  }

  return data || [];
}

/**
 * Obter assinatura por landing page ID
 */
export async function getSubscriptionByLandingPage(landingPageId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('landing_page_id', landingPageId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching subscription by landing page:', error);
    throw error;
  }

  return data;
}

/**
 * Obter todas as assinaturas (admin only)
 */
export async function getAllSubscriptions(): Promise<Subscription[]> {
  // Verificar se é admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  // Verificar se é admin (usar a mesma lógica do admin.ts)
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single();

  if (!roleData) {
    throw new Error('Acesso negado. Apenas administradores podem ver todas as assinaturas.');
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all subscriptions:', error);
    throw error;
  }

  return data || [];
}

/**
 * Sincronizar status das subscriptions com o Stripe (admin only)
 */
export async function syncSubscriptionsWithStripe(): Promise<{ updated: number; total: number; errors?: string[] }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  // Usar Edge Function para sincronizar
  const { data, error } = await supabase.functions.invoke('admin-sync-subscriptions', {
    body: { userId: user.id },
  });

  if (error) {
    console.error('Erro ao sincronizar subscriptions:', error);
    throw error;
  }

  const result = data || { updated: 0, total: 0 };
  console.log('Resultado da sincronização:', result);
  
  if (result.errors && result.errors.length > 0) {
    console.warn('Alguns erros durante a sincronização:', result.errors);
  }

  return result;
}

/**
 * Obter assinaturas com informações do usuário (admin only)
 * Nota: Não podemos acessar auth.users diretamente via Supabase client
 * Os emails dos usuários devem vir das landing pages ou ser obtidos via Edge Function
 */
export async function getSubscriptionsWithUsers(): Promise<(Subscription & { user_email?: string })[]> {
  const subscriptions = await getAllSubscriptions();
  
  // Buscar emails dos usuários através das landing pages
  const landingPageIds = subscriptions
    .map(s => s.landing_page_id)
    .filter((id): id is string => id !== null);
  
  if (landingPageIds.length > 0) {
    const { data: landingPages, error } = await supabase
      .from('landing_pages')
      .select('id, briefing_data')
      .in('id', landingPageIds);

    if (!error && landingPages) {
      const emailMap = new Map<string, string>();
      landingPages.forEach(lp => {
        if (lp.briefing_data?.contactEmail) {
          emailMap.set(lp.id, lp.briefing_data.contactEmail);
        }
      });

      return subscriptions.map(sub => ({
        ...sub,
        user_email: sub.landing_page_id ? emailMap.get(sub.landing_page_id) : undefined,
      }));
    }
  }

  return subscriptions.map(sub => ({
    ...sub,
    user_email: undefined,
  }));
}
