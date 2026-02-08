-- ============================================
-- Atualizar Metatags SEO das Landing Pages Existentes
-- ============================================
-- Esta migração atualiza os campos meta_title e meta_description
-- das landing pages existentes para usar o novo formato otimizado
-- que não referencia mais "DocPage AI" nas metatags

-- Primeiro, vamos ver quantas landing pages serão afetadas
DO $$
DECLARE
  total_count INTEGER;
  valid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM public.landing_pages;
  SELECT COUNT(*) INTO valid_count 
  FROM public.landing_pages
  WHERE briefing_data IS NOT NULL
    AND briefing_data::text != '{}'
    AND briefing_data->>'name' IS NOT NULL
    AND briefing_data->>'name' != ''
    AND briefing_data->>'specialty' IS NOT NULL
    AND briefing_data->>'specialty' != ''
    AND briefing_data->>'crm' IS NOT NULL
    AND briefing_data->>'crm' != ''
    AND briefing_data->>'crmState' IS NOT NULL
    AND briefing_data->>'crmState' != '';
  
  RAISE NOTICE 'Total de landing pages: %', total_count;
  RAISE NOTICE 'Landing pages com dados válidos: %', valid_count;
END $$;

-- Atualizar meta_title e meta_description para TODAS as landing pages com dados válidos
UPDATE public.landing_pages
SET 
  meta_title = CONCAT(
    (briefing_data->>'name')::text,
    ' - ',
    (briefing_data->>'specialty')::text,
    ' | CRM ',
    (briefing_data->>'crm')::text,
    '/',
    (briefing_data->>'crmState')::text
  ),
  meta_description = CONCAT(
    'Dr(a). ',
    (briefing_data->>'name')::text,
    ', ',
    (briefing_data->>'specialty')::text,
    ' - CRM ',
    (briefing_data->>'crm')::text,
    '/',
    (briefing_data->>'crmState')::text,
    '. ',
    (briefing_data->>'crmState')::text,
    '. Agende sua consulta online.'
  ),
  updated_at = NOW()
WHERE 
  briefing_data IS NOT NULL
  AND briefing_data::text != '{}'
  AND briefing_data->>'name' IS NOT NULL
  AND briefing_data->>'name' != ''
  AND briefing_data->>'specialty' IS NOT NULL
  AND briefing_data->>'specialty' != ''
  AND briefing_data->>'crm' IS NOT NULL
  AND briefing_data->>'crm' != ''
  AND briefing_data->>'crmState' IS NOT NULL
  AND briefing_data->>'crmState' != '';

-- Verificar quantas foram atualizadas
SELECT 
  COUNT(*) as total_atualizadas
FROM public.landing_pages
WHERE updated_at > NOW() - INTERVAL '1 minute';

-- Verificar resultado (opcional - descomente para ver)
-- SELECT 
--   subdomain,
--   meta_title,
--   LEFT(meta_description, 50) as meta_desc_preview,
--   updated_at
-- FROM public.landing_pages
-- WHERE updated_at > NOW() - INTERVAL '5 minutes'
-- ORDER BY updated_at DESC
-- LIMIT 10;
