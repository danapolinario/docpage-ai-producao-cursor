-- ============================================
-- Atualizar Metatags SEO - Versão Simples
-- ============================================
-- Esta versão atualiza TODAS as landing pages com dados válidos
-- sem verificar o conteúdo atual dos campos meta_title e meta_description

-- Atualizar todas as landing pages com briefing_data válido
UPDATE public.landing_pages
SET 
  meta_title = CONCAT(
    COALESCE(briefing_data->>'name', ''),
    ' - ',
    COALESCE(briefing_data->>'specialty', ''),
    ' | CRM ',
    COALESCE(briefing_data->>'crm', ''),
    '/',
    COALESCE(briefing_data->>'crmState', '')
  ),
  meta_description = CONCAT(
    'Dr(a). ',
    COALESCE(briefing_data->>'name', ''),
    ', ',
    COALESCE(briefing_data->>'specialty', ''),
    ' - CRM ',
    COALESCE(briefing_data->>'crm', ''),
    '/',
    COALESCE(briefing_data->>'crmState', ''),
    '. ',
    COALESCE(briefing_data->>'crmState', ''),
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

-- Mostrar quantas foram atualizadas
SELECT 
  COUNT(*) as total_atualizadas,
  COUNT(DISTINCT subdomain) as subdomains_unicos
FROM public.landing_pages
WHERE updated_at > NOW() - INTERVAL '1 minute';
