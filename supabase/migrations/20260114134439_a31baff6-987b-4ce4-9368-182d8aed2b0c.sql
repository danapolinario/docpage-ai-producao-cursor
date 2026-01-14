-- Tabela para armazenar códigos OTP
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  code VARCHAR(6) NOT NULL,
  name VARCHAR(100),
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON public.otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON public.otp_codes(expires_at);

-- Trigger para updated_at
CREATE TRIGGER update_otp_codes_updated_at 
  BEFORE UPDATE ON public.otp_codes 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Políticas: Apenas edge functions com service_role podem acessar
-- Nenhuma política para anon/authenticated = acesso negado por padrão
-- O edge function usa service_role que bypassa RLS