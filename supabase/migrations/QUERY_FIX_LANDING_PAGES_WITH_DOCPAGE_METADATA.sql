-- ============================================
-- Corrigir Meta Tags Genéricas do DocPage AI
-- ============================================
-- Este script identifica e corrige landing pages que têm meta tags
-- genéricas do DocPage AI ao invés dos dados específicos do médico
--
-- INSTRUÇÕES:
-- 1. Execute primeiro a QUERY 1 para ver quantas landing pages serão afetadas
-- 2. Execute a QUERY 2 para ver detalhes das landing pages afetadas
-- 3. Execute as queries de UPDATE (3, 4, 5, 6) para corrigir
-- 4. Execute a QUERY 7 para verificar o resultado

-- ============================================
-- QUERY 1: Verificar quantas landing pages têm meta tags genéricas
-- ============================================
SELECT 
  'Landing pages com meta_title genérico do DocPage' as metric,
  COUNT(*)::text as count
FROM landing_pages
WHERE meta_title IS NOT NULL
  AND (
    meta_title ILIKE '%DocPage AI%'
    OR meta_title ILIKE '%Crie Site Profissional para Médicos%'
    OR meta_title ILIKE '%SEO Otimizado%'
  )
UNION ALL
SELECT 
  'Landing pages com meta_description genérica do DocPage',
  COUNT(*)::text
FROM landing_pages
WHERE meta_description IS NOT NULL
  AND (
    meta_description ILIKE '%Crie seu site profissional para médicos%'
    OR meta_description ILIKE '%com IA%'
    OR meta_description ILIKE '%Teste grátis%'
  )
UNION ALL
SELECT 
  'Landing pages com og_image_url genérico (og-default.png)',
  COUNT(*)::text
FROM landing_pages
WHERE og_image_url IS NOT NULL
  AND og_image_url ILIKE '%og-default.png%'
ORDER BY metric;

-- ============================================
-- QUERY 2: Listar landing pages com meta tags genéricas
-- ============================================
SELECT 
  id,
  subdomain,
  status,
  briefing_data->>'name' as nome_medico,
  meta_title as meta_title_atual,
  meta_description as meta_description_atual,
  og_image_url as og_image_url_atual,
  created_at::date as criada_em
FROM landing_pages
WHERE (
  (meta_title IS NOT NULL AND (
    meta_title ILIKE '%DocPage AI%'
    OR meta_title ILIKE '%Crie Site Profissional para Médicos%'
  ))
  OR (meta_description IS NOT NULL AND (
    meta_description ILIKE '%Crie seu site profissional para médicos%'
    OR meta_description ILIKE '%com IA%'
  ))
  OR (og_image_url IS NOT NULL AND og_image_url ILIKE '%og-default.png%')
)
ORDER BY created_at DESC;

-- ============================================
-- QUERY 3: Corrigir meta_title genérico
-- ============================================
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
WHERE meta_title IS NOT NULL
  AND (
    meta_title ILIKE '%DocPage AI%'
    OR meta_title ILIKE '%Crie Site Profissional para Médicos%'
    OR meta_title ILIKE '%SEO Otimizado%'
  )
  AND briefing_data->>'name' IS NOT NULL
  AND briefing_data->>'specialty' IS NOT NULL
  AND briefing_data->>'crm' IS NOT NULL
  AND briefing_data->>'crmState' IS NOT NULL;

-- ============================================
-- QUERY 4: Corrigir meta_description genérica
-- ============================================
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
WHERE meta_description IS NOT NULL
  AND (
    meta_description ILIKE '%Crie seu site profissional para médicos%'
    OR meta_description ILIKE '%com IA%'
    OR meta_description ILIKE '%Teste grátis%'
  )
  AND briefing_data->>'name' IS NOT NULL
  AND briefing_data->>'specialty' IS NOT NULL
  AND briefing_data->>'crm' IS NOT NULL
  AND briefing_data->>'crmState' IS NOT NULL;

-- ============================================
-- QUERY 5: Corrigir meta_keywords genéricas
-- ============================================
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
WHERE meta_keywords IS NOT NULL
  AND (
    -- Verificar se contém keywords genéricas do DocPage
    array_to_string(meta_keywords, ', ') ILIKE '%site para médicos%'
    OR array_to_string(meta_keywords, ', ') ILIKE '%marketing médico%'
    OR array_to_string(meta_keywords, ', ') ILIKE '%plataforma para médicos%'
    OR array_to_string(meta_keywords, ', ') ILIKE '%criação de site médico%'
  )
  AND briefing_data->>'name' IS NOT NULL
  AND briefing_data->>'specialty' IS NOT NULL
  AND briefing_data->>'crm' IS NOT NULL
  AND briefing_data->>'crmState' IS NOT NULL;

-- ============================================
-- QUERY 6: Corrigir og_image_url genérico
-- ============================================
-- Substituir og-default.png por foto do médico (se disponível)
UPDATE landing_pages
SET og_image_url = COALESCE(about_photo_url, photo_url)
WHERE og_image_url IS NOT NULL
  AND og_image_url ILIKE '%og-default.png%'
  AND (about_photo_url IS NOT NULL OR photo_url IS NOT NULL);

-- Se não tiver foto, remover og_image_url para usar fallback do SSR
UPDATE landing_pages
SET og_image_url = NULL
WHERE og_image_url IS NOT NULL
  AND og_image_url ILIKE '%og-default.png%'
  AND about_photo_url IS NULL
  AND photo_url IS NULL;

-- ============================================
-- QUERY 7: Verificar resultado após correção
-- ============================================
SELECT 
  'Landing pages corrigidas (meta_title)' as metric,
  COUNT(*)::text as count
FROM landing_pages
WHERE meta_title IS NOT NULL
  AND meta_title NOT ILIKE '%DocPage AI%'
  AND meta_title NOT ILIKE '%Crie Site Profissional para Médicos%'
  AND briefing_data->>'name' IS NOT NULL
UNION ALL
SELECT 
  'Landing pages ainda com meta_title genérico',
  COUNT(*)::text
FROM landing_pages
WHERE meta_title IS NOT NULL
  AND (
    meta_title ILIKE '%DocPage AI%'
    OR meta_title ILIKE '%Crie Site Profissional para Médicos%'
  )
UNION ALL
SELECT 
  'Landing pages corrigidas (meta_description)',
  COUNT(*)::text
FROM landing_pages
WHERE meta_description IS NOT NULL
  AND meta_description NOT ILIKE '%Crie seu site profissional para médicos%'
  AND meta_description NOT ILIKE '%com IA%'
  AND briefing_data->>'name' IS NOT NULL
UNION ALL
SELECT 
  'Landing pages ainda com meta_description genérica',
  COUNT(*)::text
FROM landing_pages
WHERE meta_description IS NOT NULL
  AND (
    meta_description ILIKE '%Crie seu site profissional para médicos%'
    OR meta_description ILIKE '%com IA%'
  )
UNION ALL
SELECT 
  'Landing pages corrigidas (og_image_url)',
  COUNT(*)::text
FROM landing_pages
WHERE (og_image_url IS NULL OR og_image_url NOT ILIKE '%og-default.png%')
  AND (about_photo_url IS NOT NULL OR photo_url IS NOT NULL)
UNION ALL
SELECT 
  'Landing pages ainda com og_image_url genérico',
  COUNT(*)::text
FROM landing_pages
WHERE og_image_url IS NOT NULL
  AND og_image_url ILIKE '%og-default.png%'
ORDER BY metric;
