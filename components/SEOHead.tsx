import React from 'react';
import { Helmet } from 'react-helmet-async';
import { BriefingData, LandingPageContent } from '../types';

interface SEOHeadProps {
  briefing: BriefingData;
  content: LandingPageContent;
  subdomain: string;
  photoUrl?: string | null;
  aboutPhotoUrl?: string | null;
  ogImageUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string[] | null;
  customDomain?: string | null;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  briefing,
  content,
  subdomain,
  photoUrl,
  aboutPhotoUrl,
  ogImageUrl,
  metaTitle,
  metaDescription,
  metaKeywords,
  customDomain,
}) => {
  const pageUrl = customDomain 
    ? `https://${customDomain}` 
    : `https://${subdomain}.docpage.com.br`;
  
  // Base URL para recursos estáticos
  const baseUrl = customDomain 
    ? `https://${customDomain}` 
    : 'https://docpage.com.br';
  
  // Generate SEO-optimized title (50-60 chars ideal)
  const title = metaTitle || 
    `${briefing.name} - ${briefing.specialty} | CRM ${briefing.crm}/${briefing.crmState}`;
  
  // Generate SEO-optimized description (150-160 chars ideal)
  const rawDescription = metaDescription || content.subheadline || 
    `Dr(a). ${briefing.name}, ${briefing.specialty} - CRM ${briefing.crm}/${briefing.crmState}. ${briefing.crmState}. Agende sua consulta online.`;
  const description = rawDescription.length > 160 
    ? rawDescription.substring(0, 157) + '...' 
    : rawDescription;
  
  // Keywords (comma-separated, max 10-15 keywords)
  const keywords = metaKeywords?.join(', ') || 
    `${briefing.name}, ${briefing.specialty}, médico ${briefing.crmState}, CRM ${briefing.crm}, consulta médica, agendar consulta, ${briefing.mainServices?.split(',').slice(0, 3).join(', ') || ''}`;
  
  // OG Image - prioritize ogImageUrl, then aboutPhotoUrl (office), then photoUrl (profile)
  const ogImage = ogImageUrl || aboutPhotoUrl || photoUrl || `${baseUrl}/og-default.png`;
  const ogImageSecure = ogImage.replace('http://', 'https://');
  
  // Generate SEO-optimized site name for og:site_name
  // Uses doctor name and specialty for better SEO and branding
  const siteName = `Dr(a). ${briefing.name} - ${briefing.specialty} | CRM ${briefing.crm}/${briefing.crmState}`;
  
  // Schema.org JSON-LD
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "Physician",
    "@id": pageUrl,
    "name": briefing.name,
    "alternateName": `Dr(a). ${briefing.name}`,
    "description": description,
    "image": [
      ogImage,
      ...(photoUrl ? [photoUrl] : []),
      ...(aboutPhotoUrl ? [aboutPhotoUrl] : [])
    ].filter(Boolean),
    "url": pageUrl,
    "sameAs": [],
    "medicalSpecialty": {
      "@type": "MedicalSpecialty",
      "name": briefing.specialty
    },
    "telephone": briefing.contactPhone || content.contactPhone,
    "email": briefing.contactEmail || content.contactEmail,
    "address": briefing.addresses?.length > 0 ? briefing.addresses.map((addr: string) => ({
      "@type": "PostalAddress",
      "streetAddress": addr,
      "addressLocality": briefing.crmState,
      "addressCountry": "BR"
    })) : undefined,
    "identifier": {
      "@type": "PropertyValue",
      "name": "CRM",
      "value": `${briefing.crm}/${briefing.crmState}`
    },
    "priceRange": "$$",
    "areaServed": {
      "@type": "State",
      "name": briefing.crmState
    },
    "potentialAction": {
      "@type": "ReserveAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": pageUrl,
        "actionPlatform": [
          "http://schema.org/DesktopWebPlatform",
          "http://schema.org/MobileWebPlatform"
        ]
      },
      "result": {
        "@type": "Reservation",
        "name": "Consulta Médica"
      }
    }
  };
  
  // Remove undefined fields
  const cleanSchema = JSON.parse(JSON.stringify(schemaMarkup, (key, value) => 
    value === undefined ? undefined : value
  ));

  // Atualizar metatags diretamente no DOM como fallback (para garantir que funcionem no localhost)
  React.useEffect(() => {
    // Função helper para atualizar ou criar meta tag por property
    const updateOrCreateOGMeta = (property: string, content: string) => {
      const existing = document.querySelector(`meta[property="${property}"]`);
      if (existing) {
        existing.setAttribute('content', content);
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute('property', property);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      }
    };

    // Função helper para atualizar ou criar meta tag por name
    const updateOrCreateNameMeta = (name: string, content: string) => {
      const existing = document.querySelector(`meta[name="${name}"]`);
      if (existing) {
        existing.setAttribute('content', content);
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute('name', name);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      }
    };

    // Atualizar title
    const titleTag = document.querySelector('title');
    if (titleTag) {
      titleTag.textContent = title;
    }

    // Atualizar todas as tags Open Graph
    updateOrCreateOGMeta('og:title', title);
    updateOrCreateOGMeta('og:description', description);
    updateOrCreateOGMeta('og:image', ogImage);
    updateOrCreateOGMeta('og:image:secure_url', ogImageSecure);
    updateOrCreateOGMeta('og:image:alt', `${briefing.name} - ${briefing.specialty} | CRM ${briefing.crm}/${briefing.crmState}`);
    updateOrCreateOGMeta('og:url', pageUrl);
    updateOrCreateOGMeta('og:site_name', siteName);

    // Atualizar tags Twitter
    updateOrCreateNameMeta('twitter:title', title);
    updateOrCreateNameMeta('twitter:description', description);
    updateOrCreateNameMeta('twitter:image', ogImage);
    updateOrCreateNameMeta('twitter:image:alt', `${briefing.name} - ${briefing.specialty}`);

    // Atualizar tags SEO básicas
    updateOrCreateNameMeta('description', description);
    updateOrCreateNameMeta('keywords', keywords);
    updateOrCreateNameMeta('author', briefing.name);

    // Remover tags Twitter do DocPage se existirem
    const twitterSite = document.querySelector('meta[name="twitter:site"]');
    const twitterCreator = document.querySelector('meta[name="twitter:creator"]');
    if (twitterSite && twitterSite.getAttribute('content') === '@DocPageAI') {
      twitterSite.remove();
    }
    if (twitterCreator && twitterCreator.getAttribute('content') === '@DocPageAI') {
      twitterCreator.remove();
    }
  }, [title, description, keywords, ogImage, ogImageSecure, siteName, pageUrl, briefing.name, briefing.specialty, briefing.crm, briefing.crmState]);

  return (
    <Helmet>
      {/* ============================================ */}
      {/* SEO Base Tags */}
      {/* ============================================ */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={briefing.name} />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="language" content="pt-BR" />
      <meta name="revisit-after" content="7 days" />
      <meta name="rating" content="general" />
      <meta name="distribution" content="global" />
      <meta name="copyright" content={`© ${new Date().getFullYear()} ${briefing.name}`} />
      <meta name="geo.region" content={`BR-${briefing.crmState}`} />
      <meta name="geo.placename" content={briefing.crmState} />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta name="format-detection" content="telephone=yes" />
      
      {/* ============================================ */}
      {/* Open Graph / Facebook / WhatsApp */}
      {/* ============================================ */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:secure_url" content={ogImageSecure} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={`${briefing.name} - ${briefing.specialty} | CRM ${briefing.crm}/${briefing.crmState}`} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="pt_BR" />
      <meta property="og:locale:alternate" content="pt_PT" />
      {briefing.contactPhone && (
        <meta property="og:phone_number" content={briefing.contactPhone} />
      )}
      {briefing.contactEmail && (
        <meta property="og:email" content={briefing.contactEmail} />
      )}
      
      {/* ============================================ */}
      {/* Twitter Card */}
      {/* ============================================ */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={`${briefing.name} - ${briefing.specialty}`} />
      <meta name="twitter:domain" content={customDomain || 'docpage.com.br'} />
      
      {/* ============================================ */}
      {/* Mobile & PWA */}
      {/* ============================================ */}
      <meta name="theme-color" content="#3B82F6" />
      <meta name="msapplication-TileColor" content="#3B82F6" />
      <meta name="msapplication-config" content="/browserconfig.xml" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={briefing.name} />
      {photoUrl && (
        <link rel="apple-touch-icon" href={photoUrl} sizes="180x180" />
      )}
      <link rel="icon" href={photoUrl || `${baseUrl}/favicon.ico`} type="image/x-icon" />
      
      {/* ============================================ */}
      {/* Canonical URL */}
      {/* ============================================ */}
      <link rel="canonical" href={pageUrl} />
      
      {/* ============================================ */}
      {/* Schema.org JSON-LD (Structured Data) */}
      {/* ============================================ */}
      <script type="application/ld+json">
        {JSON.stringify(cleanSchema, null, 2)}
      </script>
    </Helmet>
  );
};
