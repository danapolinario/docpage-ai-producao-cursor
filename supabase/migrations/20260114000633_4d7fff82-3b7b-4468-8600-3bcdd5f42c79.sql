-- Adicionar campo CPF na tabela landing_pages
ALTER TABLE public.landing_pages 
ADD COLUMN IF NOT EXISTS cpf TEXT;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.landing_pages.cpf IS 'CPF do titular para registro do domínio (somente números, 11 dígitos)';