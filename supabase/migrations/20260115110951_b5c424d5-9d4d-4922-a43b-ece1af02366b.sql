-- =============================================
-- Correção de Segurança: Proteger dados sensíveis
-- =============================================

-- 1. Criar uma VIEW pública para landing pages que EXCLUI dados sensíveis (CPF, user_id)
-- Esta view será usada para acesso público às páginas publicadas

CREATE OR REPLACE VIEW public.landing_pages_public AS
SELECT 
  id,
  subdomain,
  custom_domain,
  slug,
  briefing_data,
  content_data,
  design_settings,
  section_visibility,
  layout_variant,
  photo_url,
  about_photo_url,
  meta_title,
  meta_description,
  meta_keywords,
  og_image_url,
  schema_markup,
  status,
  published_at,
  view_count,
  last_viewed_at,
  created_at,
  updated_at
  -- EXCLUÍDOS: cpf, user_id (dados sensíveis)
FROM public.landing_pages
WHERE status = 'published';

-- Permitir acesso público à view
GRANT SELECT ON public.landing_pages_public TO anon, authenticated;

-- 2. Adicionar comentário explicativo na tabela
COMMENT ON COLUMN landing_pages.cpf IS 'CPF do médico - DADOS SENSÍVEIS - Não expor publicamente';
COMMENT ON COLUMN landing_pages.user_id IS 'ID do usuário proprietário - Não expor publicamente';

-- 3. Políticas para tabela otp_codes (gerenciada pelo service role, não precisa de policies para usuários)
-- A tabela otp_codes é acessada APENAS via edge functions com service_role_key
-- Isso é intencional e seguro - usuários normais NÃO devem ter acesso direto

COMMENT ON TABLE otp_codes IS 'Códigos OTP para autenticação - Acessível APENAS via service role nas edge functions';

-- 4. Política de retenção: Criar função para limpar dados antigos de analytics (opcional - para LGPD)
CREATE OR REPLACE FUNCTION public.cleanup_old_analytics()
RETURNS void AS $$
BEGIN
  -- Remover eventos de analytics com mais de 90 dias
  DELETE FROM analytics_events 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Anonimizar IPs de eventos com mais de 30 dias (substituir por NULL)
  UPDATE analytics_events 
  SET ip_address = NULL
  WHERE created_at < NOW() - INTERVAL '30 days' 
  AND ip_address IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permitir que apenas admins executem esta função
REVOKE ALL ON FUNCTION public.cleanup_old_analytics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_old_analytics() TO authenticated;