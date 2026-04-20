import type { SpecialtyConfig } from './specialties-data.js';

function escapeHtmlAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildSchemaJson(spec: SpecialtyConfig, canonicalUrl: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: spec.titulo,
    description: spec.descricao,
    url: canonicalUrl,
    publisher: {
      '@type': 'Organization',
      name: 'DocPage AI',
      url: 'https://docpage.com.br',
    },
    mainEntity: {
      '@type': 'FAQPage',
      mainEntity: spec.faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
  };
}

/**
 * Injeta title, meta, canonical, JSON-LD e bloco legível em <noscript> no HTML do SPA
 * para crawlers verem conteúdo sem executar JavaScript.
 */
export function injectSpecialtyPrerender(html: string, spec: SpecialtyConfig): string {
  const canonicalUrl = `https://docpage.com.br/site-para/${spec.slug}`;
  const titleEsc = escapeHtmlText(spec.titulo);
  const descAttr = escapeHtmlAttr(spec.descricao);
  const subtituloEsc = escapeHtmlText(spec.subtitulo);

  const faqHtml = spec.faq
    .map(
      (f) =>
        `<h3>${escapeHtmlText(f.question)}</h3><p>${escapeHtmlText(f.answer)}</p>`
    )
    .join('');

  const noscriptBlock = `
<noscript>
  <article style="max-width:48rem;margin:2rem auto;padding:1rem;font-family:system-ui,sans-serif;line-height:1.5;color:#0f172a">
    <h1>${titleEsc}</h1>
    <p>${subtituloEsc}</p>
    <p>${escapeHtmlText(spec.descricao)}</p>
    <section aria-label="Perguntas frequentes">${faqHtml}</section>
    <p><a href="https://docpage.com.br/?openLead=1">Criar meu site grátis no DocPage AI</a></p>
  </article>
</noscript>`;

  const ldJson = `<script type="application/ld+json">${JSON.stringify(buildSchemaJson(spec, canonicalUrl))}</script>`;

  let out = html;

  out = out.replace(/<title>[^<]*<\/title>/i, `<title>${titleEsc}</title>`);

  out = out.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${descAttr}" />`
  );

  out = out.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${escapeHtmlAttr(canonicalUrl)}" />`
  );
  out = out.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${escapeHtmlAttr(spec.titulo)}" />`
  );
  out = out.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${descAttr}" />`
  );

  out = out.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${escapeHtmlAttr(canonicalUrl)}" />`
  );

  out = out.replace(
    /<meta\s+name="twitter:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:url" content="${escapeHtmlAttr(canonicalUrl)}" />`
  );
  out = out.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${escapeHtmlAttr(spec.titulo)}" />`
  );
  out = out.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${descAttr}" />`
  );

  out = out.replace(/<\/head>/i, `${ldJson}\n</head>`);

  out = out.replace(/<div\s+id="root"\s*>/i, `${noscriptBlock}\n    <div id="root">`);

  return out;
}
