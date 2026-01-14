-- ============================================
-- Schema do Banco de Dados - DocPage AI
-- ============================================

-- Habilitar extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- Tabela de Landing Pages
-- ============================================
CREATE TABLE IF NOT EXISTS public.landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Identificação
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  custom_domain VARCHAR(255) UNIQUE,
  slug VARCHAR(255) UNIQUE NOT NULL,
  
  -- Dados (JSONB para flexibilidade)
  briefing_data JSONB NOT NULL DEFAULT '{}',
  content_data JSONB NOT NULL DEFAULT '{}',
  design_settings JSONB NOT NULL DEFAULT '{}',
  section_visibility JSONB NOT NULL DEFAULT '{}',
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
CREATE INDEX IF NOT EXISTS idx_landing_pages_subdomain ON public.landing_pages(subdomain);
CREATE INDEX IF NOT EXISTS idx_landing_pages_user_id ON public.landing_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_status ON public.landing_pages(status);
CREATE INDEX IF NOT EXISTS idx_landing_pages_published_at ON public.landing_pages(published_at);
CREATE INDEX IF NOT EXISTS idx_landing_pages_created_at ON public.landing_pages(created_at DESC);

-- Índices GIN para busca em JSONB
CREATE INDEX IF NOT EXISTS idx_landing_pages_briefing_gin ON public.landing_pages USING GIN (briefing_data);
CREATE INDEX IF NOT EXISTS idx_landing_pages_content_gin ON public.landing_pages USING GIN (content_data);

-- ============================================
-- Tabela de Analytics
-- ============================================
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id UUID REFERENCES public.landing_pages(id) ON DELETE CASCADE NOT NULL,
  
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

CREATE INDEX IF NOT EXISTS idx_analytics_landing_page_id ON public.analytics_events(landing_page_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events(created_at DESC);

-- ============================================
-- Tabela de Domínios Customizados
-- ============================================
CREATE TABLE IF NOT EXISTS public.custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id UUID REFERENCES public.landing_pages(id) ON DELETE CASCADE NOT NULL,
  
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
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_landing_pages_updated_at 
  BEFORE UPDATE ON public.landing_pages 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_domains_updated_at 
  BEFORE UPDATE ON public.custom_domains 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Habilitar RLS
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;

-- Landing Pages: Usuários só podem ver/editar suas próprias páginas
CREATE POLICY "Users can view own landing pages"
  ON public.landing_pages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own landing pages"
  ON public.landing_pages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own landing pages"
  ON public.landing_pages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own landing pages"
  ON public.landing_pages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Landing Pages públicas: Qualquer um pode ler páginas publicadas
CREATE POLICY "Public can view published landing pages"
  ON public.landing_pages FOR SELECT
  TO anon
  USING (status = 'published');

-- Analytics: Usuários podem ver analytics de suas próprias páginas
CREATE POLICY "Users can view own analytics"
  ON public.analytics_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.landing_pages
      WHERE landing_pages.id = analytics_events.landing_page_id
      AND landing_pages.user_id = auth.uid()
    )
  );

-- Analytics: Qualquer um pode inserir eventos (para tracking público)
CREATE POLICY "Public can insert analytics events"
  ON public.analytics_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Custom Domains: Usuários só podem gerenciar seus próprios domínios
CREATE POLICY "Users can view own custom domains"
  ON public.custom_domains FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.landing_pages
      WHERE landing_pages.id = custom_domains.landing_page_id
      AND landing_pages.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own custom domains"
  ON public.custom_domains FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.landing_pages
      WHERE landing_pages.id = custom_domains.landing_page_id
      AND landing_pages.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own custom domains"
  ON public.custom_domains FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.landing_pages
      WHERE landing_pages.id = custom_domains.landing_page_id
      AND landing_pages.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own custom domains"
  ON public.custom_domains FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.landing_pages
      WHERE landing_pages.id = custom_domains.landing_page_id
      AND landing_pages.user_id = auth.uid()
    )
  );

-- ============================================
-- Função para Verificar Disponibilidade de Subdomínio (Pública)
-- ============================================
CREATE OR REPLACE FUNCTION public.check_subdomain_available(check_subdomain TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 
    FROM public.landing_pages 
    WHERE subdomain = LOWER(check_subdomain)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permitir execução pública da função
GRANT EXECUTE ON FUNCTION public.check_subdomain_available(TEXT) TO anon, authenticated;