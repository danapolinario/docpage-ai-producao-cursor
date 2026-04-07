import { createClient } from '@supabase/supabase-js';

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

  console.log('[SEO-ROBOTS] host:', hostname);

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');

  if (isMainDocpage) {
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(
      'User-agent: *\n' +
      'Allow: /\n' +
      'Disallow: /admin\n' +
      'Disallow: /dashboard\n' +
      'Disallow: /checkout/\n' +
      'Disallow: /dev\n' +
      '\n' +
      'Sitemap: https://docpage.com.br/sitemap.xml\n'
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
          .select('chosen_domain, custom_domain, subdomain')
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
      const seoDomain = lp.chosen_domain || lp.custom_domain || `${lp.subdomain}.docpage.com.br`;
      const isSubWithCustom = isSubdomain && (lp.chosen_domain || lp.custom_domain);

      if (isSubWithCustom) {
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.status(200).send('User-agent: *\nDisallow: /\n');
      }

      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.status(200).send(
        'User-agent: *\n' +
        'Allow: /\n' +
        '\n' +
        `Sitemap: https://${seoDomain}/sitemap.xml\n`
      );
    }
  } catch (err: any) {
    console.log('[SEO-ROBOTS] Erro:', err?.message);
  }

  res.setHeader('Cache-Control', 'public, max-age=300');
  return res.status(200).send('User-agent: *\nAllow: /\n');
}
