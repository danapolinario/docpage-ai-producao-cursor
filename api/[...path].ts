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
  
  console.log('[SSR DEBUG] Subdomain extraction:', {
    host,
    subdomain,
    hostname: host.split(':')[0],
    endsWithCheck: host.split(':')[0].toLowerCase().endsWith('.docpage.com.br'),
    parts: host.split(':')[0].split('.')
  });
  console.log('[SSR DEBUG] ============================================');
  
  // Se for subdomínio, renderizar SSR
  if (subdomain) {
    console.log('[SUBDOMAIN DEBUG] Subdomain detected, querying database:', subdomain);
    try {
      const { data: landingPage, error } = await supabase
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

      try {
        console.log('[SSR] Renderizando HTML com dados do médico...');
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
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return res.send(html);
      } catch (renderError: any) {
        console.error('Erro ao renderizar SSR:', renderError);
        console.error('Stack trace:', renderError?.stack);
        // Em caso de erro na renderização, servir index.html como fallback
        try {
          const indexPath = join(process.cwd(), 'dist', 'index.html');
          const indexHtml = readFileSync(indexPath, 'utf-8');
          res.setHeader('Content-Type', 'text/html');
          return res.send(indexHtml);
        } catch (fallbackError) {
          console.error('Erro ao servir fallback:', fallbackError);
          return res.status(500).send('Internal Server Error');
        }
      }
    } catch (error: any) {
      console.error('Erro geral ao processar subdomínio:', error);
      console.error('Stack trace:', error?.stack);
      // Em caso de erro, servir index.html como fallback
      try {
        const indexPath = join(process.cwd(), 'dist', 'index.html');
        const indexHtml = readFileSync(indexPath, 'utf-8');
        res.setHeader('Content-Type', 'text/html');
        return res.send(indexHtml);
      } catch (fallbackError) {
        console.error('Erro ao servir fallback:', fallbackError);
        return res.status(500).send('Internal Server Error');
      }
    }
  }
  
  // Se não for subdomínio, verificar se é arquivo estático ou rota do SPA
  const pathArray = req.query.path;
  const path = Array.isArray(pathArray) ? pathArray.join('/') : (pathArray || '');
  
  console.log('[SUBDOMAIN DEBUG] Not a subdomain, serving SPA:', {
    host,
    subdomain: null,
    path
  });
  
  // Ignorar arquivos estáticos (deixar Vercel servir automaticamente)
  if (path && (path.startsWith('assets/') || path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/))) {
    return res.status(404).send('Not found');
  }
  
  // Rotas do SPA que devem ser servidas com index.html (React Router vai lidar)
  // Inclui: /, /admin, /dashboard, e qualquer outra rota que não seja subdomínio
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
        console.log('[SUBDOMAIN DEBUG] index.html encontrado em:', indexPath);
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
