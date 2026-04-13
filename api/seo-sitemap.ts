import { createClient } from '@supabase/supabase-js';
import { resolveCanonicalHostname } from '../lib/seo-canonical.js';

interface VercelRequest {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  send: (body: any) => void;
  setHeader: (name: string, value: string) => void;
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

function getHost(req: VercelRequest): string {
  const get = (h: string | string[] | undefined) => (Array.isArray(h) ? h[0] : h) || '';
  return get(req.headers['x-vercel-original-host'])
    || get(req.headers['x-forwarded-host'])
    || get(req.headers.host)
    || '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const host = getHost(req);
  const hostname = host.split(':')[0].toLowerCase();
  const isMainDocpage = hostname === 'docpage.com.br' || hostname === 'www.docpage.com.br';

  console.log('[SEO-SITEMAP] host:', hostname);

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');

  if (isMainDocpage) {
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      '  <url>\n' +
      '    <loc>https://docpage.com.br/</loc>\n' +
      '    <lastmod>2026-02-05</lastmod>\n' +
      '    <changefreq>weekly</changefreq>\n' +
      '    <priority>1.0</priority>\n' +
      '  </url>\n' +
      '  <url>\n' +
      '    <loc>https://docpage.com.br/termos-de-uso</loc>\n' +
      '    <lastmod>2026-02-05</lastmod>\n' +
      '    <changefreq>monthly</changefreq>\n' +
      '    <priority>0.5</priority>\n' +
      '  </url>\n' +
      '  <url>\n' +
      '    <loc>https://docpage.com.br/politica-de-privacidade</loc>\n' +
      '    <lastmod>2026-02-05</lastmod>\n' +
      '    <changefreq>monthly</changefreq>\n' +
      '    <priority>0.5</priority>\n' +
      '  </url>\n' +
      '  <url>\n' +
      '    <loc>https://docpage.com.br/marketing-medico-primeiros-passos</loc>\n' +
      '    <lastmod>2026-02-18</lastmod>\n' +
      '    <changefreq>monthly</changefreq>\n' +
      '    <priority>0.8</priority>\n' +
      '  </url>\n' +
      '  <url>\n' +
      '    <loc>https://docpage.com.br/site-para/cardiologista</loc>\n' +
      '    <lastmod>2026-04-13</lastmod>\n' +
      '    <changefreq>monthly</changefreq>\n' +
      '    <priority>0.8</priority>\n' +
      '  </url>\n' +
      '  <url>\n' +
      '    <loc>https://docpage.com.br/site-para/dermatologista</loc>\n' +
      '    <lastmod>2026-04-13</lastmod>\n' +
      '    <changefreq>monthly</changefreq>\n' +
      '    <priority>0.8</priority>\n' +
      '  </url>\n' +
      '  <url>\n' +
      '    <loc>https://docpage.com.br/site-para/pediatra</loc>\n' +
      '    <lastmod>2026-04-13</lastmod>\n' +
      '    <changefreq>monthly</changefreq>\n' +
      '    <priority>0.8</priority>\n' +
      '  </url>\n' +
      '  <url>\n' +
      '    <loc>https://docpage.com.br/site-para/ortopedista</loc>\n' +
      '    <lastmod>2026-04-13</lastmod>\n' +
      '    <changefreq>monthly</changefreq>\n' +
      '    <priority>0.8</priority>\n' +
      '  </url>\n' +
      '  <url>\n' +
      '    <loc>https://docpage.com.br/site-para/ginecologista</loc>\n' +
      '    <lastmod>2026-04-13</lastmod>\n' +
      '    <changefreq>monthly</changefreq>\n' +
      '    <priority>0.8</priority>\n' +
      '  </url>\n' +
      '  <url>\n' +
      '    <loc>https://docpage.com.br/site-para/oftalmologista</loc>\n' +
      '    <lastmod>2026-04-13</lastmod>\n' +
      '    <changefreq>monthly</changefreq>\n' +
      '    <priority>0.8</priority>\n' +
      '  </url>\n' +
      '  <url>\n' +
      '    <loc>https://docpage.com.br/site-para/psiquiatra</loc>\n' +
      '    <lastmod>2026-04-13</lastmod>\n' +
      '    <changefreq>monthly</changefreq>\n' +
      '    <priority>0.8</priority>\n' +
      '  </url>\n' +
      '  <url>\n' +
      '    <loc>https://docpage.com.br/site-para/neurologista</loc>\n' +
      '    <lastmod>2026-04-13</lastmod>\n' +
      '    <changefreq>monthly</changefreq>\n' +
      '    <priority>0.8</priority>\n' +
      '  </url>\n' +
      '  <url>\n' +
      '    <loc>https://docpage.com.br/site-para/endocrinologista</loc>\n' +
      '    <lastmod>2026-04-13</lastmod>\n' +
      '    <changefreq>monthly</changefreq>\n' +
      '    <priority>0.8</priority>\n' +
      '  </url>\n' +
      '  <url>\n' +
      '    <loc>https://docpage.com.br/site-para/nutrologista</loc>\n' +
      '    <lastmod>2026-04-13</lastmod>\n' +
      '    <changefreq>monthly</changefreq>\n' +
      '    <priority>0.8</priority>\n' +
      '  </url>\n' +
      '  <url>\n' +
      '    <loc>https://docpage.com.br/site-para/cirurgiao-plastico</loc>\n' +
      '    <lastmod>2026-04-13</lastmod>\n' +
      '    <changefreq>monthly</changefreq>\n' +
      '    <priority>0.8</priority>\n' +
      '  </url>\n' +
      '  <url>\n' +
      '    <loc>https://docpage.com.br/site-para/urologista</loc>\n' +
      '    <lastmod>2026-04-13</lastmod>\n' +
      '    <changefreq>monthly</changefreq>\n' +
      '    <priority>0.8</priority>\n' +
      '  </url>\n' +
      '  <url>\n' +
      '    <loc>https://docpage.com.br/site-para/geriatra</loc>\n' +
      '    <lastmod>2026-04-13</lastmod>\n' +
      '    <changefreq>monthly</changefreq>\n' +
      '    <priority>0.8</priority>\n' +
      '  </url>\n' +
      '  <url>\n' +
      '    <loc>https://docpage.com.br/site-para/otorrinolaringologista</loc>\n' +
      '    <lastmod>2026-04-13</lastmod>\n' +
      '    <changefreq>monthly</changefreq>\n' +
      '    <priority>0.8</priority>\n' +
      '  </url>\n' +
      '</urlset>'
    );
  }

  try {
    const client = supabaseAdmin || supabase;
    const isSubdomain = hostname.endsWith('.docpage.com.br');
    let lp: any = null;

    if (isSubdomain) {
      const parts = hostname.split('.');
      const sub = parts.length >= 4 ? parts[0] : null;
      if (sub && sub !== 'www' && sub !== 'docpage') {
        const { data } = await client
          .from('landing_pages')
          .select('chosen_domain, custom_domain, subdomain, published_at')
          .eq('subdomain', sub)
          .single();
        lp = data;
      }
    } else {
      const normalized = hostname.replace(/^www\./, '');
      const { data: pages } = await client
        .rpc('get_landing_page_by_domain', { domain_input: normalized });
      lp = Array.isArray(pages) ? pages[0] : pages;
    }

    if (lp) {
      const seoDomain = resolveCanonicalHostname(
        {
          chosen_domain: lp.chosen_domain,
          custom_domain: lp.custom_domain,
          subdomain: lp.subdomain,
        },
        hostname
      );
      const lastmod = lp.published_at
        ? new Date(lp.published_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.status(200).send(
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        '  <url>\n' +
        `    <loc>https://${seoDomain}/</loc>\n` +
        `    <lastmod>${lastmod}</lastmod>\n` +
        '    <changefreq>weekly</changefreq>\n' +
        '    <priority>1.0</priority>\n' +
        '  </url>\n' +
        '</urlset>'
      );
    }
  } catch (err: any) {
    console.log('[SEO-SITEMAP] Erro:', err?.message);
  }

  res.setHeader('Cache-Control', 'public, max-age=300');
  return res.status(200).send(
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>'
  );
}
