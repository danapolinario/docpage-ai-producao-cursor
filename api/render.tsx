// Versão simplificada para Vercel Serverless Functions
// Não usa React SSR para evitar dependências externas
interface BriefingData {
  name: string;
  crm: string;
  crmState: string;
  specialty: string;
  contactPhone?: string;
  contactEmail?: string;
  addresses?: string[];
  mainServices?: string;
}

interface LandingPageContent {
  headline?: string;
  subheadline?: string;
  contactPhone?: string;
  contactEmail?: string;
}

interface DesignSettings {
  colorPalette?: string;
}

interface SectionVisibility {
  hero?: boolean;
  services?: boolean;
  about?: boolean;
  testimonials?: boolean;
  footer?: boolean;
}

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

  // Gerar tags SEO
  const title = landingPage.meta_title || 
    `${landingPage.briefing_data.name} - ${landingPage.briefing_data.specialty} | CRM ${landingPage.briefing_data.crm}/${landingPage.briefing_data.crmState}`;
  
  const rawDescription = landingPage.meta_description || landingPage.content_data.subheadline || 
    `Dr(a). ${landingPage.briefing_data.name}, ${landingPage.briefing_data.specialty} - CRM ${landingPage.briefing_data.crm}/${landingPage.briefing_data.crmState}. ${landingPage.briefing_data.crmState}. Agende sua consulta online.`;
  const description = rawDescription.length > 160 
    ? rawDescription.substring(0, 157) + '...' 
    : rawDescription;
  
  const keywords = landingPage.meta_keywords?.join(', ') || 
    `${landingPage.briefing_data.name}, ${landingPage.briefing_data.specialty}, médico ${landingPage.briefing_data.crmState}, CRM ${landingPage.briefing_data.crm}, consulta médica, agendar consulta, ${landingPage.briefing_data.mainServices?.split(',').slice(0, 3).join(', ') || ''}`;
  
  const ogImage = landingPage.og_image_url || landingPage.about_photo_url || landingPage.photo_url || `${baseUrl}/og-default.png`;
  const ogImageSecure = ogImage.replace('http://', 'https://');

  // Schema.org JSON-LD
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "Physician",
    "@id": pageUrl,
    "name": landingPage.briefing_data.name,
    "alternateName": `Dr(a). ${landingPage.briefing_data.name}`,
    "description": description,
    "image": [
      ogImage,
      ...(landingPage.photo_url ? [landingPage.photo_url] : []),
      ...(landingPage.about_photo_url ? [landingPage.about_photo_url] : [])
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

  const cleanSchema = JSON.parse(JSON.stringify(schemaMarkup, (key, value) => 
    value === undefined ? undefined : value
  ));

  // HTML básico - React hidratará no cliente
  const appHtml = `<div id="root"><div class="min-h-screen flex items-center justify-center p-8">
    <div class="text-center">
      <h1 class="text-4xl font-bold mb-4">${escapeHtml(landingPage.briefing_data.name)}</h1>
      <p class="text-xl text-gray-600">${escapeHtml(landingPage.content_data.subheadline || landingPage.briefing_data.specialty)}</p>
    </div>
  </div></div>`;

  // HTML completo com tags SEO no <head>
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
    
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
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(ogImageSecure)}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(landingPage.briefing_data.name)} - ${escapeHtml(landingPage.briefing_data.specialty)} | CRM ${landingPage.briefing_data.crm}/${landingPage.briefing_data.crmState}" />
    <meta property="og:url" content="${escapeHtml(pageUrl)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="DocPage AI" />
    <meta property="og:locale" content="pt_BR" />
    <meta property="og:locale:alternate" content="pt_PT" />
    ${landingPage.briefing_data.contactPhone ? `<meta property="og:phone_number" content="${escapeHtml(landingPage.briefing_data.contactPhone)}" />` : ''}
    ${landingPage.briefing_data.contactEmail ? `<meta property="og:email" content="${escapeHtml(landingPage.briefing_data.contactEmail)}" />` : ''}
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
    <meta name="twitter:image:alt" content="${escapeHtml(landingPage.briefing_data.name)} - ${escapeHtml(landingPage.briefing_data.specialty)}" />
    <meta name="twitter:site" content="@DocPageAI" />
    <meta name="twitter:creator" content="@DocPageAI" />
    <meta name="twitter:domain" content="${escapeHtml(landingPage.custom_domain || baseUrl.replace('https://', '').replace('http://', ''))}" />
    
    <!-- Mobile & PWA -->
    <meta name="theme-color" content="#3B82F6" />
    <meta name="msapplication-TileColor" content="#3B82F6" />
    <meta name="msapplication-config" content="/browserconfig.xml" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="${escapeHtml(landingPage.briefing_data.name)}" />
    ${landingPage.photo_url ? `<link rel="apple-touch-icon" href="${escapeHtml(landingPage.photo_url)}" sizes="180x180" />` : ''}
    <link rel="icon" href="${escapeHtml(landingPage.photo_url || `${baseUrl}/favicon.ico`)}" type="image/x-icon" />
    
    <!-- Canonical URL -->
    <link rel="canonical" href="${escapeHtml(pageUrl)}" />
    
    <!-- Schema.org JSON-LD (Structured Data) -->
    <script type="application/ld+json">
      ${JSON.stringify(cleanSchema, null, 2)}
    </script>
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
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
