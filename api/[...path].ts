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
  console.log('[API/[...PATH]] Handler chamado para:', req.url);
  
  // Garantir que host seja string - verificar múltiplos headers do Vercel
  // IMPORTANTE: Vercel pode passar o host em diferentes headers dependendo da configuração
  const hostHeader = req.headers.host;
  const xForwardedHost = req.headers['x-forwarded-host'];
  const xVercelOriginalHost = req.headers['x-vercel-original-host'];
  const xHost = req.headers['x-host'];
  const xForwardedFor = req.headers['x-forwarded-for'];
  
  // Tentar múltiplos headers (Vercel pode usar diferentes)
  // Prioridade: host > x-forwarded-host > x-vercel-original-host > x-host
  let host = '';
  if (Array.isArray(hostHeader)) {
    host = hostHeader[0] || '';
  } else if (hostHeader) {
    host = hostHeader;
  } else if (xForwardedHost) {
    host = Array.isArray(xForwardedHost) ? xForwardedHost[0] : xForwardedHost;
  } else if (xVercelOriginalHost) {
    host = Array.isArray(xVercelOriginalHost) ? xVercelOriginalHost[0] : xVercelOriginalHost;
  } else if (xHost) {
    host = Array.isArray(xHost) ? xHost[0] : xHost;
  }
  
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
  
  // Se for subdomínio, verificar se existe HTML estático primeiro
  if (subdomain) {
    console.log('[SUBDOMAIN DEBUG] Subdomain detected:', subdomain);
    
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
          
          console.log('[SSR] ✓ HTML estático servido com sucesso, tamanho:', htmlText.length);
          
          // Verificar se o HTML estático contém referência a /index.tsx (antigo, precisa regenerar)
          const hasOldIndexTsx = htmlText.includes('src="/index.tsx"') || htmlText.includes("src='/index.tsx'");
          const hasCompiledAssets = htmlText.includes('/assets/') && (htmlText.includes('.js"') || htmlText.includes('.js\''));
          
          if (hasOldIndexTsx && !hasCompiledAssets) {
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
            res.setHeader('X-Served-From', 'static-html');
            return res.send(htmlText);
          }
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
  
  // Se não for subdomínio, verificar se é arquivo estático ou rota do SPA
  const pathArray = req.query.path;
  const path = Array.isArray(pathArray) ? pathArray.join('/') : (pathArray || '');
  
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
            const html = await renderLandingPage(landingPage, mockReq);
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            return res.send(html);
          }
        } catch (retryError) {
          console.error('[SUBDOMAIN DEBUG] Erro ao tentar detectar subdomínio novamente:', retryError);
        }
      }
    }

    // Lookup por domínio customizado (chosen_domain/custom_domain) quando host não é docpage.com.br
    const requestHostname = host.split(':')[0].toLowerCase();
    if (!requestHostname.includes('docpage.com.br')) {
      const hostNormalized = normalizeHostForDomainLookup(host);
      const hostWithWww = `www.${hostNormalized}`;
      if (hostNormalized && hostNormalized.length > 2) {
        try {
          const queryClient = supabaseAdmin || supabase;
          const { data: pages, error: domainError } = await queryClient
            .from('landing_pages')
            .select('*')
            .or(`chosen_domain.eq."${hostNormalized}",chosen_domain.eq."${hostWithWww}",custom_domain.eq."${hostNormalized}",custom_domain.eq."${hostWithWww}"`)
            .limit(2);

          if (!domainError && pages && pages.length > 0) {
            const landingPage = pages[0];
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
                    res.setHeader('X-Served-From', 'static-html');
                    return res.send(htmlText);
                  }
                }
              }
            } catch (staticErr) {
              console.log('[CUSTOM DOMAIN] HTML estático não disponível, usando SSR');
            }

            const mockReq = {
              protocol: 'https',
              get: (h: string) => {
                if (h === 'host') return host;
                const val = req.headers[h.toLowerCase()];
                return (Array.isArray(val) ? val[0] : val) || '';
              },
              headers: req.headers as Record<string, string>,
            };
            const htmlContent = await renderLandingPage(landingPage, mockReq);
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', hasPreview ? 'no-cache, no-store, must-revalidate, max-age=0, private' : 'public, max-age=3600, s-maxage=3600');
            res.setHeader('Vary', 'Host');
            res.setHeader('X-Served-From', hasPreview ? 'dynamic-ssr-preview' : 'dynamic-ssr');
            return res.status(200).send(htmlContent);
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
