import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Preview } from './Preview';
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
}

export const LandingPageViewer: React.FC = () => {
  const { subdomain } = useParams<{ subdomain: string }>();
  const [landingPage, setLandingPage] = useState<LandingPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLandingPage = async () => {
      if (!subdomain) {
        setError('Subdomínio não especificado');
        setLoading(false);
        return;
      }

      try {
        // Primeiro tentar buscar a landing page (independente do status para verificar se existe)
        const { data, error: fetchError } = await supabase
          .from('landing_pages')
          .select('*')
          .eq('subdomain', subdomain)
          .single();

        if (fetchError) {
          console.error('Error fetching landing page:', fetchError);
          setError('Landing page não encontrada');
        } else if (data.status !== 'published') {
          // Landing page existe mas não está publicada
          setError('Esta landing page ainda não foi publicada');
        } else {
          setLandingPage(data);
        }
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
