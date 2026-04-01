import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { SaaSLanding } from './components/SaaSLanding';
import { Auth } from './components/Auth';
import { LeadCaptureModal } from './components/LeadCaptureModal';
import { Confetti } from './components/common/Confetti';

const BriefingForm = lazy(() => import('./components/BriefingForm').then(m => ({ default: m.BriefingForm })));
const ContentConfig = lazy(() => import('./components/ContentConfig').then(m => ({ default: m.ContentConfig })));
const PhotoUploader = lazy(() => import('./components/PhotoUploader').then(m => ({ default: m.PhotoUploader })));
const VisualConfig = lazy(() => import('./components/VisualConfig').then(m => ({ default: m.VisualConfig })));
const Preview = lazy(() => import('./components/Preview').then(m => ({ default: m.Preview })));
const EditorPanel = lazy(() => import('./components/EditorPanel').then(m => ({ default: m.EditorPanel })));
const PricingPage = lazy(() => import('./components/PricingPage').then(m => ({ default: m.PricingPage })));
import { AppState, BriefingData, ThemeType, DesignSettings, SectionVisibility, LandingPageContent, LayoutVariant, LeadData, LeadProgressPayload } from './types';
import { generateLandingPageContent, enhancePhoto, generateOfficePhoto, refineLandingPage, sanitizeContent } from './services/gemini';
import { isAuthenticated, getCurrentUser, onAuthStateChange, signOut } from './services/auth';
import {
  createLandingPage,
  updateLandingPage,
  publishLandingPage,
  generateSubdomain,
  getMyLandingPages,
  type LandingPageRow,
} from './services/landing-pages';
import {
  updateLeadStatus,
  buildLeadProgressPayload,
  updateLeadProgress,
  getLeadByResumeToken,
  getLeadForFunnelResume,
  leadRowToLeadData,
  clearLeadResumeLocalStorage,
  linkLeadToUser,
  DUPLICATE_LEAD_EMAIL_MESSAGE,
} from './services/leads';
import { getLeadCaptureSetting } from './services/admin';
import {
  trackBriefingStart,
  trackBriefingComplete,
  trackStyleSelect,
  trackPhotoUpload,
  trackPhotoEnhance,
  trackPreviewView,
  trackContentEdit,
  trackPricingView,
  trackPlanSelect,
  trackCheckoutStart,
  trackCheckoutStep,
  trackPaymentComplete,
  trackDashboardView,
  trackPageView as trackGAPageView,
  trackEvent,
  trackError,
} from './services/google-analytics';

const INITIAL_DESIGN: DesignSettings = {
  colorPalette: 'blue',
  secondaryColor: 'teal',
  fontPairing: 'sans',
  borderRadius: 'medium',
  photoStyle: 'minimal'
};

const INITIAL_VISIBILITY: SectionVisibility = {
  hero: true,
  about: true,
  services: true,
  testimonials: true,
  footer: true,
};

const INITIAL_STATE: AppState = {
  step: 0,
  briefing: {
    name: '',
    crm: '',
    crmState: '',
    rqe: '',
    specialty: '',
    targetAudience: '',
    mainServices: '',
    bio: '',
    tone: 'Profissional e Seguro',
    contactPhone: '',
    contactEmail: '',
    addresses: []
  },
  theme: ThemeType.CLINICAL,
  designSettings: INITIAL_DESIGN,
  sectionVisibility: INITIAL_VISIBILITY,
  layoutVariant: 1,
  photoUrl: null,
  aboutPhotoUrl: null,
  isPhotoAIEnhanced: false,
  generatedContent: null,
  modificationsLeft: 5,
  isLoading: false,
  loadingMessage: '',
  error: null,
};

/** Se o briefing ainda não tem nome (ex.: não persistido na LP), usa o nome do lead. */
function applyLeadNameToBriefingIfEmpty(
  briefing: BriefingData,
  leadName: string | undefined | null
): BriefingData {
  if ((briefing.name ?? '').trim()) return briefing;
  const n = (leadName ?? '').trim();
  if (!n) return briefing;
  return { ...briefing, name: n };
}

function mergeProgressPayload(progress: LeadProgressPayload): Partial<AppState> {
  return {
    step: progress.step,
    briefing: progress.briefing,
    theme: progress.theme,
    designSettings: progress.designSettings,
    sectionVisibility: progress.sectionVisibility,
    layoutVariant: progress.layoutVariant,
    photoUrl: progress.photoUrl,
    aboutPhotoUrl: progress.aboutPhotoUrl,
    isPhotoAIEnhanced: progress.isPhotoAIEnhanced,
    generatedContent: progress.generatedContent,
    modificationsLeft: progress.modificationsLeft ?? INITIAL_STATE.modificationsLeft,
  };
}

function normalizeLeadEmail(e: string | undefined | null): string {
  return (e ?? '').trim().toLowerCase();
}

function emailsMatchLead(userEmail: string | undefined | null, leadEmail: string | undefined | null): boolean {
  const a = normalizeLeadEmail(userEmail);
  const b = normalizeLeadEmail(leadEmail);
  if (!a || !b) return false;
  return a === b;
}

/**
 * Fase 2 — regra única ref vs progress_data (BD):
 * Se o snapshot em memória indica wizard ainda em curso (step < 5 e nome no briefing),
 * usar o ref de imediato (evita desfasagem do debounce de updateLeadProgress).
 * Caso contrário, usar progress_data devolvido por getLeadByResumeToken (se existir).
 */
function wizardRefHasPriorityOverDbProgress(snap: LeadProgressPayload | null): boolean {
  if (!snap) return false;
  if (snap.step >= 5) return false;
  if (!(snap.briefing?.name ?? '').trim()) return false;
  return true;
}

function pickLatestPublishedLandingPage(pages: LandingPageRow[]): LandingPageRow | null {
  const published = pages.filter((lp) => lp.status === 'published');
  if (published.length === 0) return null;
  const ts = (lp: LandingPageRow) => lp.published_at || lp.updated_at || lp.created_at;
  published.sort((a, b) => ts(b).localeCompare(ts(a)));
  return published[0];
}

// --- DUMMY DATA FOR DEV NAVIGATION ---
const DUMMY_BRIEFING: BriefingData = {
  name: 'Dr. Ricardo Mendes',
  crm: '123456',
  crmState: 'SP',
  rqe: '54321',
  specialty: 'Cardiologia',
  targetAudience: 'Adultos e Idosos',
  mainServices: 'Check-up, Eletrocardiograma, Teste Ergométrico',
  bio: 'Especialista em saúde do coração com 15 anos de experiência.',
  tone: 'Profissional',
  contactPhone: '(11) 99999-9999',
  contactEmail: 'doutor@email.com',
  addresses: ['Av. Paulista, 1000, São Paulo - SP']
};

const DUMMY_CONTENT: LandingPageContent = {
  headline: "Cuidando do seu coração com excelência",
  subheadline: "Medicina baseada em evidências para sua longevidade e bem-estar.",
  ctaText: "Agendar Consulta",
  aboutTitle: "Sobre o Dr. Ricardo",
  aboutBody: "Formado pela USP, o Dr. Ricardo dedica sua vida a prevenir e tratar doenças cardiovasculares. Com abordagem humanizada, busca não apenas tratar doenças, mas promover saúde.",
  servicesTitle: "Especialidades",
  services: [
    { title: "Check-up Cardiológico", description: "Avaliação completa para prevenção." },
    { title: "Eletrocardiograma", description: "Exame preciso do ritmo cardíaco." },
    { title: "Teste Ergométrico", description: "Avaliação do coração sob esforço." }
  ],
  testimonials: [
    { name: "Maria Silva", text: "Excelente médico, muito atencioso e explicou tudo com calma." },
    { name: "João Santos", text: "Consultório impecável e atendimento pontual." }
  ],
  footerText: "Diretor Técnico Médico: Dr. Ricardo Mendes - CRM/SP 123456",
  contactEmail: 'doutor@email.com',
  contactPhone: '(11) 99999-9999',
  contactAddresses: ['Av. Paulista, 1000, São Paulo - SP']
};

interface AppProps {
  isDevMode?: boolean;
}

const App: React.FC<AppProps> = ({ isDevMode = false }) => {
  const location = useLocation();
  
  // Verificar se está na rota /checkout ao inicializar
  const [showSaaSIntro, setShowSaaSIntro] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      const fromDashboard = searchParams.get('from') === 'dashboard';
      const hasLandingPageId = localStorage.getItem('checkout_landing_page_id');
      // Se está em /checkout vindo do dashboard, não mostrar a home
      if (path === '/checkout' && (fromDashboard || hasLandingPageId)) {
        return false;
      }
      if (localStorage.getItem('lead_resume_token')) {
        return false;
      }
      try {
        const raw = localStorage.getItem('lead_data');
        if (raw) {
          const j = JSON.parse(raw) as LeadData;
          if (j?.resumeToken) return false;
        }
      } catch {
        /* ignore */
      }
    }
    return true;
  });
  const [state, setState] = useState<AppState>(() => {
    // Se está vindo do dashboard, inicializar com step 5
    // Nota: location ainda não está disponível na inicialização, então usamos window.location
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      const fromDashboard = searchParams.get('from') === 'dashboard';
      const hasLandingPageId = localStorage.getItem('checkout_landing_page_id');
      if (path === '/checkout' && (fromDashboard || hasLandingPageId)) {
        return { ...INITIAL_STATE, step: 5 };
      }
    }
    return INITIAL_STATE;
  });
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [pricingViewMode, setPricingViewMode] = useState<'plans' | 'checkout' | 'success' | 'dashboard'>(() => {
    // Se está vindo do dashboard, inicializar com checkout
    // Nota: location ainda não está disponível na inicialização, então usamos window.location
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      const fromDashboard = searchParams.get('from') === 'dashboard';
      const hasLandingPageId = localStorage.getItem('checkout_landing_page_id');
      if (path === '/checkout' && (fromDashboard || hasLandingPageId)) {
        return 'checkout';
      }
    }
    return 'plans';
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState<boolean | null>(null);
  const [currentLandingPageId, setCurrentLandingPageId] = useState<string | null>(null);
  const [isCreatingLandingPage, setIsCreatingLandingPage] = useState(false); // Flag para evitar redirecionamentos durante criação
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  /** Sobrepõe `leadData?.email` no Auth (ex.: duplicado na modal de lead). */
  const [authModalPrefillEmail, setAuthModalPrefillEmail] = useState<string | undefined>(undefined);
  const [authModalBannerMessage, setAuthModalBannerMessage] = useState<string | null>(null);
  const [hasAppliedRecommendedTheme, setHasAppliedRecommendedTheme] = useState(false);
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  /** Definido no admin (`lead_capture_enabled`); default true até carregar. */
  const [leadCaptureEnabled, setLeadCaptureEnabled] = useState(true);
  const [leadData, setLeadData] = useState<LeadData | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lead_data');
      if (stored) {
        try {
          return JSON.parse(stored) as LeadData;
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const [isRestoringState, setIsRestoringState] = React.useState(false);
  const stepScrollInitialMount = React.useRef(true);
  /** Snapshot do wizard para pós-login OTP (Fase 2); só preenchido com funil ativo e lead. */
  const wizardProgressRef = useRef<LeadProgressPayload | null>(null);

  // Restaurar estado do localStorage quando voltar do Stripe com canceled=true
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const canceled = searchParams.get('canceled') === 'true';
    const fullUrl = window.location.href;
    
    if (canceled) {
      trackEvent('checkout_canceled', { event_category: 'conversion' });
      setIsRestoringState(true);
      
      // Se não está na rota /checkout, redirecionar para lá
      if (path !== '/checkout') {
        window.location.href = '/checkout?canceled=true';
        return;
      }
      
      try {
        const savedState = localStorage.getItem('checkout_state');
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          
          // Restaurar estado do App
          setState(prev => ({
            ...prev,
            step: parsedState.step || 5,
            briefing: parsedState.briefing || prev.briefing,
            generatedContent: parsedState.content || prev.generatedContent,
            designSettings: parsedState.design || prev.designSettings,
            sectionVisibility: parsedState.visibility || prev.sectionVisibility,
            layoutVariant: parsedState.layoutVariant || prev.layoutVariant,
            photoUrl: parsedState.photoUrl || prev.photoUrl,
            aboutPhotoUrl: parsedState.aboutPhotoUrl || prev.aboutPhotoUrl,
          }));
          
          // Fechar a home (SaaSLanding) para mostrar o checkout
          setShowSaaSIntro(false);
          
          // Restaurar pricingViewMode
          if (parsedState.pricingViewMode) {
            setPricingViewMode(parsedState.pricingViewMode);
          }
          
          // Marcar que a restauração foi concluída após um pequeno delay
          setTimeout(() => {
            setIsRestoringState(false);
          }, 500);
          
          // Não limpar o localStorage imediatamente - deixar o PricingPage ler também
          // Limpar após um delay para garantir que o PricingPage tenha tempo de ler
          setTimeout(() => {
            localStorage.removeItem('checkout_state');
          }, 2000);
        } else {
          setIsRestoringState(false);
        }
      } catch (error) {
        console.error('Erro ao restaurar estado do localStorage:', error);
        setIsRestoringState(false);
      }
    }
  }, []); // Executar apenas uma vez quando o componente monta

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const enabled = await getLeadCaptureSetting();
        if (!cancelled) setLeadCaptureEnabled(enabled);
      } catch (e) {
        console.warn('lead_capture_enabled:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Home: utilizador logado tem alguma LP com status `published`? (para CTA / Painel) */
  type HomePublishedState = 'idle' | 'loading' | 'published' | 'not_published';
  const [homePublishedState, setHomePublishedState] = useState<HomePublishedState>('idle');

  useEffect(() => {
    if (!showSaaSIntro || !isAuthenticatedUser) {
      setHomePublishedState('idle');
      return;
    }
    let cancelled = false;
    setHomePublishedState('loading');
    (async () => {
      try {
        const landingPages = await getMyLandingPages();
        if (cancelled) return;
        const hasPublished = landingPages.some((lp) => lp.status === 'published');
        setHomePublishedState(hasPublished ? 'published' : 'not_published');
      } catch {
        if (!cancelled) setHomePublishedState('not_published');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showSaaSIntro, isAuthenticatedUser]);

  const funnelContinueMode =
    Boolean(isAuthenticatedUser) && homePublishedState === 'not_published';

  // Detectar se está na rota /checkout e ajustar estado inicial
  // Função para verificar e ajustar o estado do checkout
  const checkCheckoutRoute = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const canceled = searchParams.get('canceled') === 'true';
    const fromDashboard = searchParams.get('from') === 'dashboard';
    const hasLandingPageId = localStorage.getItem('checkout_landing_page_id');
    
    if (path === '/checkout') {
      // Se veio do dashboard, garantir que a home não seja mostrada
      if (fromDashboard || hasLandingPageId) {
        setShowSaaSIntro(false);
      }
      
      // Se está na rota /checkout sem dados, redirecionar para home
      // MAS: se canceled=true, está restaurando estado, ou veio do dashboard, não redirecionar ainda
      if (!state.generatedContent || !state.briefing.name) {
        if (canceled || isRestoringState || fromDashboard || hasLandingPageId) {
          // Se veio do dashboard ou tem landingPageId, permitir acesso ao checkout
          // O PricingPage vai lidar com a lógica de carregar dados da landing page existente
          if (state.step !== 5) {
            setState(prev => ({ ...prev, step: 5 }));
          }
          if (pricingViewMode !== 'checkout') {
            setPricingViewMode('checkout');
          }
          return;
        } else {
          window.location.href = '/';
          return;
        }
      }
      
      // Se está na rota /checkout com dados (incluindo quando canceled=true),
      // mostrar PricingPage no modo checkout para permitir que o usuário veja o input do cupom
      if (state.step !== 5) {
        setState(prev => ({ ...prev, step: 5 }));
      }
      if (pricingViewMode !== 'checkout') {
        setPricingViewMode('checkout');
      }
    }
  }, [location.pathname, location.search, state.generatedContent, state.briefing.name, state.step, pricingViewMode, isRestoringState]);

  // Executar quando a rota mudar (detecta navegação do React Router)
  // Este é o useEffect principal que detecta mudanças de rota
  useEffect(() => {
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const fromDashboard = searchParams.get('from') === 'dashboard';
    const hasLandingPageId = localStorage.getItem('checkout_landing_page_id');
    
    console.log('[ROUTE CHANGE] Rota mudou:', { path, search: location.search, fromDashboard, hasLandingPageId });
    
    // Se está em /checkout vindo do dashboard, configurar estado imediatamente
    if (path === '/checkout' && (fromDashboard || hasLandingPageId)) {
      console.log('[CHECKOUT] Detectado acesso do dashboard, configurando estado imediatamente...', { fromDashboard, hasLandingPageId, path });
      
      // Atualizar estados de forma síncrona
      setShowSaaSIntro(false);
      setState(prev => {
        if (prev.step !== 5) {
          console.log('[CHECKOUT] Configurando step para 5');
          return { ...prev, step: 5 };
        }
        return prev;
      });
      setPricingViewMode(prev => {
        if (prev !== 'checkout') {
          console.log('[CHECKOUT] Configurando pricingViewMode para checkout');
          return 'checkout';
        }
        return prev;
      });
    }
    
    // Executar checkCheckoutRoute também para garantir consistência
    // Usar setTimeout para garantir que os estados sejam atualizados primeiro
    setTimeout(() => {
      checkCheckoutRoute();
    }, 0);
  }, [location.pathname, location.search]); // Executar quando a rota mudar - removido checkCheckoutRoute das dependências para evitar loops

  // Executar quando as dependências mudarem
  useEffect(() => {
    checkCheckoutRoute();
  }, [checkCheckoutRoute]);

  // Escutar mudanças na URL (quando volta do Stripe)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Executar imediatamente
    checkCheckoutRoute();
    
    // Escutar eventos de navegação
    const handlePopState = () => {
      setTimeout(checkCheckoutRoute, 100); // Pequeno delay para garantir que a URL foi atualizada
    };
    
    window.addEventListener('popstate', handlePopState);
    
    // Também verificar periodicamente quando na rota /checkout (fallback)
    const interval = setInterval(() => {
      if (window.location.pathname === '/checkout') {
        checkCheckoutRoute();
      }
    }, 500);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      clearInterval(interval);
    };
  }, [checkCheckoutRoute]);

  useEffect(() => {
    trackGAPageView('/', 'DocPage AI - Landing Pages para Médicos');
  }, []);

  // Verificar autenticação ao carregar (sem bloquear o acesso)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await isAuthenticated();
        setIsAuthenticatedUser(authenticated);
      } catch (error) {
        setIsAuthenticatedUser(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();

    // Observar mudanças de autenticação
    const { data: { subscription } } = onAuthStateChange((user) => {
      setIsAuthenticatedUser(!!user);
      if (user) {
        setShowAuthModal(false);
        setAuthModalPrefillEmail(undefined);
        setAuthModalBannerMessage(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Scroll para o topo no mobile quando o step muda (não no mount inicial, para não disparar evento scroll do GA4)
  useEffect(() => {
    if (stepScrollInitialMount.current) {
      stepScrollInitialMount.current = false;
      return;
    }
    const isMobile = window.innerWidth < 768;
    if (isMobile && state.step !== undefined) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const mainElement = document.querySelector('main');
        if (mainElement) {
          mainElement.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [state.step]);

  // Helper para atualizar status do lead (ignora dev-lead-id)
  const safeUpdateLeadStatus = React.useCallback(async (status: Parameters<typeof updateLeadStatus>[1]) => {
    const lid = leadData?.id;
    if (!lid || lid === 'dev-lead-id') return;
    try {
      await updateLeadStatus(lid, status, leadData?.resumeToken ?? null);
    } catch (e) {
      console.warn('Erro ao atualizar status do lead:', e);
    }
  }, [leadData?.id, leadData?.resumeToken]);

  // Atualizar status do lead: briefing_started ao montar BriefingForm (step 0)
  useEffect(() => {
    if (!showSaaSIntro && state.step === 0 && leadData) {
      safeUpdateLeadStatus('briefing_started');
    }
  }, [showSaaSIntro, state.step, leadData, safeUpdateLeadStatus]);

  // Track step changes (só disparar briefing_start quando o formulário de briefing estiver visível, não na homepage)
  useEffect(() => {
    if (!showSaaSIntro && state.step === 0) {
      trackBriefingStart();
    } else if (state.step === 1) {
      trackGAPageView('/step/content', 'Configuração de Conteúdo');
    } else if (state.step === 2) {
      trackGAPageView('/step/photo', 'Upload de Foto');
    } else if (state.step === 3) {
      trackGAPageView('/step/visual', 'Configuração Visual');
    } else if (state.step === 4) {
      trackPreviewView();
      trackGAPageView('/step/editor', 'Editor de Conteúdo');
    } else if (state.step === 5) {
      trackPricingView();
      trackGAPageView('/step/pricing', 'Planos e Preços');
      
      // Scroll automático para a seção de planos quando entrar no step 5
      setTimeout(() => {
        const plansSection = document.getElementById('plans-section');
        if (plansSection) {
          plansSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }
  }, [state.step, showSaaSIntro]);

  // Salvamento automático removido - landing page só será salva após assinatura e pagamento

  const getRecommendedThemeForSpecialty = (specialty: string): ThemeType | null => {
    const s = specialty.toLowerCase();
    if (s.includes('cardio') || s.includes('clínica geral') || s.includes('clinica geral') || s.includes('medicina interna')) {
      return ThemeType.CLINICAL;
    }
    if (s.includes('pediatria') || s.includes('psiquiatria') || s.includes('geriatria') || s.includes('psicologia')) {
      return ThemeType.CARING;
    }
    if (s.includes('dermato') || s.includes('plástica') || s.includes('plastica') || s.includes('esportiva')) {
      return ThemeType.MODERN;
    }
    return null;
  };

  // Helpers to update state
  const updateBriefing = (data: BriefingData) => setState(prev => ({ ...prev, briefing: data }));
  
  const updateTheme = React.useCallback((theme: ThemeType) => {
    console.log('[updateTheme] called with', theme);
    setState(prev => {
      let newDesign: DesignSettings = { ...prev.designSettings };
      
      if (theme === ThemeType.CLINICAL) {
        newDesign = { ...newDesign, colorPalette: 'blue', secondaryColor: 'teal', fontPairing: 'sans', borderRadius: 'medium', photoStyle: 'minimal' };
      } else if (theme === ThemeType.CARING) {
        newDesign = { ...newDesign, colorPalette: 'green', secondaryColor: 'gold', fontPairing: 'serif-sans', borderRadius: 'full', photoStyle: 'organic' };
      } else if (theme === ThemeType.MODERN) {
        newDesign = { ...newDesign, colorPalette: 'slate', secondaryColor: 'purple', fontPairing: 'sans', borderRadius: 'none', photoStyle: 'glass' };
      }
      console.log('[updateTheme] newDesign', newDesign);
      return { ...prev, theme, designSettings: newDesign };
    });
  }, []);

  // Trigger Confetti when entering Editor Step (Step 4)
  useEffect(() => {
    if (state.step === 4) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 2000); 
      return () => clearTimeout(timer);
    }
  }, [state.step]);

  // Apply recommended theme automatically once when entering Visual step
  useEffect(() => {
    if (state.step === 3 && !hasAppliedRecommendedTheme) {
      const recommended = getRecommendedThemeForSpecialty(state.briefing.specialty || '');
      if (recommended) {
        updateTheme(recommended);
      }
      setHasAppliedRecommendedTheme(true);
    }
  }, [state.step, state.briefing.specialty, hasAppliedRecommendedTheme, updateTheme]);

  const updatePhoto = (url: string) => {
    // Quando uma foto é feita upload, apenas salva a foto original
    // A foto do consultório será gerada apenas quando clicar em "Gerar Landing Page"
    trackPhotoUpload();
    setState(prev => ({ ...prev, photoUrl: url, aboutPhotoUrl: null, isPhotoAIEnhanced: false }));
  };

  const handleUpdateContent = (key: keyof LandingPageContent, value: any) => {
    if (!state.generatedContent) return;
    trackContentEdit(key);
    setState(prev => {
      const newContent = { ...prev.generatedContent!, [key]: value };
      
      // Se está editando depoimentos, marcar como customizados
      let newVisibility = prev.sectionVisibility;
      if (key === 'testimonials') {
        newVisibility = {
          ...prev.sectionVisibility,
          hasCustomTestimonials: true, // Marcar como customizado
        } as any;
      }
      
      return {
        ...prev,
        generatedContent: newContent,
        sectionVisibility: newVisibility,
      };
    });
  };

  const handleUpdateDesign = (key: keyof DesignSettings, value: any) => {
    if (key === 'colorPalette' || key === 'fontPairing' || key === 'photoStyle') {
      trackStyleSelect(`${key}:${value}`);
    }
    setState(prev => ({
      ...prev,
      designSettings: { ...prev.designSettings, [key]: value }
    }));
  };

  const handleUpdateLayout = (variant: LayoutVariant) => {
    trackEvent('layout_select', { event_category: 'user_journey', variant });
    setState(prev => ({ ...prev, layoutVariant: variant }));
  };

  const handleToggleSection = (key: keyof SectionVisibility) => {
    setState(prev => ({
      ...prev,
      sectionVisibility: { ...prev.sectionVisibility, [key]: !prev.sectionVisibility[key] }
    }));
  };

  const handleEnhancePhoto = async (originalUrl: string) => {
    trackPhotoEnhance();
    setState(prev => ({ ...prev, isLoading: true, loadingMessage: 'IA está criando suas fotos (Perfil Profissional + Consultório)...' }));
    try {
      // 1. Melhora a foto de perfil para uma foto profissional de médico/médica com trajes médicos
      // 2. Gera a foto do consultório com o médico ambientado
      const [enhancedUrl, officeUrl] = await Promise.all([
        enhancePhoto(originalUrl),  // Foto profissional de perfil
        generateOfficePhoto(originalUrl)  // Foto ambientada no consultório
      ]);

      setState(prev => ({ 
        ...prev, 
        photoUrl: enhancedUrl,
        aboutPhotoUrl: officeUrl,
        isPhotoAIEnhanced: true, 
        isLoading: false 
      }));
    } catch (e: any) {
      console.error(e);
      trackError('photo_enhance', e?.message || 'Falha ao melhorar foto');
      setState(prev => ({ ...prev, isLoading: false, error: 'Falha ao melhorar foto. Tente novamente.' }));
    }
  };

  const handleEnhanceProfilePhoto = async () => {
    if (!state.photoUrl) return;
    
    trackPhotoEnhance();
    setState(prev => ({ ...prev, isLoading: true, loadingMessage: 'Melhorando foto de perfil com IA...' }));
    try {
      const enhancedUrl = await enhancePhoto(state.photoUrl);
      setState(prev => ({ 
        ...prev, 
        photoUrl: enhancedUrl,
        isPhotoAIEnhanced: true,
        isLoading: false 
      }));
    } catch (e: any) {
      console.error(e);
      trackError('photo_enhance_profile', e?.message || 'Falha ao melhorar foto de perfil');
      setState(prev => ({ ...prev, isLoading: false, error: 'Falha ao melhorar foto de perfil. Tente novamente.' }));
    }
  };

  // Handler para upload manual da foto de consultório
  const handleAboutPhotoChange = (url: string) => {
    setState(prev => ({ ...prev, aboutPhotoUrl: url }));
  };

  // Handler para gerar foto de consultório por IA
  const handleGenerateOfficePhoto = async () => {
    if (!state.photoUrl) {
      setState(prev => ({ ...prev, error: 'É necessário ter uma foto de perfil para gerar a foto de consultório por IA.' }));
      return;
    }
    
    setState(prev => ({ ...prev, isLoading: true, loadingMessage: 'Gerando foto ambientada no consultório...' }));
    try {
      const officeUrl = await generateOfficePhoto(state.photoUrl);
      setState(prev => ({ 
        ...prev, 
        aboutPhotoUrl: officeUrl,
        isLoading: false 
      }));
    } catch (e) {
      console.error(e);
      setState(prev => ({ ...prev, isLoading: false, error: 'Falha ao gerar foto de consultório. Tente novamente.' }));
    }
  };

  const handleGenerateContentOnly = async () => {
    trackGAPageView('/step/content/generate', 'Gerando Conteúdo');
    setState(prev => ({ ...prev, isLoading: true, loadingMessage: 'Gerando conteúdo e foto do consultório...' }));
    try {
      // Gera o conteúdo da landing page
      const content = await generateLandingPageContent(state.briefing);
      
      const contentWithContact = {
         ...content,
         contactEmail: state.briefing.contactEmail,
         contactPhone: state.briefing.contactPhone,
         contactAddresses: state.briefing.addresses
      };

      const sanitizedContent = sanitizeContent(contentWithContact);

      // Se houver foto de perfil mas não houver foto do consultório, gera a foto do consultório
      let officePhotoUrl = state.aboutPhotoUrl;
      if (state.photoUrl && !state.aboutPhotoUrl) {
        try {
          setState(prev => ({ ...prev, loadingMessage: 'Gerando foto ambientada no consultório...' }));
          officePhotoUrl = await generateOfficePhoto(state.photoUrl);
        } catch (error) {
          console.error('Erro ao gerar foto do consultório:', error);
          // Continua mesmo se falhar a geração da foto do consultório
        }
      }

      trackEvent('content_generated', {
        event_category: 'user_journey',
        specialty: state.briefing.specialty,
      });

      setState(prev => ({ 
        ...prev, 
        generatedContent: sanitizedContent,
        aboutPhotoUrl: officePhotoUrl || prev.aboutPhotoUrl,
        isLoading: false 
      }));
    } catch (e: any) {
      console.error(e);
      trackError('content_generation', e?.message || 'Erro desconhecido');
      setState(prev => ({ ...prev, isLoading: false, error: 'Erro ao gerar conteúdo. Verifique sua conexão.' }));
    }
  };

  const handleContentApproved = () => {
     safeUpdateLeadStatus('content_generated');
     trackGAPageView('/step/photo', 'Upload de Foto');
     setState(prev => ({ ...prev, step: 2 }));
  };

  const handlePhotoStepNext = async () => {
    // Marcar que está criando landing page para evitar redirecionamentos automáticos
    setIsCreatingLandingPage(true);
    
    // Se a foto não foi melhorada com IA, gerar automaticamente a foto do consultório
    if (state.photoUrl && !state.isPhotoAIEnhanced && !state.aboutPhotoUrl) {
      try {
        setState(prev => ({ ...prev, isLoading: true, loadingMessage: 'Gerando foto ambientada no consultório...' }));
        const officePhotoUrl = await generateOfficePhoto(state.photoUrl);
        
        safeUpdateLeadStatus('photo_uploaded');
        setState(prev => {
          let nextState = { 
            ...prev, 
            aboutPhotoUrl: officePhotoUrl,
            isLoading: false,
            step: 3 
          };

          // Initialize with a random layout if not set
          if (prev.layoutVariant === 1) {
             const randomVariant = Math.floor(Math.random() * 5) + 1 as LayoutVariant;
             nextState.layoutVariant = randomVariant;
          }
          
          return nextState;
        });
      } catch (error) {
        console.error('Erro ao gerar foto do consultório:', error);
        safeUpdateLeadStatus('photo_uploaded');
        // Continua mesmo se falhar a geração da foto do consultório
        setState(prev => {
          let nextState = { ...prev, isLoading: false, step: 3 };

          // Initialize with a random layout if not set
          if (prev.layoutVariant === 1) {
             const randomVariant = Math.floor(Math.random() * 5) + 1 as LayoutVariant;
             nextState.layoutVariant = randomVariant;
          }
          
          return nextState;
        });
      }
    } else {
      // Se já tem foto melhorada ou não tem foto, apenas avançar
      safeUpdateLeadStatus('photo_uploaded');
      setState(prev => {
        let nextState = { ...prev, isLoading: false, step: 3 };

        // Initialize with a random layout if not set
        if (prev.layoutVariant === 1) {
           const randomVariant = Math.floor(Math.random() * 5) + 1 as LayoutVariant;
           nextState.layoutVariant = randomVariant;
        }
        
        return nextState;
      });
    }
  };

  const handleVisualConfigNext = () => {
     safeUpdateLeadStatus('visual_configured');
     setIsSidebarOpen(false); // Force Sidebar close
     trackPreviewView();
     setState(prev => ({ ...prev, step: 4 }));
  };

  const handleRefine = async (instruction: string) => {
    if (!state.generatedContent || state.modificationsLeft <= 0) return;

    setState(prev => ({ ...prev, isLoading: true, loadingMessage: 'IA está processando suas alterações...' }));
    try {
      const response = await refineLandingPage(
        state.generatedContent,
        state.designSettings,
        state.sectionVisibility,
        instruction
      );

      setState(prev => {
        const newState = { ...prev };
        
        if (response.content) {
          newState.generatedContent = sanitizeContent(response.content);
        }
        if (response.design) {
          newState.designSettings = { ...prev.designSettings, ...response.design };
        }
        if (response.visibility) {
           newState.sectionVisibility = { ...prev.sectionVisibility, ...response.visibility };
        }

        newState.modificationsLeft = prev.modificationsLeft - 1;
        newState.isLoading = false;
        return newState;
      });

    } catch (e: any) {
      console.error(e);
      trackError('ai_refine', e?.message || 'Falha ao refinar conteúdo');
      setState(prev => ({ ...prev, isLoading: false, error: 'Não foi possível aplicar as alterações.' }));
    }
  };

  const handleEditorFinish = () => {
    safeUpdateLeadStatus('editor_completed');
    // Ir para step 5 (Publicar) sem salvar ainda
    // O salvamento acontecerá apenas após assinatura e pagamento
    setState(prev => ({ ...prev, step: 5 })); // Step 5 = Publicar (Pricing)
  };

  // Persistir leadData + tokens de retomada no localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (leadData) {
      localStorage.setItem('lead_data', JSON.stringify(leadData));
      if (leadData.resumeToken) {
        localStorage.setItem('lead_resume_token', leadData.resumeToken);
      }
      localStorage.setItem('lead_id', leadData.id);
    } else {
      clearLeadResumeLocalStorage();
    }
  }, [leadData]);

  // Retomar funil anónimo por resume_token (Fase 1)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;

    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const fromDashboard = searchParams.get('from') === 'dashboard';
    const hasLandingPageId = localStorage.getItem('checkout_landing_page_id');
    if (path === '/checkout' && (fromDashboard || hasLandingPageId)) {
      return undefined;
    }

    const token =
      localStorage.getItem('lead_resume_token') ||
      (() => {
        try {
          const raw = localStorage.getItem('lead_data');
          if (!raw) return null;
          const j = JSON.parse(raw) as LeadData;
          return j?.resumeToken ?? null;
        } catch {
          return null;
        }
      })();

    if (!token) return undefined;

    (async () => {
      try {
        const row = await getLeadByResumeToken(token);
        if (cancelled) return;

        if (!row) {
          clearLeadResumeLocalStorage();
          setLeadData(null);
          setShowSaaSIntro(true);
          return;
        }

        const storedId = localStorage.getItem('lead_id');
        if (storedId && storedId !== row.id) {
          clearLeadResumeLocalStorage();
          setLeadData(null);
          setShowSaaSIntro(true);
          return;
        }

        setLeadData({
          id: row.id,
          name: row.name,
          email: row.email,
          whatsapp: row.whatsapp || undefined,
          marketingConsent: row.marketing_consent,
          resumeToken: row.resume_token,
        });

        const pd = row.progress_data;
        if (pd && typeof pd === 'object' && typeof pd.step === 'number') {
          setState((prev) => {
            const next = { ...prev, ...mergeProgressPayload(pd as LeadProgressPayload) };
            return {
              ...next,
              briefing: applyLeadNameToBriefingIfEmpty(next.briefing, row.name),
            };
          });
          const pm = (pd as LeadProgressPayload).pricingViewMode;
          if (pm) setPricingViewMode(pm);
        } else {
          setState((prev) => ({
            ...prev,
            briefing: applyLeadNameToBriefingIfEmpty(prev.briefing, row.name),
          }));
        }

        setShowSaaSIntro(false);
      } catch (e) {
        console.warn('Retomada de lead:', e);
        if (!cancelled) {
          clearLeadResumeLocalStorage();
          setLeadData(null);
          setShowSaaSIntro(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Debounce: persistir progresso do wizard para leads.progress_data
  useEffect(() => {
    const token = leadData?.resumeToken;
    if (!token || leadData.id === 'dev-lead-id' || showSaaSIntro) return;

    const handle = window.setTimeout(() => {
      updateLeadProgress(token, buildLeadProgressPayload(state, pricingViewMode)).catch((err) =>
        console.warn('Persistência do funil:', err)
      );
    }, 450);

    return () => clearTimeout(handle);
  }, [state, pricingViewMode, leadData?.resumeToken, leadData?.id, showSaaSIntro]);

  useEffect(() => {
    if (!leadData || showSaaSIntro) {
      wizardProgressRef.current = null;
      return;
    }
    wizardProgressRef.current = buildLeadProgressPayload(state, pricingViewMode);
  }, [state, pricingViewMode, leadData, showSaaSIntro]);

  const handleRestart = () => {
    setState(INITIAL_STATE);
    setViewMode('desktop');
    setIsSidebarOpen(true);
    setHasAppliedRecommendedTheme(false);
    setIsCreatingLandingPage(false);
    setLeadData(null);
  };
  
  const handleGoHome = () => {
    setState(INITIAL_STATE);
    setViewMode('desktop');
    setIsSidebarOpen(true);
    setShowSaaSIntro(true);
    setShowLeadCapture(false);
    setHasAppliedRecommendedTheme(false);
    setIsCreatingLandingPage(false);
    setLeadData(null);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      trackEvent('logout', { event_category: 'auth' });
      setIsAuthenticatedUser(false);
      setState(INITIAL_STATE);
      setCurrentLandingPageId(null);
      clearLeadResumeLocalStorage();
      setLeadData(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
    setAuthModalPrefillEmail(undefined);
    setAuthModalBannerMessage(null);
  };

  const handleAuthSuccess = async () => {
    setIsAuthenticatedUser(true);
    closeAuthModal();
    setState(prev => ({ ...prev, error: null }));
    trackEvent('login', { event_category: 'auth', method: 'otp' });

    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const { supabase } = await import('./lib/supabase');
      console.log('handleAuthSuccess: Fazendo refresh da sessão...');
      const { data: { session: refreshResult }, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError) {
        console.error('Erro ao refresh da sessão no handleAuthSuccess:', refreshError);
      }

      if (!refreshResult) {
        console.warn('Refresh da sessão retornou null');
        await new Promise(resolve => setTimeout(resolve, 1000));
        const { data: { session: retryRefresh } } = await supabase.auth.refreshSession();
        if (!retryRefresh) {
          console.error('Não foi possível obter sessão após login');
          return;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      if (isCreatingLandingPage) {
        console.log('handleAuthSuccess: Usuário está criando landing page, ignorando redirecionamento automático');
        return;
      }

      const user = await getCurrentUser();
      if (!user?.id) {
        console.warn('handleAuthSuccess: sem utilizador após refresh');
        return;
      }

      const userEmail = user.email;
      const landingPages = await getMyLandingPages();
      console.log('handleAuthSuccess: Landing pages encontradas:', landingPages?.length || 0);

      let effectiveLeadData: LeadData | null = leadData;
      /** progress_data já devolvido por getLeadForFunnelResume (evita 2ª RPC após OTP). */
      let progressHydratedFromEmailRpc: LeadProgressPayload | null = null;
      if (!effectiveLeadData) {
        try {
          const row = await getLeadForFunnelResume();
          if (row) {
            effectiveLeadData = leadRowToLeadData(row);
            progressHydratedFromEmailRpc =
              row.progress_data && typeof row.progress_data === 'object'
                ? (row.progress_data as LeadProgressPayload)
                : null;
            setLeadData(effectiveLeadData);
            console.log('handleAuthSuccess: lead hidratado por e-mail (BD)', effectiveLeadData.id);
          }
        } catch (e) {
          console.warn('handleAuthSuccess: getLeadForFunnelResume:', e);
        }
      }

      const hasPublished = landingPages.some((lp) => lp.status === 'published');

      const applyLandingPageToState = (lp: LandingPageRow) => {
        setCurrentLandingPageId(lp.id);
        setPricingViewMode('dashboard');
        if (lp.briefing_data) {
          setState((prev) => ({
            ...prev,
            briefing: lp.briefing_data,
            generatedContent: lp.content_data,
            designSettings: lp.design_settings,
            sectionVisibility: lp.section_visibility || INITIAL_VISIBILITY,
            layoutVariant: (lp.layout_variant || 1) as LayoutVariant,
            photoUrl: lp.photo_url,
            aboutPhotoUrl: lp.about_photo_url,
            step: 5,
          }));
        }
        setShowSaaSIntro(false);
      };

      if (hasPublished) {
        const publishedLp = pickLatestPublishedLandingPage(landingPages);
        if (publishedLp?.briefing_data) {
          if (
            effectiveLeadData &&
            emailsMatchLead(userEmail, effectiveLeadData.email) &&
            effectiveLeadData.id !== 'dev-lead-id'
          ) {
            try {
              await linkLeadToUser(effectiveLeadData.id, user.id);
            } catch (e) {
              console.warn('handleAuthSuccess: linkLeadToUser (published):', e);
            }
          }
          applyLandingPageToState(publishedLp);
          console.log('handleAuthSuccess: dashboard com LP publicada');
        } else {
          console.warn('handleAuthSuccess: LP publicada sem briefing_data');
        }
        return;
      }

      if (effectiveLeadData && emailsMatchLead(userEmail, effectiveLeadData.email)) {
        if (effectiveLeadData.id !== 'dev-lead-id') {
          try {
            await linkLeadToUser(effectiveLeadData.id, user.id);
          } catch (e) {
            console.warn('handleAuthSuccess: linkLeadToUser:', e);
          }
        }

        let dbProgress: LeadProgressPayload | null = progressHydratedFromEmailRpc;
        if (dbProgress == null && effectiveLeadData.resumeToken) {
          try {
            const row = await getLeadByResumeToken(effectiveLeadData.resumeToken);
            dbProgress = row?.progress_data ?? null;
          } catch (e) {
            console.warn('handleAuthSuccess: getLeadByResumeToken:', e);
          }
        }

        const snap = wizardProgressRef.current;
        if (wizardRefHasPriorityOverDbProgress(snap)) {
          setState((prev) => {
            const next = { ...prev, ...mergeProgressPayload(snap!) };
            return {
              ...next,
              briefing: applyLeadNameToBriefingIfEmpty(next.briefing, effectiveLeadData.name),
            };
          });
          if (snap!.pricingViewMode) setPricingViewMode(snap!.pricingViewMode);
          setShowSaaSIntro(false);
          console.log('handleAuthSuccess: retomar wizard (ref)');
          return;
        }

        if (dbProgress && typeof dbProgress.step === 'number') {
          setState((prev) => {
            const next = { ...prev, ...mergeProgressPayload(dbProgress) };
            return {
              ...next,
              briefing: applyLeadNameToBriefingIfEmpty(next.briefing, effectiveLeadData.name),
            };
          });
          if (dbProgress.pricingViewMode) setPricingViewMode(dbProgress.pricingViewMode);
          setShowSaaSIntro(false);
          console.log('handleAuthSuccess: retomar wizard (progress_data)');
          return;
        }
      }

      if (landingPages.length > 0) {
        const latestLandingPage = landingPages[0];
        console.log('handleAuthSuccess: dashboard com draft / legado', {
          id: latestLandingPage.id,
          status: latestLandingPage.status,
        });
        applyLandingPageToState(latestLandingPage);
      } else {
        console.log('handleAuthSuccess: sem landing pages — mantém ecrã atual');
      }
    } catch (error: unknown) {
      console.error('Erro ao verificar landing pages após login:', error);
    }
  };

  const handleEditSite = () => {
    // Go back to Editor Step
    setState(prev => ({ ...prev, step: 4 }));
    setIsSidebarOpen(true);
    setPricingViewMode('plans'); // Reset pricing view so it doesn't show dashboard when we return eventually
  };

  // --- DEV NAVIGATION ---
  const handleDevNavigation = (step: number, mode?: 'plans' | 'checkout' | 'dashboard') => {
    setShowSaaSIntro(false);
    setShowLeadCapture(false);
    // Dev mode: preencher leadData default para ter email no checkout
    if (!leadData) {
      setLeadData({
        id: 'dev-lead-id',
        name: 'Dev User',
        email: 'dev@docpage.com.br',
        marketingConsent: false,
      });
    }
    
    // Reset auto theme recommendation when jumping between steps
    if (step <= 3) {
      setHasAppliedRecommendedTheme(false);
    }
    
    // Inject Dummy Data if needed
    const needsBriefing = step >= 0;
    const needsContent = step >= 1;
    const needsPhoto = step >= 3;

    setState(prev => ({
      ...prev,
      step,
      briefing: needsBriefing ? (prev.briefing.name ? prev.briefing : DUMMY_BRIEFING) : prev.briefing,
      generatedContent: needsContent ? (prev.generatedContent || DUMMY_CONTENT) : prev.generatedContent,
      // Use a placeholder photo if none exists
      photoUrl: needsPhoto ? (prev.photoUrl || "https://randomuser.me/api/portraits/men/32.jpg") : prev.photoUrl,
      // Use a placeholder office photo if none exists
      aboutPhotoUrl: needsPhoto ? (prev.aboutPhotoUrl || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&q=80") : prev.aboutPhotoUrl,
      isPhotoAIEnhanced: needsPhoto,
      layoutVariant: prev.layoutVariant === 1 ? 4 : prev.layoutVariant // Ensure interesting layout
    }));

    if (mode) {
      setPricingViewMode(mode);
    } else {
      setPricingViewMode('plans');
    }

    if (step === 4) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  };

  const getViewDimensions = () => {
    switch (viewMode) {
      case 'mobile': return 'w-[375px] h-full border-8 border-gray-800 rounded-[2rem] shadow-2xl';
      case 'tablet': return 'w-[768px] h-full border-8 border-gray-800 rounded-[1.5rem] shadow-2xl';
      case 'desktop': default: return 'w-full h-full md:w-[calc(100%-2rem)] md:h-full border border-gray-300 md:rounded-xl shadow-2xl';
    }
  };

  /** CTA principal da SaaS landing: retoma funil / rascunho ou abre captura de lead. */
  const handleSaaSHomePrimaryAction = async () => {
    if (isAuthenticatedUser && !isCreatingLandingPage) {
      try {
        const landingPages = await getMyLandingPages();
        const hasPublished = landingPages.some((lp) => lp.status === 'published');

        if (hasPublished) {
          const publishedLp =
            pickLatestPublishedLandingPage(landingPages) ??
            landingPages.find((lp) => lp.status === 'published');
          if (!publishedLp) return;
          setCurrentLandingPageId(publishedLp.id);
          setPricingViewMode('dashboard');
          if (publishedLp.briefing_data) {
            setState((prev) => ({
              ...prev,
              briefing: publishedLp.briefing_data,
              generatedContent: publishedLp.content_data,
              designSettings: publishedLp.design_settings,
              sectionVisibility: publishedLp.section_visibility || INITIAL_VISIBILITY,
              layoutVariant: (publishedLp.layout_variant || 1) as LayoutVariant,
              photoUrl: publishedLp.photo_url,
              aboutPhotoUrl: publishedLp.about_photo_url,
              step: 5,
            }));
          }
          setShowSaaSIntro(false);
          return;
        }

        const row = await getLeadForFunnelResume();
        if (row) {
          setLeadData(leadRowToLeadData(row));
          const pd = row.progress_data as LeadProgressPayload | null;
          if (pd && typeof pd.step === 'number') {
            setState((prev) => {
              const next = { ...prev, ...mergeProgressPayload(pd) };
              return {
                ...next,
                briefing: applyLeadNameToBriefingIfEmpty(next.briefing, row.name),
              };
            });
            if (pd.pricingViewMode) setPricingViewMode(pd.pricingViewMode);
          } else {
            setState((prev) => ({
              ...prev,
              briefing: applyLeadNameToBriefingIfEmpty(prev.briefing, row.name),
            }));
          }
          setShowSaaSIntro(false);
          setShowLeadCapture(false);
          return;
        }

        if (landingPages.length > 0) {
          const latestLandingPage = landingPages[0];
          setCurrentLandingPageId(latestLandingPage.id);
          setPricingViewMode('dashboard');
          if (latestLandingPage.briefing_data) {
            setState((prev) => ({
              ...prev,
              briefing: latestLandingPage.briefing_data,
              generatedContent: latestLandingPage.content_data,
              designSettings: latestLandingPage.design_settings,
              sectionVisibility: latestLandingPage.section_visibility || INITIAL_VISIBILITY,
              layoutVariant: (latestLandingPage.layout_variant || 1) as LayoutVariant,
              photoUrl: latestLandingPage.photo_url,
              aboutPhotoUrl: latestLandingPage.about_photo_url,
              step: 5,
            }));
          }
          setShowSaaSIntro(false);
          return;
        }
      } catch (error: unknown) {
        console.error('Erro ao retomar a partir da home:', error);
      }
    }

    if (leadCaptureEnabled) {
      setShowLeadCapture(true);
    } else {
      setShowLeadCapture(false);
      setShowSaaSIntro(false);
    }
  };

  const WizardHeader = ({ currentStep }: { currentStep: number }) => {
    const steps = ['Dados', 'Conteúdo', 'Foto', 'Visual', 'Editor', 'Publicar'];
    return (
      <div className="flex items-center justify-center space-x-1 md:space-x-3">
        {steps.map((label, idx) => (
          <div key={idx} className="flex items-center">
            <div className={`flex items-center justify-center w-5 h-5 md:w-8 md:h-8 rounded-full text-xs font-bold border-2 transition-colors ${
              idx <= currentStep 
                ? 'bg-blue-600 border-blue-600 text-white' 
                : 'bg-white border-gray-300 text-gray-400'
            }`}>
              {idx + 1}
            </div>
            <span className={`ml-1 text-[9px] md:text-xs font-medium hidden sm:block ${
              idx <= currentStep ? 'text-gray-900' : 'text-gray-400'
            }`}>
              {label}
            </span>
            {idx < steps.length - 1 && (
              <div className={`w-2 md:w-6 h-0.5 mx-1 ${
                idx < currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`}></div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Não bloquear renderização na verificação de auth - conteúdo aparece imediatamente
  if (showSaaSIntro) {
    return (
      <>
        <SaaSLanding 
          onStart={handleSaaSHomePrimaryAction}
          funnelContinueMode={funnelContinueMode}
          onDevNavigation={isDevMode ? handleDevNavigation : undefined}
          onLoginClick={() => {
            console.log('Login clicado na home');
            setAuthModalPrefillEmail(undefined);
            setAuthModalBannerMessage(null);
            setShowAuthModal(true);
          }}
          isAuthenticated={isAuthenticatedUser || false}
          onLogout={handleLogout}
        />
        
        {/* Modal de Captura de Lead - antes do BriefingForm */}
        {showLeadCapture && (
          <LeadCaptureModal
            onSuccess={(data) => {
              setLeadData(data);
              setShowLeadCapture(false);
              setShowSaaSIntro(false);
              setState((prev) => ({
                ...prev,
                briefing: applyLeadNameToBriefingIfEmpty(prev.briefing, data.name),
              }));
            }}
            onClose={() => setShowLeadCapture(false)}
            onDuplicateEmail={(email) => {
              setShowLeadCapture(false);
              setAuthModalPrefillEmail(email);
              setAuthModalBannerMessage(DUPLICATE_LEAD_EMAIL_MESSAGE);
              setShowAuthModal(true);
            }}
          />
        )}

        {/* Modal de Autenticação - deve aparecer mesmo quando showSaaSIntro é true */}
        {showAuthModal && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in"
            onClick={closeAuthModal}
          >
            <div 
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeAuthModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <Auth 
                onSuccess={handleAuthSuccess}
                initialEmail={authModalPrefillEmail ?? leadData?.email}
                bannerMessage={authModalBannerMessage}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  // Determine if we should show the Wizard header
  const isDashboardView = state.step === 5 && pricingViewMode === 'dashboard';

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col h-screen overflow-hidden">
      {/* App Header */}
      <header className={`bg-white border-b border-gray-200 z-50 flex-none h-16`}>
        <div className="max-w-7xl mx-auto px-4 w-full h-full flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={handleGoHome}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-500 rounded-lg shadow-lg shadow-blue-900/20 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <svg className="w-4 h-4 relative z-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="8" cy="8" r="1.5" fill="currentColor" opacity="0.9" />
                <circle cx="16" cy="8" r="1.5" fill="currentColor" opacity="0.9" />
                <circle cx="12" cy="16" r="1.5" fill="currentColor" opacity="0.9" />
                <path d="M8 8 L12 16 M16 8 L12 16 M8 8 L16 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                <circle cx="6" cy="6" r="0.5" fill="currentColor" opacity="0.7">
                  <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="18" cy="6" r="0.5" fill="currentColor" opacity="0.7">
                  <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" begin="0.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="12" cy="18" r="0.5" fill="currentColor" opacity="0.7">
                  <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" begin="1s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-800 hidden md:block group-hover:text-blue-600 transition-colors">DocPage AI</span>
          </div>
          
          {/* Hide Wizard Steps in Dashboard Mode */}
          {!isDashboardView && (
            <div className="absolute left-1/2 transform -translate-x-1/2 w-full md:w-auto flex justify-center">
               <WizardHeader currentStep={state.step} />
            </div>
          )}

          <div className="flex items-center gap-4">
            {state.step === 4 && (
              <div className="hidden md:flex bg-gray-100 p-1 rounded-lg">
                <button 
                  onClick={() => setViewMode('desktop')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'desktop' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </button>
                <button 
                  onClick={() => setViewMode('tablet')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'tablet' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                </button>
                <button 
                  onClick={() => setViewMode('mobile')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'mobile' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                </button>
              </div>
            )}
            
            {/* Botão de Login/Logout */}
            {isAuthenticatedUser ? (
              <button
                onClick={handleLogout}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                title="Sair"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden md:inline">Sair</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthModalPrefillEmail(undefined);
                  setAuthModalBannerMessage(null);
                  setShowAuthModal(true);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
                title="Entrar"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span className="hidden md:inline">Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 relative ${state.step >= 3 ? 'overflow-hidden flex flex-col bg-gray-100' : 'overflow-y-auto'}`}>
        <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
        {state.step === 0 && (
          <div className="max-w-7xl mx-auto px-4 py-8 w-full">
            <BriefingForm 
              data={state.briefing} 
              onChange={updateBriefing} 
              onNext={() => {
                trackBriefingComplete({ specialty: state.briefing.specialty, name: state.briefing.name });
                setState(prev => ({ ...prev, step: 1 }));
              }}
              isDevMode={isDevMode}
            />
          </div>
        )}

        {state.step === 1 && (
          <div className="max-w-7xl mx-auto px-4 py-8 w-full">
             <ContentConfig 
               content={state.generatedContent}
               visibility={state.sectionVisibility}
               onUpdateContent={handleUpdateContent}
               onToggleSection={handleToggleSection}
               onNext={handleContentApproved}
               onBack={() => setState(prev => ({ ...prev, step: 0 }))}
               isLoading={state.isLoading}
               onGenerate={handleGenerateContentOnly}
             />
          </div>
        )}

        {state.step === 2 && (
          <div className="max-w-7xl mx-auto px-4 py-8 w-full">
            <PhotoUploader 
              photoUrl={state.photoUrl}
              aboutPhotoUrl={state.aboutPhotoUrl} 
              onPhotoChange={updatePhoto}
              onAboutPhotoChange={handleAboutPhotoChange}
              onEnhance={handleEnhancePhoto}
              onEnhanceProfilePhoto={handleEnhanceProfilePhoto}
              onGenerateOfficePhoto={handleGenerateOfficePhoto}
              isEnhanced={state.isPhotoAIEnhanced}
              onNext={handlePhotoStepNext}
              onBack={() => setState(prev => ({ ...prev, step: 1 }))}
              isLoading={state.isLoading}
            />
          </div>
        )}

        {state.step === 3 && state.generatedContent && (
           <VisualConfig 
              design={state.designSettings}
              photoUrl={state.photoUrl}
              briefing={state.briefing}
              layoutVariant={state.layoutVariant}
              onUpdateDesign={handleUpdateDesign}
              onUpdateLayout={handleUpdateLayout}
              onThemeSelect={updateTheme}
              onNext={handleVisualConfigNext}
              onBack={() => setState(prev => ({ ...prev, step: 2 }))}
           />
        )}

        {state.step === 4 && state.generatedContent && (
          <div className="flex flex-col w-full h-full">
            {showConfetti && <Confetti />}
            
            {/* Main Editor Area (Sidebar + Preview) */}
            <div className="flex-1 flex overflow-hidden relative">
              {/* Left Sidebar - Editor */}
              {isSidebarOpen && (
                <div className="w-80 md:w-96 h-full flex-none z-20 shadow-xl bg-white border-r border-gray-200 animate-slide-right">
                  <EditorPanel 
                    content={state.generatedContent}
                    design={state.designSettings}
                    visibility={state.sectionVisibility}
                    layoutVariant={state.layoutVariant}
                    onUpdateContent={handleUpdateContent}
                    onUpdateDesign={handleUpdateDesign}
                    onUpdateLayout={handleUpdateLayout}
                    onToggleSection={handleToggleSection}
                    onRefineWithAI={handleRefine}
                    modificationsLeft={state.modificationsLeft}
                    isLoading={state.isLoading}
                    onPublish={handleEditorFinish}
                    onHide={() => setIsSidebarOpen(false)}
                    onThemeSelect={updateTheme}
                  />
                </div>
              )}


              {/* Right Area - Preview */}
              <div className="flex-1 h-full overflow-hidden bg-gray-200 flex flex-col items-center justify-center relative p-4 md:p-6 pb-24 md:pb-6">
                 {state.generatedContent ? (
                   <div className={`transition-all duration-300 ease-in-out bg-white overflow-hidden shadow-2xl origin-top ${getViewDimensions()}`}>
                      <Preview 
                        content={state.generatedContent}
                        design={state.designSettings}
                        visibility={state.sectionVisibility}
                        photoUrl={state.photoUrl}
                        aboutPhotoUrl={state.aboutPhotoUrl}
                        briefing={state.briefing}
                        layoutVariant={state.layoutVariant}
                        isEditorMode={true}
                        hasCustomTestimonials={(state.sectionVisibility as any)?.hasCustomTestimonials}
                      />
                   </div>
                 ) : (
                   <div className="bg-white rounded-xl shadow-xl p-8 max-w-md text-center">
                     <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                     <p className="text-gray-600 font-medium mb-2">Conteúdo não disponível</p>
                     <p className="text-sm text-gray-400">Gere o conteúdo da landing page primeiro no passo anterior</p>
                   </div>
                 )}
              </div>
            </div>

            {/* Footer Bar - Static at bottom of flex column */}
            <div className="h-20 bg-white border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-[60] flex-none flex items-center justify-between px-4 md:px-8 fixed md:relative bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:right-auto">
               <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 transition-all border border-gray-300"
                  >
                    {isSidebarOpen ? (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        Fechar Editor
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        Editar Página
                      </>
                    )}
                  </button>
                  <span className="hidden md:inline text-sm text-gray-400 font-medium">Faça ajustes finos no texto e design</span>
               </div>

               <div className="flex items-center gap-4">
                  <div className="hidden md:block text-right mr-4">
                     <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Próximo Passo</p>
                     <p className="text-sm font-bold text-gray-800">Escolher Domínio & Plano</p>
                  </div>
                  <button 
                    onClick={handleEditorFinish}
                    className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-green-200 hover:-translate-y-1 transition-all flex items-center gap-2"
                  >
                    Publicar
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
               </div>
            </div>
          </div>
        )}
        
        {state.step === 5 && (state.generatedContent || localStorage.getItem('checkout_landing_page_id')) && (
          <div className="w-full h-full overflow-y-auto">
            <PricingPage 
              onRestart={handleRestart} 
              onEditSite={handleEditSite}
              doctorName={state.briefing.name || 'Médico'}
              content={state.generatedContent || DUMMY_CONTENT}
              design={state.designSettings || {}}
              visibility={state.sectionVisibility || {
                hero: true,
                about: true,
                services: true,
                testimonials: true,
                footer: true,
              }}
              photoUrl={state.photoUrl}
              aboutPhotoUrl={state.aboutPhotoUrl}
              briefing={state.briefing.name ? state.briefing : {
                name: 'Médico',
                specialty: '',
                crm: '',
                city: '',
                state: '',
                contactEmail: '',
                contactPhone: '',
                contactAddresses: [],
              }}
              layoutVariant={state.layoutVariant || 1}
              selectedDomain=""
              initialViewMode={pricingViewMode}
              landingPageId={currentLandingPageId || localStorage.getItem('checkout_landing_page_id') || undefined}
              leadEmail={leadData?.email}
              leadId={leadData?.id}
              onLeadCheckoutStarted={() => safeUpdateLeadStatus('checkout_started')}
              onCheckoutSuccess={(data) => {
                safeUpdateLeadStatus('subscription_completed');
                clearLeadResumeLocalStorage();
                setLeadData(null);
                localStorage.removeItem('checkout_landing_page_id');
                setIsAuthenticatedUser(true);
                setCurrentLandingPageId(data.landingPageId);
                setPricingViewMode('dashboard');
                setIsCreatingLandingPage(false);
              }}
            />
          </div>
        )}
        </Suspense>
      </main>

      {/* Loading Overlay */}
      {/* Não mostrar overlay no Step 5 (checkout) para não bloquear os inputs */}
      {state.isLoading && state.step !== 1 && state.step !== 5 && ( // Step 1 e Step 5 não devem ter overlay bloqueando
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center text-white px-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-semibold animate-pulse text-center break-words max-w-md" style={{ overflowWrap: 'break-word' }}>{state.loadingMessage}</p>
        </div>
      )}

      {/* Modal de Autenticação - apenas renderiza quando NÃO está na home (já está renderizado no bloco showSaaSIntro) */}
      {!showSaaSIntro && showAuthModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in"
          onClick={closeAuthModal}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeAuthModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <Auth 
              onSuccess={handleAuthSuccess}
              initialEmail={authModalPrefillEmail ?? leadData?.email}
              bannerMessage={authModalBannerMessage}
            />
          </div>
        </div>
      )}

      {/* Error Toast */}
      {state.error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-[100] flex items-center gap-3 animate-slide-up">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div>
            <p className="font-bold">Erro</p>
            <p className="text-sm">{state.error}</p>
          </div>
          <button 
            onClick={() => setState(prev => ({ ...prev, error: null }))}
            className="ml-2 hover:bg-white/20 rounded-full p-1"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
