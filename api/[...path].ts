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
import { join } from 'path';

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
  
  console.log('[SUBDOMAIN DEBUG] Headers:', {
    hostHeader,
    xForwardedHost,
    xVercelOriginalHost,
    xHost,
    finalHost: host
  });
  
  const subdomain = extractSubdomain(host);
  
  console.log('[SUBDOMAIN DEBUG] Subdomain extraction:', {
    host,
    subdomain,
    hostname: host.split(':')[0],
    endsWithCheck: host.split(':')[0].toLowerCase().endsWith('.docpage.com.br')
  });
  
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

      if (landingPage.status !== 'published') {
        console.log('[SUBDOMAIN DEBUG] Landing page not published, status:', landingPage.status);
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
  
  // Se não for subdomínio, verificar se é arquivo estático
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
  
  // Se não for subdomínio e não for arquivo estático, servir index.html (SPA)
  try {
    // Tentar ler index.html do dist
    const indexPath = join(process.cwd(), 'dist', 'index.html');
    const indexHtml = readFileSync(indexPath, 'utf-8');
    res.setHeader('Content-Type', 'text/html');
    return res.send(indexHtml);
  } catch (error) {
    // Se não encontrar, retornar 404 (Vercel tentará servir do outputDirectory)
    return res.status(404).send('Not found');
  }
}
