-- ============================================
-- Script para gerar HTML estático para todas as landing pages publicadas
-- ============================================
-- Este script lista todas as landing pages publicadas e fornece
-- os IDs para você chamar manualmente a Edge Function generate-static-html
--
-- INSTRUÇÕES:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Copie os IDs das landing pages retornadas
-- 3. Para cada ID, chame a Edge Function generate-static-html via:
--    - Supabase Dashboard > Edge Functions > generate-static-html > Invoke
--    - Ou via HTTP POST (veja exemplo abaixo)
--
-- Exemplo de chamada HTTP para cada landing page:
-- curl -X POST https://SEU_PROJETO.supabase.co/functions/v1/generate-static-html \
--   -H "Authorization: Bearer SUA_SERVICE_ROLE_KEY" \
--   -H "Content-Type: application/json" \
--   -d '{"landingPageId": "UUID_AQUI"}'

-- Listar todas as landing pages publicadas
SELECT 
  id,
  subdomain,
  status,
  meta_title,
  briefing_data->>'name' as doctor_name,
  briefing_data->>'specialty' as specialty,
  created_at,
  published_at
FROM landing_pages
WHERE status = 'published'
ORDER BY published_at DESC NULLS LAST, created_at DESC;

-- Contagem total
SELECT 
  COUNT(*) as total_published,
  COUNT(CASE WHEN published_at IS NOT NULL THEN 1 END) as with_published_date
FROM landing_pages
WHERE status = 'published';

-- ============================================
-- ALTERNATIVA: Usar pg_net para chamar Edge Function automaticamente
-- ============================================
-- NOTA: Isso requer a extensão pg_net habilitada
-- Execute apenas se pg_net estiver disponível no seu projeto
--
-- Descomente o código abaixo se quiser tentar chamar automaticamente:

/*
DO $$
DECLARE
  landing_page_record RECORD;
  function_url TEXT;
  service_key TEXT;
  response_status INT;
  response_body TEXT;
BEGIN
  -- Configurar URL da função e service key
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/generate-static-html';
  service_key := current_setting('app.settings.service_role_key', true);
  
  -- Se não estiver configurado, usar valores padrão (ajuste conforme necessário)
  IF function_url IS NULL OR function_url = '/functions/v1/generate-static-html' THEN
    function_url := 'https://SEU_PROJETO.supabase.co/functions/v1/generate-static-html';
  END IF;
  
  -- Iterar sobre todas as landing pages publicadas
  FOR landing_page_record IN 
    SELECT id, subdomain 
    FROM landing_pages 
    WHERE status = 'published'
  LOOP
    RAISE NOTICE 'Gerando HTML estático para: % (ID: %)', 
      landing_page_record.subdomain, 
      landing_page_record.id;
    
    -- Chamar Edge Function via pg_net (se disponível)
    -- NOTA: Isso requer configuração adicional
    -- Por enquanto, apenas logar o que seria feito
    
    RAISE NOTICE 'Para gerar, execute: curl -X POST % -H "Authorization: Bearer SERVICE_KEY" -H "Content-Type: application/json" -d ''{"landingPageId": "%"}''',
      function_url,
      landing_page_record.id;
  END LOOP;
END $$;
*/
