-- ============================================
-- Schema do Banco de Dados - DocPage AI
-- ============================================
-- Execute este SQL no SQL Editor do Supabase Dashboard
-- Acesse: https://supabase.com/dashboard/project/[seu-projeto]/sql/new

-- Habilitar extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para busca full-text

-- ============================================
-- Tabela de Landing Pages
-- ============================================
CREATE TABLE IF NOT EXISTS landing_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Identificação
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  custom_domain VARCHAR(255) UNIQUE,
  slug VARCHAR(255) UNIQUE NOT NULL,
  
  -- Dados (JSONB para flexibilidade)
  briefing_data JSONB NOT NULL,
  content_data JSONB NOT NULL,
  design_settings JSONB NOT NULL,
  section_visibility JSONB NOT NULL,
  layout_variant INTEGER NOT NULL DEFAULT 1,
  
  -- Fotos (URLs do Storage)
  photo_url TEXT,
  about_photo_url TEXT,
  
  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT[],
  og_image_url TEXT,
  schema_markup JSONB,
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_landing_pages_subdomain ON landing_pages(subdomain);
CREATE INDEX IF NOT EXISTS idx_landing_pages_user_id ON landing_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_status ON landing_pages(status);
CREATE INDEX IF NOT EXISTS idx_landing_pages_published_at ON landing_pages(published_at);
CREATE INDEX IF NOT EXISTS idx_landing_pages_created_at ON landing_pages(created_at DESC);

-- Índices GIN para busca em JSONB
CREATE INDEX IF NOT EXISTS idx_landing_pages_briefing_gin ON landing_pages USING GIN (briefing_data);
CREATE INDEX IF NOT EXISTS idx_landing_pages_content_gin ON landing_pages USING GIN (content_data);

-- ============================================
-- Tabela de Analytics
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landing_page_id UUID REFERENCES landing_pages(id) ON DELETE CASCADE NOT NULL,
  
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  
  -- Informações do visitante
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  
  -- Geolocalização
  country VARCHAR(2),
  city VARCHAR(100),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_landing_page_id ON analytics_events(landing_page_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);

-- ============================================
-- Tabela de Domínios Customizados
-- ============================================
CREATE TABLE IF NOT EXISTS custom_domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landing_page_id UUID REFERENCES landing_pages(id) ON DELETE CASCADE NOT NULL,
  
  domain VARCHAR(255) UNIQUE NOT NULL,
  ssl_status VARCHAR(50) DEFAULT 'pending',
  dns_configured BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Funções e Triggers
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_landing_pages_updated_at ON landing_pages;
CREATE TRIGGER update_landing_pages_updated_at 
  BEFORE UPDATE ON landing_pages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_custom_domains_updated_at ON custom_domains;
CREATE TRIGGER update_custom_domains_updated_at 
  BEFORE UPDATE ON custom_domains 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Habilitar RLS
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;

-- Landing Pages: Usuários só podem ver/editar suas próprias páginas
DROP POLICY IF EXISTS "Users can view own landing pages" ON landing_pages;
CREATE POLICY "Users can view own landing pages"
  ON landing_pages FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own landing pages" ON landing_pages;
CREATE POLICY "Users can insert own landing pages"
  ON landing_pages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own landing pages" ON landing_pages;
CREATE POLICY "Users can update own landing pages"
  ON landing_pages FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own landing pages" ON landing_pages;
CREATE POLICY "Users can delete own landing pages"
  ON landing_pages FOR DELETE
  USING (auth.uid() = user_id);

-- Landing Pages públicas: Qualquer um pode ler páginas publicadas
DROP POLICY IF EXISTS "Public can view published landing pages" ON landing_pages;
CREATE POLICY "Public can view published landing pages"
  ON landing_pages FOR SELECT
  USING (status = 'published');

-- Analytics: Usuários podem ver analytics de suas próprias páginas
DROP POLICY IF EXISTS "Users can view own analytics" ON analytics_events;
CREATE POLICY "Users can view own analytics"
  ON analytics_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM landing_pages
      WHERE landing_pages.id = analytics_events.landing_page_id
      AND landing_pages.user_id = auth.uid()
    )
  );

-- Analytics: Qualquer um pode inserir eventos (para tracking público)
DROP POLICY IF EXISTS "Public can insert analytics events" ON analytics_events;
CREATE POLICY "Public can insert analytics events"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

-- Custom Domains: Usuários só podem gerenciar seus próprios domínios
DROP POLICY IF EXISTS "Users can manage own custom domains" ON custom_domains;
CREATE POLICY "Users can manage own custom domains"
  ON custom_domains FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM landing_pages
      WHERE landing_pages.id = custom_domains.landing_page_id
      AND landing_pages.user_id = auth.uid()
    )
  );

-- ============================================
-- Função para Verificar Disponibilidade de Subdomínio (Pública)
-- ============================================
CREATE OR REPLACE FUNCTION check_subdomain_available(check_subdomain TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 
    FROM landing_pages 
    WHERE subdomain = LOWER(check_subdomain)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permitir execução pública da função
GRANT EXECUTE ON FUNCTION check_subdomain_available(TEXT) TO anon, authenticated;

-- ============================================
-- Comentários nas Tabelas
-- ============================================
COMMENT ON TABLE landing_pages IS 'Armazena as landing pages criadas pelos usuários';
COMMENT ON TABLE analytics_events IS 'Eventos de analytics das landing pages';
COMMENT ON TABLE custom_domains IS 'Domínios customizados associados às landing pages';
COMMENT ON FUNCTION check_subdomain_available IS 'Verifica se um subdomínio está disponível (execução pública)';
