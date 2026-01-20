
import React, { useState, useMemo, useEffect } from 'react';
import { BriefingData, LandingPageContent, DesignSettings, SectionVisibility, LayoutVariant, Plan } from '../types';
import { Preview } from './Preview';
import { getDashboardData, DashboardData } from '../services/dashboard';
import { updateLandingPage } from '../services/landing-pages';
import { supabase } from '../lib/supabase';

interface Props {
  doctorName: string;
  domain: string;
  plan: Plan;
  content: LandingPageContent;
  design: DesignSettings;
  visibility: SectionVisibility;
  photoUrl: string | null;
  aboutPhotoUrl: string | null;
  briefing: BriefingData;
  layoutVariant: LayoutVariant;
  onEditSite?: () => void;
  landingPageId?: string; // ID da landing page para carregar dados do backend
}

// --- Helper: Interactive SVG Line Chart ---
const InteractiveLineChart = ({ data, color, height = 60 }: { data: number[], color: string, height?: number }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const padding = 10;
  const chartHeight = height - padding * 2;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 300; 
    const y = padding + (chartHeight - ((val - min) / range) * chartHeight);
    return { x, y, val };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="w-full h-full relative" onMouseLeave={() => setHoveredIndex(null)}>
      <svg viewBox={`0 0 300 ${height}`} className="w-full h-full overflow-visible">
        {/* Line */}
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polylinePoints}
          className={color}
        />
        
        {/* Interactive Areas (Invisible Rects for better hover target) */}
        {points.map((p, i) => (
           <rect 
             key={`rect-${i}`}
             x={p.x - (300 / points.length) / 2}
             y={0}
             width={300 / points.length}
             height={height}
             fill="transparent"
             onMouseEnter={() => setHoveredIndex(i)}
             className="cursor-crosshair"
           />
        ))}

        {/* Hover Points & Tooltip */}
        {points.map((p, i) => (
           <g key={`point-${i}`} style={{ opacity: hoveredIndex === i ? 1 : 0, transition: 'opacity 0.1s' }} pointerEvents="none">
              <circle cx={p.x} cy={p.y} r={5} fill="white" stroke="currentColor" strokeWidth="3" className={color} />
              {/* Tooltip */}
              <foreignObject x={Math.min(Math.max(p.x - 30, 0), 240)} y={Math.max(p.y - 35, -10)} width="60" height="30">
                 <div className="bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded shadow-lg text-center">
                    {p.val}
                 </div>
              </foreignObject>
           </g>
        ))}
      </svg>
    </div>
  );
};

type ViewState = 'overview' | 'settings' | 'domain' | 'social' | 'testimonials';

export const Dashboard: React.FC<Props> = ({ 
  doctorName, domain, plan, 
  content, design, visibility, photoUrl, aboutPhotoUrl, briefing, layoutVariant,
  onEditSite,
  landingPageId
}) => {
  const [activeView, setActiveView] = useState<ViewState>('overview');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testimonials, setTestimonials] = useState(content.testimonials || []);
  const [isSavingTestimonials, setIsSavingTestimonials] = useState(false);

  // Carregar dados do backend se landingPageId for fornecido
  useEffect(() => {
    // Track dashboard view
    trackDashboardView();
    
    if (landingPageId) {
      setIsLoading(true);
      setError(null);
      
      // Aguardar mais tempo para garantir que a sessão está sincronizada após o checkout
      const loadDashboard = async () => {
        try {
          // Sempre fazer refresh da sessão primeiro para garantir que está atualizada
          console.log('Dashboard: Fazendo refresh da sessão...');
          const { data: { session: refreshResult }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error('Erro ao refresh da sessão no Dashboard:', refreshError);
          }
          
          if (!refreshResult) {
            console.warn('Refresh da sessão retornou null, tentando novamente...');
            // Tentar mais uma vez após um delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            const { data: { session: retryRefresh } } = await supabase.auth.refreshSession();
            if (!retryRefresh) {
              throw new Error('Sessão inválida. Por favor, faça login novamente.');
            }
          }
          
          // Aguardar mais tempo para garantir que a sessão está propagada
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Verificar autenticação após refresh
          const { data: { user }, error: getUserError } = await supabase.auth.getUser();
          
          if (!user || !user.id) {
            // Tentar mais uma vez
            await new Promise(resolve => setTimeout(resolve, 1000));
            const { data: { user: retryUser } } = await supabase.auth.getUser();
            
            if (!retryUser || !retryUser.id) {
              console.error('Usuário não autenticado após refresh:', getUserError);
              throw new Error('Sessão expirada. Por favor, faça login novamente.');
            }
            
            console.log('Usuário autenticado após retry:', retryUser.id);
          } else {
            console.log('Usuário já autenticado:', user.id);
          }
          
          // Verificar sessão também
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            console.warn('Sem sessão disponível, mas usuário existe. Aguardando mais um pouco...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (!retrySession) {
              throw new Error('Sessão não disponível. Por favor, faça login novamente.');
            }
          }
          
          // Carregar dados do dashboard
          console.log('Carregando dados do dashboard para landingPageId:', landingPageId);
          const data = await getDashboardData(landingPageId);
          console.log('Dados do dashboard carregados com sucesso:', data);
          setDashboardData(data);
          setIsLoading(false);
        } catch (err: any) {
          console.error('Erro ao carregar dados do dashboard:', err);
          console.error('Detalhes do erro:', {
            message: err.message,
            landingPageId,
            error: err
          });
          
          // Verificar se é erro de autenticação
          if (err.message?.includes('autenticado') || err.message?.includes('authenticated') || err.message?.includes('Sessão')) {
            setError('Sessão expirada. Por favor, faça login novamente.');
          } else if (err.message?.includes('não pertence')) {
            setError('Esta landing page não pertence ao seu usuário.');
          } else {
            setError(err.message || 'Erro ao carregar dados do dashboard.');
          }
          
          setIsLoading(false);
        }
      };
      
      loadDashboard();
    } else {
      console.warn('Dashboard renderizado sem landingPageId - usando dados mock');
    }
  }, [landingPageId]);

  // Usar dados do backend ou dados mock
  const { chartData, tableData } = useMemo(() => {
    // Se tem landingPageId, SEMPRE usar dados do backend (mesmo que vazios)
    // Se não tem landingPageId, usar dados mock (compatibilidade)
    if (landingPageId && dashboardData) {
      // Atualizar testimonials state com dados do backend
      if (dashboardData.landingPage?.content_data?.testimonials) {
        setTestimonials(dashboardData.landingPage.content_data.testimonials);
      }

      // Usar dados reais do backend (podem estar vazios se não houver eventos ainda)
      const visits = dashboardData.stats.visitsByDay.map(d => d.count);
      const clicks = dashboardData.stats.clicksByDay.map(d => d.count);
      
      // Preencher com zeros se arrays estiverem vazios (para gráficos)
      const visitsArray = visits.length > 0 ? visits : Array(30).fill(0);
      const clicksArray = clicks.length > 0 ? clicks : Array(30).fill(0);
      
      // Converter eventos recentes para formato da tabela
      const logs = dashboardData.stats.recentEvents.map((event, idx) => {
        const date = event.created_at ? new Date(event.created_at) : new Date();
        const channel = event.referrer?.includes('google') ? 'Google Ads' :
                       event.referrer?.includes('instagram') ? 'Instagram' :
                       event.referrer?.includes('facebook') ? 'Facebook' :
                       event.referrer ? 'Indicação' : 'Direto';
        
        return {
          id: event.id || `${idx}`,
          action: event.event_data?.action || 'Clique',
          channel,
          date: date.toLocaleDateString('pt-BR'),
          time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
      });
      
      return { 
        chartData: { visits: visitsArray, clicks: clicksArray }, 
        tableData: logs 
      };
    } else if (landingPageId) {
      // Tem landingPageId mas não tem dados ainda (carregando ou erro)
      // Retornar dados vazios ao invés de mock
      return {
        chartData: { visits: Array(30).fill(0), clicks: Array(30).fill(0) },
        tableData: []
      };
    } else {
      // Fallback: dados mock (para compatibilidade quando não há landingPageId)
      const visits = [];
      const clicks = [];
      const logs = [];
      const actions = ['Botão WhatsApp (Flu)', 'Agendar Consulta (Hero)', 'Ver Especialidades', 'Link Rodapé', 'Telefone (Click-to-call)'];
      const channels = ['Google Ads', 'Instagram', 'Direto', 'Facebook', 'Indicação'];

      for (let i = 29; i >= 0; i--) {
        const v = Math.floor(Math.random() * 50) + 20 + (i % 7) * 10;
        const c = Math.floor(Math.random() * 15) + 2;
        visits.push(v);
        clicks.push(c);

        const logsCount = Math.floor(Math.random() * 4); 
        for (let j = 0; j < logsCount; j++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          logs.push({
            id: `${i}-${j}`,
            action: actions[Math.floor(Math.random() * actions.length)],
            channel: channels[Math.floor(Math.random() * channels.length)],
            date: date.toLocaleDateString('pt-BR'),
            time: `${Math.floor(Math.random() * 12 + 8)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`
          });
        }
      }
      return { chartData: { visits, clicks }, tableData: logs.reverse() };
    }
  }, [dashboardData]);

  // Calculate Conversion Rate (30 Days)
  const totalVisits = dashboardData?.stats?.totalVisits || chartData.visits.reduce((a, b) => a + b, 0);
  const totalClicks = dashboardData?.stats?.totalClicks || chartData.clicks.reduce((a, b) => a + b, 0);
  const conversionRate30d = totalVisits > 0 ? ((totalClicks / totalVisits) * 100).toFixed(1) : '0.0';

  // Calculate Conversion Rate (7 Days)
  const last7Visits = dashboardData?.stats 
    ? dashboardData.stats.visitsByDay.slice(-7).reduce((a, b) => a + b.count, 0)
    : chartData.visits.slice(-7).reduce((a, b) => a + b, 0);
  const last7Clicks = dashboardData?.stats
    ? dashboardData.stats.clicksByDay.slice(-7).reduce((a, b) => a + b.count, 0)
    : chartData.clicks.slice(-7).reduce((a, b) => a + b, 0);
  const conversionRate7d = last7Visits > 0 ? ((last7Clicks / last7Visits) * 100).toFixed(1) : '0.0';

  // Calculate All Time (usar dados de 30 dias como referência)
  const conversionRateAllTime = (parseFloat(conversionRate30d) * 0.95).toFixed(1);
 
  // Detectar se ainda está usando depoimentos padrão/ilustrativos
  const hasDefaultTestimonials =
    visibility.testimonials &&
    Array.isArray(content.testimonials) &&
    content.testimonials.length > 0 &&
    content.testimonials.some((t) => t.name === 'Paciente' || t.text === 'Depoimento...');
 
  // Pagination Logic
  const totalPages = Math.ceil(tableData.length / itemsPerPage);
  const paginatedData = tableData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Usar domain do backend se disponível
  const displayDomain = dashboardData?.domainInfo?.domain || domain;

  const StatCard = ({ title, value, change, data, colorClass, icon, detailedStats }: any) => (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group hover:border-blue-200 transition-colors">
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg bg-gray-50 text-gray-400 group-hover:text-gray-600 transition-colors`}>
          {icon}
        </div>
      </div>
      
      {/* Detailed Stats (Conversion) or Chart */}
      {detailedStats ? (
        <div className="grid grid-cols-3 gap-2 mt-2 relative z-10 pt-2 border-t border-gray-50">
           {detailedStats.map((stat: any, i: number) => (
             <div key={i} className="flex flex-col">
               <span className="text-[10px] text-gray-400 font-bold uppercase">{stat.label}</span>
               <span className={`text-sm font-bold ${stat.color || 'text-gray-700'}`}>{stat.value}</span>
             </div>
           ))}
        </div>
      ) : (
        <div className="flex items-end justify-between mt-4 relative z-10">
           <div className="w-2/3 h-12">
              <InteractiveLineChart data={data} color={colorClass} height={40} />
           </div>
           <p className={`text-xs font-medium ${change.startsWith('+') ? 'text-green-600' : 'text-red-500'} bg-white/80 px-2 py-1 rounded shadow-sm border border-gray-100`}>
            {change}
          </p>
        </div>
      )}
    </div>
  );

  const SettingsView = () => (
    <div className="max-w-2xl bg-white rounded-xl shadow-sm border border-gray-100 p-8">
       <h2 className="text-2xl font-bold text-gray-800 mb-6">Meus Dados</h2>
       <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
               <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 font-medium">{briefing.name}</div>
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Especialidade</label>
               <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800">{briefing.specialty}</div>
             </div>
          </div>
          <div className="grid grid-cols-3 gap-6">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">CRM</label>
               <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">{briefing.crm}</div>
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
               <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">{briefing.crmState}</div>
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">RQE</label>
               <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">{briefing.rqe || '-'}</div>
             </div>
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Email de Contato</label>
             <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">{briefing.contactEmail}</div>
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
             <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">{briefing.contactPhone}</div>
          </div>
       </div>
       <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">Salvar Alterações</button>
       </div>
    </div>
  );

  const hasCustomTestimonialsFlag = (dashboardData?.landingPage?.section_visibility as any)?.hasCustomTestimonials;
  const showTestimonialsWarning = visibility.testimonials && !hasCustomTestimonialsFlag;

  const handleTestimonialChange = (index: number, field: 'name' | 'text', value: string) => {
    setTestimonials(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddTestimonial = () => {
    setTestimonials(prev => [...prev, { name: '', text: '' }]);
  };

  const handleRemoveTestimonial = (index: number) => {
    setTestimonials(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveTestimonials = async () => {
    if (!landingPageId || !dashboardData?.landingPage) return;

    try {
      setIsSavingTestimonials(true);

      const updatedVisibility = {
        ...(dashboardData.landingPage.section_visibility || {}),
        hasCustomTestimonials: true,
      };

      const updatedContent = {
        ...(dashboardData.landingPage.content_data || content),
        testimonials,
      };

      const updatedLandingPage = await updateLandingPage(landingPageId, {
        content_data: updatedContent as any,
        section_visibility: updatedVisibility as any,
      });

      setDashboardData(prev => prev ? { ...prev, landingPage: updatedLandingPage } : prev);
    } catch (err) {
      console.error('Erro ao salvar depoimentos:', err);
    } finally {
      setIsSavingTestimonials(false);
    }
  };

  const TestimonialsView = () => (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {showTestimonialsWarning && (
        <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-6 flex items-start gap-3">
          <div className="mt-1 text-amber-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-amber-900 mb-1">Depoimentos & Avaliações</h2>
            <p className="text-sm text-amber-800">
              Os depoimentos exibidos no seu site são apenas ilustrativos. É importante substituí-los por experiências reais dos seus pacientes
              ou desativar a seção para manter a comunicação em conformidade com o CFM.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-bold text-gray-800">Depoimentos atuais</h3>
          {onEditSite && (
            <button
              onClick={onEditSite}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              Editar no Editor
            </button>
          )}
        </div>
        {visibility.testimonials ? (
          <>
            {testimonials.length > 0 ? (
              <ul className="space-y-3">
                {testimonials.map((t, idx) => (
                  <li key={idx} className="p-3 rounded-lg border border-gray-100 bg-gray-50 space-y-2">
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Nome do paciente</label>
                        <input
                          type="text"
                          value={t.name}
                          onChange={(e) => handleTestimonialChange(idx, 'name', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Ex: Maria Silva"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Comentário</label>
                        <textarea
                          value={t.text}
                          onChange={(e) => handleTestimonialChange(idx, 'text', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          rows={3}
                          placeholder="Escreva aqui o depoimento real do seu paciente (com autorização)"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveTestimonial(idx)}
                        className="text-xs text-red-600 hover:text-red-700 font-semibold"
                      >
                        Remover depoimento
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                Nenhum depoimento está sendo exibido no momento. Você pode adicionar novos depoimentos reais dos seus pacientes aqui.
              </p>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-4">
              <button
                type="button"
                onClick={handleAddTestimonial}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                + Adicionar depoimento
              </button>
              <button
                type="button"
                onClick={handleSaveTestimonials}
                disabled={isSavingTestimonials}
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${
                  isSavingTestimonials ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSavingTestimonials ? 'Salvando...' : 'Salvar depoimentos'}
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500">
            A seção de depoimentos está desativada no momento. Você pode ativá-la no editor para exibir depoimentos reais aqui.
          </p>
        )}
      </div>

    </div>
  );

  const DomainView = () => {
    const domainInfo = dashboardData?.domainInfo || {
      domain,
      status: 'active' as const,
      sslStatus: 'active' as const,
    };
 
    return (
      <div className="max-w-2xl space-y-6">
         <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full blur-3xl -mr-10 -mt-10"></div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
               <div>
                  <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Domínio Principal</h2>
                  <div className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                     {domainInfo.domain}
                     <span className={`text-xs font-bold px-2 py-1 rounded border ${
                       domainInfo.status === 'active' 
                         ? 'bg-green-100 text-green-700 border-green-200' 
                         : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                     }`}>
                       {domainInfo.status === 'active' ? 'Ativo' : 'Em publicação'}
                     </span>
                  </div>
               </div>
               <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">🌐</div>
            </div>
 
            <div className="grid grid-cols-2 gap-8 border-t border-gray-100 pt-8 relative z-10">
               <div>
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Provedor</p>
                  <p className="font-medium text-gray-800">DocPage AI Hosting</p>
               </div>
               {domainInfo.renewalDate && (
                 <div>
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Próxima Renovação</p>
                    <p className="font-medium text-gray-800">{domainInfo.renewalDate}</p>
                 </div>
               )}
               <div>
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Certificado SSL</p>
                  <p className={`font-medium flex items-center gap-1 ${
                    domainInfo.sslStatus === 'active' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                     <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                     {domainInfo.sslStatus === 'active' ? 'Seguro (HTTPS)' : 'Pendente'}
                  </p>
               </div>
               <div>
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">DNS</p>
                  <p className="font-medium text-gray-800">Gerenciado</p>
               </div>
            </div>
         </div>
         
         <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl flex items-start gap-4">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
               <h4 className="font-bold text-blue-900 mb-1">Email Profissional</h4>
               <p className="text-sm text-blue-700">Seu plano inclui 3 contas de email profissional (ex: contato@{domainInfo.domain.replace('www.', '')}). Configure no painel de hospedagem.</p>
               <button className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-800 underline">Configurar Emails</button>
            </div>
         </div>
      </div>
    );
  };

  const SocialMediaView = () => {
    const feedCaption = `É com muita alegria que apresento meu novo site profissional!\n\nAgora você pode conferir todas as especialidades, tirar dúvidas e agendar sua consulta de forma prática e rápida.\n\nAcesse: ${domain}\n\n#medicina #saude #${briefing.specialty.split(',')[0].trim().toLowerCase()} #novosite`;
    
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
         <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
               <h2 className="text-3xl font-bold mb-2">Kit de Lançamento</h2>
               <p className="text-purple-100 max-w-xl">
                 Preparamos posts exclusivos para você divulgar seu novo site no Instagram. Basta baixar a imagem e copiar a legenda.
               </p>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400 rounded-full mix-blend-overlay blur-3xl -mt-10 -mr-10 opacity-50"></div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Feed Post */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
               <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    Post para Feed (Quadrado)
                  </h3>
                  <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded">Bônus</span>
               </div>
               
               {/* Mockup Image */}
               <div className="aspect-square bg-gray-100 relative group overflow-hidden">
                  <div className="absolute inset-0 bg-blue-900 flex flex-col items-center justify-center p-8 text-center">
                     <div className="w-32 h-32 rounded-full border-4 border-white mb-4 overflow-hidden shadow-lg">
                        <img src={photoUrl || ''} className="w-full h-full object-cover" alt="" />
                     </div>
                     <h2 className="text-white text-2xl font-bold font-serif mb-2">Novo Site no Ar</h2>
                     <p className="text-blue-200 text-sm font-medium tracking-widest uppercase mb-6">{domain}</p>
                     <div className="bg-white text-blue-900 px-6 py-2 rounded-full font-bold text-sm">
                        Agende sua consulta
                     </div>
                  </div>
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <button className="bg-white text-gray-900 px-6 py-3 rounded-lg font-bold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all">
                       Baixar Imagem
                     </button>
                  </div>
               </div>

               {/* Caption Box */}
               <div className="p-6 bg-gray-50 border-t border-gray-100">
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Legenda Sugerida</label>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 text-sm text-gray-600 mb-4 whitespace-pre-wrap">
                    {feedCaption}
                  </div>
                  <button 
                    onClick={() => navigator.clipboard.writeText(feedCaption)}
                    className="w-full py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    Copiar Legenda
                  </button>
               </div>
            </div>

            {/* Stories Post */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
               <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    Post para Stories (Vertical)
                  </h3>
                  <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded">Bônus</span>
               </div>

               <div className="flex-1 bg-gray-100 p-8 flex justify-center">
                  <div className="w-[280px] aspect-[9/16] bg-white shadow-2xl rounded-2xl overflow-hidden relative group">
                     <img 
                       src={aboutPhotoUrl || photoUrl || ''} 
                       className="w-full h-full object-cover brightness-50" 
                       alt="Stories Background" 
                     />
                     <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-white/30">Novidade</span>
                        <h2 className="text-3xl font-bold text-white mb-2 leading-tight">Meu novo site<br/>está no ar!</h2>
                        <p className="text-white/80 text-sm mb-8">Saiba mais sobre meus tratamentos e agende sua consulta.</p>
                        
                        <div className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold text-sm shadow-lg w-full">
                           Acesse o link 👇
                        </div>
                        <p className="text-white text-xs mt-2 font-mono">{domain}</p>
                     </div>

                     <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="bg-white text-gray-900 px-6 py-3 rounded-lg font-bold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all">
                          Baixar Stories
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex">
       {/* Sidebar */}
       <aside className="w-64 bg-slate-900 text-white flex-none hidden md:flex flex-col">
           <div className="p-6 border-b border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-lg text-blue-400 border-2 border-slate-600">
                 {doctorName.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate">{doctorName}</p>
                <p className="text-xs text-slate-500 truncate">{displayDomain}</p>
              </div>
           </div>

          <nav className="flex-1 p-4 space-y-2 mt-4">
             <button 
               onClick={() => setActiveView('overview')}
               className={`flex w-full items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors ${activeView === 'overview' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
             >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                Painel Geral
             </button>
             <button 
               onClick={onEditSite}
               className={`flex w-full items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors text-slate-400 hover:text-white hover:bg-slate-800`}
             >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Editar Site
             </button>
             <button 
               onClick={() => setActiveView('settings')}
               className={`flex w-full items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors ${activeView === 'settings' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
             >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Configurações
             </button>
             <button 
               onClick={() => setActiveView('testimonials')}
               className={`flex w-full items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors ${activeView === 'testimonials' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
             >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-6 4h4M5 5a2 2 0 00-2 2v9.5a.5.5 0 00.8.4L7 15h12a2 2 0 002-2V7a2 2 0 00-2-2H5z" /></svg>
                Depoimentos
             </button>
             <button 
               onClick={() => setActiveView('domain')}
               className={`flex w-full items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors ${activeView === 'domain' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
             >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                Domínio
             </button>
             <button 
               onClick={() => setActiveView('social')}
               className={`flex w-full items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors mt-2 ${activeView === 'social' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
             >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Posts Redes Sociais
             </button>
          </nav>

          <div className="p-4 border-t border-slate-800">
             <button 
               onClick={() => window.location.reload()} // Simulator logout
               className="flex items-center gap-3 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg w-full transition-colors text-sm font-medium"
             >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Sair
             </button>
          </div>
       </aside>

       {/* Main Area */}
       <main className="flex-1 overflow-y-auto">
          <header className="bg-white border-b border-gray-200 py-4 px-8 flex justify-between items-center sticky top-0 z-40 shadow-sm">
             <h1 className="text-xl font-bold text-gray-800">
                {activeView === 'overview'
                  ? 'Painel de Controle'
                  : activeView === 'settings'
                  ? 'Minhas Configurações'
                  : activeView === 'domain'
                  ? 'Gerenciar Domínio'
                  : activeView === 'testimonials'
                  ? 'Depoimentos & Avaliações'
                  : 'Redes Sociais'}
             </h1>
             <div className="flex items-center gap-4">
                {dashboardData?.domainInfo?.renewalDate && (
                  <div className="text-xs text-right hidden sm:block">
                     <p className="text-gray-500">Próxima Renovação</p>
                     <p className="font-bold text-gray-800">{dashboardData.domainInfo.renewalDate}</p>
                  </div>
                )}
                {dashboardData?.landingPage.status === 'published' && (
                  <a 
                    href={`https://${displayDomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Ver site online ↗
                  </a>
                )}
             </div>
          </header>

          <div className="p-8 max-w-7xl mx-auto space-y-8">
             
             {/* Loading State */}
             {isLoading && (
               <div className="flex items-center justify-center py-12">
                 <div className="text-center">
                   <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                   <p className="text-gray-600">Carregando dados do dashboard...</p>
                 </div>
               </div>
             )}

             {/* Error State */}
             {error && !isLoading && (
               <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                 <p className="font-bold">Erro ao carregar dados</p>
                 <p className="text-sm">{error}</p>
                 {error.includes('autenticado') && (
                   <button
                     onClick={() => window.location.reload()}
                     className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                   >
                     Recarregar Página
                   </button>
                 )}
               </div>
             )}

             {activeView === 'overview' && !isLoading && !error && dashboardData && (
               <>
                 {/* Welcome Banner */}
                 <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
                    <div className="relative z-10 space-y-2">
                       <h2 className="text-3xl font-bold mb-1">Bem-vindo(a), {doctorName}!</h2>
                       <p className="text-slate-300">
                         Seu site está <strong>{dashboardData.landingPage?.status === 'published' ? 'ativo' : 'em publicação'}</strong>.
                       </p>
                       {!dashboardData.landingPage || dashboardData.landingPage.status !== 'published' && (
                         <p className="text-xs text-amber-200 max-w-xl">
                           Assim que o domínio escolhido for publicado, seu site estará no ar e você receberá um email automático avisando.
                         </p>
                       )}
                    </div>
                    <div className="hidden md:block relative z-10">
                       <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20 text-sm font-bold flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full animate-pulse ${dashboardData.landingPage?.status === 'published' ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
                          {displayDomain}
                       </div>
                    </div>
                 </div>

                 {/* Stats Grid - Updated with Conversion Rate */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard 
                       title="Visitas Únicas" 
                       value={totalVisits.toLocaleString()} 
                       change="+12.5%" 
                       colorClass="text-blue-500"
                       data={chartData.visits}
                       icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                    />
                    <StatCard 
                       title="Cliques Totais" 
                       value={totalClicks.toLocaleString()} 
                       change="+5.2%" 
                       colorClass="text-green-500"
                       data={chartData.clicks}
                       icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>}
                    />
                    <StatCard 
                       title="Taxa de Conversão"
                       value={`${conversionRate30d}%`}
                       colorClass="text-purple-500"
                       detailedStats={[
                         { label: 'Geral', value: `${conversionRateAllTime}%`, color: 'text-gray-600' },
                         { label: '30 Dias', value: `${conversionRate30d}%`, color: 'text-purple-600' },
                         { label: '7 Dias', value: `${conversionRate7d}%`, color: 'text-blue-500' }
                       ]}
                       icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                    />
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Leads Table */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                       <div className="p-6 border-b border-gray-100">
                          <h3 className="font-bold text-gray-800">Últimos Cliques (30 Dias)</h3>
                       </div>
                       <div className="flex-1 overflow-x-auto">
                         <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                               <tr>
                                  <th className="px-6 py-3">Botão Acionado</th>
                                  <th className="px-6 py-3">Canal Origem</th>
                                  <th className="px-6 py-3">Data/Hora</th>
                               </tr>
                            </thead>
                            <tbody>
                               {paginatedData.map((item, i) => (
                                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                     <td className="px-6 py-4 font-medium text-gray-900">
                                       <div className="flex items-center gap-2">
                                         <div className={`w-2 h-2 rounded-full ${item.action.includes('WhatsApp') ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                         {item.action}
                                       </div>
                                     </td>
                                     <td className="px-6 py-4 text-gray-600">{item.channel}</td>
                                     <td className="px-6 py-4 text-gray-500 font-mono text-xs">{item.date} - {item.time}</td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                       </div>
                       
                       {/* Pagination */}
                       <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                          <span className="text-xs text-gray-500">
                            Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
                          </span>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              disabled={currentPage === 1}
                              className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-medium hover:bg-gray-100 disabled:opacity-50"
                            >
                              Anterior
                            </button>
                            <button 
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              disabled={currentPage === totalPages}
                              className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-medium hover:bg-gray-100 disabled:opacity-50"
                            >
                              Próxima
                            </button>
                          </div>
                       </div>
                    </div>

                    {/* Site Preview Mini & Bonus Widget */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-fit">
                           <h3 className="font-bold text-gray-800 mb-4">Seu Site</h3>
                           
                           <a 
                             href={dashboardData?.landingPage.status === 'published' 
                               ? `https://${displayDomain}` 
                               : `https://id-preview--0a9faad6-43ab-4990-8403-ac9018697ff1.lovable.app`
                             }
                             target="_blank"
                             rel="noopener noreferrer"
                             className="block w-full bg-gray-100 rounded-lg border border-gray-200 relative mb-4 overflow-hidden group cursor-pointer"
                           >
                              <div className="relative w-full pb-[62.5%]">
                                 <div className="absolute inset-0 overflow-hidden">
                                    <div className="origin-top-left transform scale-[0.25] lg:scale-[0.2] xl:scale-[0.25]" style={{ width: '1280px', height: '800px' }}>
                                       <Preview 
                                         content={content}
                                         design={design}
                                         visibility={visibility}
                                         photoUrl={photoUrl}
                                         aboutPhotoUrl={aboutPhotoUrl}
                                         briefing={briefing}
                                         layoutVariant={layoutVariant}
                                       />
                                    </div>
                                 </div>
                                 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
                                    <span className="bg-white text-gray-800 px-4 py-2 rounded-lg font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                      Visualizar
                                    </span>
                                 </div>
                              </div>
                           </a>

                           <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-4">
                              <span className="text-gray-500">Plano Atual:</span>
                              <span className="font-bold text-blue-600 px-2 py-1 bg-blue-50 rounded uppercase text-xs">{plan.name}</span>
                           </div>
                        </div>

                        {/* Social Media Bonus Widget */}
                        <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl shadow-md p-6 text-white relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all" onClick={() => setActiveView('social')}>
                           <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400 rounded-full mix-blend-overlay blur-xl -mt-6 -mr-6 animate-pulse"></div>
                           <h3 className="font-bold text-lg mb-1 relative z-10">Posts Liberados! 🎁</h3>
                           <p className="text-sm text-purple-100 mb-4 relative z-10">Divulgue seu novo site com nosso kit de lançamento para Instagram.</p>
                           <button className="bg-white text-purple-600 text-xs font-bold px-4 py-2 rounded-full shadow-sm group-hover:scale-105 transition-transform">
                             Acessar Bônus
                           </button>
                        </div>
                    </div>

                 </div>
               </>
             )}

             {activeView === 'settings' && <SettingsView />}
             
             {activeView === 'domain' && <DomainView />}

             {activeView === 'social' && <SocialMediaView />}

          </div>
       </main>
    </div>
  );
};
