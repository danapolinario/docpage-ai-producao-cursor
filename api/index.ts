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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // IMPORTANTE: Verificar subdomínio PRIMEIRO, antes de qualquer outra coisa
  // Isso garante que subdomínios sempre passem pelo SSR, mesmo que o Vercel tente servir arquivos estáticos
  
  console.log('[API/INDEX] Handler chamado para:', req.url);
  
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
  // Prioridade para domínio customizado: usar o que NÃO é docpage.com.br (domínio real do cliente)
  const candidates = [hostFromXVercelOriginal, hostFromXForwarded, hostFromHeader, hostFromXHost].filter(Boolean);
  const hostForCustomDomain = candidates.find((h) => h && !h.toLowerCase().includes('docpage.com.br')) || hostFromHeader;
  let host = hostFromHeader || hostFromXForwarded || hostFromXVercelOriginal || hostFromXHost;
  
  // Verificar se é subdomínio ANTES de qualquer processamento
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
  
  // Log detalhado para debug
  console.log('[SSR DEBUG] ============================================');
  console.log('[SSR DEBUG] Request URL:', req.url);
  console.log('[SSR DEBUG] All headers:', JSON.stringify(req.headers, null, 2));
  console.log('[SSR DEBUG] Host headers:', {
    hostHeader,
    xForwardedHost,
    xVercelOriginalHost,
    xHost,
    xForwardedFor,
    finalHost: host
  });
  
  console.log('[SSR DEBUG] Subdomain extraction:', {
    host,
    subdomain,
    hostname: host.split(':')[0],
    endsWithCheck: host.split(':')[0].toLowerCase().endsWith('.docpage.com.br'),
    parts: host.split(':')[0].split('.')
  });
  console.log('[SSR DEBUG] ============================================');
  
  // Se for subdomínio, verificar se existe HTML estático primeiro
  // Isso garante que subdomínios sempre passem pelo SSR, mesmo que o Vercel tente servir arquivos estáticos
  if (subdomain) {
    console.log('[SSR] ✓ Subdomínio detectado:', subdomain);
    console.log('[SSR] Request URL:', req.url);
    console.log('[SSR] Request Host:', host);
    
    // Primeiro, verificar se existe HTML estático no Storage
    try {
      const HTML_FOLDER = 'html';
      const filePath = `${HTML_FOLDER}/${subdomain}.html`;
      
      // Obter URL pública do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from('landing-pages')
        .getPublicUrl(filePath);
      
      console.log('[SSR] Verificando HTML estático em:', publicUrl);
      
      // Tentar fazer fetch da URL pública (mais confiável que download)
      const fetchResponse = await fetch(publicUrl, {
        method: 'HEAD', // Usar HEAD primeiro para verificar se existe sem baixar
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      console.log('[SSR] HEAD response status:', fetchResponse.status);
      
      if (fetchResponse.ok) {
        // Arquivo existe, fazer fetch completo
        console.log('[SSR] ✓ HTML estático encontrado, fazendo fetch completo');
        const fullResponse = await fetch(publicUrl, {
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
          if (fullResponse.ok) {
          const htmlText = await fullResponse.text();
          
          console.log('[SSR] ✓ HTML estático baixado com sucesso, tamanho:', htmlText.length);
          console.log('[SSR] Primeiros 200 caracteres:', htmlText.substring(0, 200));
          
          // IMPORTANTE: Verificar se o HTML não é o index.html padrão do DocPage
          // O HTML estático deve conter dados específicos do médico, não o HTML genérico
          const isDefaultIndex = htmlText.includes('DocPage AI - Crie Site Profissional') && 
                                 !htmlText.includes('id="root"') && // O HTML estático deve ter id="root"
                                 htmlText.length < 5000; // HTML estático deve ser maior que o index padrão
          
          // Verificar se o HTML estático contém referência a /index.tsx (antigo, precisa regenerar)
          const hasOldIndexTsx = htmlText.includes('src="/index.tsx"') || htmlText.includes("src='/index.tsx'");
          const hasCompiledAssets = htmlText.includes('/assets/') && (htmlText.includes('.js"') || htmlText.includes('.js\''));
          
          if (isDefaultIndex) {
            console.error('[SSR] ⚠️ ATENÇÃO: HTML estático parece ser o index.html padrão!');
            console.error('[SSR] Continuando com SSR dinâmico...');
            // Não retornar, continuar com SSR dinâmico
          } else if (hasOldIndexTsx && !hasCompiledAssets) {
            console.warn('[SSR] ⚠️ ATENÇÃO: HTML estático contém referência antiga a /index.tsx!');
            console.warn('[SSR] HTML estático precisa ser regenerado. Usando SSR dinâmico...');
            // Não retornar, continuar com SSR dinâmico para gerar HTML correto
          } else {
            console.log('[SSR] ✓ HTML estático validado, servindo...');
            if (hasCompiledAssets) {
              console.log('[SSR] ✓ HTML estático contém assets compilados corretos');
            }
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600'); // Cache de 1 hora
            res.setHeader('Vary', 'Host');
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Served-From', 'static-html');
            res.setHeader('X-Subdomain', subdomain);
            
            // Enviar e finalizar resposta
            res.status(200).send(htmlText);
            return;
          }
        } else {
          console.log('[SSR] Erro ao fazer fetch completo do HTML estático:', fullResponse.status);
        }
      } else {
        console.log('[SSR] HTML estático não encontrado (status:', fetchResponse.status, ')');
      }
    } catch (staticError: any) {
      console.log('[SSR] Erro ao verificar HTML estático, fazendo SSR dinâmico:', staticError?.message);
      console.error('[SSR] Stack:', staticError?.stack);
    }

    // Fallback: SSR dinâmico
    try {
      // IMPORTANTE: Usar service role key para fazer a query (bypass RLS)
      // Isso permite buscar landing pages não publicadas para verificação de permissões
      if (!supabaseAdmin) {
        console.error('[SSR] ⚠️ Service role key não configurada! Não será possível buscar landing pages não publicadas.');
      }
      
      const queryClient = supabaseAdmin || supabase;
      const { data: landingPage, error } = await queryClient
        .from('landing_pages')
        .select('*')
        .eq('subdomain', subdomain)
        .single();

      console.log('[SSR] Resultado da query:', {
        subdomain,
        found: !!landingPage,
        error: error?.message,
        errorCode: error?.code,
        status: landingPage?.status,
        landingPageId: landingPage?.id,
        userId: landingPage?.user_id,
        usingServiceRole: !!supabaseAdmin,
        hasMetaTitle: !!landingPage?.meta_title,
        metaTitle: landingPage?.meta_title?.substring(0, 50),
        photo_url: landingPage?.photo_url ? (landingPage.photo_url.length > 100 ? landingPage.photo_url.substring(0, 100) + '...' : landingPage.photo_url) : 'null/undefined',
        about_photo_url: landingPage?.about_photo_url ? (landingPage.about_photo_url.length > 100 ? landingPage.about_photo_url.substring(0, 100) + '...' : landingPage.about_photo_url) : 'null/undefined',
        og_image_url: landingPage?.og_image_url ? (landingPage.og_image_url.length > 100 ? landingPage.og_image_url.substring(0, 100) + '...' : landingPage.og_image_url) : 'null/undefined',
      });

      if (error || !landingPage) {
        console.log('[SSR] ✗ Landing page não encontrada, retornando 404', {
          error: error?.message,
          errorCode: error?.code,
          errorDetails: error?.details,
          errorHint: error?.hint,
          subdomain
        });
        return res.status(404).send('Not found');
      }

      // Verificar autenticação e permissões
      // IMPORTANTE: Se landing page está publicada, permitir acesso público
      const isPublished = landingPage.status === 'published';
      
      if (isPublished) {
        console.log('[SSR] ✓ Landing page publicada, acesso público permitido');
      } else {
        // Se não está publicada, verificar se tem parâmetro preview na URL
        if (hasPreview) {
          console.log('[SSR] ✓ Landing page draft com preview, acesso permitido');
        } else {
          // Se não tem preview, verificar autenticação e permissões (apenas admin ou dono)
          console.log('[SSR] Landing page não publicada sem preview, verificando autenticação...');
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
            console.log('[SSR] ✗ Acesso negado - landing page não publicada sem preview e usuário não tem permissão');
            
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
      
      const htmlContent = await renderLandingPage(landingPage, mockReq);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', hasPreview ? 'no-cache, no-store, must-revalidate, max-age=0, private' : 'public, max-age=3600, s-maxage=3600');
      res.setHeader('Vary', 'Host');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Served-From', hasPreview ? 'dynamic-ssr-preview' : 'dynamic-ssr');
      return res.status(200).send(htmlContent);
    } catch (error: any) {
      console.error('[SSR] ✗ Erro ao renderizar SSR:', error?.message || error);
      console.error('[SSR] Stack:', error?.stack);
      return res.status(500).send('Internal Server Error');
    }
  }

  // Lookup por domínio customizado (chosen_domain/custom_domain) quando host não é docpage.com.br
  // Usar hostForCustomDomain que prioriza headers com o domínio real do cliente (pode diferir do host após rewrite)
  const hostForLookup = hostForCustomDomain || host;
  const hostname = hostForLookup.split(':')[0].toLowerCase();
  console.log('[CUSTOM DOMAIN] Verificando lookup:', { host, hostForLookup, hostname, willTry: !hostname.includes('docpage.com.br') });
  if (!hostname.includes('docpage.com.br')) {
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
          try {
            const HTML_FOLDER = 'html';
            const filePath = `${HTML_FOLDER}/${landingPage.subdomain}.html`;
            const { data: { publicUrl } } = supabase.storage.from('landing-pages').getPublicUrl(filePath);
            const fetchResponse = await fetch(publicUrl, { method: 'HEAD', headers: { 'Cache-Control': 'no-cache' } });
            if (fetchResponse.ok) {
              const fullResponse = await fetch(publicUrl, { headers: { 'Cache-Control': 'no-cache' } });
              if (fullResponse.ok) {
                const htmlText = await fullResponse.text();
                const hasOldIndexTsx = htmlText.includes('src="/index.tsx"') || htmlText.includes("src='/index.tsx'");
                const hasCompiledAssets = htmlText.includes('/assets/') && (htmlText.includes('.js"') || htmlText.includes('.js\''));
                if (!hasOldIndexTsx || hasCompiledAssets) {
                  res.setHeader('Content-Type', 'text/html; charset=utf-8');
                  res.setHeader('Cache-Control', hasPreview ? 'no-cache, no-store, must-revalidate, max-age=0, private' : 'public, max-age=3600, s-maxage=3600');
                  res.setHeader('Vary', 'Host');
                  res.setHeader('X-Served-From', 'custom-domain-static-html');
                  return res.status(200).send(htmlText);
                }
              }
            }
          } catch (staticErr) {
            console.log('[CUSTOM DOMAIN] HTML estático não disponível, usando SSR');
          }

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
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', hasPreview ? 'no-cache, no-store, must-revalidate, max-age=0, private' : 'public, max-age=3600, s-maxage=3600');
            res.setHeader('Vary', 'Host');
            res.setHeader('X-Served-From', 'custom-domain-landing');
            return res.status(200).send(htmlContent);
        }
      } catch (domainLookupError: any) {
        console.error('[CUSTOM DOMAIN] Erro no lookup:', domainLookupError?.message);
      }
    }
  }
  
  // Se não for subdomínio, servir spa.html (SPA)
  console.log('[SUBDOMAIN DEBUG] Not a subdomain (index), serving SPA:', {
    host,
    hostForCustomDomain,
    subdomain: null
  });
  res.setHeader('X-Debug-Host', host);
  res.setHeader('X-Debug-HostForLookup', hostForCustomDomain || host);
  
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
        console.log('[SUBDOMAIN DEBUG] spa.html/index.html encontrado em (index):', indexPath);
        break;
      } catch (err: any) {
        lastError = err;
        continue;
      }
    }
    
    if (indexHtml) {
      res.setHeader('Content-Type', 'text/html');
      return res.send(indexHtml);
    } else {
      console.error('Erro ao ler index.html de todos os caminhos (index):', lastError);
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
    console.error('Erro geral ao servir index.html (index):', error);
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