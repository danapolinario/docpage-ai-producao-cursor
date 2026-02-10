import React from 'react';
import { renderToString } from 'react-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import { LandingPageViewerSSR } from '../components/LandingPageViewerSSR';
import { BriefingData, LandingPageContent, DesignSettings, SectionVisibility } from '../types';

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

export async function renderLandingPage(landingPage: LandingPageData, req: any): Promise<string> {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const pageUrl = landingPage.custom_domain 
    ? `https://${landingPage.custom_domain}` 
    : `https://${landingPage.subdomain}.docpage.com.br`;

  // Função para verificar se meta tag é genérica do DocPage AI
  const isGenericDocPageMeta = (value: string | null | undefined): boolean => {
    if (!value) return false;
    const lower = value.toLowerCase();
    return (
      lower.includes('docpage ai') ||
      lower.includes('crie site profissional para médicos') ||
      lower.includes('seo otimizado') ||
      lower.includes('com ia') ||
      lower.includes('teste grátis') ||
      lower.includes('plataforma para médicos')
    );
  };

  // Gerar tags SEO
  // Ignorar meta_title se for genérico do DocPage AI
  const title = (landingPage.meta_title && !isGenericDocPageMeta(landingPage.meta_title))
    ? landingPage.meta_title
    : `${landingPage.briefing_data.name} - ${landingPage.briefing_data.specialty} | CRM ${landingPage.briefing_data.crm}/${landingPage.briefing_data.crmState}`;
  
  // Ignorar meta_description se for genérica do DocPage AI
  const rawDescription = (landingPage.meta_description && !isGenericDocPageMeta(landingPage.meta_description))
    ? landingPage.meta_description
    : (landingPage.content_data.subheadline || 
      `Dr(a). ${landingPage.briefing_data.name}, ${landingPage.briefing_data.specialty} - CRM ${landingPage.briefing_data.crm}/${landingPage.briefing_data.crmState}. ${landingPage.briefing_data.crmState}. Agende sua consulta online.`);
  const description = rawDescription.length > 160 
    ? rawDescription.substring(0, 157) + '...' 
    : rawDescription;
  
  // Ignorar meta_keywords se forem genéricas do DocPage AI
  const hasGenericKeywords = landingPage.meta_keywords && landingPage.meta_keywords.length > 0
    ? landingPage.meta_keywords.some(kw => isGenericDocPageMeta(kw))
    : false;
  const keywords = (landingPage.meta_keywords && !hasGenericKeywords)
    ? landingPage.meta_keywords.join(', ')
    : `${landingPage.briefing_data.name}, ${landingPage.briefing_data.specialty}, médico ${landingPage.briefing_data.crmState}, CRM ${landingPage.briefing_data.crm}, consulta médica, agendar consulta, ${landingPage.briefing_data.mainServices?.split(',').slice(0, 3).join(', ') || ''}`;
  
  // Prioridade para imagem OG: og_image_url > about_photo_url > photo_url > fallback
  // SEMPRE ignorar qualquer URL que seja base64 (data:image) - usar apenas URLs reais
  const isOgImageGeneric = landingPage.og_image_url ? landingPage.og_image_url.includes('og-default.png') : true;
  const isOgImageBase64 = landingPage.og_image_url ? landingPage.og_image_url.startsWith('data:image') : false;
  const isAboutPhotoBase64 = landingPage.about_photo_url ? landingPage.about_photo_url.startsWith('data:image') : false;
  const isPhotoBase64 = landingPage.photo_url ? landingPage.photo_url.startsWith('data:image') : false;
  
  // Se og_image_url for válido (não genérico e não base64), usar ele
  // Caso contrário, usar about_photo_url ou photo_url (que são URLs do storage), mas apenas se não forem base64
  let ogImage: string;
  if (!isOgImageGeneric && !isOgImageBase64 && landingPage.og_image_url) {
    ogImage = landingPage.og_image_url;
  } else if (landingPage.about_photo_url && !isAboutPhotoBase64) {
    ogImage = landingPage.about_photo_url;
  } else if (landingPage.photo_url && !isPhotoBase64) {
    ogImage = landingPage.photo_url;
  } else {
    ogImage = `${baseUrl}/og-default.png`;
  }
  const ogImageSecure = ogImage.replace('http://', 'https://');
  
  // Detectar tipo de imagem OG
  const getImageType = (imageUrl: string): string => {
    const lowerUrl = imageUrl.toLowerCase();
    if (lowerUrl.includes('.png')) return 'image/png';
    if (lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg')) return 'image/jpeg';
    if (lowerUrl.includes('.webp')) return 'image/webp';
    return 'image/png'; // default
  };
  const ogImageType = getImageType(ogImageSecure);
  
  // Favicon: usar foto do médico se disponível, senão usar padrão
  // SEMPRE ignorar base64 - usar apenas URLs reais
  const faviconImage = (landingPage.photo_url && !isPhotoBase64) 
    ? landingPage.photo_url 
    : (landingPage.about_photo_url && !isAboutPhotoBase64)
    ? landingPage.about_photo_url
    : `${baseUrl}/favicon.svg`;
  const appleTouchIcon = (landingPage.photo_url && !isPhotoBase64)
    ? landingPage.photo_url
    : (landingPage.about_photo_url && !isAboutPhotoBase64)
    ? landingPage.about_photo_url
    : `${baseUrl}/apple-touch-icon.png`;

  // Generate SEO-optimized site name for og:site_name
  // Uses doctor name and specialty for better SEO and branding
  const siteName = `Dr(a). ${landingPage.briefing_data.name} - ${landingPage.briefing_data.specialty} | CRM ${landingPage.briefing_data.crm}/${landingPage.briefing_data.crmState}`;

  // Schema.org JSON-LD - Physician
  const physicianSchema = {
    "@context": "https://schema.org",
    "@type": "Physician",
    "@id": pageUrl,
    "name": landingPage.briefing_data.name,
    "alternateName": `Dr(a). ${landingPage.briefing_data.name}`,
    "description": description,
    "image": [
      ogImage,
      ...(landingPage.photo_url && !isPhotoBase64 ? [landingPage.photo_url] : []),
      ...(landingPage.about_photo_url && !isAboutPhotoBase64 ? [landingPage.about_photo_url] : [])
    ].filter(Boolean),
    "url": pageUrl,
    "sameAs": [],
    "medicalSpecialty": {
      "@type": "MedicalSpecialty",
      "name": landingPage.briefing_data.specialty
    },
    "telephone": landingPage.briefing_data.contactPhone || landingPage.content_data.contactPhone,
    "email": landingPage.briefing_data.contactEmail || landingPage.content_data.contactEmail,
    "address": landingPage.briefing_data.addresses?.length > 0 ? landingPage.briefing_data.addresses.map((addr: string) => ({
      "@type": "PostalAddress",
      "streetAddress": addr,
      "addressLocality": landingPage.briefing_data.crmState,
      "addressCountry": "BR"
    })) : undefined,
    "identifier": {
      "@type": "PropertyValue",
      "name": "CRM",
      "value": `${landingPage.briefing_data.crm}/${landingPage.briefing_data.crmState}`
    },
    "priceRange": "$$",
    "areaServed": {
      "@type": "State",
      "name": landingPage.briefing_data.crmState
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

  // Schema.org JSON-LD - LocalBusiness (MedicalBusiness)
  const localBusinessSchema = landingPage.briefing_data.addresses?.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    "@id": `${pageUrl}#business`,
    "name": `Consultório ${landingPage.briefing_data.name}`,
    "description": description,
    "url": pageUrl,
    "image": [
      ogImage,
      ...(landingPage.about_photo_url && !isAboutPhotoBase64 ? [landingPage.about_photo_url] : []),
      ...(landingPage.photo_url && !isPhotoBase64 ? [landingPage.photo_url] : [])
    ].filter(Boolean),
    "telephone": landingPage.briefing_data.contactPhone || landingPage.content_data.contactPhone,
    "email": landingPage.briefing_data.contactEmail || landingPage.content_data.contactEmail,
    "address": landingPage.briefing_data.addresses.map((addr: string) => ({
      "@type": "PostalAddress",
      "streetAddress": addr,
      "addressLocality": landingPage.briefing_data.crmState,
      "addressRegion": landingPage.briefing_data.crmState,
      "addressCountry": "BR"
    })),
    "priceRange": "$$",
    "areaServed": {
      "@type": "State",
      "name": landingPage.briefing_data.crmState
    },
    "medicalSpecialty": {
      "@type": "MedicalSpecialty",
      "name": landingPage.briefing_data.specialty
    }
  } : null;

  const cleanPhysicianSchema = JSON.parse(JSON.stringify(physicianSchema, (key, value) => 
    value === undefined ? undefined : value
  ));
  
  const cleanLocalBusinessSchema = localBusinessSchema ? JSON.parse(JSON.stringify(localBusinessSchema, (key, value) => 
    value === undefined ? undefined : value
  )) : null;

  // Renderizar componente React para string
  const appHtml = renderToString(
    <HelmetProvider>
      <LandingPageViewerSSR landingPage={landingPage} />
    </HelmetProvider>
  );

  // HTML completo com tags SEO no <head>
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
    
    <!-- Resource Hints for Performance -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
    <link rel="dns-prefetch" href="https://cdn.tailwindcss.com" />
    
    <!-- Preload Critical Fonts -->
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" as="style" />
    
    <!-- SEO Base Tags -->
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="keywords" content="${escapeHtml(keywords)}" />
    <meta name="author" content="${escapeHtml(landingPage.briefing_data.name)}" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <meta name="language" content="pt-BR" />
    <meta name="revisit-after" content="7 days" />
    <meta name="rating" content="general" />
    <meta name="distribution" content="global" />
    <meta name="copyright" content="© ${new Date().getFullYear()} ${escapeHtml(landingPage.briefing_data.name)}" />
    <meta name="geo.region" content="BR-${landingPage.briefing_data.crmState}" />
    <meta name="geo.placename" content="${escapeHtml(landingPage.briefing_data.crmState)}" />
    <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
    <meta name="format-detection" content="telephone=yes" />
    
    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${escapeHtml(pageUrl)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(ogImageSecure)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(ogImageSecure)}" />
    <meta property="og:image:type" content="${ogImageType}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(landingPage.briefing_data.name)} - ${escapeHtml(landingPage.briefing_data.specialty)} | CRM ${landingPage.briefing_data.crm}/${landingPage.briefing_data.crmState}" />
    <meta property="og:locale" content="pt_BR" />
    <meta property="og:locale:alternate" content="pt_PT" />
    <meta property="og:site_name" content="${escapeHtml(landingPage.briefing_data.name)}" />
    ${landingPage.briefing_data.contactPhone ? `<meta property="og:phone_number" content="${escapeHtml(landingPage.briefing_data.contactPhone)}" />` : ''}
    ${landingPage.briefing_data.contactEmail ? `<meta property="og:email" content="${escapeHtml(landingPage.briefing_data.contactEmail)}" />` : ''}
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${escapeHtml(pageUrl)}" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImageSecure)}" />
    <meta name="twitter:image:alt" content="${escapeHtml(landingPage.briefing_data.name)} - ${escapeHtml(landingPage.briefing_data.specialty)}" />
    <meta name="twitter:domain" content="${escapeHtml(landingPage.custom_domain ? landingPage.custom_domain.replace(/^https?:\/\//, '') : baseUrl.replace('https://', '').replace('http://', ''))}" />
    
    <!-- Mobile & PWA -->
    <meta name="theme-color" content="#3B82F6" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="${escapeHtml(landingPage.briefing_data.name)}" />
    
    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="${escapeHtml(faviconImage.includes('.svg') ? faviconImage : `${baseUrl}/favicon.svg`)}" />
    <link rel="icon" type="image/png" sizes="32x32" href="${escapeHtml((!isPhotoBase64 && landingPage.photo_url) || (!isAboutPhotoBase64 && landingPage.about_photo_url) ? faviconImage : `${baseUrl}/favicon-32x32.png`)}" />
    <link rel="icon" type="image/png" sizes="16x16" href="${escapeHtml((!isPhotoBase64 && landingPage.photo_url) || (!isAboutPhotoBase64 && landingPage.about_photo_url) ? faviconImage : `${baseUrl}/favicon-16x16.png`)}" />
    <link rel="apple-touch-icon" sizes="180x180" href="${escapeHtml(appleTouchIcon)}" />
    
    <!-- Canonical URL -->
    <link rel="canonical" href="${escapeHtml(pageUrl)}" />
    
    <!-- Schema.org JSON-LD (Structured Data) -->
    <script type="application/ld+json">
      ${JSON.stringify(cleanPhysicianSchema, null, 2)}
    </script>
    ${cleanLocalBusinessSchema ? `<script type="application/ld+json">
      ${JSON.stringify(cleanLocalBusinessSchema, null, 2)}
    </script>` : ''}
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <script type="importmap">
{
  "imports": {
    "@google/genai": "https://aistudiocdn.com/@google/genai@^1.30.0",
    "react/": "https://aistudiocdn.com/react@^19.2.1/",
    "react": "https://aistudiocdn.com/react@^19.2.1",
    "react-dom/": "https://aistudiocdn.com/react-dom@^19.2.1/"
  }
}
</script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            fontFamily: {
              sans: ['Inter', 'sans-serif'],
              serif: ['Playfair Display', 'serif'],
              startup: ['Plus Jakarta Sans', 'sans-serif'],
            },
            colors: {
              brand: {
                50: '#f0fdfa',
                100: '#ccfbf1',
                500: '#14b8a6',
                600: '#0d9488',
                900: '#134e4a',
              },
              clinical: {
                50: '#f8fafc',
                100: '#f1f5f9',
                500: '#64748b',
                900: '#0f172a',
              },
            },
            boxShadow: {
              'soft': '0 20px 40px -15px rgba(0, 0, 0, 0.05)',
              'glow': '0 0 20px rgba(20, 184, 166, 0.3)',
            },
            animation: {
              'scroll-x': 'scrollX 40s linear infinite',
            }
          }
        }
      }
    </script>
    <style>
      body {
        font-family: 'Plus Jakarta Sans', sans-serif;
      }
      .preview-scroll::-webkit-scrollbar {
        width: 6px;
      }
      .preview-scroll::-webkit-scrollbar-track {
        background: transparent;
      }
      .preview-scroll::-webkit-scrollbar-thumb {
        background: rgba(0,0,0,0.1);
        border-radius: 10px;
      }
      .animate-fade-in {
        animation: fadeIn 0.5s ease-out forwards;
      }
      .animate-slide-down {
        animation: slideDown 0.3s ease-out;
      }
      .animate-slide-up {
        animation: slideUp 0.5s ease-out forwards;
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translate(-50%, -20px);
        }
        to {
          opacity: 1;
          transform: translate(-50%, 0);
        }
      }
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes scrollX {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
    </style>
  </head>
  <body>
    <div id="root">${appHtml}</div>
    <script>
      // Injetar dados da landing page no window para hidratação
      window.__LANDING_PAGE_DATA__ = ${JSON.stringify(landingPage)};
    </script>
    <script type="module" src="/index.tsx"></script>
  </body>
</html>`;

  return html;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
