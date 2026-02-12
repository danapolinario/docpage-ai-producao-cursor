import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Preview } from './Preview';
import { SEOHead } from './SEOHead';
import { DesignSettings, SectionVisibility, LandingPageContent, LayoutVariant, BriefingData } from '../types';
import { trackPageView } from '../services/analytics';

interface LandingPageData {
  id: string;
  subdomain: string;
  content_data: LandingPageContent;
  design_settings: DesignSettings;
  section_visibility: SectionVisibility;
  layout_variant: number;
  briefing_data: BriefingData;
  photo_url: string | null;
  about_photo_url: string | null;
  status: string;
  custom_domain: string | null;
  // SEO fields
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string[] | null;
  og_image_url?: string | null;
}

// Função para extrair subdomínio do hostname
function extractSubdomainFromHost(): string | null {
  if (typeof window === 'undefined') return null;
  
  const hostname = window.location.hostname.toLowerCase();
  if (hostname.endsWith('.docpage.com.br')) {
    const parts = hostname.split('.');
    if (parts.length >= 4) {
      const subdomain = parts[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'docpage') {
        return subdomain;
      }
    }
  }
  return null;
}

export const LandingPageViewer: React.FC = () => {
  const { subdomain: subdomainFromRoute } = useParams<{ subdomain: string }>();
  
  // Tentar pegar subdomínio da rota ou do hostname
  const subdomain = subdomainFromRoute || extractSubdomainFromHost();
  
  const [landingPage, setLandingPage] = useState<LandingPageData | null>(
    // Tentar usar dados do SSR se disponíveis
    (window as any).__LANDING_PAGE_DATA__ || null
  );
  const [loading, setLoading] = useState(!(window as any).__LANDING_PAGE_DATA__);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Se já temos dados do SSR, não precisa fazer fetch
    if ((window as any).__LANDING_PAGE_DATA__) {
      setLoading(false);
      return;
    }

    const fetchLandingPage = async () => {
      if (!subdomain) {
        setError('Subdomínio não especificado');
        setLoading(false);
        return;
      }

      try {
        // Primeiro verificar autenticação antes de fazer a query
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log('[LandingPageViewer] Usuário autenticado:', {
          isAuthenticated: !!user,
          userId: user?.id,
          userError: userError?.message
        });

        // Verificar se é admin ANTES de fazer a query
        let isAdmin = false;
        if (user) {
          try {
            const { checkIsAdmin } = await import('../services/admin');
            isAdmin = await checkIsAdmin();
            console.log('[LandingPageViewer] Verificação de admin:', { isAdmin });
          } catch (adminError) {
            console.error('[LandingPageViewer] Erro ao verificar admin:', adminError);
            // Continuar sem permissão de admin se houver erro
          }
        }

        // Buscar landing page (independente do status para verificar se existe)
        // IMPORTANTE: As políticas RLS devem permitir acesso se:
        // - Landing page está publicada (anon)
        // - Usuário é dono da landing page (authenticated)
        // - Usuário é admin (authenticated)
        
        // Tentar buscar primeiro apenas campos essenciais para verificar acesso
        let data: any = null;
        let fetchError: any = null;
        
        // Primeira tentativa: buscar apenas campos mínimos para verificar permissões
        const { data: minimalData, error: minimalError } = await supabase
          .from('landing_pages')
          .select('id, user_id, status, subdomain')
          .eq('subdomain', subdomain)
          .maybeSingle();
        
        if (minimalError) {
          console.log('[LandingPageViewer] Erro ao buscar dados mínimos:', minimalError);
          fetchError = minimalError;
        } else if (minimalData) {
          // Se conseguiu buscar dados mínimos, verificar acesso
          const isOwner = user && user.id === minimalData.user_id;
          const canAccessMinimal = minimalData.status === 'published' || isOwner || isAdmin;
          
          if (canAccessMinimal) {
            console.log('[LandingPageViewer] Acesso confirmado com dados mínimos, buscando dados completos...');
            // Se tem acesso, buscar dados completos
            const { data: fullData, error: fullError } = await supabase
              .from('landing_pages')
              .select('*')
              .eq('subdomain', subdomain)
              .single();
            
            if (fullError) {
              console.error('[LandingPageViewer] Erro ao buscar dados completos:', fullError);
              fetchError = fullError;
            } else {
              data = fullData;
            }
          } else {
            // Não tem acesso mesmo com dados mínimos
            setError('Esta landing page ainda não foi publicada');
            setLoading(false);
            return;
          }
        } else {
          // Não encontrou dados mínimos
          setError('Landing page não encontrada');
          setLoading(false);
          return;
        }
        
        // Se ainda não temos data, tentar query completa direta (fallback)
        if (!data && !fetchError) {
          const { data: directData, error: directError } = await supabase
            .from('landing_pages')
            .select('*')
            .eq('subdomain', subdomain)
            .single();
          
          if (directError) {
            fetchError = directError;
          } else {
            data = directData;
          }
        }

        console.log('[LandingPageViewer] Resultado da query:', {
          found: !!data,
          error: fetchError?.message,
          errorCode: fetchError?.code,
          errorDetails: fetchError?.details,
          errorHint: fetchError?.hint,
          status: data?.status,
          userId: data?.user_id,
          isOwner: user && user.id === data?.user_id,
          isAdmin
        });

        if (fetchError) {
          // Se o erro for de RLS (PGRST301 ou similar), pode ser que o usuário não tenha permissão
          // Mas ainda podemos tentar verificar se é dono ou admin
          console.error('[LandingPageViewer] Erro ao buscar landing page:', fetchError);
          
          // Se o erro for de permissão e o usuário está autenticado, tentar verificar se é dono ou admin
          if (user && (fetchError.code === 'PGRST301' || fetchError.message?.includes('permission') || fetchError.message?.includes('RLS'))) {
            console.log('[LandingPageViewer] Erro de permissão detectado, tentando verificar acesso alternativo...');
            
            // Tentar buscar apenas o ID e user_id para verificar se é dono
            const { data: minimalData, error: minimalError } = await supabase
              .from('landing_pages')
              .select('id, user_id, status')
              .eq('subdomain', subdomain)
              .maybeSingle();
            
            if (minimalData) {
              const isOwner = user.id === minimalData.user_id;
              const canAccess = minimalData.status === 'published' || isOwner || isAdmin;
              
              if (canAccess) {
                console.log('[LandingPageViewer] Acesso permitido via verificação alternativa');
                // Se tem acesso, tentar buscar novamente com uma query diferente ou usar dados mínimos
                // Por enquanto, vamos mostrar erro mas com mensagem mais específica
                setError('Erro ao carregar dados completos da landing page. Verifique suas permissões.');
                setLoading(false);
                return;
              }
            }
          }
          
          setError('Landing page não encontrada ou você não tem permissão para visualizá-la');
          setLoading(false);
          return;
        }

        if (!data) {
          setError('Landing page não encontrada');
          setLoading(false);
          return;
        }

        // Verificar se é dono
        const isOwner = user && user.id === data.user_id;
        
        // Permitir acesso se publicado OU se usuário é dono OU se usuário é admin
        const canAccess = data.status === 'published' || isOwner || isAdmin;

        console.log('[LandingPageViewer] Verificação de acesso:', {
          status: data.status,
          isPublished: data.status === 'published',
          isOwner,
          isAdmin,
          canAccess
        });

        if (!canAccess) {
          setError('Esta landing page ainda não foi publicada');
          setLoading(false);
          return;
        }

        // Permitir visualização
        setLandingPage(data);
      } catch (err) {
        console.error('Error:', err);
        setError('Erro ao carregar landing page');
      } finally {
        setLoading(false);
      }
    };

    fetchLandingPage();
  }, [subdomain]);

  // Registrar visualização da página quando a landing publicada for carregada
  useEffect(() => {
    if (!landingPage) return;

    try {
      trackPageView(landingPage.id, {
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
        subdomain: landingPage.subdomain,
      });
    } catch (err) {
      console.error('Erro ao registrar page_view:', err);
    }
  }, [landingPage?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !landingPage) {
    const isPending = error === 'Esta landing page ainda não foi publicada';
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className={`w-20 h-20 ${isPending ? 'bg-amber-100' : 'bg-gray-100'} rounded-full flex items-center justify-center mx-auto mb-6`}>
            {isPending ? (
              <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {isPending ? 'Página em processamento' : 'Página não encontrada'}
          </h1>
          <p className="text-gray-600 mb-6">
            {isPending 
              ? 'Sua landing page está sendo processada e será publicada em breve. Por favor, aguarde.'
              : (error || 'Esta landing page não existe.')
            }
          </p>
          <a 
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Voltar para o início
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Dynamic SEO Head - injects meta tags, OG tags, and Schema.org markup */}
      <SEOHead
        briefing={landingPage.briefing_data}
        content={landingPage.content_data}
        subdomain={landingPage.subdomain}
        photoUrl={landingPage.photo_url}
        aboutPhotoUrl={landingPage.about_photo_url}
        ogImageUrl={landingPage.og_image_url}
        metaTitle={landingPage.meta_title}
        metaDescription={landingPage.meta_description}
        metaKeywords={landingPage.meta_keywords}
        customDomain={landingPage.custom_domain}
      />
      <Preview
        content={landingPage.content_data}
        design={landingPage.design_settings}
        visibility={landingPage.section_visibility}
        photoUrl={landingPage.photo_url}
        aboutPhotoUrl={landingPage.about_photo_url}
        briefing={landingPage.briefing_data}
        layoutVariant={landingPage.layout_variant as LayoutVariant}
        landingPageId={landingPage.id}
        isPreview={false}
      />
    </div>
  );
};
