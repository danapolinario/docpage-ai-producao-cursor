import type { VercelRequest, VercelResponse } from '@vercel/node';
import { renderLandingPage } from '../server/render';
import { createClient } from '@supabase/supabase-js';

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
  const host = req.headers.host || '';
  const subdomain = extractSubdomain(host);
  
  // Se for subdomínio, renderizar SSR
  if (subdomain) {
    try {
      const { data: landingPage, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('subdomain', subdomain)
        .single();

      if (error || !landingPage) {
        // Se não encontrar, servir SPA normal
        return res.status(404).send('Not found');
      }

      if (landingPage.status !== 'published') {
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
  
  // Se não for subdomínio, retornar 404 (Vercel servirá index.html via rewrites)
  return res.status(404).send('Not found');
}