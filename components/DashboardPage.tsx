import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dashboard } from './Dashboard';
import { Auth } from './Auth';
import { isAuthenticated, getCurrentUser } from '../services/auth';
import { getMyLandingPages } from '../services/landing-pages';
import { Plan } from '../types';
import { trackDashboardView } from '../services/google-analytics';

/**
 * Página standalone do Dashboard
 * Acessível via rota /dashboard
 */
export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState<boolean | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [landingPageId, setLandingPageId] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Track dashboard view - SEMPRE chamar antes de qualquer return condicional
  useEffect(() => {
    if (dashboardData && landingPageId) {
      trackDashboardView();
    }
  }, [dashboardData, landingPageId]);

  // Verificar autenticação ao carregar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await isAuthenticated();
        setIsAuthenticatedUser(authenticated);

        if (!authenticated) {
          // Se não autenticado, mostrar modal de login
          setShowAuthModal(true);
          setIsLoading(false);
          return;
        }

        // Se autenticado, buscar landing pages
        const user = await getCurrentUser();
        if (!user) {
          setShowAuthModal(true);
          setIsLoading(false);
          return;
        }

        console.log('DashboardPage: Buscando landing pages do usuário...');
        const landingPages = await getMyLandingPages();
        console.log('DashboardPage: Landing pages encontradas:', landingPages?.length || 0);

        if (!landingPages || landingPages.length === 0) {
          // Usuário não tem landing pages ainda
          setIsLoading(false);
          return;
        }

        // Pegar a landing page mais recente
        const latestLandingPage = landingPages[0];
        setLandingPageId(latestLandingPage.id);

        // Carregar dados do dashboard
        try {
          const { getDashboardData } = await import('../services/dashboard');
          const data = await getDashboardData(latestLandingPage.id);
          setDashboardData(data);
        } catch (error: any) {
          console.error('Erro ao carregar dados do dashboard:', error);
        }

        setIsLoading(false);
      } catch (error: any) {
        console.error('Erro ao verificar autenticação:', error);
        setIsAuthenticatedUser(false);
        setShowAuthModal(true);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Handler para sucesso de autenticação
  const handleAuthSuccess = async () => {
    setIsAuthenticatedUser(true);
    setShowAuthModal(false);

    // Aguardar um pouco para garantir que a sessão está sincronizada
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Buscar landing pages novamente
      const landingPages = await getMyLandingPages();
      console.log('DashboardPage: Landing pages após login:', landingPages?.length || 0);

      if (landingPages && landingPages.length > 0) {
        const latestLandingPage = landingPages[0];
        setLandingPageId(latestLandingPage.id);

        // Carregar dados do dashboard
        const { getDashboardData } = await import('../services/dashboard');
        const data = await getDashboardData(latestLandingPage.id);
        setDashboardData(data);
      }
    } catch (error: any) {
      console.error('Erro ao carregar landing pages após login:', error);
    }
  };

  // Se ainda está carregando, mostrar loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-slate-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  // Se não autenticado, mostrar modal de login
  if (!isAuthenticatedUser || showAuthModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative">
          <button
            onClick={() => navigate('/')}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Acesso ao Dashboard</h2>
            <p className="text-slate-600 mb-6">Faça login para acessar seu dashboard</p>
            <Auth onSuccess={handleAuthSuccess} />
          </div>
        </div>
      </div>
    );
  }

  // Se não tem landing pages, mostrar mensagem
  if (!landingPageId || !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="mb-6">
            <svg className="w-16 h-16 mx-auto text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Nenhuma Landing Page Encontrada</h2>
          <p className="text-slate-600 mb-6">
            Você ainda não criou nenhuma landing page. Comece criando sua primeira landing page profissional!
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Criar Landing Page
          </button>
        </div>
      </div>
    );
  }

  // Renderizar Dashboard com dados carregados
  // Validar que todos os dados necessários estão presentes
  if (!dashboardData?.landingPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="mb-6">
            <svg className="w-16 h-16 mx-auto text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Erro ao Carregar Dashboard</h2>
          <p className="text-slate-600 mb-6">
            Não foi possível carregar os dados da landing page. Tente novamente.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Voltar para Home
          </button>
        </div>
      </div>
    );
  }

  const landingPage = dashboardData.landingPage;
  const domainInfo = dashboardData.domainInfo;

  // Validar dados obrigatórios
  if (!landingPage.briefing_data || !landingPage.content_data || !landingPage.design_settings) {
    console.error('DashboardPage: Dados incompletos da landing page:', {
      hasBriefing: !!landingPage.briefing_data,
      hasContent: !!landingPage.content_data,
      hasDesign: !!landingPage.design_settings,
    });
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="mb-6">
            <svg className="w-16 h-16 mx-auto text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Dados Incompletos</h2>
          <p className="text-slate-600 mb-6">
            A landing page não possui todos os dados necessários. Por favor, edite a landing page primeiro.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Editar Landing Page
          </button>
        </div>
      </div>
    );
  }

  // Criar plano padrão (Starter) - pode ser melhorado no futuro para buscar do banco
  const defaultPlan: Plan = {
    id: 'starter',
    name: 'Starter',
    price: 'R$ 97',
    rawPrice: 97,
    period: '/mês',
    description: 'Para quem está começando e quer presença digital rápida.',
    features: [
      'Hospedagem inclusa',
      'Domínio .com.br grátis (1 ano)',
      'Botão WhatsApp',
      'Estatísticas de acesso'
    ],
    cta: 'Gerenciar',
    popular: false,
    color: 'border-slate-200'
  };

  return (
    <Dashboard
      doctorName={landingPage.briefing_data.name || 'Médico'}
      domain={domainInfo?.customDomain || domainInfo?.domain || 'seu-dominio.com.br'}
      plan={defaultPlan}
      content={landingPage.content_data}
      design={landingPage.design_settings}
      visibility={landingPage.section_visibility || {
        hero: true,
        about: true,
        services: true,
        testimonials: true,
        footer: true,
      }}
      photoUrl={landingPage.photo_url || null}
      aboutPhotoUrl={landingPage.about_photo_url || null}
      briefing={landingPage.briefing_data}
      layoutVariant={(landingPage.layout_variant || 1) as any}
      onEditSite={() => navigate('/')}
      landingPageId={landingPageId || undefined}
    />
  );
};
