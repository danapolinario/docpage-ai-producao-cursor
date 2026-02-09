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

// Servir arquivos estáticos do build (mas NÃO o index.html na raiz)
const distPath = join(__dirname, '../dist');
app.use(express.static(distPath, { index: false })); // index: false impede servir index.html automaticamente

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
// IMPORTANTE: Esta rota deve vir ANTES do express.static servir o index.html
app.get('/', async (req, res) => {
  const subdomain = (req as any).subdomain;
  
  if (subdomain) {
    // É um subdomínio - buscar landing page
    try {
      console.log(`[SSR] Tentando renderizar landing page para subdomínio: ${subdomain}`);
      
      // Buscar landing page no Supabase
      const { data: landingPage, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('subdomain', subdomain)
        .single();

      if (error || !landingPage) {
        console.log(`[SSR] Landing page não encontrada para subdomínio: ${subdomain}`, error?.message);
        // Se não encontrar, servir SPA normal
        return res.sendFile(join(distPath, 'index.html'));
      }

      console.log(`[SSR] Landing page encontrada: ${landingPage.id}, renderizando...`);
      
      // Permitir acesso mesmo se não publicado (para preview via subdomain)
      // Renderizar com SSR
      const html = await renderLandingPage(landingPage, req);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error: any) {
      console.error('[SSR] Erro ao renderizar SSR:', error?.message || error);
      console.error('[SSR] Stack:', error?.stack);
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
