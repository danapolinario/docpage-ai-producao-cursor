/**
 * Serviço de Analytics
 * 
 * Gerencia eventos de analytics das landing pages:
 * - Registro de visualizações
 * - Registro de cliques em botões
 * - Rastreamento de canais de origem
 * - Estatísticas e métricas
 */

import { supabase } from '../lib/supabase';

export interface AnalyticsEvent {
  id?: string;
  landing_page_id: string;
  event_type: 'page_view' | 'click' | 'form_submit' | 'phone_call' | 'whatsapp_click';
  event_data?: {
    action?: string; // Nome do botão/ação (ex: "Botão WhatsApp (Flu)")
    element?: string; // ID ou seletor do elemento
    section?: string; // Seção da página (ex: "hero", "footer")
    value?: any; // Valor adicional (ex: telefone, email)
  };
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  country?: string;
  city?: string;
  created_at?: string;
}

/**
 * Registrar evento de analytics
 * Pode ser chamado sem autenticação (para tracking público)
 */
export async function trackEvent(
  landingPageId: string,
  eventType: AnalyticsEvent['event_type'],
  eventData?: AnalyticsEvent['event_data'],
  metadata?: {
    ip_address?: string;
    user_agent?: string;
    referrer?: string;
    country?: string;
    city?: string;
  }
): Promise<void> {
  try {
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        landing_page_id: landingPageId,
        event_type: eventType,
        event_data: eventData || {},
        ip_address: metadata?.ip_address,
        user_agent: metadata?.user_agent,
        referrer: metadata?.referrer,
        country: metadata?.country,
        city: metadata?.city,
      });

    if (error) {
      console.error('Erro ao registrar evento de analytics:', error);
      // Não lançar erro para não quebrar o fluxo do usuário
    }
  } catch (error) {
    console.error('Erro ao registrar evento de analytics:', error);
    // Não lançar erro para não quebrar o fluxo do usuário
  }
}

/**
 * Registrar visualização de página
 */
export async function trackPageView(
  landingPageId: string,
  metadata?: {
    ip_address?: string;
    user_agent?: string;
    referrer?: string;
    country?: string;
    city?: string;
  }
): Promise<void> {
  // Também atualizar view_count na landing_page
  try {
    // Registrar evento primeiro
    await trackEvent(landingPageId, 'page_view', undefined, metadata);
    
    // Atualizar contador na landing_page
    // Primeiro obter valor atual
    const { data: current } = await supabase
      .from('landing_pages')
      .select('view_count')
      .eq('id', landingPageId)
      .single();
    
    if (current) {
      // Atualizar com novo valor
      await supabase
        .from('landing_pages')
        .update({
          view_count: (current.view_count || 0) + 1,
          last_viewed_at: new Date().toISOString(),
        })
        .eq('id', landingPageId);
    }
  } catch (error) {
    console.error('Erro ao registrar visualização:', error);
  }
}

/**
 * Registrar clique em botão/ação
 */
export async function trackClick(
  landingPageId: string,
  action: string,
  section?: string,
  metadata?: {
    ip_address?: string;
    user_agent?: string;
    referrer?: string;
    country?: string;
    city?: string;
  }
): Promise<void> {
  await trackEvent(
    landingPageId,
    'click',
    {
      action,
      section,
    },
    metadata
  );
}

/**
 * Obter eventos de uma landing page
 */
export async function getEvents(
  landingPageId: string,
  options?: {
    eventType?: AnalyticsEvent['event_type'];
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<AnalyticsEvent[]> {
  // Verificar autenticação
  const { data: { user }, error: getUserError } = await supabase.auth.getUser();
  if (!user || !user.id) {
    // Tentar refresh
    await supabase.auth.refreshSession();
    const { data: { user: refreshedUser } } = await supabase.auth.getUser();
    
    if (!refreshedUser || !refreshedUser.id) {
      throw new Error('Usuário não autenticado');
    }
  }

  let query = supabase
    .from('analytics_events')
    .select('*')
    .eq('landing_page_id', landingPageId);

  if (options?.eventType) {
    query = query.eq('event_type', options.eventType);
  }

  if (options?.startDate) {
    query = query.gte('created_at', options.startDate.toISOString());
  }

  if (options?.endDate) {
    query = query.lte('created_at', options.endDate.toISOString());
  }

  query = query.order('created_at', { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
  }

  const { data, error } = await query;

  if (error) {
    // Se não houver eventos ainda (tabela vazia ou RLS bloqueando), retornar array vazio
    if (error.code === 'PGRST116' || error.message?.includes('permission denied')) {
      console.warn('Sem eventos ou sem permissão para ver eventos:', error.message);
      return [];
    }
    throw error;
  }
  
  return data || [];
}

/**
 * Obter estatísticas agregadas de uma landing page
 */
export interface DashboardStats {
  totalVisits: number;
  totalClicks: number;
  conversionRate: number;
  visitsByDay: { date: string; count: number }[];
  clicksByDay: { date: string; count: number }[];
  clicksByAction: { action: string; count: number }[];
  clicksByChannel: { channel: string; count: number }[];
  recentEvents: AnalyticsEvent[];
}

export async function getDashboardStats(
  landingPageId: string,
  days: number = 30
): Promise<DashboardStats> {
  // Verificar autenticação
  const { data: { user }, error: getUserError } = await supabase.auth.getUser();
  if (!user || !user.id) {
    // Tentar refresh
    await supabase.auth.refreshSession();
    const { data: { user: refreshedUser } } = await supabase.auth.getUser();
    
    if (!refreshedUser || !refreshedUser.id) {
      throw new Error('Usuário não autenticado');
    }
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Obter todos os eventos do período (pode retornar array vazio se não houver eventos)
  let events: AnalyticsEvent[] = [];
  try {
    events = await getEvents(landingPageId, {
      startDate,
      endDate,
    });
  } catch (eventsError: any) {
    console.warn('Erro ao obter eventos (pode ser normal se não houver eventos ainda):', eventsError);
    // Se falhar (ex: tabela vazia, sem permissões), retornar estrutura vazia
    events = [];
  }

  // Calcular estatísticas
  const pageViews = events.filter((e) => e.event_type === 'page_view');
  const clicks = events.filter((e) => e.event_type === 'click');

  // Agrupar por dia
  const visitsByDayMap = new Map<string, number>();
  const clicksByDayMap = new Map<string, number>();

  for (let i = 0; i < days; i++) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    visitsByDayMap.set(dateStr, 0);
    clicksByDayMap.set(dateStr, 0);
  }

  pageViews.forEach((event) => {
    if (event.created_at) {
      const dateStr = event.created_at.split('T')[0];
      visitsByDayMap.set(dateStr, (visitsByDayMap.get(dateStr) || 0) + 1);
    }
  });

  clicks.forEach((event) => {
    if (event.created_at) {
      const dateStr = event.created_at.split('T')[0];
      clicksByDayMap.set(dateStr, (clicksByDayMap.get(dateStr) || 0) + 1);
    }
  });

  // Converter mapas para arrays ordenados
  const visitsByDay = Array.from(visitsByDayMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));

  const clicksByDay = Array.from(clicksByDayMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));

  // Agrupar cliques por ação
  const clicksByActionMap = new Map<string, number>();
  clicks.forEach((event) => {
    const action = event.event_data?.action || 'Desconhecido';
    clicksByActionMap.set(action, (clicksByActionMap.get(action) || 0) + 1);
  });
  const clicksByAction = Array.from(clicksByActionMap.entries())
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count);

  // Agrupar cliques por canal (baseado no referrer)
  const clicksByChannelMap = new Map<string, number>();
  clicks.forEach((event) => {
    const referrer = event.referrer || 'Direto';
    let channel = 'Direto';
    
    if (referrer.includes('google')) channel = 'Google Ads';
    else if (referrer.includes('instagram')) channel = 'Instagram';
    else if (referrer.includes('facebook')) channel = 'Facebook';
    else if (referrer !== 'Direto') channel = 'Indicação';
    
    clicksByChannelMap.set(channel, (clicksByChannelMap.get(channel) || 0) + 1);
  });
  const clicksByChannel = Array.from(clicksByChannelMap.entries())
    .map(([channel, count]) => ({ channel, count }))
    .sort((a, b) => b.count - a.count);

  // Calcular taxa de conversão
  const totalVisits = pageViews.length;
  const totalClicks = clicks.length;
  const conversionRate = totalVisits > 0 ? (totalClicks / totalVisits) * 100 : 0;

  // Eventos recentes (últimos 10 cliques)
  const recentEvents = clicks
    .sort((a, b) => {
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bDate - aDate;
    })
    .slice(0, 10);

  return {
    totalVisits,
    totalClicks,
    conversionRate,
    visitsByDay,
    clicksByDay,
    clicksByAction,
    clicksByChannel,
    recentEvents,
  };
}
