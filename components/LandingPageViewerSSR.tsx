import React from 'react';
import { Preview } from './Preview';
import { SEOHead } from './SEOHead';
import { DesignSettings, SectionVisibility, LandingPageContent, LayoutVariant, BriefingData } from '../types';

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
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string[] | null;
  og_image_url?: string | null;
}

interface LandingPageViewerSSRProps {
  landingPage: LandingPageData;
}

// Componente SSR-friendly que recebe dados diretamente (sem hooks de fetch)
export const LandingPageViewerSSR: React.FC<LandingPageViewerSSRProps> = ({ landingPage }) => {
  return (
    <div className="min-h-screen">
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
