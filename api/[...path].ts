// Types for Vercel serverless functions
interface VercelRequest {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[] | undefined>;
  body?: any;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  send: (body: any) => void;
  setHeader: (name: string, value: string) => void;
}

import { renderLandingPage } from './render.js';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { verifyAuthFromRequest } from './auth-utils.js';
import { resolveCanonicalHostname, stripHostname } from '../lib/seo-canonical.js';
import { getSpecialtyByUrlPath } from '../lib/specialties-data.js';
import { injectSpecialtyPrerender } from '../lib/specialty-inject-html.js';

// Para ES modules, precisamos definir __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Cliente com service role para bypass RLS quando necessário
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

function extractSubdomain(host: string): string | null {
  const hostname = host.split(':')[0].toLowerCase();
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

/** Normaliza host para comparação: lowercase, sem porta, sem www. */
function normalizeHostForDomainLookup(host: string): string {
  return host.split(':')[0].toLowerCase().replace(/^www\./, '').trim();
}

/** path após /api/ (ex.: site-para/cardiologista). req.query.path às vezes vem vazio na Vercel com rotas aninhadas. */
function getPathParamFromRequest(req: VercelRequest): string {
  const q = req.query.path;
  if (Array.isArray(q) && q.length > 0) {
    return q
      .map((s) => String(s).replace(/^\/+|\/+$/g, ''))
      .filter(Boolean)
      .join('/');
  }
  if (typeof q === 'string' && q.trim()) {
    return q.replace(/^\/+|\/+$/g, '');
  }
  const raw = req.url || '';
  let pathname = raw.split('?')[0];
  try {
    if (raw.startsWith('http')) pathname = new URL(raw).pathname;
  } catch {
    /* ignore */
  }
  const m = pathname.match(/^\/api\/+(.+)$/);
  if (m?.[1]) {
    try {
      return decodeURIComponent(m[1].replace(/\/+$/, ''));
    } catch {
      return m[1].replace(/\/+$/, '');
    }
  }
  return '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[API/[...PATH]] Handler chamado para:', req.url);
  
  // Garantir que host seja string - verificar múltiplos headers do Vercel
  // IMPORTANTE: Vercel pode passar o host em diferentes headers dependendo da configuração
  const hostHeader = req.headers.host;
  const xForwardedHost = req.headers['x-forwarded-host'];
  const xVercelOriginalHost = req.headers['x-vercel-original-host'];
  const xHost = req.headers['x-host'];
  const xForwardedFor = req.headers['x-forwarded-for'];
  
  // Tentar múltiplos headers (Vercel pode usar diferentes)
  // IMPORTANTE: Com rewrites, o Host pode ser sobrescrito. Priorizar headers que preservam o domínio original do cliente.
  const getHeaderStr = (h: string | string[] | undefined) => (Array.isArray(h) ? h[0] : h) || '';
  const hostFromHeader = getHeaderStr(hostHeader);
  const hostFromXForwarded = getHeaderStr(xForwardedHost);
  const hostFromXVercelOriginal = getHeaderStr(xVercelOriginalHost);
  const hostFromXHost = getHeaderStr(xHost);
  const candidates = [hostFromXVercelOriginal, hostFromXForwarded, hostFromHeader, hostFromXHost].filter(Boolean);
  const hostForCustomDomain = candidates.find((h) => h && !h.toLowerCase().includes('docpage.com.br')) || hostFromHeader;
  let host = hostFromHeader || hostFromXForwarded || hostFromXVercelOriginal || hostFromXHost;
  
  // Log detalhado para debug
  console.log('[SSR DEBUG] ============================================');
  console.log('[SSR DEBUG] Request URL:', req.url);
  console.log('[SSR DEBUG] Path query:', req.query.path);
  console.log('[SSR DEBUG] All headers:', JSON.stringify(req.headers, null, 2));
  console.log('[SSR DEBUG] Host headers:', {
    hostHeader,
    xForwardedHost,
    xVercelOriginalHost,
    xHost,
    xForwardedFor,
    finalHost: host
  });
  
  const subdomain = extractSubdomain(host);
  
  // Verificar se há parâmetro preview na URL
  let hasPreview = false;
  try {
    const requestUrl = req.url || '/';
    // Se req.url já tem protocolo, usar diretamente, senão construir URL completa
    const fullUrl = requestUrl.startsWith('http') ? requestUrl : `https://${host}${requestUrl}`;
    const url = new URL(fullUrl);
    hasPreview = url.searchParams.has('preview');
  } catch (error) {
    // Fallback: verificar manualmente se tem ?preview na string
    const requestUrl = req.url || '';
    hasPreview = requestUrl.includes('?preview') || requestUrl.includes('&preview');
    console.log('[SSR] Erro ao parsear URL, usando fallback:', error);
  }
  
  console.log('[SSR DEBUG] Subdomain extraction:', {
    host,
    subdomain,
    hostname: host.split(':')[0],
    endsWithCheck: host.split(':')[0].toLowerCase().endsWith('.docpage.com.br'),
    parts: host.split(':')[0].split('.')
  });
  console.log('[SSR DEBUG] ============================================');
  
  // SEO: Servir robots.txt e sitemap.xml dinâmicos para todos os domínios
  const requestPath = getPathParamFromRequest(req);
  const hostHostname = host.split(':')[0].toLowerCase();
  const isLandingPageHost = !!subdomain || !hostHostname.includes('docpage.com.br');
  const isMainDocpage = hostHostname === 'docpage.com.br' || hostHostname === 'www.docpage.com.br';

  // Legado: /site-para-cardiologista (um segmento) ia parar em /:subdomain → 301 para /site-para/cardiologista
  if (isMainDocpage && requestPath && !requestPath.includes('/')) {
    const legacySitePara = /^site-para-(.+)$/.exec(requestPath);
    if (legacySitePara) {
      const proto = getHeaderStr(req.headers['x-forwarded-proto']) || 'https';
      const hostOnly = host.split(':')[0];
      res.setHeader('Location', `${proto}://${hostOnly}/site-para/${legacySitePara[1]}`);
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
      return res.status(301).send('');
    }
  }
  
  if (requestPath === 'robots.txt' || requestPath === 'sitemap.xml') {
    // Domínio principal docpage.com.br
    if (isMainDocpage) {
      if (requestPath === 'robots.txt') {
        const robotsContent = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /dashboard\nDisallow: /checkout/\nDisallow: /dev\n\nSitemap: https://docpage.com.br/sitemap.xml\n`;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.status(200).send(robotsContent);
      }
      if (requestPath === 'sitemap.xml') {
        const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n  <url>\n    <loc>https://docpage.com.br/</loc>\n    <lastmod>2026-02-05</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n  <url>\n    <loc>https://docpage.com.br/termos-de-uso</loc>\n    <lastmod>2026-02-05</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n  <url>\n    <loc>https://docpage.com.br/politica-de-privacidade</loc>\n    <lastmod>2026-02-05</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n  <url>\n    <loc>https://docpage.com.br/marketing-medico-primeiros-passos</loc>\n    <lastmod>2026-02-18</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n</urlset>`;
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.status(200).send(sitemapContent);
      }
    }

    // Subdomínios e domínios customizados de landing pages
    if (isLandingPageHost) {
      try {
        const queryClientSeo = supabaseAdmin || supabase;
        let lpSeo: any = null;
        
        if (subdomain) {
          const { data } = await queryClientSeo
            .from('landing_pages')
            .select('chosen_domain, custom_domain, subdomain, status, published_at')
            .eq('subdomain', subdomain)
            .single();
          lpSeo = data;
        } else {
          const hostForLookupSeo = (candidates.find((h: string) => h && !h.toLowerCase().includes('docpage.com.br')) || host).split(':')[0].toLowerCase().replace(/^www\./, '');
          const { data: pages } = await queryClientSeo
            .rpc('get_landing_page_by_domain', { domain_input: hostForLookupSeo });
          lpSeo = Array.isArray(pages) ? pages[0] : pages;
        }

        if (lpSeo) {
          const hostForCanonicalSeo = (
            candidates.find((h: string) => h && !h.toLowerCase().includes('docpage.com.br')) ||
            host
          )
            .split(':')[0]
            .toLowerCase();
          const seoDomain = resolveCanonicalHostname(
            {
              chosen_domain: lpSeo.chosen_domain,
              custom_domain: lpSeo.custom_domain,
              subdomain: lpSeo.subdomain,
            },
            hostForCanonicalSeo
          );
          const isSubdomainWithCustom = subdomain && (lpSeo.chosen_domain || lpSeo.custom_domain);

          if (requestPath === 'robots.txt') {
            let robotsContent: string;
            if (isSubdomainWithCustom) {
              robotsContent = `User-agent: *\nDisallow: /\n`;
            } else {
              robotsContent = `User-agent: *\nAllow: /\n\nSitemap: https://${seoDomain}/sitemap.xml\n`;
            }
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return res.status(200).send(robotsContent);
          }

          if (requestPath === 'sitemap.xml') {
            const lastmod = lpSeo.published_at ? new Date(lpSeo.published_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>https://${seoDomain}/</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>`;
            res.setHeader('Content-Type', 'application/xml; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return res.status(200).send(sitemapContent);
          }
        } else {
          console.log('[SEO] LP não encontrada para robots/sitemap, retornando fallback');
          if (requestPath === 'robots.txt') {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=300');
            return res.status(200).send('User-agent: *\nAllow: /\n');
          }
          if (requestPath === 'sitemap.xml') {
            res.setHeader('Content-Type', 'application/xml; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=300');
            return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
          }
        }
      } catch (seoErr: any) {
        console.log('[SEO] Erro ao gerar robots.txt/sitemap.xml dinâmico:', seoErr?.message);
        if (requestPath === 'robots.txt') {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.setHeader('Cache-Control', 'public, max-age=300');
          return res.status(200).send('User-agent: *\nAllow: /\n');
        }
        if (requestPath === 'sitemap.xml') {
          res.setHeader('Content-Type', 'application/xml; charset=utf-8');
          res.setHeader('Cache-Control', 'public, max-age=300');
          return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
        }
      }
    }

    // Safety net: nunca deixar robots.txt/sitemap.xml cair no fluxo HTML
    if (requestPath === 'robots.txt') {
      console.log('[SEO] Safety net: retornando robots.txt fallback');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300');
      return res.status(200).send('User-agent: *\nAllow: /\n');
    }
    if (requestPath === 'sitemap.xml') {
      console.log('[SEO] Safety net: retornando sitemap.xml fallback');
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300');
      return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
    }
  }

  // Se for subdomínio, verificar se existe HTML estático primeiro
  if (subdomain) {
    console.log('[SUBDOMAIN DEBUG] Subdomain detected:', subdomain);
    
    // SEO: Query para verificar domínio customizado (usada no redirect 301 e no ramo estático)
    let lpForRedirect: { chosen_domain: string | null; custom_domain: string | null; status: string } | null = null;
    try {
      const queryClientRedirect = supabaseAdmin || supabase;
      const { data } = await queryClientRedirect
        .from('landing_pages')
        .select('chosen_domain, custom_domain, status')
        .eq('subdomain', subdomain)
        .single();
      lpForRedirect = data;
    } catch (redirectCheckErr: any) {
      console.log('[SSR] Erro ao buscar dados de redirect/SEO:', redirectCheckErr?.message);
    }

    const primaryRedirectHost = lpForRedirect
      ? resolveCanonicalHostname(
          {
            chosen_domain: lpForRedirect.chosen_domain,
            custom_domain: lpForRedirect.custom_domain,
            subdomain,
          },
          null
        )
      : null;
    const subDefaultHost = `${subdomain}.docpage.com.br`;

    // SEO: Redirect 301 subdomínio → domínio canônico (domínio próprio), se diferente do subdomínio DocPage
    if (
      !hasPreview &&
      primaryRedirectHost &&
      lpForRedirect?.status === 'published' &&
      stripHostname(primaryRedirectHost) !== stripHostname(subDefaultHost)
    ) {
      const p = getPathParamFromRequest(req);
      const currentPath = p ? `/${p}` : '';
      const redirectUrl = `https://${primaryRedirectHost}${currentPath}`;
      console.log('[SSR] 301 Redirect subdomínio → domínio canônico:', { subdomain, primaryRedirectHost, redirectUrl });
      res.setHeader('Location', redirectUrl);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      return res.status(301).send('');
    }

    // Primeiro, verificar se existe HTML estático no Storage
    let pathSubdomainServedStatic = false;
    try {
      const HTML_FOLDER = 'html';
      const filePath = `${HTML_FOLDER}/${subdomain}.html`;
      
      const { data: { publicUrl } } = supabase.storage
        .from('landing-pages')
        .getPublicUrl(filePath);
      
      console.log('[SSR] Buscando HTML estático em:', publicUrl);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const fullResponse = await fetch(publicUrl, {
          headers: { 'Cache-Control': 'no-cache' },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        
        if (fullResponse.ok) {
          const htmlText = await fullResponse.text();
          
          console.log('[SSR] ✓ HTML estático baixado, tamanho:', htmlText.length);
          
          const hasOldIndexTsx = htmlText.includes('src="/index.tsx"') || htmlText.includes("src='/index.tsx'");
          const hasCompiledAssets = htmlText.includes('/assets/') && (htmlText.includes('.js"') || htmlText.includes('.js\''));
          
          if (hasOldIndexTsx && !hasCompiledAssets) {
            console.warn('[SSR] ⚠️ HTML estático antigo com /index.tsx, usando SSR');
          } else {
            console.log('[SSR] ✓ HTML estático validado, servindo...');
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
            res.setHeader('Vary', 'Host');
            res.setHeader('X-Served-From', 'static-html');
            const staticCanonicalHost = primaryRedirectHost ?? subDefaultHost;
            const usesOnlyDocpageSubdomain =
              stripHostname(staticCanonicalHost) === stripHostname(subDefaultHost);
            if (!usesOnlyDocpageSubdomain) {
              res.setHeader('Link', `<https://${staticCanonicalHost}>; rel="canonical"`);
              res.setHeader('X-Robots-Tag', 'noindex, nofollow');
            } else {
              res.setHeader('Link', `<https://${subDefaultHost}>; rel="canonical"`);
              res.setHeader('X-Robots-Tag', 'index, follow');
            }
            pathSubdomainServedStatic = true;
            return res.send(htmlText);
          }
        } else {
          console.log('[SSR] Storage retornou status:', fullResponse.status);
        }
      } catch (fetchErr: any) {
        clearTimeout(timeout);
        console.log('[SSR] Storage fetch erro:', fetchErr?.name === 'AbortError' ? 'timeout (8s)' : fetchErr?.message);
      }
    } catch (staticError: any) {
      console.log('[SSR] Erro ao verificar HTML estático:', staticError?.message);
    }

    // Fallback: SSR dinâmico
    try {
      // Usar service role key para fazer a query (bypass RLS)
      // Depois verificaremos as permissões manualmente
      const queryClient = supabaseAdmin || supabase;
      const { data: landingPage, error } = await queryClient
        .from('landing_pages')
        .select('*')
        .eq('subdomain', subdomain)
        .single();

      console.log('[SUBDOMAIN DEBUG] Database query result:', {
        subdomain,
        found: !!landingPage,
        error: error?.message,
        status: landingPage?.status,
        landingPageId: landingPage?.id
      });

      if (error || !landingPage) {
        console.log('[SUBDOMAIN DEBUG] Landing page not found, returning 404');
        return res.status(404).send('Not found');
      }

      // Verificar autenticação e permissões
      // IMPORTANTE: Se landing page está publicada, permitir acesso público
      const isPublished = landingPage.status === 'published';
      
      if (isPublished) {
        console.log('[SUBDOMAIN DEBUG] Landing page publicada, acesso público permitido');
      } else {
        // Se não está publicada, verificar se tem parâmetro preview na URL
        if (hasPreview) {
          console.log('[SUBDOMAIN DEBUG] ✓ Landing page draft com preview, acesso permitido');
        } else {
          // Se não tem preview, verificar autenticação e permissões (apenas admin ou dono)
          console.log('[SUBDOMAIN DEBUG] Landing page não publicada sem preview, verificando autenticação...');
          const cookiesRaw = req.headers.cookie;
          const authHeaderRaw = req.headers.authorization;
          const cookies = (Array.isArray(cookiesRaw) ? cookiesRaw[0] : cookiesRaw) || '';
          const authHeader = (Array.isArray(authHeaderRaw) ? authHeaderRaw[0] : authHeaderRaw) || '';
          
          const authResult = await verifyAuthFromRequest(cookies, authHeader);
          
          const isOwner = authResult.isAuthenticated && authResult.userId === landingPage.user_id;
          const isAdmin = authResult.isAdmin;
          
          // Permitir acesso apenas se usuário é dono OU se usuário é admin
          const canAccess = isOwner || isAdmin;
          
          if (!canAccess) {
            console.log('[SUBDOMAIN DEBUG] ✗ Acesso negado - landing page não publicada sem preview e usuário não tem permissão');
            
            // Retornar página de acesso negado
            return res.status(403).send(`
              <!DOCTYPE html>
              <html lang="pt-BR">
              <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Acesso Negado</title>
                <style>
                  body {
                    font-family: Arial, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                    background: #f3f4f6;
                  }
                  .container {
                    text-align: center;
                    padding: 2rem;
                    max-width: 600px;
                  }
                  .icon {
                    width: 64px;
                    height: 64px;
                    margin: 0 auto 1.5rem;
                    background: #fbbf24;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  }
                  h1 {
                    color: #374151;
                    margin-bottom: 1rem;
                    font-size: 1.5rem;
                    font-weight: bold;
                  }
                  p {
                    color: #6b7280;
                    font-size: 1rem;
                    line-height: 1.5;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="icon">
                    <svg style="width: 32px; height: 32px; color: white;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h1>Esta landing page ainda não foi publicada</h1>
                  <p>Apenas o proprietário ou um administrador pode visualizar esta página antes da publicação.</p>
                </div>
              </body>
              </html>
            `);
          }
        }
      }
      
      // Se chegou aqui, tem permissão (publicada, preview, ou admin/dono)
      // Renderizar HTML normalmente
      const mockReq = {
        protocol: 'https',
        get: (header: string) => {
          if (header === 'host') return host;
          return req.headers[header.toLowerCase()] || '';
        },
        headers: req.headers,
      };
      
      // noIndex se servindo via subdomínio mas LP tem domínio customizado (cenário preview/draft)
      const subdomainHasCustomDomain = !!(landingPage.chosen_domain || landingPage.custom_domain);
      const subdomainCanonicalDomain = resolveCanonicalHostname(
        {
          chosen_domain: landingPage.chosen_domain,
          custom_domain: landingPage.custom_domain,
          subdomain,
        },
        host.split(':')[0]
      );
      const htmlContent = await renderLandingPage(landingPage, mockReq, { noIndex: subdomainHasCustomDomain });
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', hasPreview ? 'no-cache, no-store, must-revalidate, max-age=0, private' : (pathSubdomainServedStatic === false ? 'public, s-maxage=0, max-age=0, must-revalidate' : 'public, max-age=3600, s-maxage=3600'));
      res.setHeader('Vary', 'Host');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Served-From', hasPreview ? 'dynamic-ssr-preview' : 'dynamic-ssr-fallback');
      res.setHeader('Link', `<https://${subdomainCanonicalDomain}>; rel="canonical"`);
      if (subdomainHasCustomDomain) {
        res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      } else {
        res.setHeader('X-Robots-Tag', 'index, follow');
      }
      return res.status(200).send(htmlContent);
    } catch (error: any) {
      console.error('[SSR] ✗ Erro ao renderizar SSR:', error?.message || error);
      console.error('[SSR] Stack:', error?.stack);
      return res.status(500).send('Internal Server Error');
    }
  }
  
  // Se não for subdomínio, verificar se é arquivo estático ou rota do SPA
  const path = getPathParamFromRequest(req);
  
  // IMPORTANTE: Se a rota for `/` (vazia) e o host for um subdomínio .docpage.com.br,
  // mas não foi detectado acima, pode ser um problema de header. Tentar novamente.
  if (!path || path === '' || path === '/') {
    const retryHostname = host.split(':')[0].toLowerCase();
    if (retryHostname.includes('.docpage.com.br') && !retryHostname.startsWith('www.') && !retryHostname.startsWith('docpage.')) {
      const parts = retryHostname.split('.');
      if (parts.length >= 4) {
        const potentialSubdomain = parts[0];
        console.log('[SUBDOMAIN DEBUG] Tentando detectar subdomínio novamente para rota /:', {
          hostname: retryHostname,
          potentialSubdomain,
          parts
        });
        // Tentar buscar a landing page novamente
        try {
          const { data: landingPage, error } = await supabase
            .from('landing_pages')
            .select('*')
            .eq('subdomain', potentialSubdomain)
            .single();
          
          if (!error && landingPage) {
            console.log('[SUBDOMAIN DEBUG] Subdomínio encontrado na segunda tentativa:', potentialSubdomain);
            const mockReq = {
              protocol: 'https',
              get: (header: string) => {
                if (header === 'host') return host;
                return req.headers[header.toLowerCase()] || '';
              },
              headers: req.headers,
            };
            const retryHasCustomDomain = !!(landingPage.chosen_domain || landingPage.custom_domain);
            const html = await renderLandingPage(landingPage, mockReq, { noIndex: retryHasCustomDomain });
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            if (retryHasCustomDomain) {
              res.setHeader('X-Robots-Tag', 'noindex, nofollow');
            }
            return res.send(html);
          }
        } catch (retryError) {
          console.error('[SUBDOMAIN DEBUG] Erro ao tentar detectar subdomínio novamente:', retryError);
        }
      }
    }

    // Lookup por domínio customizado (chosen_domain/custom_domain) quando host não é docpage.com.br
    const hostForLookup = hostForCustomDomain || host;
    const requestHostname = hostForLookup.split(':')[0].toLowerCase();
    console.log('[CUSTOM DOMAIN] Verificando lookup:', { host, hostForLookup, requestHostname, path, willTry: !requestHostname.includes('docpage.com.br') });
    if (!requestHostname.includes('docpage.com.br')) {
      const hostNormalized = normalizeHostForDomainLookup(hostForLookup);
      if (hostNormalized && hostNormalized.length > 2) {
        try {
          const queryClient = supabaseAdmin || supabase;
          const { data: pages, error: domainError } = await queryClient
            .rpc('get_landing_page_by_domain', { domain_input: hostNormalized });

          if (domainError) {
            console.error('[CUSTOM DOMAIN] Erro na query RPC:', domainError.message);
          } else if (pages && (Array.isArray(pages) ? pages.length > 0 : pages)) {
            const landingPage = Array.isArray(pages) ? pages[0] : pages;
            console.log('[CUSTOM DOMAIN] Landing page encontrada:', { hostNormalized, landingPageId: landingPage.id, subdomain: landingPage.subdomain });

            const isPublished = landingPage.status === 'published';
            if (!isPublished && !hasPreview) {
              const cookiesRaw = req.headers.cookie;
              const authHeaderRaw = req.headers.authorization;
              const cookies = (Array.isArray(cookiesRaw) ? cookiesRaw[0] : cookiesRaw) || '';
              const authHeader = (Array.isArray(authHeaderRaw) ? authHeaderRaw[0] : authHeaderRaw) || '';
              const authResult = await verifyAuthFromRequest(cookies, authHeader);
              const isOwner = authResult.isAuthenticated && authResult.userId === landingPage.user_id;
              const isAdmin = authResult.isAdmin;
              if (!isOwner && !isAdmin) {
                return res.status(403).send(`
                  <!DOCTYPE html>
                  <html lang="pt-BR">
                  <head><meta charset="UTF-8" /><title>Acesso Negado</title></head>
                  <body><h1>Esta landing page ainda não foi publicada</h1></body>
                  </html>
                `);
              }
            }

            // Tentar HTML estático pelo subdomain
            const customDomainCanonical = resolveCanonicalHostname(
              {
                chosen_domain: landingPage.chosen_domain,
                custom_domain: landingPage.custom_domain,
                subdomain: landingPage.subdomain,
              },
              requestHostname
            );
            let pathServedStaticCustom = false;
            try {
              const HTML_FOLDER = 'html';
              const filePath = `${HTML_FOLDER}/${landingPage.subdomain}.html`;
              const { data: { publicUrl } } = supabase.storage.from('landing-pages').getPublicUrl(filePath);
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 8000);
              try {
                const fullResponse = await fetch(publicUrl, {
                  headers: { 'Cache-Control': 'no-cache' },
                  signal: controller.signal,
                });
                clearTimeout(timeout);
                if (fullResponse.ok) {
                  let htmlText = await fullResponse.text();
                  const hasOldIndexTsx = htmlText.includes('src="/index.tsx"') || htmlText.includes("src='/index.tsx'");
                  const hasCompiledAssets = htmlText.includes('/assets/') && (htmlText.includes('.js"') || htmlText.includes('.js\''));
                  if (!hasOldIndexTsx || hasCompiledAssets) {
                    if (customDomainCanonical) {
                      const subdomainUrl = `https://${landingPage.subdomain}.docpage.com.br`;
                      const customUrl = `https://${customDomainCanonical}`;
                      htmlText = htmlText.split(subdomainUrl).join(customUrl);
                    }
                    const canonicalUrlStatic = `https://${customDomainCanonical || landingPage.subdomain + '.docpage.com.br'}`;
                    res.setHeader('Content-Type', 'text/html; charset=utf-8');
                    res.setHeader('Cache-Control', hasPreview ? 'no-cache, no-store, must-revalidate, max-age=0, private' : 'public, max-age=3600, s-maxage=3600');
                    res.setHeader('Vary', 'Host');
                    res.setHeader('X-Served-From', 'custom-domain-static-html');
                    res.setHeader('Link', `<${canonicalUrlStatic}>; rel="canonical"`);
                    res.setHeader('X-Robots-Tag', 'index, follow');
                    pathServedStaticCustom = true;
                    return res.send(htmlText);
                  }
                } else {
                  console.log('[CUSTOM DOMAIN] Storage retornou status:', fullResponse.status);
                }
              } catch (fetchErr: any) {
                clearTimeout(timeout);
                console.log('[CUSTOM DOMAIN] Storage fetch erro:', fetchErr?.name === 'AbortError' ? 'timeout (8s)' : fetchErr?.message);
              }
            } catch (staticErr: any) {
              console.log('[CUSTOM DOMAIN] HTML estático não disponível:', staticErr?.message);
            }

            if (!pathServedStaticCustom) {
              const mockReq = {
                protocol: 'https',
                get: (h: string) => {
                  if (h === 'host') return hostForLookup;
                  const val = req.headers[h.toLowerCase()];
                  return (Array.isArray(val) ? val[0] : val) || '';
                },
                headers: req.headers as Record<string, string>,
              };
              const htmlContent = await renderLandingPage(landingPage, mockReq);
              const customCanonicalUrl = `https://${customDomainCanonical || landingPage.subdomain + '.docpage.com.br'}`;
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.setHeader('Cache-Control', hasPreview ? 'no-cache, no-store, must-revalidate, max-age=0, private' : 'public, s-maxage=0, max-age=0, must-revalidate');
              res.setHeader('Vary', 'Host');
              res.setHeader('X-Served-From', 'custom-domain-landing-ssr-fallback');
              res.setHeader('Link', `<${customCanonicalUrl}>; rel="canonical"`);
              res.setHeader('X-Robots-Tag', 'index, follow');
              return res.status(200).send(htmlContent);
            }
          }
        } catch (domainLookupError: any) {
          console.error('[CUSTOM DOMAIN] Erro no lookup:', domainLookupError?.message);
        }
      }
    }
  }
  
  console.log('[SUBDOMAIN DEBUG] Not a subdomain, serving SPA:', {
    host,
    subdomain: null,
    path
  });
  
  // Ignorar arquivos estáticos (deixar Vercel servir automaticamente)
  if (path && (path.startsWith('assets/') || path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/))) {
    return res.status(404).send('Not found');
  }
  
  // Rotas do SPA que devem ser servidas com spa.html (React Router vai lidar)
  // Inclui: /, /admin, /dashboard, e qualquer outra rota que não seja subdomínio
  try {
    // Tentar múltiplos caminhos possíveis para spa.html no Vercel
    // spa.html é o index.html renomeado após o build para evitar que o Vercel o sirva diretamente
    const possiblePaths = [
      join(process.cwd(), 'dist', 'spa.html'),
      join(process.cwd(), 'dist', 'index.html'), // Fallback caso o plugin não tenha funcionado
      join(process.cwd(), 'spa.html'),
      join(process.cwd(), 'index.html'),
      join(__dirname, '..', 'dist', 'spa.html'),
      join(__dirname, '..', 'dist', 'index.html'),
      join(__dirname, '..', 'spa.html'),
      join(__dirname, '..', 'index.html'),
    ];
    
    let indexHtml: string | null = null;
    let lastError: Error | null = null;
    
    for (const indexPath of possiblePaths) {
      try {
        indexHtml = readFileSync(indexPath, 'utf-8');
        console.log('[SUBDOMAIN DEBUG] spa.html/index.html encontrado em:', indexPath);
        break;
      } catch (err: any) {
        lastError = err;
        continue;
      }
    }
    
    if (indexHtml) {
      if (isMainDocpage && path) {
        const spec = getSpecialtyByUrlPath(path);
        if (spec) {
          indexHtml = injectSpecialtyPrerender(indexHtml, spec);
          res.setHeader('X-Served-From', 'spa-specialty-prerender');
          res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
        }
      }
      res.setHeader('Content-Type', 'text/html');
      return res.send(indexHtml);
    } else {
      console.error('Erro ao ler index.html de todos os caminhos:', lastError);
      // Retornar HTML básico como fallback
      const fallbackHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DocPage AI</title>
  <script>
    window.location.href = '/';
  </script>
</head>
<body>
  <p>Redirecionando...</p>
</body>
</html>`;
      res.setHeader('Content-Type', 'text/html');
      return res.send(fallbackHtml);
    }
  } catch (error) {
    console.error('Erro geral ao servir index.html:', error);
    // Retornar HTML básico como fallback
    const fallbackHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DocPage AI</title>
  <script>
    window.location.href = '/';
  </script>
</head>
<body>
  <p>Redirecionando...</p>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html');
    return res.send(fallbackHtml);
  }
}
