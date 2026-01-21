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
 * SOLUÇÃO DEFINITIVA: Usa supabase.functions.invoke() que adiciona headers automaticamente
 */
export async function getAllLandingPages(): Promise<LandingPageWithUser[]> {
  // Obter usuário atual
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Usuário não autenticado. Por favor, faça login novamente.');
  }

  // Usar supabase.functions.invoke() que adiciona headers automaticamente
  const { data, error } = await supabase.functions.invoke('admin-get-pages', {
    body: { userId: user.id },
  });

  if (error) {
    console.error('Error fetching landing pages:', error);
    throw new Error(error.message || 'Erro ao buscar landing pages');
  }

  return (data as any)?.data || [];
}

/**
 * Atualizar status de uma landing page
 */
export async function updateLandingPageStatus(
  landingPageId: string, 
  status: LandingPageStatus
): Promise<void> {
  // Obter usuário atual
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Usuário não autenticado. Por favor, faça login novamente.');
  }

  // Usar supabase.functions.invoke() que adiciona headers automaticamente
  const { error } = await supabase.functions.invoke('admin-update-status', {
    body: { userId: user.id, landingPageId, status },
  });

  if (error) {
    console.error('Error updating landing page status:', error);
    throw new Error(error.message || 'Erro ao atualizar status');
  }

  // Ao publicar, dispara email automático avisando que o site está no ar
  if (status === 'published') {
    try {
      console.log('Enviando email de notificação de publicação (via admin):', landingPageId);
      const notifyResponse = await fetch(`${FUNCTIONS_BASE_URL}/notify-site-published`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ landingPageId }),
      });
      
      const notifyData = await notifyResponse.json();
      
      if (!notifyResponse.ok) {
        console.error('Erro ao enviar email de notificação (via admin):', {
          status: notifyResponse.status,
          statusText: notifyResponse.statusText,
          error: notifyData.error || notifyData,
          landingPageId,
        });
      } else {
        console.log('Email de publicação enviado com sucesso (via admin):', {
          landingPageId,
          response: notifyData,
        });
      }
    } catch (notifyError: any) {
      console.error('Error notifying site published:', {
        landingPageId,
        error: notifyError.message || notifyError,
        stack: notifyError.stack,
      });
      // Não lançar erro aqui para não quebrar o fluxo do admin
    }
  }
}

/**
 * Obter estatísticas do admin
 */
export async function getAdminStats() {
  // Usar getAllLandingPages que já bypassa RLS
  const landingPages = await getAllLandingPages();

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

/**
 * Obter configuração de publicação automática
 */
export async function getAutoPublishSetting(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'auto_publish_enabled')
      .single();

    if (error || !data) {
      // Se não existe, retorna false (padrão)
      console.log('Configuração de publicação automática não encontrada, usando padrão (false)');
      return false;
    }

    // O valor está em JSONB, pode ser boolean direto ou string
    const value = data.value;
    
    // Se já é boolean, retornar diretamente
    if (typeof value === 'boolean') {
      return value;
    }
    
    // Se é string, converter
    if (typeof value === 'string') {
      return value === 'true' || value === 'True';
    }
    
    // Se é número (0 = false, 1 = true)
    if (typeof value === 'number') {
      return value !== 0;
    }
    
    // Default: false
    return false;
  } catch (error) {
    console.error('Error getting auto publish setting:', error);
    // Em caso de erro, retornar false (padrão seguro)
    return false;
  }
}

/**
 * Atualizar configuração de publicação automática
 */
export async function updateAutoPublishSetting(enabled: boolean): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  // Verificar se é admin
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    throw new Error('Apenas administradores podem alterar configurações');
  }

  const { error } = await supabase
    .from('admin_settings')
    .upsert({
      key: 'auto_publish_enabled',
      value: enabled,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'key',
    });

  if (error) {
    console.error('Error updating auto publish setting:', error);
    throw new Error(error.message || 'Erro ao atualizar configuração');
  }
}
