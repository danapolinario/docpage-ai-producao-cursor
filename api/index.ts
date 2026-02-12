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
  
  // Verificar se é subdomínio ANTES de qualquer processamento
  const subdomain = extractSubdomain(host);
  
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
        // Se não está publicada, verificar autenticação e permissões
        console.log('[SSR] Landing page não publicada, verificando autenticação...');
        const cookies = req.headers.cookie || '';
        const authHeader = req.headers.authorization || '';
        
        console.log('[SSR] Headers de autenticação:', {
          hasCookies: !!cookies,
          cookiesLength: cookies.length,
          hasAuthHeader: !!authHeader,
          cookiePreview: cookies.substring(0, 200)
        });
        
        const authResult = await verifyAuthFromRequest(cookies, authHeader);
        
        const isOwner = authResult.isAuthenticated && authResult.userId === landingPage.user_id;
        const isAdmin = authResult.isAdmin;
        
        console.log('[SSR] Resultado da verificação de autenticação:', {
          isAuthenticated: authResult.isAuthenticated,
          userId: authResult.userId,
          isAdmin,
          isOwner,
          landingPageUserId: landingPage.user_id,
          status: landingPage.status
        });
        
        // Permitir acesso se usuário é dono OU se usuário é admin
        const canAccess = isOwner || isAdmin;
        
        if (!canAccess) {
          console.log('[SSR] ✗ Acesso negado - landing page não publicada e usuário não tem permissão', {
            status: landingPage.status,
            isOwner,
            isAdmin,
            isAuthenticated: authResult.isAuthenticated,
            userId: authResult.userId,
            landingPageUserId: landingPage.user_id
          });
          
          // Se não conseguimos verificar autenticação no servidor (porque Supabase usa localStorage),
          // servir HTML completo mas com script que verifica acesso no cliente ANTES de mostrar conteúdo
          if (!authResult.isAuthenticated) {
            // Renderizar HTML completo mas com verificação no cliente
            const mockReq = {
              protocol: 'https',
              get: (header: string) => {
                if (header === 'host') return host;
                return req.headers[header.toLowerCase()] || '';
              },
              headers: req.headers,
            };
            
            const htmlContent = await renderLandingPage(landingPage, mockReq);
            
            // Injetar script de verificação ANTES do fechamento do </body>
            const verificationScript = `
              <script>
                (function() {
                  // Ocultar conteúdo até verificar acesso
                  document.body.style.display = 'none';
                  
                  const SUPABASE_URL = '${supabaseUrl}';
                  const SUPABASE_KEY = '${supabaseKey}';
                  
                  async function checkAccess() {
                    try {
                      let supabase;
                      
                      // IMPORTANTE: Sempre criar um novo cliente com localStorage explícito
                      // para garantir que a sessão seja carregada corretamente do localStorage
                      if (window.supabase && window.supabase.createClient) {
                        // Criar novo cliente com localStorage explícito para compartilhar sessão
                        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
                          auth: {
                            storage: window.localStorage,
                            persistSession: true,
                            autoRefreshToken: true,
                            detectSessionInUrl: false
                          }
                        });
                        console.log('[VERIFY] Criado novo cliente Supabase com localStorage explícito');
                      } else if (window.__SUPABASE_CLIENT__) {
                        // Se não conseguir criar novo cliente, tentar usar o existente
                        supabase = window.__SUPABASE_CLIENT__;
                        console.log('[VERIFY] Usando cliente Supabase existente da página');
                      } else {
                        console.error('[VERIFY] Supabase não está disponível');
                        showAccessDenied();
                        return;
                      }
                      
                      // Aguardar um pouco para garantir que o cliente carregou a sessão do localStorage
                      await new Promise(resolve => setTimeout(resolve, 200));
                      
                      // Tentar obter sessão primeiro (pode funcionar melhor que getUser quando a sessão está no localStorage)
                      let user = null;
                      let session = null;
                      
                      // IMPORTANTE: Tentar restaurar sessão do localStorage manualmente antes de verificar
                      // O Supabase armazena a sessão em uma chave específica: sb-{project-ref}-auth-token
                      const supabaseUrlParts = SUPABASE_URL.split('//')[1]?.split('.')[0];
                      const allKeys = Object.keys(localStorage);
                      const sessionKeys = allKeys.filter(key => 
                        key.includes('sb-') && key.includes('auth-token')
                      );
                      
                      console.log('[VERIFY] Todas as chaves do localStorage:', allKeys);
                      console.log('[VERIFY] Chaves de sessão encontradas:', sessionKeys);
                      
                      // Tentar restaurar sessão manualmente se encontrou chave
                      for (const sessionKey of sessionKeys) {
                        try {
                          const storedData = localStorage.getItem(sessionKey);
                          if (storedData) {
                            const sessionData = JSON.parse(storedData);
                            if (sessionData.access_token && sessionData.refresh_token) {
                              console.log('[VERIFY] Tentando restaurar sessão manualmente...');
                              const { data: { session: restoredSession }, error: restoreError } = await supabase.auth.setSession({
                                access_token: sessionData.access_token,
                                refresh_token: sessionData.refresh_token
                              });
                              if (!restoreError && restoredSession && restoredSession.user) {
                                user = restoredSession.user;
                                session = restoredSession;
                                console.log('[VERIFY] Sessão restaurada manualmente com sucesso');
                                break;
                              } else {
                                console.log('[VERIFY] Erro ao restaurar sessão:', restoreError?.message);
                              }
                            }
                          }
                        } catch (e) {
                          console.error('[VERIFY] Erro ao restaurar sessão manualmente:', e);
                        }
                      }
                      
                      // Se ainda não tem usuário, tentar métodos normais
                      if (!user) {
                        // Primeiro tentar obter sessão
                        const { data: { session: sessionData }, error: sessionError } = await supabase.auth.getSession();
                        if (!sessionError && sessionData && sessionData.user) {
                          session = sessionData;
                          user = sessionData.user;
                          console.log('[VERIFY] Sessão obtida via getSession()');
                        } else {
                          // Se não conseguir sessão, tentar getUser
                          const { data: { user: userData }, error: userError } = await supabase.auth.getUser();
                          if (!userError && userData) {
                            user = userData;
                            console.log('[VERIFY] Usuário obtido via getUser()');
                          } else {
                            console.log('[VERIFY] Erro ao obter sessão/usuário:', sessionError?.message || userError?.message);
                            
                            // Tentar obter sessão do localStorage diretamente
                            // O Supabase armazena a sessão em uma chave específica: sb-{project-ref}-auth-token
                            // Precisamos encontrar essa chave
                            const supabaseUrlParts = SUPABASE_URL.split('//')[1]?.split('.')[0];
                            const possibleKeys = Object.keys(localStorage).filter(key => 
                              key.includes('supabase') || 
                              (key.includes('sb-') && key.includes('auth')) ||
                              (supabaseUrlParts && key.includes(supabaseUrlParts))
                            );
                            
                            console.log('[VERIFY] Chaves do localStorage encontradas:', possibleKeys);
                            console.log('[VERIFY] SUPABASE_URL:', SUPABASE_URL);
                            
                            // Tentar todas as chaves possíveis
                            for (const sessionKey of possibleKeys) {
                              try {
                                const storedData = localStorage.getItem(sessionKey);
                                if (storedData) {
                                  console.log(\`[VERIFY] Tentando chave: \${sessionKey}, tamanho: \${storedData.length}\`);
                                  
                                  let sessionData;
                                  try {
                                    sessionData = JSON.parse(storedData);
                                  } catch {
                                    // Se não for JSON, pode ser apenas o token
                                    if (storedData.length > 50 && storedData.match(/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/)) {
                                      // Parece ser um token JWT
                                      console.log('[VERIFY] Token JWT encontrado diretamente');
                                      const { data: { user: userFromToken }, error: tokenError } = await supabase.auth.getUser(storedData);
                                      if (!tokenError && userFromToken) {
                                        user = userFromToken;
                                        console.log('[VERIFY] Usuário obtido do token direto do localStorage');
                                        break;
                                      }
                                    }
                                    continue;
                                  }
                                  
                                  // Tentar diferentes formatos de dados
                                  let accessToken = null;
                                  
                                  if (sessionData.access_token) {
                                    accessToken = sessionData.access_token;
                                  } else if (sessionData.accessToken) {
                                    accessToken = sessionData.accessToken;
                                  } else if (sessionData.session && sessionData.session.access_token) {
                                    accessToken = sessionData.session.access_token;
                                  } else if (sessionData.user && sessionData.user.id) {
                                    // Pode ser que já tenha o user no objeto
                                    user = sessionData.user;
                                    console.log('[VERIFY] Usuário encontrado diretamente no objeto de sessão');
                                    break;
                                  }
                                  
                                  if (accessToken) {
                                    console.log('[VERIFY] Token encontrado no localStorage, tentando obter usuário...');
                                    
                                    // Tentar usar o token para obter usuário
                                    const { data: { user: userFromToken }, error: tokenError } = await supabase.auth.getUser(accessToken);
                                    if (!tokenError && userFromToken) {
                                      user = userFromToken;
                                      console.log('[VERIFY] Usuário obtido do token do localStorage');
                                      break;
                                    } else {
                                      console.log('[VERIFY] Erro ao obter usuário do token:', tokenError?.message);
                                    }
                                  }
                                  
                                  // Tentar usar setSession se tiver os dados completos
                                  if (sessionData.access_token && sessionData.refresh_token) {
                                    try {
                                      const { data: { session: newSession }, error: setSessionError } = await supabase.auth.setSession({
                                        access_token: sessionData.access_token,
                                        refresh_token: sessionData.refresh_token
                                      });
                                      if (!setSessionError && newSession && newSession.user) {
                                        user = newSession.user;
                                        console.log('[VERIFY] Sessão restaurada via setSession()');
                                        break;
                                      }
                                    } catch (e) {
                                      console.error('[VERIFY] Erro ao restaurar sessão:', e);
                                    }
                                  }
                                }
                              } catch (e) {
                                console.error('[VERIFY] Erro ao ler sessão do localStorage:', e);
                                continue;
                              }
                            }
                          }
                        }
                      }
                      
                      if (!user) {
                        console.log('[VERIFY] Usuário não autenticado após todas as tentativas');
                        showAccessDenied();
                        return;
                      }
                      
                      console.log('[VERIFY] Usuário autenticado:', user.id);
                      
                      // Verificar se é admin
                      let isAdmin = false;
                      try {
                        const { data: adminData, error: adminError } = await supabase
                          .from('user_roles')
                          .select('role')
                          .eq('user_id', user.id)
                          .eq('role', 'admin')
                          .maybeSingle();
                        isAdmin = !!adminData && !adminError;
                        console.log('[VERIFY] Verificação de admin:', { isAdmin, adminError: adminError?.message });
                      } catch (e) {
                        console.error('[VERIFY] Erro ao verificar admin:', e);
                      }
                      
                      // Buscar landing page para verificar se é dono
                      const { data: lpData, error: lpError } = await supabase
                        .from('landing_pages')
                        .select('user_id')
                        .eq('subdomain', '${subdomain}')
                        .maybeSingle();
                      
                      if (lpError) {
                        console.error('[VERIFY] Erro ao buscar landing page:', lpError);
                        showAccessDenied();
                        return;
                      }
                      
                      const isOwner = lpData && user.id === lpData.user_id;
                      console.log('[VERIFY] Verificação de acesso:', { isOwner, isAdmin, userId: user.id, lpUserId: lpData?.user_id });
                      
                      if (isOwner || isAdmin) {
                        // Tem acesso, mostrar conteúdo
                        document.body.style.display = '';
                      } else {
                        showAccessDenied();
                      }
                    } catch (error) {
                      console.error('[VERIFY] Erro ao verificar acesso:', error);
                      showAccessDenied();
                    }
                  }
                  
                  function showAccessDenied() {
                    console.log('[VERIFY] Mostrando mensagem de acesso negado');
                    // Limpar qualquer conteúdo existente e mostrar mensagem
                    document.body.innerHTML = '';
                    document.body.style.display = 'block';
                    document.body.style.margin = '0';
                    document.body.style.padding = '0';
                    document.body.style.fontFamily = 'Arial, sans-serif';
                    document.body.style.background = '#f3f4f6';
                    document.body.innerHTML = \`
                      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f3f4f6;">
                        <div style="text-align: center; padding: 2rem; max-width: 600px;">
                          <div style="width: 64px; height: 64px; margin: 0 auto 1.5rem; background: #fbbf24; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <svg style="width: 32px; height: 32px; color: white;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <h1 style="color: #374151; margin-bottom: 1rem; font-size: 1.5rem; font-weight: bold;">Esta landing page ainda não foi publicada</h1>
                          <p style="color: #6b7280; font-size: 1rem; line-height: 1.5;">Apenas o proprietário ou um administrador pode visualizar esta página antes da publicação.</p>
                        </div>
                      </div>
                    \`;
                  }
                  
                  // Wrapper para garantir que erros sejam tratados
                  async function safeCheckAccess() {
                    try {
                      await checkAccess();
                    } catch (error) {
                      console.error('[VERIFY] Erro fatal ao verificar acesso:', error);
                      showAccessDenied();
                    }
                  }
                  
                  // Função para aguardar e tentar novamente se necessário
                  async function checkAccessWithRetry(retries = 3) {
                    for (let i = 0; i < retries; i++) {
                      try {
                        await safeCheckAccess();
                        // Se chegou aqui sem erro, verificar se o body foi mostrado ou negado
                        if (document.body.style.display !== 'none' || document.body.innerHTML.includes('Esta landing page ainda não foi publicada')) {
                          return; // Já foi processado
                        }
                        // Se ainda está oculto e não foi negado, aguardar e tentar novamente
                        if (i < retries - 1) {
                          console.log(\`[VERIFY] Tentativa \${i + 1} falhou, aguardando e tentando novamente...\`);
                          await new Promise(resolve => setTimeout(resolve, 500));
                        } else {
                          // Última tentativa falhou, mostrar acesso negado
                          showAccessDenied();
                        }
                      } catch (error) {
                        console.error(\`[VERIFY] Erro na tentativa \${i + 1}:\`, error);
                        if (i === retries - 1) {
                          showAccessDenied();
                        } else {
                          await new Promise(resolve => setTimeout(resolve, 500));
                        }
                      }
                    }
                  }
                  
                  // Aguardar um pouco para garantir que o DOM está pronto e o Supabase carregou a sessão
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', function() {
                      setTimeout(() => checkAccessWithRetry(), 300);
                    });
                  } else {
                    setTimeout(() => checkAccessWithRetry(), 300);
                  }
                  
                  // Carregar Supabase JS se necessário
                  if (!window.supabase || !window.supabase.createClient) {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
                    script.onload = function() {
                      setTimeout(() => checkAccessWithRetry(), 300);
                    };
                    script.onerror = function() {
                      console.error('[VERIFY] Erro ao carregar biblioteca Supabase');
                      showAccessDenied();
                    };
                    document.head.appendChild(script);
                  }
                })();
              </script>
            `;
            
            const htmlWithVerification = htmlContent.replace('</body>', verificationScript + '</body>');
            
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, private');
            return res.status(200).send(htmlWithVerification);
          }
          
          // Se verificamos mas não tem acesso, bloquear
          return res.status(403).send(`
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Acesso Negado</title>
            </head>
            <body style="font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f3f4f6;">
              <div style="text-align: center; padding: 2rem;">
                <h1 style="color: #374151; margin-bottom: 1rem;">Esta landing page ainda não foi publicada</h1>
                <p style="color: #6b7280;">Apenas o proprietário ou um administrador pode visualizar esta página antes da publicação.</p>
              </div>
            </body>
            </html>
          `);
        }

        console.log('[SSR] ✓ Acesso permitido para usuário autenticado', {
          status: landingPage.status,
          isOwner,
          isAdmin
        });
      }

      // Se landing page está publicada mas HTML estático não existe, tentar gerar
      if (landingPage.status === 'published') {
        try {
          console.log('[SSR] Landing page publicada mas HTML estático não encontrado, tentando gerar...');
          const FUNCTIONS_BASE_URL = process.env.VITE_SUPABASE_URL?.replace('/rest/v1', '/functions/v1') || '';
          const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
          
          if (FUNCTIONS_BASE_URL && SERVICE_ROLE_KEY) {
            const generateResponse = await fetch(`${FUNCTIONS_BASE_URL}/generate-static-html`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
              },
              body: JSON.stringify({ landingPageId: landingPage.id }),
            });
            
            if (generateResponse.ok) {
              console.log('[SSR] HTML estático gerado com sucesso, tentando servir novamente...');
              // Tentar servir o HTML estático recém-gerado
              const HTML_FOLDER = 'html';
              const filePath = `${HTML_FOLDER}/${subdomain}.html`;
              const { data: { publicUrl } } = supabase.storage
                .from('landing-pages')
                .getPublicUrl(filePath);
              
              const retryResponse = await fetch(publicUrl, {
                headers: { 'Cache-Control': 'no-cache' }
              });
              
              if (retryResponse.ok) {
                const htmlText = await retryResponse.text();
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
                res.setHeader('Vary', 'Host');
                res.setHeader('X-Content-Type-Options', 'nosniff');
                res.setHeader('X-Served-From', 'static-html-generated');
                return res.send(htmlText);
              }
            } else {
              console.log('[SSR] Erro ao gerar HTML estático:', await generateResponse.text());
            }
          }
        } catch (genError: any) {
          console.log('[SSR] Erro ao tentar gerar HTML estático:', genError?.message);
          // Continuar com SSR dinâmico
        }
      }

      // Permitir acesso mesmo se não publicado (para preview via subdomain)
      // Removido: if (landingPage.status !== 'published')

      // Criar objeto req compatível para renderLandingPage
      const mockReq = {
        protocol: 'https',
        get: (header: string) => {
          if (header === 'host') return host;
          return req.headers[header.toLowerCase()] || '';
        },
        headers: req.headers,
      };

      console.log('[SSR] Renderizando HTML com dados do médico (SSR dinâmico)...');
      const html = await renderLandingPage(landingPage, mockReq);
      
      // Verificar se o HTML gerado contém dados do médico (não genérico)
      const hasDoctorName = html.includes(landingPage.briefing_data?.name || '');
      const hasGenericDocPage = html.includes('DocPage AI - Crie Site Profissional');
      
      console.log('[SSR] Verificação do HTML gerado:', {
        hasDoctorName,
        hasGenericDocPage,
        htmlLength: html.length,
        firstChars: html.substring(0, 200)
      });
      
      if (hasGenericDocPage && !hasDoctorName) {
        console.error('[SSR] ⚠️ ATENÇÃO: HTML gerado ainda contém dados genéricos!');
      }
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Vary', 'Host');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Served-From', 'ssr-dynamic');
      return res.send(html);
    } catch (error: any) {
      console.error('[SSR] ✗ Erro ao renderizar SSR:', error?.message || error);
      console.error('[SSR] Stack:', error?.stack);
      return res.status(500).send('Internal Server Error');
    }
  }
  
  // Se não for subdomínio, servir spa.html (SPA)
  console.log('[SUBDOMAIN DEBUG] Not a subdomain (index), serving SPA:', {
    host,
    subdomain: null
  });
  
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