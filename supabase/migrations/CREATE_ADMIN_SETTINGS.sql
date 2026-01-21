-- ============================================
-- Tabela de Configurações Admin
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Inserir configuração inicial de publicação automática
INSERT INTO public.admin_settings (key, value, description)
VALUES (
  'auto_publish_enabled',
  to_jsonb(false),
  'Habilita publicação automática de landing pages criadas pelos usuários'
)
ON CONFLICT (key) DO NOTHING;

-- RLS: Apenas admins podem inserir e atualizar, mas qualquer usuário autenticado pode ler
-- (Configurações não são sensíveis e precisam ser lidas por usuários normais)
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Qualquer usuário autenticado pode ler (necessário para verificar publicação automática)
CREATE POLICY "Authenticated users can read admin settings"
ON public.admin_settings
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Policy: Apenas admins podem inserir
CREATE POLICY "Admins can insert admin settings"
ON public.admin_settings
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Policy: Apenas admins podem atualizar
CREATE POLICY "Admins can update admin settings"
ON public.admin_settings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON public.admin_settings(key);
