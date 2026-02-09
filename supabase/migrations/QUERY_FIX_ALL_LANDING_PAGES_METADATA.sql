-- ============================================
-- Corrigir TODAS as Meta Tags das Landing Pages
-- ============================================
-- Este script força a atualização de TODAS as meta tags
-- substituindo valores genéricos ou NULL pelos dados corretos do médico
--
-- ATENÇÃO: Esta query atualiza TODAS as landing pages que têm dados básicos
-- (nome, especialidade, CRM). Execute com cuidado!

-- ============================================
-- 1. Atualizar meta_title para TODAS as landing pages
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
WHERE briefing_data->>'name' IS NOT NULL
  AND briefing_data->>'specialty' IS NOT NULL
  AND briefing_data->>'crm' IS NOT NULL
  AND briefing_data->>'crmState' IS NOT NULL
  AND (
    meta_title IS NULL
    OR meta_title ILIKE '%DocPage AI%'
    OR meta_title ILIKE '%Crie Site Profissional para Médicos%'
    OR meta_title ILIKE '%SEO Otimizado%'
  );

-- ============================================
-- 2. Atualizar meta_description para TODAS as landing pages
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
WHERE briefing_data->>'name' IS NOT NULL
  AND briefing_data->>'specialty' IS NOT NULL
  AND briefing_data->>'crm' IS NOT NULL
  AND briefing_data->>'crmState' IS NOT NULL
  AND (
    meta_description IS NULL
    OR meta_description ILIKE '%Crie seu site profissional para médicos%'
    OR meta_description ILIKE '%com IA%'
    OR meta_description ILIKE '%Teste grátis%'
  );

-- ============================================
-- 3. Atualizar meta_keywords para TODAS as landing pages
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
WHERE briefing_data->>'name' IS NOT NULL
  AND briefing_data->>'specialty' IS NOT NULL
  AND briefing_data->>'crm' IS NOT NULL
  AND briefing_data->>'crmState' IS NOT NULL
  AND (
    meta_keywords IS NULL
    OR array_to_string(meta_keywords, ', ') ILIKE '%site para médicos%'
    OR array_to_string(meta_keywords, ', ') ILIKE '%marketing médico%'
    OR array_to_string(meta_keywords, ', ') ILIKE '%plataforma para médicos%'
    OR array_to_string(meta_keywords, ', ') ILIKE '%criação de site médico%'
  );

-- ============================================
-- 4. Atualizar og_image_url para TODAS as landing pages
-- ============================================
-- Prioridade: about_photo_url > photo_url
-- Se não tiver foto, deixa NULL (SSR usará fallback)
UPDATE landing_pages
SET og_image_url = COALESCE(about_photo_url, photo_url)
WHERE (about_photo_url IS NOT NULL OR photo_url IS NOT NULL)
  AND (
    og_image_url IS NULL
    OR og_image_url ILIKE '%og-default.png%'
  );

-- Remover og_image_url genérico se não tiver foto
UPDATE landing_pages
SET og_image_url = NULL
WHERE og_image_url IS NOT NULL
  AND og_image_url ILIKE '%og-default.png%'
  AND about_photo_url IS NULL
  AND photo_url IS NULL;

-- ============================================
-- 5. Resumo final
-- ============================================
SELECT 
  'Total de landing pages atualizadas' as resultado,
  COUNT(*)::text as count
FROM landing_pages
WHERE briefing_data->>'name' IS NOT NULL
  AND briefing_data->>'specialty' IS NOT NULL
  AND briefing_data->>'crm' IS NOT NULL
  AND briefing_data->>'crmState' IS NOT NULL;
