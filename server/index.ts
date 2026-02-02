import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { renderLandingPage } from './render';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8081;

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Servir arquivos estáticos do build
const distPath = join(__dirname, '../dist');
app.use(express.static(distPath));

// Middleware para parsear JSON
app.use(express.json());

/**
 * Extrair subdomínio do Host header
 * Exemplo: drjoaosilva.docpage.com.br -> drjoaosilva
 */
function extractSubdomain(host: string): string | null {
  // Remove porta se houver
  const hostname = host.split(':')[0].toLowerCase();
  
  // Verificar se é subdomínio de docpage.com.br
  if (hostname.endsWith('.docpage.com.br')) {
    const parts = hostname.split('.');
    if (parts.length >= 4) {
      const subdomain = parts[0];
      // Ignorar subdomínios especiais
      if (subdomain && subdomain !== 'www' && subdomain !== 'docpage') {
        return subdomain;
      }
    }
  }
  
  return null;
}

// Middleware para detectar subdomínios
app.use((req, res, next) => {
  const host = req.get('host') || '';
  const subdomain = extractSubdomain(host);
  
  if (subdomain) {
    (req as any).subdomain = subdomain;
  }
  
  next();
});

// Rota raiz - verificar se é subdomínio ou servir SPA principal
app.get('/', async (req, res) => {
  const subdomain = (req as any).subdomain;
  
  if (subdomain) {
    // É um subdomínio - buscar landing page
    try {
      // Buscar landing page no Supabase
      const { data: landingPage, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('subdomain', subdomain)
        .single();

      if (error || !landingPage) {
        // Se não encontrar, servir SPA normal
        return res.sendFile(join(distPath, 'index.html'));
      }

      if (landingPage.status !== 'published') {
        // Se não estiver publicada, servir SPA normal (que mostrará mensagem de erro)
        return res.sendFile(join(distPath, 'index.html'));
      }

      // Renderizar com SSR
      const html = await renderLandingPage(landingPage, req);
      res.send(html);
    } catch (error) {
      console.error('Erro ao renderizar SSR:', error);
      // Em caso de erro, servir SPA normal
      res.sendFile(join(distPath, 'index.html'));
    }
  } else {
    // Não é subdomínio - servir SPA principal
    res.sendFile(join(distPath, 'index.html'));
  }
});

// Rota para admin
app.get('/admin', (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

// Rota legacy para compatibilidade (redirecionar path-based para subdomínio)
app.get('/:subdomain', async (req, res) => {
  const { subdomain } = req.params;

  // Ignorar rotas especiais
  if (['admin', 'api', 'assets', 'favicon.ico', 'robots.txt', 'sitemap.xml'].includes(subdomain)) {
    return res.sendFile(join(distPath, 'index.html'));
  }

  // Redirecionar para subdomínio (301 permanente)
  return res.redirect(301, `https://${subdomain}.docpage.com.br`);
});

// Todas as outras rotas servem o index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor SSR rodando em http://localhost:${PORT}`);
  console.log(`📦 Servindo arquivos estáticos de: ${distPath}`);
});
