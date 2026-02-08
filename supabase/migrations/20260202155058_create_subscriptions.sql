-- ============================================
-- Tabela de Subscriptions (Stripe)
-- ============================================
-- Armazena informações sobre assinaturas do Stripe

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  landing_page_id UUID REFERENCES public.landing_pages(id) ON DELETE SET NULL,
  
  -- IDs do Stripe
  stripe_customer_id VARCHAR(255) NOT NULL,
  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_price_id VARCHAR(255) NOT NULL,
  
  -- Informações do plano
  plan_id VARCHAR(50) NOT NULL CHECK (plan_id IN ('starter', 'pro')),
  billing_period VARCHAR(20) NOT NULL CHECK (billing_period IN ('monthly', 'annual')),
  
  -- Status da assinatura
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
  
  -- Períodos
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  
  -- Cupom aplicado (se houver)
  coupon_id VARCHAR(255),
  coupon_name VARCHAR(255),
  
  -- Metadata adicional (JSONB para flexibilidade)
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_landing_page_id ON public.subscriptions(landing_page_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON public.subscriptions(plan_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON public.subscriptions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Usuários só podem ver suas próprias subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Comentários
COMMENT ON TABLE public.subscriptions IS 'Armazena informações sobre assinaturas do Stripe';
COMMENT ON COLUMN public.subscriptions.stripe_customer_id IS 'ID do cliente no Stripe';
COMMENT ON COLUMN public.subscriptions.stripe_subscription_id IS 'ID da assinatura no Stripe';
COMMENT ON COLUMN public.subscriptions.stripe_price_id IS 'ID do preço (Price) no Stripe';
COMMENT ON COLUMN public.subscriptions.plan_id IS 'ID do plano (starter ou pro)';
COMMENT ON COLUMN public.subscriptions.billing_period IS 'Período de cobrança (monthly ou annual)';
COMMENT ON COLUMN public.subscriptions.status IS 'Status da assinatura (active, canceled, past_due, etc.)';
