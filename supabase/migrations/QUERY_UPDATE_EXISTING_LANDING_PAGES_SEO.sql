-- ============================================
-- Atualizar Landing Pages Existentes com SEO
-- ============================================
-- Este script popula campos SEO faltantes nas landing pages existentes
-- com valores baseados nos dados já existentes (briefing_data, content_data, etc.)

-- 1. Atualizar meta_title se estiver NULL
-- Usa: nome + especialidade + CRM
UPDATE landing_pages
SET meta_title = CONCAT(
  (briefing_data->>'name'),
  ' - ',
  (briefing_data->>'specialty'),
  ' | CRM ',
  (briefing_data->>'crm'),
  '/',
  (briefing_data->>'crmState')
)
WHERE meta_title IS NULL
  AND briefing_data->>'name' IS NOT NULL
  AND briefing_data->>'specialty' IS NOT NULL
  AND briefing_data->>'crm' IS NOT NULL
  AND briefing_data->>'crmState' IS NOT NULL;

-- 2. Atualizar meta_description se estiver NULL
-- Usa: subheadline do content_data ou gera descrição padrão
UPDATE landing_pages
SET meta_description = COALESCE(
  NULLIF(content_data->>'subheadline', ''),
  CONCAT(
    'Dr(a). ',
    (briefing_data->>'name'),
    ', ',
    (briefing_data->>'specialty'),
    ' - CRM ',
    (briefing_data->>'crm'),
    '/',
    (briefing_data->>'crmState'),
    '. ',
    (briefing_data->>'crmState'),
    '. Agende sua consulta online.'
  )
)
WHERE meta_description IS NULL
  AND briefing_data->>'name' IS NOT NULL
  AND briefing_data->>'specialty' IS NOT NULL
  AND briefing_data->>'crm' IS NOT NULL
  AND briefing_data->>'crmState' IS NOT NULL;

-- 3. Atualizar meta_keywords se estiver NULL
-- Gera keywords baseadas em nome, especialidade, CRM, estado e serviços
UPDATE landing_pages
SET meta_keywords = ARRAY[
  briefing_data->>'name',
  briefing_data->>'specialty',
  CONCAT('médico ', briefing_data->>'crmState'),
  CONCAT('CRM ', briefing_data->>'crm'),
  'consulta médica',
  'agendar consulta'
] || 
CASE 
  WHEN briefing_data->>'mainServices' IS NOT NULL 
    AND briefing_data->>'mainServices' != '' 
  THEN string_to_array(
    regexp_replace(briefing_data->>'mainServices', '\s*,\s*', ',', 'g'),
    ','
  )
  ELSE ARRAY[]::text[]
END
WHERE meta_keywords IS NULL
  AND briefing_data->>'name' IS NOT NULL
  AND briefing_data->>'specialty' IS NOT NULL
  AND briefing_data->>'crm' IS NOT NULL
  AND briefing_data->>'crmState' IS NOT NULL;

-- 4. Atualizar og_image_url se estiver NULL
-- Prioridade: about_photo_url > photo_url
-- Se nenhuma foto estiver disponível, deixa NULL (o SSR usará fallback)
UPDATE landing_pages
SET og_image_url = COALESCE(about_photo_url, photo_url)
WHERE og_image_url IS NULL
  AND (about_photo_url IS NOT NULL OR photo_url IS NOT NULL);

-- 5. Verificar e mostrar resumo das atualizações
-- Query para verificar quantas landing pages foram atualizadas
SELECT 
  'Total de landing pages' as metric,
  COUNT(*) as count
FROM landing_pages
UNION ALL
SELECT 
  'Landing pages com meta_title',
  COUNT(*)
FROM landing_pages
WHERE meta_title IS NOT NULL
UNION ALL
SELECT 
  'Landing pages com meta_description',
  COUNT(*)
FROM landing_pages
WHERE meta_description IS NOT NULL
UNION ALL
SELECT 
  'Landing pages com meta_keywords',
  COUNT(*)
FROM landing_pages
WHERE meta_keywords IS NOT NULL
UNION ALL
SELECT 
  'Landing pages com og_image_url',
  COUNT(*)
FROM landing_pages
WHERE og_image_url IS NOT NULL
UNION ALL
SELECT 
  'Landing pages SEM meta_title',
  COUNT(*)
FROM landing_pages
WHERE meta_title IS NULL
UNION ALL
SELECT 
  'Landing pages SEM meta_description',
  COUNT(*)
FROM landing_pages
WHERE meta_description IS NULL
UNION ALL
SELECT 
  'Landing pages SEM meta_keywords',
  COUNT(*)
FROM landing_pages
WHERE meta_keywords IS NULL
UNION ALL
SELECT 
  'Landing pages SEM og_image_url',
  COUNT(*)
FROM landing_pages
WHERE og_image_url IS NULL;

-- 6. Query para listar landing pages que ainda precisam de atenção
-- (aquelas sem dados básicos necessários)
SELECT 
  id,
  subdomain,
  status,
  briefing_data->>'name' as nome,
  briefing_data->>'specialty' as especialidade,
  CASE 
    WHEN meta_title IS NULL THEN '❌'
    ELSE '✅'
  END as tem_meta_title,
  CASE 
    WHEN meta_description IS NULL THEN '❌'
    ELSE '✅'
  END as tem_meta_description,
  CASE 
    WHEN meta_keywords IS NULL THEN '❌'
    ELSE '✅'
  END as tem_meta_keywords,
  CASE 
    WHEN og_image_url IS NULL AND about_photo_url IS NULL AND photo_url IS NULL THEN '❌'
    ELSE '✅'
  END as tem_imagem,
  created_at
FROM landing_pages
WHERE meta_title IS NULL 
   OR meta_description IS NULL 
   OR meta_keywords IS NULL
   OR (og_image_url IS NULL AND about_photo_url IS NULL AND photo_url IS NULL)
ORDER BY created_at DESC;
