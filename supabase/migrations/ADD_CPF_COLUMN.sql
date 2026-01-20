-- Adicionar coluna CPF à tabela landing_pages
-- Execute este SQL no SQL Editor do Supabase se a coluna não existir

ALTER TABLE public.landing_pages 
ADD COLUMN IF NOT EXISTS cpf VARCHAR(14);

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.landing_pages.cpf IS 'CPF do titular para registro do domínio (somente números, 11 dígitos)';
