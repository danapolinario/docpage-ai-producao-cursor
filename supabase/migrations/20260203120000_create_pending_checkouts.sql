-- ============================================
-- Tabela de Pending Checkouts
-- ============================================
-- Armazena dados completos da landing page antes do checkout
-- para evitar truncamento na metadata do Stripe (limite de 500 chars)

CREATE TABLE IF NOT EXISTS public.pending_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_session_id VARCHAR(255) UNIQUE,
  
  -- Dados completos da landing page (sem truncamento)
  landing_page_data JSONB NOT NULL,
  
  -- Dados básicos para referência rápida
  domain VARCHAR(255) NOT NULL,
  has_custom_domain BOOLEAN DEFAULT FALSE,
  custom_domain VARCHAR(255),
  cpf VARCHAR(20),
  
  -- Status
  processed BOOLEAN DEFAULT FALSE,
  landing_page_id UUID REFERENCES public.landing_pages(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours') NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pending_checkouts_user_id ON public.pending_checkouts(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_checkouts_stripe_session_id ON public.pending_checkouts(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_pending_checkouts_processed ON public.pending_checkouts(processed);
CREATE INDEX IF NOT EXISTS idx_pending_checkouts_expires_at ON public.pending_checkouts(expires_at);

-- Habilitar RLS
ALTER TABLE public.pending_checkouts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Usuários só podem ver seus próprios pending checkouts
CREATE POLICY "Users can view own pending checkouts"
  ON public.pending_checkouts FOR SELECT
  USING (auth.uid() = user_id);

-- Service role pode fazer tudo (para webhook)
CREATE POLICY "Service role can manage all pending checkouts"
  ON public.pending_checkouts FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comentários
COMMENT ON TABLE public.pending_checkouts IS 'Armazena dados completos da landing page antes do checkout do Stripe';
COMMENT ON COLUMN public.pending_checkouts.stripe_session_id IS 'ID da sessão do Stripe Checkout';
COMMENT ON COLUMN public.pending_checkouts.landing_page_data IS 'Dados completos da landing page (JSONB, sem truncamento)';
COMMENT ON COLUMN public.pending_checkouts.processed IS 'Indica se o checkout foi processado e a landing page foi criada';
COMMENT ON COLUMN public.pending_checkouts.expires_at IS 'Data de expiração (24 horas) - dados antigos serão limpos';
