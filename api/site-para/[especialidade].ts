import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getSpecialtyByUrlPath } from '../../lib/specialties-data.js';
import { injectSpecialtyPrerender } from '../../lib/specialty-inject-html.js';

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readSpaHtml(): { html: string | null; lastError: Error | null } {
  const possiblePaths = [
    join(process.cwd(), 'dist', 'spa.html'),
    join(process.cwd(), 'dist', 'index.html'),
    join(process.cwd(), 'spa.html'),
    join(process.cwd(), 'index.html'),
    join(__dirname, '..', '..', 'dist', 'spa.html'),
    join(__dirname, '..', '..', 'dist', 'index.html'),
    join(__dirname, '..', '..', 'spa.html'),
    join(__dirname, '..', '..', 'index.html'),
  ];
  let lastError: Error | null = null;
  for (const indexPath of possiblePaths) {
    try {
      return { html: readFileSync(indexPath, 'utf-8'), lastError: null };
    } catch (err: any) {
      lastError = err;
    }
  }
  return { html: null, lastError };
}

/**
 * Rota dedicada: a Vercel nem sempre encaminha /api/site-para/x para api/[...path].ts (404 NOT_FOUND na edge).
 * Este ficheiro garante /api/site-para/:especialidade → HTML do SPA + pré-render de especialidade.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  const raw = req.query.especialidade;
  const slug = Array.isArray(raw) ? raw[0] : raw;
  if (!slug || typeof slug !== 'string') {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(400).send('Bad request');
  }

  const normalized = slug.replace(/^\/+|\/+$/g, '');
  const pathKey = `site-para/${normalized}`;
  const spec = getSpecialtyByUrlPath(pathKey);

  const { html: indexHtml, lastError } = readSpaHtml();
  if (!indexHtml) {
    console.error('[site-para] spa.html não encontrado:', lastError);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(500).send('<!DOCTYPE html><html lang="pt-BR"><body>Erro ao carregar aplicação</body></html>');
  }

  let out = indexHtml;
  if (spec) {
    out = injectSpecialtyPrerender(out, spec);
    res.setHeader('X-Served-From', 'spa-specialty-prerender');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  } else {
    res.setHeader('X-Served-From', 'spa-specialty-unknown-slug');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(out);
}
