import { Plugin } from 'vite';
import { renameSync, existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { SPECIALTIES } from './lib/specialties-data';

/**
 * Plugin do Vite para renomear index.html após o build
 * Isso impede que o Vercel sirva o index.html estático antes das rewrites
 */
export function renameIndexHtml(): Plugin {
  return {
    name: 'rename-index-html',
    closeBundle() {
      const distPath = join(process.cwd(), 'dist');
      const indexPath = join(distPath, 'index.html');
      const spaPath = join(distPath, 'spa.html');
      
      // Renomear index.html para spa.html após o build
      if (existsSync(indexPath)) {
        try {
          renameSync(indexPath, spaPath);
          console.log('✓ index.html renomeado para spa.html');
        } catch (error: any) {
          console.error('Erro ao renomear index.html:', error.message);
        }
      }

      // Gerar HTML estático por especialidade com metatags canônicas no HTML cru.
      if (!existsSync(spaPath)) return;
      const spaTemplate = readFileSync(spaPath, 'utf-8');

      for (const spec of Object.values(SPECIALTIES)) {
        const canonicalUrl = `https://docpage.com.br/site-para/${spec.slug}`;
        const desc = spec.descricao;
        const faqEntities = spec.faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        }));
        const schema = {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebPage',
              '@id': `${canonicalUrl}#webpage`,
              url: canonicalUrl,
              name: spec.titulo,
              description: desc,
              isPartOf: {
                '@type': 'WebSite',
                name: 'DocPage AI',
                url: 'https://docpage.com.br',
              },
            },
            {
              '@type': 'FAQPage',
              '@id': `${canonicalUrl}#faq`,
              name: `Perguntas frequentes — site para ${spec.nomeProfissional}`,
              mainEntity: faqEntities,
            },
          ],
        };

        let out = spaTemplate;
        out = out.replace(/<title>[^<]*<\/title>/i, `<title>${spec.titulo}</title>`);
        out = out.replace(
          /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
          `<meta name="description" content="${desc.replace(/"/g, '&quot;')}" />`
        );
        out = out.replace(
          /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
          `<meta property="og:url" content="${canonicalUrl}" />`
        );
        out = out.replace(
          /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
          `<meta property="og:title" content="${spec.titulo.replace(/"/g, '&quot;')}" />`
        );
        out = out.replace(
          /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
          `<meta property="og:description" content="${desc.replace(/"/g, '&quot;')}" />`
        );
        out = out.replace(
          /<meta\s+name="twitter:url"\s+content="[^"]*"\s*\/?>/i,
          `<meta name="twitter:url" content="${canonicalUrl}" />`
        );
        out = out.replace(
          /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
          `<meta name="twitter:title" content="${spec.titulo.replace(/"/g, '&quot;')}" />`
        );
        out = out.replace(
          /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
          `<meta name="twitter:description" content="${desc.replace(/"/g, '&quot;')}" />`
        );
        out = out.replace(
          /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
          `<link rel="canonical" href="${canonicalUrl}" />`
        );

        out = out.replace(/<\/head>/i, `<script type="application/ld+json">${JSON.stringify(schema)}</script>\n</head>`);

        const targetDir = join(distPath, 'site-para', spec.slug);
        mkdirSync(targetDir, { recursive: true });
        writeFileSync(join(targetDir, 'index.html'), out, 'utf-8');
      }
      console.log(`✓ HTML estático de especialidades gerado (${Object.keys(SPECIALTIES).length})`);
    },
  };
}
