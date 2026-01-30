-- =============================================
-- Correção de Segurança: Políticas RLS para otp_codes
-- =============================================
-- 
-- A tabela otp_codes é acessada APENAS via Edge Functions usando service_role_key
-- Service role bypassa RLS automaticamente, então o funcionamento atual está correto
-- 
-- Esta migration adiciona políticas RLS explícitas que negam acesso para usuários normais,
-- resolvendo o aviso do Security Advisor sem quebrar o funcionamento atual

-- Garantir que RLS está habilitado
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem (idempotente)
DROP POLICY IF EXISTS "Deny all access to anon users" ON public.otp_codes;
DROP POLICY IF EXISTS "Deny all access to authenticated users" ON public.otp_codes;

-- Política 1: Negar acesso para usuários anônimos
-- Service role (usado pelas Edge Functions) bypassa RLS, então continua funcionando
CREATE POLICY "Deny all access to anon users"
ON public.otp_codes
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Política 2: Negar acesso para usuários autenticados
-- Service role (usado pelas Edge Functions) bypassa RLS, então continua funcionando
CREATE POLICY "Deny all access to authenticated users"
ON public.otp_codes
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Comentário explicativo
COMMENT ON TABLE public.otp_codes IS 
'Códigos OTP para autenticação - Acessível APENAS via Edge Functions usando service_role_key. 
Políticas RLS negam acesso para anon/authenticated. Service role bypassa RLS automaticamente.';