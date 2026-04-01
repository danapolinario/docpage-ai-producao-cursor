-- ============================================
-- Tabela de Leads - Captura antes do Briefing
-- ============================================

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  whatsapp VARCHAR(50),
  marketing_consent BOOLEAN DEFAULT FALSE,
  terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  privacy_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(50) NOT NULL DEFAULT 'lead_captured'
    CHECK (status IN (
      'lead_captured',
      'briefing_started',
      'content_generated',
      'photo_uploaded',
      'visual_configured',
      'editor_completed',
      'checkout_started',
      'subscription_completed'
    )),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  landing_page_id UUID REFERENCES landing_pages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Inserção pública (anon) para captura de lead sem login
DROP POLICY IF EXISTS "Anyone can insert leads" ON leads;
CREATE POLICY "Anyone can insert leads"
  ON leads FOR INSERT
  WITH CHECK (true);

-- Leitura: usuário autenticado pode ver seus próprios leads (por user_id)
DROP POLICY IF EXISTS "Users can view own leads" ON leads;
CREATE POLICY "Users can view own leads"
  ON leads FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Update: anon pode atualizar leads não vinculados (status durante fluxo); autenticado pode atualizar próprios ou vincular
DROP POLICY IF EXISTS "Users can update own leads" ON leads;
CREATE POLICY "Users can update own leads"
  ON leads FOR UPDATE
  USING (
    auth.role() = 'service_role'
    OR (auth.role() = 'anon' AND user_id IS NULL)
    OR (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL))
  );

-- Service role precisa de acesso total para webhooks e operações internas
-- (já coberto pelas políticas com auth.role() = 'service_role')

COMMENT ON TABLE leads IS 'Leads capturados antes do briefing, com rastreamento de etapa';
