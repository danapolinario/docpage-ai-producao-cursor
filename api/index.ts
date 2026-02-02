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

import { renderLandingPage } from './render';
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
  const hostHeader = req.headers.host;
  const xForwardedHost = req.headers['x-forwarded-host'];
  const xVercelOriginalHost = req.headers['x-vercel-original-host'];
  const xHost = req.headers['x-host'];
  
  // Tentar múltiplos headers (Vercel pode usar diferentes)
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
  
  console.log('[SUBDOMAIN DEBUG] Headers (index):', {
    hostHeader,
    xForwardedHost,
    xVercelOriginalHost,
    xHost,
    finalHost: host
  });
  
  const subdomain = extractSubdomain(host);
  
  console.log('[SUBDOMAIN DEBUG] Subdomain extraction (index):', {
    host,
    subdomain,
    hostname: host.split(':')[0],
    endsWithCheck: host.split(':')[0].toLowerCase().endsWith('.docpage.com.br')
  });
  
  // Se for subdomínio, renderizar SSR
  if (subdomain) {
    console.log('[SUBDOMAIN DEBUG] Subdomain detected, querying database (index):', subdomain);
    try {
      const { data: landingPage, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('subdomain', subdomain)
        .single();

      console.log('[SUBDOMAIN DEBUG] Database query result (index):', {
        subdomain,
        found: !!landingPage,
        error: error?.message,
        status: landingPage?.status,
        landingPageId: landingPage?.id
      });

      if (error || !landingPage) {
        console.log('[SUBDOMAIN DEBUG] Landing page not found (index), returning 404');
        return res.status(404).send('Not found');
      }

      if (landingPage.status !== 'published') {
        console.log('[SUBDOMAIN DEBUG] Landing page not published (index), status:', landingPage.status);
        return res.status(404).send('Not found');
      }

      // Criar objeto req compatível para renderLandingPage
      const mockReq = {
        protocol: 'https',
        get: (header: string) => {
          if (header === 'host') return host;
          return req.headers[header.toLowerCase()] || '';
        },
        headers: req.headers,
      };

      const html = await renderLandingPage(landingPage, mockReq);
      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    } catch (error) {
      console.error('Erro ao renderizar SSR:', error);
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