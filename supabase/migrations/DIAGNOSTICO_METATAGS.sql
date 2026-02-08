-- ============================================
-- Diagnóstico: Verificar Landing Pages para Atualização de Metatags
-- ============================================
-- Execute esta query ANTES de executar a migração para entender
-- quais landing pages serão atualizadas

-- 1. Estatísticas gerais
SELECT 
  COUNT(*) as total_landing_pages,
  COUNT(CASE WHEN briefing_data IS NOT NULL THEN 1 END) as com_briefing_data,
  COUNT(CASE WHEN briefing_data::text != '{}' THEN 1 END) as briefing_nao_vazio,
  COUNT(CASE 
    WHEN briefing_data->>'name' IS NOT NULL 
     AND briefing_data->>'name' != ''
    THEN 1 
  END) as com_nome,
  COUNT(CASE 
    WHEN briefing_data->>'specialty' IS NOT NULL 
     AND briefing_data->>'specialty' != ''
    THEN 1 
  END) as com_especialidade,
  COUNT(CASE 
    WHEN briefing_data->>'crm' IS NOT NULL 
     AND briefing_data->>'crm' != ''
    THEN 1 
  END) as com_crm,
  COUNT(CASE 
    WHEN briefing_data->>'crmState' IS NOT NULL 
     AND briefing_data->>'crmState' != ''
    THEN 1 
  END) as com_estado,
  COUNT(CASE 
    WHEN briefing_data IS NOT NULL
     AND briefing_data::text != '{}'
     AND briefing_data->>'name' IS NOT NULL 
     AND briefing_data->>'name' != ''
     AND briefing_data->>'specialty' IS NOT NULL
     AND briefing_data->>'specialty' != ''
     AND briefing_data->>'crm' IS NOT NULL
     AND briefing_data->>'crm' != ''
     AND briefing_data->>'crmState' IS NOT NULL
     AND briefing_data->>'crmState' != ''
    THEN 1 
  END) as com_dados_completos
FROM public.landing_pages;

-- 2. Ver exemplos de landing pages que SERÃO atualizadas
SELECT 
  id,
  subdomain,
  briefing_data->>'name' as nome,
  briefing_data->>'specialty' as especialidade,
  briefing_data->>'crm' as crm,
  briefing_data->>'crmState' as estado,
  meta_title as meta_title_atual,
  LEFT(meta_description, 60) as meta_desc_atual,
  updated_at
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
  AND briefing_data->>'crmState' != ''
ORDER BY updated_at DESC
LIMIT 10;

-- 3. Ver landing pages que NÃO serão atualizadas (para entender o problema)
SELECT 
  id,
  subdomain,
  CASE 
    WHEN briefing_data IS NULL THEN 'briefing_data é NULL'
    WHEN briefing_data::text = '{}' THEN 'briefing_data está vazio'
    WHEN briefing_data->>'name' IS NULL OR briefing_data->>'name' = '' THEN 'nome faltando'
    WHEN briefing_data->>'specialty' IS NULL OR briefing_data->>'specialty' = '' THEN 'especialidade faltando'
    WHEN briefing_data->>'crm' IS NULL OR briefing_data->>'crm' = '' THEN 'crm faltando'
    WHEN briefing_data->>'crmState' IS NULL OR briefing_data->>'crmState' = '' THEN 'estado faltando'
    ELSE 'outro problema'
  END as motivo,
  briefing_data->>'name' as nome,
  briefing_data->>'specialty' as especialidade,
  briefing_data->>'crm' as crm,
  briefing_data->>'crmState' as estado
FROM public.landing_pages
WHERE NOT (
  briefing_data IS NOT NULL
  AND briefing_data::text != '{}'
  AND briefing_data->>'name' IS NOT NULL
  AND briefing_data->>'name' != ''
  AND briefing_data->>'specialty' IS NOT NULL
  AND briefing_data->>'specialty' != ''
  AND briefing_data->>'crm' IS NOT NULL
  AND briefing_data->>'crm' != ''
  AND briefing_data->>'crmState' IS NOT NULL
  AND briefing_data->>'crmState' != ''
)
LIMIT 10;
