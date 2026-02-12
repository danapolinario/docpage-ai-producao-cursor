
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Preview } from './Preview';
import { LandingPageContent, DesignSettings, SectionVisibility, BriefingData, LayoutVariant, Plan } from '../types';
import { CheckoutFlow } from './CheckoutFlow';
import { Dashboard } from './Dashboard';
import { supabase } from '../lib/supabase';

interface Props {
  onRestart: () => void;
  onEditSite?: () => void;
  doctorName: string;
  content: LandingPageContent;
  design: DesignSettings;
  visibility: SectionVisibility;
  photoUrl: string | null;
  aboutPhotoUrl: string | null;
  briefing: BriefingData;
  layoutVariant: LayoutVariant;
  selectedDomain: string;
  initialViewMode?: 'plans' | 'checkout' | 'success' | 'dashboard';
  landingPageId?: string; // ID da landing page para carregar no dashboard
  onCheckoutSuccess?: (data: { landingPageId: string; landingPageUrl: string; domain: string }) => void;
}

export const PricingPage: React.FC<Props> = ({ 
  onRestart, 
  onEditSite,
  doctorName,
  content,
  design,
  visibility,
  photoUrl,
  aboutPhotoUrl,
  briefing,
  layoutVariant,
  selectedDomain,
  initialViewMode = 'plans',
  landingPageId,
  onCheckoutSuccess
}) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'plans' | 'checkout' | 'success' | 'dashboard'>(initialViewMode);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [confirmedDomain, setConfirmedDomain] = useState('');
  const [checkoutData, setCheckoutData] = useState<{ landingPageId: string; landingPageUrl: string; domain: string } | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');
  // Dados pré-preenchidos quando vem do dashboard
  const [prefilledDomain, setPrefilledDomain] = useState<string | null>(null);
  const [prefilledCpf, setPrefilledCpf] = useState<string | null>(null);
  const [prefilledHasCustomDomain, setPrefilledHasCustomDomain] = useState(false);

  // Se landingPageId for fornecido externamente (ex: após login), usar ele
  // Também verificar localStorage quando vem do dashboard
  useEffect(() => {
    // Verificar se há landingPageId no localStorage (quando vem do dashboard)
    const storedLandingPageId = localStorage.getItem('checkout_landing_page_id');
    const effectiveLandingPageId = landingPageId || storedLandingPageId;
    
    if (effectiveLandingPageId && (initialViewMode === 'dashboard' || initialViewMode === 'checkout')) {
      setCheckoutData({
        landingPageId: effectiveLandingPageId,
        landingPageUrl: `https://${selectedDomain || 'seu-dominio.com.br'}`,
        domain: selectedDomain || 'seu-dominio.com.br'
      });
      if (initialViewMode === 'dashboard') {
        setViewMode('dashboard');
      } else if (initialViewMode === 'checkout') {
        setViewMode('checkout');
      }
    }
  }, [landingPageId, initialViewMode, selectedDomain]);

  // Buscar dados da landing page quando vem do dashboard (domínio, CPF, plano)
  useEffect(() => {
    const fetchLandingPageData = async () => {
      // Só buscar se estiver em modo checkout e tiver landingPageId
      if (initialViewMode !== 'checkout' && viewMode !== 'checkout') {
        return;
      }

      const storedLandingPageId = localStorage.getItem('checkout_landing_page_id');
      const effectiveLandingPageId = landingPageId || storedLandingPageId;
      
      if (!effectiveLandingPageId) {
        return;
      }

      try {
        console.log('[PRICING PAGE] Buscando dados da landing page para checkout:', effectiveLandingPageId);
        
        // Buscar landing page
        const { data: landingPage, error: lpError } = await supabase
          .from('landing_pages')
          .select('id, chosen_domain, custom_domain, cpf, subdomain')
          .eq('id', effectiveLandingPageId)
          .single();

        if (lpError) {
          console.error('[PRICING PAGE] Erro ao buscar landing page:', lpError);
          return;
        }

        // Buscar domínio de pending_checkouts se não tiver chosen_domain
        let domainToUse = landingPage.chosen_domain || landingPage.custom_domain;
        let cpfToUse = landingPage.cpf;
        let hasCustomDomain = !!landingPage.custom_domain;

        if (!domainToUse) {
          const { data: pendingCheckout } = await supabase
            .from('pending_checkouts')
            .select('domain, has_custom_domain, custom_domain, cpf')
            .eq('landing_page_id', effectiveLandingPageId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (pendingCheckout) {
            domainToUse = pendingCheckout.has_custom_domain && pendingCheckout.custom_domain
              ? pendingCheckout.custom_domain
              : pendingCheckout.domain;
            cpfToUse = cpfToUse || pendingCheckout.cpf;
            hasCustomDomain = pendingCheckout.has_custom_domain || false;
          }
        }

        // Buscar plano da subscription se houver
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('plan_id, billing_period')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (subscription) {
            // Mapear plan_id para Plan object
            const planMap: Record<string, Plan> = {
              starter: {
                id: 'starter',
                name: 'Starter',
                price: subscription.billing_period === 'annual' ? 'R$ 97' : 'R$ 147',
                oldPrice: subscription.billing_period === 'annual' ? 'R$ 147' : undefined,
                rawPrice: subscription.billing_period === 'annual' ? 97 : 147,
                period: '/mês',
                description: 'Para quem está começando e quer presença digital rápida.',
                features: [
                  'Hospedagem inclusa',
                  'Domínio .com.br grátis (1 ano)',
                  'Botão WhatsApp',
                  'Estatísticas de acesso'
                ],
                cta: 'Começar Agora',
                popular: false,
                color: 'border-slate-200'
              },
              pro: {
                id: 'pro',
                name: 'Profissional',
                price: subscription.billing_period === 'annual' ? 'R$ 197' : 'R$ 297',
                oldPrice: subscription.billing_period === 'annual' ? 'R$ 297' : undefined,
                rawPrice: subscription.billing_period === 'annual' ? 197 : 297,
                period: '/mês',
                description: 'Para especialistas que buscam autoridade e agendamentos.',
                features: [
                  'Tudo do Starter',
                  'Estatísticas de acesso avançadas',
                  'Sugestões periódicas da nossa equipe para melhoria de desempenho',
                  'Plano estratégico para otimizar resultados',
                  'Pacote de posts para Redes Sociais'
                ],
                cta: 'Assinar Profissional',
                popular: true,
                color: 'border-blue-500 ring-2 ring-blue-500'
              }
            };

            const plan = planMap[subscription.plan_id];
            if (plan) {
              setSelectedPlan(plan);
              setBillingPeriod(subscription.billing_period as 'monthly' | 'annual');
            }
          }
        }

        // Preencher dados do domínio e CPF
        if (domainToUse) {
          setPrefilledDomain(domainToUse);
          setConfirmedDomain(domainToUse);
          setPrefilledHasCustomDomain(hasCustomDomain);
          console.log('[PRICING PAGE] Domínio pré-preenchido:', domainToUse, 'Custom:', hasCustomDomain);
        }

        if (cpfToUse) {
          setPrefilledCpf(cpfToUse);
          console.log('[PRICING PAGE] CPF pré-preenchido encontrado');
        }
      } catch (error: any) {
        console.error('[PRICING PAGE] Erro ao buscar dados da landing page:', error);
      }
    };

    fetchLandingPageData();
  }, [landingPageId, initialViewMode, viewMode]);

  // Auto-select a dummy plan if jumping straight to checkout/dashboard in dev mode
  // Também seleciona um plano padrão quando voltar do Stripe com canceled=true
  // IMPORTANTE: Este useEffect deve executar ANTES de sincronizar o viewMode
  useEffect(() => {
    // Só executar se initialViewMode for 'checkout' ou 'dashboard'
    if (initialViewMode !== 'checkout' && initialViewMode !== 'dashboard') {
      return;
    }
    
    // Primeiro, tentar restaurar o plano do localStorage (se voltou do Stripe)
    // Fazer isso mesmo se já tem plano selecionado, para garantir que está correto
    try {
      const savedState = localStorage.getItem('checkout_state');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        if (parsedState.selectedPlan) {
          setSelectedPlan(parsedState.selectedPlan);
          if (parsedState.billingPeriod) {
            setBillingPeriod(parsedState.billingPeriod);
          }
          return; // Não continuar para selecionar plano padrão
        }
      }
    } catch (error) {
      console.warn('Erro ao restaurar plano do localStorage:', error);
    }
    
    // Se já tem plano selecionado e não encontrou no localStorage, não fazer nada
    if (selectedPlan) {
      return;
    }
    
    // Se não encontrou no localStorage e não tem plano, selecionar plano padrão
    setSelectedPlan({
      id: 'pro',
      name: 'Profissional',
      price: 'R$ 197',
      oldPrice: 'R$ 297',
      rawPrice: 197,
      period: '/mês',
      features: [],
      cta: '',
      popular: true,
      color: 'border-blue-500',
      description: 'Para especialistas que buscam autoridade.'
    });
    setConfirmedDomain('www.drteste.com.br');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialViewMode]);

  // Sincronizar viewMode quando initialViewMode mudar (ex: quando voltar do Stripe com canceled=true)
  // IMPORTANTE: Só sincronizar quando initialViewMode mudar de 'plans' para 'checkout' ou 'dashboard'
  // Não sobrescrever mudanças manuais do usuário (quando seleciona um plano)
  const prevInitialViewModeRef = React.useRef(initialViewMode);
  useEffect(() => {
    // Só sincronizar se o initialViewMode mudou E se mudou para 'checkout' ou 'dashboard'
    // Não sincronizar se mudou para 'plans' (isso permitiria mudanças manuais)
    if (prevInitialViewModeRef.current !== initialViewMode) {
      // Só sincronizar se mudou para 'checkout' ou 'dashboard' (mudanças externas)
      // Não sincronizar se mudou para 'plans' (permite mudanças manuais do usuário)
      if (initialViewMode === 'checkout' || initialViewMode === 'dashboard') {
        if (viewMode !== initialViewMode) {
          setViewMode(initialViewMode);
        }
      }
      
      prevInitialViewModeRef.current = initialViewMode;
    } else if (initialViewMode === 'checkout' && viewMode !== 'checkout') {
      // Se initialViewMode já é 'checkout' mas viewMode não está sincronizado, sincronizar
      // Isso pode acontecer quando o componente é montado com initialViewMode='checkout'
      setViewMode('checkout');
    }
  }, [initialViewMode, viewMode]);

  const scrollToPlans = () => {
    const element = document.getElementById('plans-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectPlan = (plan: Plan) => {
    // Importar e usar trackPlanSelect e trackCheckoutStart
    import('../services/google-analytics').then(({ trackPlanSelect, trackCheckoutStart }) => {
      trackPlanSelect(plan.name, plan.price);
      trackCheckoutStart(plan.name);
    });
    setSelectedPlan(plan);
    setViewMode('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCheckoutSuccess = async (data: { landingPageId: string; landingPageUrl: string; domain: string }) => {
    console.log('Checkout success - Dados recebidos:', data);
    
    setConfirmedDomain(data.domain);
    setCheckoutData(data);
    
    // Redirecionar imediatamente para dashboard (sem delays desnecessários)
    // A verificação de sessão pode ser feita no dashboard se necessário
    setViewMode('dashboard');
    
    // Notificar App.tsx sobre sucesso do checkout
    onCheckoutSuccess?.(data);
    
    // Scroll suave para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCheckoutError = (error: string) => {
    // Erro já será mostrado no CheckoutFlow
    console.error('Erro no checkout:', error);
  };
  
  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const checklistItems = [
    { title: 'Conteúdo Ético (CFM)', desc: 'Validado pela Resolução 2.336/23', icon: '⚖️' },
    { title: 'SEO Configurado', desc: 'Pronto para Google e Bing', icon: '🔍' },
    { title: 'Alta Conversão', desc: 'Estrutura persuasiva de vendas', icon: '📈' },
    { title: 'Mobile First', desc: 'Perfeito em todos os celulares', icon: '📱' },
  ];

  // Preços base (mensais)
  const planPrices = {
    starter: { monthly: 147, annual: 97 },
    pro: { monthly: 297, annual: 197 },
    authority: { monthly: null, annual: null }
  };

  const plans: Plan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: billingPeriod === 'annual' ? 'R$ 97' : 'R$ 147',
      oldPrice: billingPeriod === 'annual' ? 'R$ 147' : undefined,
      rawPrice: billingPeriod === 'annual' ? 97 : 147,
      period: '/mês',
      description: 'Para quem está começando e quer presença digital rápida.',
      features: [
        'Hospedagem inclusa',
        'Domínio .com.br grátis (1 ano)',
        'Botão WhatsApp',
        'Estatísticas de acesso'
      ],
      cta: 'Começar Agora',
      popular: false,
      color: 'border-slate-200'
    },
    {
      id: 'pro',
      name: 'Profissional',
      price: billingPeriod === 'annual' ? 'R$ 197' : 'R$ 297',
      oldPrice: billingPeriod === 'annual' ? 'R$ 297' : undefined,
      rawPrice: billingPeriod === 'annual' ? 197 : 297,
      period: '/mês',
      description: 'Para especialistas que buscam autoridade e agendamentos.',
      features: [
        'Tudo do Starter',
        'Estatísticas de acesso avançadas',
        'Sugestões periódicas da nossa equipe para melhoria de desempenho',
        'Plano estratégico para otimizar resultados',
        'Pacote de posts para Redes Sociais'
      ],
      cta: 'Assinar Profissional',
      popular: true,
      color: 'border-blue-500 ring-2 ring-blue-500'
    },
    {
      id: 'authority',
      name: 'Autoridade',
      price: 'Consulte',
      oldPrice: '',
      rawPrice: 0,
      period: '',
      description: 'Para profissionais que são referência e buscam presença sólida.',
      features: [
        'Tudo do Profissional',
        'Customização humana',
        'Gestão de Tráfego (Ads)',
        'Consultoria Mensal',
        'Posts sob demanda (Redes Sociais)'
      ],
      cta: 'Falar com Consultor',
      popular: false,
      color: 'border-slate-200'
    }
  ];

  const previewProps = {
    content,
    design,
    visibility,
    photoUrl,
    aboutPhotoUrl,
    briefing,
    layoutVariant
  };
  
  // --- Dashboard View ---
  if (viewMode === 'dashboard' && selectedPlan) {
     return (
        <Dashboard 
          doctorName={doctorName}
          domain={checkoutData?.domain || confirmedDomain || 'seu-dominio.com.br'}
          plan={selectedPlan}
          content={content}
          design={design}
          visibility={visibility}
          photoUrl={photoUrl}
          aboutPhotoUrl={aboutPhotoUrl}
          briefing={briefing}
          layoutVariant={layoutVariant}
          onEditSite={onEditSite}
          landingPageId={checkoutData?.landingPageId || landingPageId}
        />
     );
  }

  // --- Success View ---
  if (viewMode === 'success') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 animate-fade-in text-center">
        <div className="bg-white p-12 rounded-2xl shadow-xl max-w-lg w-full border border-gray-100">
           <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
             <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
           </div>
           <h2 className="text-3xl font-bold text-gray-800 mb-2">Pagamento Confirmado!</h2>
           <p className="text-gray-500 mb-8">
             Parabéns, Dr(a). {doctorName}. Sua página já está sendo processada para publicação.
           </p>
           
           <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-8 text-left">
             <h4 className="font-bold text-blue-900 mb-2 text-sm uppercase">Próximos Passos</h4>
             <ul className="space-y-3">
               <li className="flex gap-2 text-sm text-blue-800">
                 <span className="font-bold">1.</span> Você receberá um email com os dados de acesso.
               </li>
               <li className="flex gap-2 text-sm text-blue-800">
                 <span className="font-bold">2.</span> Domínio <span className="underline">{confirmedDomain}</span> registrado em 24h.
               </li>
               <li className="flex gap-2 text-sm text-blue-800">
                 <span className="font-bold">3.</span> Seu site estará online em breve!
               </li>
             </ul>
           </div>

           <button 
             onClick={handleGoToDashboard}
             className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg"
           >
             Acessar Meu Painel
           </button>
        </div>
      </div>
    );
  }

  // --- Checkout View ---
  if (viewMode === 'checkout' && selectedPlan) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <CheckoutFlow 
          plan={selectedPlan}
          billingPeriod={billingPeriod}
          briefing={briefing}
          content={content}
          design={design}
          visibility={visibility}
          layoutVariant={layoutVariant}
          photoUrl={photoUrl}
          aboutPhotoUrl={aboutPhotoUrl}
          onBack={() => setViewMode('plans')}
          onSuccess={handleCheckoutSuccess}
          onError={handleCheckoutError}
          prefilledDomain={prefilledDomain}
          prefilledCpf={prefilledCpf}
          prefilledHasCustomDomain={prefilledHasCustomDomain}
        />
      </div>
    );
  }

  // --- Plans View (Default) ---
  return (
    <div className="w-full bg-white animate-fade-in pb-20 font-sans">
      {/* Header Area with Mockups */}
      <div className="bg-slate-900 text-white pt-16 pb-20 px-4 text-center overflow-hidden relative">
        <div className="max-w-4xl mx-auto relative z-10 mb-12">
          <div className="inline-block bg-green-500 text-xs font-bold px-3 py-1 rounded-full mb-6 uppercase tracking-wide">
            Página Pronta para Publicar
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            Uaau, {doctorName}!
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
            Falta muito pouco para sua presença digital estar no ar. Clique no botão abaixo para escolher o plano que melhor te atende.
          </p>
          <div className="flex flex-col items-center gap-4">
            <button 
              onClick={scrollToPlans}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-1"
            >
              Quero publicar
            </button>
            {onEditSite && (
              <button
                onClick={onEditSite}
                className="text-sm text-slate-400 hover:text-slate-300 transition-colors underline"
              >
                Voltar para o editor
              </button>
            )}
          </div>
        </div>

        {/* Device Mockups Container - FIXED SCALING */}
        <div className="flex justify-center items-end gap-4 md:gap-8 h-[250px] md:h-[350px] max-w-6xl mx-auto relative z-20 select-none">
          
          {/* Mobile Mockup */}
          <div className="hidden md:block relative w-[100px] h-[200px] bg-slate-800 rounded-3xl border-[4px] border-slate-700 shadow-2xl z-30 transform translate-y-4">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-3 bg-slate-700 rounded-b-lg z-20"></div>
              <div className="absolute inset-1 bg-white rounded-2xl overflow-hidden">
                <div 
                  className="origin-top-left"
                  style={{ width: '375px', height: '800px', transform: 'scale(0.245)' }} 
                >
                  <div className="w-full h-full overflow-hidden">
                    <Preview {...previewProps} />
                  </div>
                </div>
              </div>
          </div>

          {/* Desktop Mockup */}
          <div className="relative w-[300px] md:w-[600px] h-[180px] md:h-[350px] bg-slate-800 rounded-t-xl border-t-[8px] border-x-[8px] border-slate-700 shadow-2xl z-20">
              <div className="absolute top-[-5px] left-1/2 w-1 h-1 bg-gray-500 rounded-full"></div>
              <div className="absolute inset-0 bg-white overflow-hidden rounded-t-sm">
                 {/* Desktop: Scale calculated based on 1280px content width fitting into container width */}
                 <div 
                   className="origin-top-left hidden md:block"
                   style={{ width: '1280px', height: '800px', transform: 'scale(0.456)' }}
                 >
                    <div className="w-full h-full overflow-hidden">
                       <Preview {...previewProps} />
                    </div>
                 </div>
                 <div 
                   className="origin-top-left block md:hidden"
                   style={{ width: '1280px', height: '810px', transform: 'scale(0.222)' }}
                 >
                    <div className="w-full h-full overflow-hidden">
                       <Preview {...previewProps} />
                    </div>
                 </div>
              </div>
          </div>

          {/* Tablet Mockup */}
          <div className="hidden lg:block relative w-[180px] h-[240px] bg-slate-800 rounded-xl border-[6px] border-slate-700 shadow-2xl z-10 transform translate-y-2">
              <div className="absolute inset-1 bg-white rounded-lg overflow-hidden">
                 <div 
                   className="origin-top-left"
                   style={{ width: '768px', height: '1100px', transform: 'scale(0.218)' }}
                 >
                   <div className="w-full h-full overflow-hidden">
                     <Preview {...previewProps} />
                   </div>
                 </div>
              </div>
          </div>

        </div>
        
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-1/2 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none"></div>
      </div>

      <div className="bg-slate-50 py-12 border-b border-slate-200">
         <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            {checklistItems.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center">
                 <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl mb-3 shadow-sm border border-green-200">
                   {item.icon}
                 </div>
                 <h4 className="font-bold text-slate-800 text-sm">{item.title}</h4>
                 <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            ))}
         </div>
      </div>

      <div id="plans-section" className="max-w-7xl mx-auto px-4 mt-16 relative z-30">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Escolha seu plano</h2>
        
        {/* Billing Period Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-400'}`}>
            Mensal
          </span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
            className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
              billingPeriod === 'annual' ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                billingPeriod === 'annual' ? 'translate-x-9' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${billingPeriod === 'annual' ? 'text-gray-900' : 'text-gray-400'}`}>
            Anual
            {billingPeriod === 'annual' && (
              <span className="ml-2 inline-block bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">
                Economize até 34%
              </span>
            )}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`relative p-8 bg-white rounded-2xl shadow-xl transition-transform hover:-translate-y-2 flex flex-col ${plan.popular ? 'border-2 border-blue-500 ring-4 ring-blue-50' : 'border border-slate-200'}`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-sm font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-md">
                  Mais Popular
                </div>
              )}
              
              <h3 className={`text-xl font-bold mb-2 ${plan.popular ? 'text-blue-700' : 'text-slate-700'}`}>{plan.name}</h3>
              <p className="text-xs text-slate-500 mb-6 h-8">{plan.description}</p>
              
              <div className="mb-6">
                {plan.oldPrice && (
                  <div className="mb-2">
                    <span className="text-xs text-red-400 font-bold line-through block">De {plan.oldPrice}</span>
                    <span className="text-xs text-gray-500">Por</span>
                  </div>
                )}
                <div className="flex items-baseline">
                  <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                  <span className="text-slate-500 ml-1">{plan.period}</span>
                </div>
                {billingPeriod === 'annual' && plan.id !== 'authority' && (
                  <span className="text-xs text-gray-500 mt-1 block">(plano anual)</span>
                )}
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                    <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handleSelectPlan(plan)}
                className={`w-full py-4 rounded-xl font-bold transition-all transform hover:-translate-y-1 shadow-lg ${
                plan.popular 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-20 px-4 pb-12">
        <div className="border-t border-gray-100 pt-12 flex flex-col md:flex-row items-center justify-between gap-8">
           
           <div className="flex items-center gap-4 text-left">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Garantia de 7 Dias</h4>
                <p className="text-sm text-gray-500">Satisfação garantida ou seu dinheiro de volta.</p>
              </div>
           </div>

           <div className="text-center md:text-right">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Pagamento Seguro</p>
              <div className="flex items-center gap-3 opacity-70 grayscale hover:grayscale-0 transition-all">
                 <div className="h-8 w-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center font-bold text-xs text-blue-800 italic">VISA</div>
                 <div className="h-8 w-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center font-bold text-xs text-orange-600">Master</div>
                 <div className="h-8 w-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center font-bold text-xs text-emerald-600">Pix</div>
                 <div className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                   <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                   SSL
                 </div>
              </div>
           </div>
        </div>
        
        <div className="text-center mt-12">
           <button 
             onClick={onRestart}
             className="text-gray-400 hover:text-gray-600 text-sm font-medium underline"
           >
             Quero criar outra página
           </button>
        </div>
      </div>
    </div>
  );
}
