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

import { renderLandingPage } from '../server/render';
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
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/4f26b07b-316f-4349-9d74-50fa5b35a5ad',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/index.ts:23',message:'Handler called',data:{method:req.method,url:req.url,headers:Object.keys(req.headers)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  // Garantir que host seja string
  const hostHeader = req.headers.host;
  const host = Array.isArray(hostHeader) ? hostHeader[0] : (hostHeader || '');
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/4f26b07b-316f-4349-9d74-50fa5b35a5ad',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/index.ts:27',message:'Host header extracted',data:{host,allHeaders:req.headers},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  const subdomain = extractSubdomain(host);
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/4f26b07b-316f-4349-9d74-50fa5b35a5ad',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/index.ts:31',message:'Subdomain extracted',data:{host,subdomain,hostname:host.split(':')[0],endsWithCheck:host.split(':')[0].toLowerCase().endsWith('.docpage.com.br')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  
  // Se for subdomínio, renderizar SSR
  if (subdomain) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4f26b07b-316f-4349-9d74-50fa5b35a5ad',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/index.ts:36',message:'Subdomain detected, querying database',data:{subdomain},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    try {
      const { data: landingPage, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('subdomain', subdomain)
        .single();

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/4f26b07b-316f-4349-9d74-50fa5b35a5ad',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/index.ts:42',message:'Database query result',data:{subdomain,found:!!landingPage,error:error?.message,status:landingPage?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      if (error || !landingPage) {
        // Se não encontrar, servir SPA normal
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/4f26b07b-316f-4349-9d74-50fa5b35a5ad',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/index.ts:48',message:'Landing page not found',data:{subdomain,error:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        return res.status(404).send('Not found');
      }

      if (landingPage.status !== 'published') {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/4f26b07b-316f-4349-9d74-50fa5b35a5ad',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/index.ts:54',message:'Landing page not published',data:{subdomain,status:landingPage.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
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
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/4f26b07b-316f-4349-9d74-50fa5b35a5ad',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/index.ts:63',message:'SSR rendered successfully',data:{subdomain,htmlLength:html.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      return res.send(html);
    } catch (error) {
      console.error('Erro ao renderizar SSR:', error);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/4f26b07b-316f-4349-9d74-50fa5b35a5ad',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/index.ts:68',message:'SSR render error',data:{subdomain,error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      return res.status(500).send('Internal Server Error');
    }
  }
  
  // Se não for subdomínio, servir index.html (SPA)
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/4f26b07b-316f-4349-9d74-50fa5b35a5ad',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/index.ts:115',message:'Not a subdomain, serving index.html',data:{host,subdomain:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  try {
    // Tentar ler index.html do dist
    const indexPath = join(process.cwd(), 'dist', 'index.html');
    const indexHtml = readFileSync(indexPath, 'utf-8');
    res.setHeader('Content-Type', 'text/html');
    return res.send(indexHtml);
  } catch (error) {
    // Se não encontrar, retornar 404 (Vercel tentará servir do outputDirectory)
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4f26b07b-316f-4349-9d74-50fa5b35a5ad',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/index.ts:125',message:'Could not read index.html, returning 404',data:{error:error instanceof Error ? error.message : String(error),cwd:process.cwd()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return res.status(404).send('Not found');
  }
}