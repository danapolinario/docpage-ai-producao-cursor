/**
 * Resolve o hostname canônico para SEO (link rel=canonical, og:url, sitemap).
 * Prioriza domínio próprio conectado (custom_domain) sobre o escolhido no checkout (chosen_domain)
 * e ignora valores *.docpage.com.br nesses campos quando existir um domínio externo —
 * evita canonical no subdomínio DocPage quando o site público está no www do cliente.
 */

export function stripHostname(d: string | null | undefined): string {
  if (!d) return '';
  const noProto = d.replace(/^https?:\/\//i, '').split('/')[0].trim().toLowerCase();
  return noProto.split(':')[0];
}

function withoutWww(h: string): string {
  const s = stripHostname(h);
  return s.startsWith('www.') ? s.slice(4) : s;
}

/** Mesmo site (ex.: www e apex do mesmo domínio). */
export function sameRegistrableSite(a: string, b: string): boolean {
  return withoutWww(a) === withoutWww(b);
}

/** Subdomínio de landing na DocPage (ex.: nome.docpage.com.br), não o site principal docpage.com.br. */
export function isDocpageTenantSubdomain(host: string): boolean {
  const h = stripHostname(host);
  return (
    /\.docpage\.com\.br$/i.test(h) &&
    h !== 'docpage.com.br' &&
    h !== 'www.docpage.com.br'
  );
}

function externalCanonicalPriority(lp: {
  chosen_domain?: string | null;
  custom_domain?: string | null;
}): string | null {
  const custom = stripHostname(lp.custom_domain);
  const chosen = stripHostname(lp.chosen_domain);
  if (custom && !isDocpageTenantSubdomain(custom)) return custom;
  if (chosen && !isDocpageTenantSubdomain(chosen)) return chosen;
  return null;
}

export function resolveCanonicalHostname(
  lp: {
    chosen_domain?: string | null;
    custom_domain?: string | null;
    subdomain: string;
  },
  requestHost?: string | null
): string {
  const chosen = stripHostname(lp.chosen_domain);
  const custom = stripHostname(lp.custom_domain);
  const fallbackSub = `${lp.subdomain}.docpage.com.br`;

  const ext = externalCanonicalPriority(lp);

  if (requestHost) {
    const req = stripHostname(requestHost);
    if (isDocpageTenantSubdomain(req)) {
      if (ext) return ext;
    } else {
      if (ext && sameRegistrableSite(req, ext)) {
        return req;
      }
      if (custom && sameRegistrableSite(req, custom)) {
        return req;
      }
      if (chosen && sameRegistrableSite(req, chosen)) {
        return req;
      }
    }
  }

  if (ext) return ext;
  if (custom) return custom;
  if (chosen) return chosen;
  return fallbackSub;
}
