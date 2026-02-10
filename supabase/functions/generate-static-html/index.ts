// @ts-nocheck - Deno runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Função para renderizar HTML (simplificada, baseada em api/render.ts)
async function renderLandingPageHTML(landingPage: any): Promise<string> {
  const baseUrl = "https://docpage.com.br";
  const pageUrl = landingPage.custom_domain 
    ? `https://${landingPage.custom_domain}` 
    : `https://${landingPage.subdomain}.docpage.com.br`;

  const briefing = landingPage.briefing_data || {};
  const content = landingPage.content_data || {};

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
  const isTitleGeneric = landingPage.meta_title ? isGenericDocPageMeta(landingPage.meta_title) : true;
  const title = (!isTitleGeneric && landingPage.meta_title)
    ? landingPage.meta_title
    : `${briefing.name || 'Médico'} - ${briefing.specialty || 'Especialista'} | CRM ${briefing.crm || ''}/${briefing.crmState || ''}`;
  
  const isDescriptionGeneric = landingPage.meta_description ? isGenericDocPageMeta(landingPage.meta_description) : true;
  const rawDescription = (!isDescriptionGeneric && landingPage.meta_description)
    ? landingPage.meta_description
    : (content.subheadline || 
      `Dr(a). ${briefing.name || 'Médico'}, ${briefing.specialty || 'Especialista'} - CRM ${briefing.crm || ''}/${briefing.crmState || ''}. ${briefing.crmState || ''}. Agende sua consulta online.`);
  const description = rawDescription.length > 160 
    ? rawDescription.substring(0, 157) + '...' 
    : rawDescription;
  
  const hasGenericKeywords = landingPage.meta_keywords && landingPage.meta_keywords.length > 0
    ? landingPage.meta_keywords.some((kw: string) => isGenericDocPageMeta(kw))
    : true;
  const keywords = (!hasGenericKeywords && landingPage.meta_keywords)
    ? landingPage.meta_keywords.join(', ')
    : `${briefing.name || 'Médico'}, ${briefing.specialty || 'Especialista'}, médico ${briefing.crmState || ''}, CRM ${briefing.crm || ''}, consulta médica, agendar consulta, ${briefing.mainServices?.split(',').slice(0, 3).join(', ') || ''}`;
  
  // Imagem OG
  const isOgImageGeneric = landingPage.og_image_url ? landingPage.og_image_url.includes('og-default.png') : true;
  const isOgImageBase64 = landingPage.og_image_url ? landingPage.og_image_url.startsWith('data:image') : false;
  const isAboutPhotoBase64 = landingPage.about_photo_url ? landingPage.about_photo_url.startsWith('data:image') : false;
  const isPhotoBase64 = landingPage.photo_url ? landingPage.photo_url.startsWith('data:image') : false;
  
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
  
  const siteName = `Dr(a). ${briefing.name || 'Médico'} - ${briefing.specialty || 'Especialista'} | CRM ${briefing.crm || ''}/${briefing.crmState || ''}`;

  // Schema.org JSON-LD
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "Physician",
    "@id": pageUrl,
    "name": briefing.name || 'Médico',
    "alternateName": `Dr(a). ${briefing.name || 'Médico'}`,
    "description": description,
    "image": [
      ogImage,
      ...(landingPage.photo_url && !landingPage.photo_url.startsWith('data:image') ? [landingPage.photo_url] : []),
      ...(landingPage.about_photo_url && !landingPage.about_photo_url.startsWith('data:image') ? [landingPage.about_photo_url] : [])
    ].filter(Boolean),
    "url": pageUrl,
    "sameAs": [],
    "medicalSpecialty": {
      "@type": "MedicalSpecialty",
      "name": briefing.specialty || 'Especialista'
    },
    "telephone": briefing.contactPhone || content.contactPhone,
    "email": briefing.contactEmail || content.contactEmail,
    "address": briefing.addresses?.length > 0 ? briefing.addresses.map((addr: string) => ({
      "@type": "PostalAddress",
      "streetAddress": addr,
      "addressLocality": briefing.crmState || '',
      "addressCountry": "BR"
    })) : undefined,
    "identifier": {
      "@type": "PropertyValue",
      "name": "CRM",
      "value": `${briefing.crm || ''}/${briefing.crmState || ''}`
    },
    "priceRange": "$$",
    "areaServed": {
      "@type": "State",
      "name": briefing.crmState || ''
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

  const cleanSchema = JSON.parse(JSON.stringify(schemaMarkup, (key: string, value: any) => 
    value === undefined ? undefined : value
  ));

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

  const appHtml = `<div id="root"><div class="min-h-screen flex items-center justify-center p-8">
    <div class="text-center">
      <h1 class="text-4xl font-bold mb-4">${escapeHtml(briefing.name || 'Médico')}</h1>
      <p class="text-xl text-gray-600">${escapeHtml(content.subheadline || briefing.specialty || 'Especialista')}</p>
    </div>
  </div></div>`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
    
    <!-- SEO Base Tags -->
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="keywords" content="${escapeHtml(keywords)}" />
    <meta name="author" content="${escapeHtml(briefing.name || 'Médico')}" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <meta name="language" content="pt-BR" />
    <meta name="revisit-after" content="7 days" />
    <meta name="rating" content="general" />
    <meta name="distribution" content="global" />
    <meta name="copyright" content="© ${new Date().getFullYear()} ${escapeHtml(briefing.name || 'Médico')}" />
    <meta name="geo.region" content="BR-${briefing.crmState || ''}" />
    <meta name="geo.placename" content="${escapeHtml(briefing.crmState || '')}" />
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
    <meta property="og:image:alt" content="${escapeHtml(briefing.name || 'Médico')} - ${escapeHtml(briefing.specialty || 'Especialista')} | CRM ${briefing.crm || ''}/${briefing.crmState || ''}" />
    <meta property="og:url" content="${escapeHtml(pageUrl)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${escapeHtml(siteName)}" />
    <meta property="og:locale" content="pt_BR" />
    <meta property="og:locale:alternate" content="pt_PT" />
    ${briefing.contactPhone ? `<meta property="og:phone_number" content="${escapeHtml(briefing.contactPhone)}" />` : ''}
    ${briefing.contactEmail ? `<meta property="og:email" content="${escapeHtml(briefing.contactEmail)}" />` : ''}
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
    <meta name="twitter:image:alt" content="${escapeHtml(briefing.name || 'Médico')} - ${escapeHtml(briefing.specialty || 'Especialista')}" />
    <meta name="twitter:domain" content="${escapeHtml(landingPage.custom_domain || baseUrl.replace('https://', '').replace('http://', ''))}" />
    
    <!-- Mobile & PWA -->
    <meta name="theme-color" content="#3B82F6" />
    <meta name="msapplication-TileColor" content="#3B82F6" />
    <meta name="msapplication-config" content="/browserconfig.xml" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="${escapeHtml(briefing.name || 'Médico')}" />
    ${landingPage.photo_url && !landingPage.photo_url.startsWith('data:image') ? `<link rel="apple-touch-icon" href="${escapeHtml(landingPage.photo_url)}" sizes="180x180" />` : ''}
    <link rel="icon" href="${escapeHtml((landingPage.photo_url && !landingPage.photo_url.startsWith('data:image')) ? landingPage.photo_url : `${baseUrl}/favicon.ico`)}" type="image/x-icon" />
    
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { landingPageId } = await req.json();

    if (!landingPageId) {
      return new Response(
        JSON.stringify({ error: "landingPageId é obrigatório" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log('[GENERATE STATIC HTML] Iniciando geração para landing page:', landingPageId);

    // Buscar dados da landing page
    const { data: landingPage, error: fetchError } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('id', landingPageId)
      .single();

    if (fetchError || !landingPage) {
      console.error('[GENERATE STATIC HTML] Erro ao buscar landing page:', fetchError);
      return new Response(
        JSON.stringify({ error: "Landing page não encontrada", details: fetchError?.message }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verificar se está publicada
    if (landingPage.status !== 'published') {
      console.log('[GENERATE STATIC HTML] Landing page não está publicada:', landingPage.status);
      return new Response(
        JSON.stringify({ error: "Landing page não está publicada", status: landingPage.status }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Gerar HTML
    const html = await renderLandingPageHTML(landingPage);

    if (!html || html.length === 0) {
      return new Response(
        JSON.stringify({ error: "Erro ao gerar HTML" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Upload para Storage
    const BUCKET_NAME = 'landing-pages';
    const HTML_FOLDER = 'html';
    const filePath = `${HTML_FOLDER}/${landingPage.subdomain}.html`;
    
    const htmlBlob = new Blob([html], { type: 'text/html; charset=utf-8' });
    const htmlFile = new File([htmlBlob], `${landingPage.subdomain}.html`, {
      type: 'text/html; charset=utf-8'
    });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, htmlFile, {
        upsert: true,
        contentType: 'text/html; charset=utf-8',
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('[GENERATE STATIC HTML] Erro ao fazer upload:', uploadError);
      return new Response(
        JSON.stringify({ error: "Erro ao fazer upload do HTML", details: uploadError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    console.log('[GENERATE STATIC HTML] HTML estático gerado com sucesso:', {
      landingPageId,
      subdomain: landingPage.subdomain,
      publicUrl
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        publicUrl,
        subdomain: landingPage.subdomain
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error('[GENERATE STATIC HTML] Erro:', error);
    return new Response(
      JSON.stringify({ error: "Erro interno", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
