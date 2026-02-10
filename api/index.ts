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

// Para ES modules, precisamos definir __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

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
          
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600'); // Cache de 1 hora
          res.setHeader('Vary', 'Host');
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('X-Served-From', 'static-html');
          return res.send(htmlText);
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
      const { data: landingPage, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('subdomain', subdomain)
        .single();

      console.log('[SSR] Resultado da query:', {
        subdomain,
        found: !!landingPage,
        error: error?.message,
        status: landingPage?.status,
        landingPageId: landingPage?.id,
        hasMetaTitle: !!landingPage?.meta_title,
        metaTitle: landingPage?.meta_title?.substring(0, 50)
      });

      if (error || !landingPage) {
        console.log('[SSR] ✗ Landing page não encontrada, retornando 404');
        return res.status(404).send('Not found');
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
  
  // Se não for subdomínio, servir index.html (SPA)
  console.log('[SUBDOMAIN DEBUG] Not a subdomain (index), serving SPA:', {
    host,
    subdomain: null
  });
  
  try {
    // Tentar múltiplos caminhos possíveis para index.html no Vercel
    const possiblePaths = [
      join(process.cwd(), 'dist', 'index.html'),
      join(process.cwd(), 'index.html'),
      join(__dirname, '..', 'dist', 'index.html'),
      join(__dirname, '..', 'index.html'),
    ];
    
    let indexHtml: string | null = null;
    let lastError: Error | null = null;
    
    for (const indexPath of possiblePaths) {
      try {
        indexHtml = readFileSync(indexPath, 'utf-8');
        console.log('[SUBDOMAIN DEBUG] index.html encontrado em (index):', indexPath);
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