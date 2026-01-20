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

// Rota SSR para landing pages (/:subdomain)
app.get('/:subdomain', async (req, res) => {
  const { subdomain } = req.params;

  // Ignorar rotas especiais
  if (['admin', 'api', 'assets', 'favicon.ico', 'robots.txt', 'sitemap.xml'].includes(subdomain)) {
    return res.sendFile(join(distPath, 'index.html'));
  }

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
});

// Rota para admin
app.get('/admin', (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

// Rota raiz
app.get('/', (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

// Todas as outras rotas servem o index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor SSR rodando em http://localhost:${PORT}`);
  console.log(`📦 Servindo arquivos estáticos de: ${distPath}`);
});
