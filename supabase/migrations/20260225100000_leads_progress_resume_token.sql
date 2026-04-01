-- Progresso do funil anónimo + retoma por token seguro
-- Inclui bootstrap da tabela `leads` caso a migration 20260225000000 não exista/aplicada no projeto
-- (evita ERROR: relation "public.leads" does not exist).

-- ============================================
-- Leads: tabela base (idempotente)
-- ============================================

CREATE TABLE IF NOT EXISTS public.leads (
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
  landing_page_id UUID REFERENCES public.landing_pages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
CREATE POLICY "Anyone can insert leads"
  ON public.leads FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own leads" ON public.leads;
CREATE POLICY "Users can view own leads"
  ON public.leads FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Política inicial (será substituída no ficheiro: anon só via RPC)
DROP POLICY IF EXISTS "Users can update own leads" ON public.leads;
CREATE POLICY "Users can update own leads"
  ON public.leads FOR UPDATE
  USING (
    auth.role() = 'service_role'
    OR (auth.role() = 'anon' AND user_id IS NULL)
    OR (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL))
  );

COMMENT ON TABLE public.leads IS 'Leads capturados antes do briefing, com rastreamento de etapa';

-- ============================================
-- Colunas progress_data + resume_token + RPCs
-- ============================================

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS progress_data JSONB,
  ADD COLUMN IF NOT EXISTS resume_token VARCHAR(64);

UPDATE public.leads
SET resume_token = encode(gen_random_bytes(24), 'hex')
WHERE resume_token IS NULL;

ALTER TABLE public.leads
  ALTER COLUMN resume_token SET NOT NULL,
  ALTER COLUMN resume_token SET DEFAULT encode(gen_random_bytes(24), 'hex');

CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_resume_token ON public.leads(resume_token);

CREATE OR REPLACE FUNCTION public.get_lead_by_resume_token(token_input text)
RETURNS SETOF public.leads
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.leads
  WHERE resume_token = token_input
    AND user_id IS NULL
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.update_lead_funnel_by_token(
  token_input text,
  p_progress jsonb DEFAULT NULL,
  p_status text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.leads
  SET
    progress_data = COALESCE(p_progress, progress_data),
    status = COALESCE(p_status, status),
    updated_at = now()
  WHERE resume_token = token_input
    AND user_id IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.get_lead_by_resume_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_lead_funnel_by_token(text, jsonb, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_lead_by_resume_token(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_lead_funnel_by_token(text, jsonb, text) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Users can update own leads" ON public.leads;
CREATE POLICY "Users can update own leads"
  ON public.leads FOR UPDATE
  USING (
    auth.role() = 'service_role'
    OR (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL))
  );

COMMENT ON COLUMN public.leads.progress_data IS 'Snapshot do wizard (JSON); evitar base64 em URLs de foto';
COMMENT ON COLUMN public.leads.resume_token IS 'Segredo opaco para retomar o funil sem login; nunca expor em URLs partilháveis';
