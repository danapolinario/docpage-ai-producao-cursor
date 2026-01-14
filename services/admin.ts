import { supabase } from '../lib/supabase';

const FUNCTIONS_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  user_metadata?: {
    name?: string;
  };
}

export interface LandingPageWithUser {
  id: string;
  subdomain: string;
  custom_domain: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  user_id: string;
  user_email?: string;
  briefing_data: any;
  content_data: any;
}

export type LandingPageStatus = 'draft' | 'published';

/**
 * Login de administrador via edge function
 */
export async function adminLogin(email: string, password: string) {
  const response = await fetch(`${FUNCTIONS_BASE_URL}/admin-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Erro ao fazer login de admin');
  }
  
  // Set session in Supabase client
  if (data.session) {
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  }
  
  return data;
}

/**
 * Verificar se o usuário atual é admin
 */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();
    
    return !!data;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Obter todas as landing pages (admin only)
 */
export async function getAllLandingPages(): Promise<LandingPageWithUser[]> {
  const { data, error } = await supabase
    .from('landing_pages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching landing pages:', error);
    throw error;
  }

  return data || [];
}

/**
 * Atualizar status de uma landing page
 */
export async function updateLandingPageStatus(
  landingPageId: string, 
  status: LandingPageStatus
): Promise<void> {
  const updateData: any = { status };
  
  // Se está publicando, adicionar published_at
  if (status === 'published') {
    updateData.published_at = new Date().toISOString();
  }
  
  const { error } = await supabase
    .from('landing_pages')
    .update(updateData)
    .eq('id', landingPageId);

  if (error) {
    console.error('Error updating landing page status:', error);
    throw error;
  }

  // Ao publicar, dispara email automático avisando que o site está no ar
  if (status === 'published') {
    try {
      await fetch(`${FUNCTIONS_BASE_URL}/notify-site-published`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ landingPageId }),
      });
    } catch (notifyError) {
      console.error('Error notifying site published:', notifyError);
      // Não lançar erro aqui para não quebrar o fluxo do admin
    }
  }
}

/**
 * Obter estatísticas do admin
 */
export async function getAdminStats() {
  const { data: landingPages, error } = await supabase
    .from('landing_pages')
    .select('id, status, created_at');

  if (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }

  const total = landingPages?.length || 0;
  const published = landingPages?.filter(lp => lp.status === 'published').length || 0;
  const draft = landingPages?.filter(lp => lp.status === 'draft').length || 0;

  return {
    total,
    published,
    pending: 0,
    draft,
  };
}
