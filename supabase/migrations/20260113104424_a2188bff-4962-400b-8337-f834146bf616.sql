-- Ajustar schema da tabela analytics_events para casar com o código do frontend
ALTER TABLE public.analytics_events
  ALTER COLUMN user_id DROP NOT NULL;

-- Adicionar colunas usadas pelo serviço de analytics, se ainda não existirem
ALTER TABLE public.analytics_events
  ADD COLUMN IF NOT EXISTS event_data jsonb,
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS referrer text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS city text;

-- Remover políticas antigas, se existirem
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'analytics_events' 
      AND policyname = 'Users can insert their own analytics events'
  ) THEN
    DROP POLICY "Users can insert their own analytics events" ON public.analytics_events;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'analytics_events' 
      AND policyname = 'Users can view their own analytics events'
  ) THEN
    DROP POLICY "Users can view their own analytics events" ON public.analytics_events;
  END IF;
END $$;

-- Política de INSERT: permitir que qualquer requisição (anônima ou autenticada) grave eventos
CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events
FOR INSERT
TO public
WITH CHECK (true);

-- Política de SELECT: apenas o dono da landing page pode ver seus eventos
CREATE POLICY "Owners can view analytics events for their landing pages"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.landing_pages lp
    WHERE lp.id = analytics_events.landing_page_id
      AND lp.user_id = auth.uid()
  )
);

-- Garantir que RLS continue habilitado
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;