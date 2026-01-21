/**
 * Serviço de Dashboard
 * 
 * Fornece dados agregados para o dashboard:
 * - Estatísticas da landing page
 * - Analytics
 * - Informações do domínio
 * - Dados do plano
 */

import { getDashboardStats, DashboardStats } from './analytics';
import { getLandingPageById, LandingPageRow } from './landing-pages';
import { supabase } from '../lib/supabase';

export interface DashboardData {
  landingPage: LandingPageRow;
  stats: DashboardStats;
  domainInfo?: {
    domain: string;
    status: 'active' | 'pending' | 'expired';
    sslStatus: 'active' | 'pending';
    renewalDate?: string;
    customDomain?: string;
  };
}

/**
 * Obter dados completos do dashboard para uma landing page
 */
export async function getDashboardData(landingPageId: string): Promise<DashboardData> {
  // Verificar autenticação e sessão
  let { data: { user }, error: getUserError } = await supabase.auth.getUser();
  
  console.log('getDashboardData - Verificação inicial:', {
    hasUser: !!user,
    userId: user?.id,
    error: getUserError?.message
  });
  
  if (!user || !user.id) {
    console.log('getDashboardData - Usuário não autenticado, tentando refresh...');
    
    // Tentar refresh da sessão
    const { data: { session: refreshResult }, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      console.error('Erro ao refresh da sessão:', refreshError);
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!refreshResult) {
      console.error('Refresh da sessão retornou null');
      throw new Error('Sessão inválida. Por favor, faça login novamente.');
    }
    
    // Verificar novamente após refresh
    const { data: { user: refreshedUser }, error: getUserError2 } = await supabase.auth.getUser();
    
    if (!refreshedUser || !refreshedUser.id) {
      console.error('Usuário ainda não autenticado após refresh:', getUserError2);
      throw new Error('Não foi possível autenticar. Por favor, faça login novamente.');
    }
    
    user = refreshedUser;
    console.log('getDashboardData - Usuário autenticado após refresh:', user.id);
  } else {
    console.log('getDashboardData - Usuário já autenticado:', user.id);
  }

  // Verificar sessão também
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.warn('getDashboardData - Sem sessão disponível, mas usuário existe');
  } else {
    console.log('getDashboardData - Sessão disponível:', {
      sessionUserId: session.user?.id,
      matches: session.user?.id === user.id
    });
  }

  // Obter landing page (getLandingPageById já verifica se pertence ao usuário)
  console.log('getDashboardData - Buscando landing page:', landingPageId);
  const landingPage = await getLandingPageById(landingPageId);
  console.log('getDashboardData - Landing page encontrada:', {
    id: landingPage.id,
    userId: landingPage.user_id,
    matches: landingPage.user_id === user.id
  });

  // Obter estatísticas (30 dias por padrão)
  // Mesmo sem eventos, retornar estrutura vazia ao invés de falhar
  let stats: DashboardStats;
  try {
    stats = await getDashboardStats(landingPageId, 30);
  } catch (statsError: any) {
    console.warn('Erro ao obter estatísticas (pode ser normal se não houver eventos ainda):', statsError);
    // Se falhar (ex: sem eventos ainda), retornar estrutura vazia
    stats = {
      totalVisits: 0,
      totalClicks: 0,
      conversionRate: 0,
      visitsByDay: [],
      clicksByDay: [],
      clicksByAction: [],
      clicksByChannel: [],
      recentEvents: [],
    };
  }

  // Obter informações do domínio (formato path-based: docpage.com.br/xxx)
  const domainInfo = {
    domain: landingPage.custom_domain 
      ? landingPage.custom_domain 
      : `docpage.com.br/${landingPage.subdomain}`,
    status: landingPage.status === 'published' ? ('active' as const) : ('pending' as const),
    sslStatus: 'active' as const,
    customDomain: landingPage.custom_domain || undefined,
    renewalDate: landingPage.published_at
      ? new Date(new Date(landingPage.published_at).getTime() + 365 * 24 * 60 * 60 * 1000)
          .toLocaleDateString('pt-BR')
      : undefined,
  };

  return {
    landingPage,
    stats,
    domainInfo,
  };
}

/**
 * Obter dados do dashboard para todas as landing pages do usuário
 */
export async function getAllDashboardsData(): Promise<DashboardData[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.id) throw new Error('Usuário não autenticado');

  // Obter todas as landing pages do usuário
  const { data: landingPages, error } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Obter dados do dashboard para cada landing page
  const dashboardsData = await Promise.all(
    (landingPages || []).map(async (lp) => {
      const stats = await getDashboardStats(lp.id, 30);
      const domainInfo = {
        domain: `${lp.subdomain}.com.br`,
        status: lp.status === 'published' ? ('active' as const) : ('pending' as const),
        sslStatus: 'active' as const,
        customDomain: lp.custom_domain || undefined,
        renewalDate: lp.published_at
          ? new Date(new Date(lp.published_at).getTime() + 365 * 24 * 60 * 60 * 1000)
              .toLocaleDateString('pt-BR')
          : undefined,
      };

      return {
        landingPage: lp,
        stats,
        domainInfo,
      };
    })
  );

  return dashboardsData;
}
