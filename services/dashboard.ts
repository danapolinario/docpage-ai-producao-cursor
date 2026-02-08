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

  // Buscar o domínio escolhido pelo usuário na etapa de checkout (pode estar em pending_checkouts)
  let chosenDomain: string | null = null;
  try {
    console.log('dashboard.ts: Buscando domínio escolhido no pending_checkouts', {
      landingPageId,
      userId: user.id,
    });
    
    // Tentar buscar pelo landing_page_id primeiro (mais específico)
    let pendingCheckout = null;
    
    const { data: byLandingPageId } = await supabase
      .from("pending_checkouts")
      .select("domain, has_custom_domain, custom_domain")
      .eq("landing_page_id", landingPageId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (byLandingPageId) {
      pendingCheckout = byLandingPageId;
      console.log('dashboard.ts: Domínio encontrado por landing_page_id:', pendingCheckout);
    } else {
      // Se não encontrou, buscar pelo user_id
      const { data: byUserId } = await supabase
        .from("pending_checkouts")
        .select("domain, has_custom_domain, custom_domain")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (byUserId) {
        pendingCheckout = byUserId;
        console.log('dashboard.ts: Domínio encontrado por user_id:', pendingCheckout);
      } else {
        console.log('dashboard.ts: Nenhum domínio encontrado no pending_checkouts');
      }
    }
    
    if (pendingCheckout) {
      // Se tem domínio customizado, usar ele; senão, usar o domínio escolhido (com extensão)
      chosenDomain = pendingCheckout.has_custom_domain && pendingCheckout.custom_domain
        ? pendingCheckout.custom_domain
        : pendingCheckout.domain; // Este é o domínio escolhido pelo usuário (ex: "testefinaldocpage.com.br")
      
      console.log('dashboard.ts: Domínio escolhido determinado:', {
        chosenDomain,
        hasCustomDomain: pendingCheckout.has_custom_domain,
        customDomain: pendingCheckout.custom_domain,
        domain: pendingCheckout.domain,
      });
    }
  } catch (error) {
    console.warn('Erro ao buscar domínio escolhido do pending_checkouts:', error);
  }

  // Obter informações do domínio
  // Prioridade: 1) chosenDomain (do pending_checkouts), 2) custom_domain, 3) subdomain.docpage.com.br
  let displayDomain: string;
  if (chosenDomain) {
    displayDomain = chosenDomain;
    console.log('dashboard.ts: Usando domínio escolhido do pending_checkouts:', displayDomain);
  } else if (landingPage.custom_domain) {
    displayDomain = landingPage.custom_domain;
    console.log('dashboard.ts: Usando custom_domain da landing page:', displayDomain);
  } else {
    displayDomain = `${landingPage.subdomain}.docpage.com.br`;
    console.log('dashboard.ts: Usando fallback subdomain.docpage.com.br:', displayDomain);
  }

  // Garantir que o domínio não tenha protocolo
  displayDomain = displayDomain.replace(/^https?:\/\//, '');
  
  // Se o domínio não contém extensão (.com.br, .com, etc), adicionar .docpage.com.br
  // Isso é um fallback de segurança caso o chosenDomain não tenha sido salvo com extensão
  if (!displayDomain.includes('.') && !displayDomain.includes('docpage')) {
    console.warn('dashboard.ts: Domínio sem extensão detectado, adicionando .docpage.com.br:', displayDomain);
    displayDomain = `${displayDomain}.docpage.com.br`;
  }
  
  console.log('dashboard.ts: Domínio final determinado:', displayDomain);

  const domainInfo = {
    domain: displayDomain,
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
      
      // Buscar o domínio escolhido pelo usuário na etapa de checkout (pode estar em pending_checkouts)
      let chosenDomain: string | null = null;
      try {
        const { data: pendingCheckout } = await supabase
          .from("pending_checkouts")
          .select("domain, has_custom_domain, custom_domain")
          .or(`landing_page_id.eq.${lp.id},user_id.eq.${user.id}`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (pendingCheckout) {
          // Se tem domínio customizado, usar ele; senão, usar o domínio escolhido (com extensão)
          chosenDomain = pendingCheckout.has_custom_domain && pendingCheckout.custom_domain
            ? pendingCheckout.custom_domain
            : pendingCheckout.domain; // Este é o domínio escolhido pelo usuário (ex: "testefinaldocpage.com.br")
        }
      } catch (error) {
        console.warn('Erro ao buscar domínio escolhido do pending_checkouts:', error);
      }

      // Prioridade: 1) chosenDomain (do pending_checkouts), 2) custom_domain, 3) subdomain.docpage.com.br
      let displayDomain: string;
      if (chosenDomain) {
        displayDomain = chosenDomain;
      } else if (lp.custom_domain) {
        displayDomain = lp.custom_domain;
      } else {
        displayDomain = `${lp.subdomain}.docpage.com.br`;
      }

      // Garantir que o domínio não tenha protocolo
      displayDomain = displayDomain.replace(/^https?:\/\//, '');

      const domainInfo = {
        domain: displayDomain,
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
