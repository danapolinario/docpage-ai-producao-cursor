-- ============================================
-- Verificar Status de SEO das Landing Pages
-- ============================================
-- Este script verifica quais landing pages têm campos SEO preenchidos
-- e quais precisam de atualização
--
-- INSTRUÇÕES:
-- Execute cada query separadamente no Supabase SQL Editor
-- ou execute todas de uma vez (elas são independentes)

-- ============================================
-- QUERY 1: Resumo geral de SEO
-- ============================================
SELECT 
  'Total de landing pages' as metric,
  COUNT(*)::text as count
FROM landing_pages
UNION ALL
SELECT 
  'Landing pages com meta_title',
  COUNT(*)::text
FROM landing_pages
WHERE meta_title IS NOT NULL
UNION ALL
SELECT 
  'Landing pages com meta_description',
  COUNT(*)::text
FROM landing_pages
WHERE meta_description IS NOT NULL
UNION ALL
SELECT 
  'Landing pages com meta_keywords',
  COUNT(*)::text
FROM landing_pages
WHERE meta_keywords IS NOT NULL
UNION ALL
SELECT 
  'Landing pages com og_image_url',
  COUNT(*)::text
FROM landing_pages
WHERE og_image_url IS NOT NULL
UNION ALL
SELECT 
  'Landing pages com photo_url',
  COUNT(*)::text
FROM landing_pages
WHERE photo_url IS NOT NULL
UNION ALL
SELECT 
  'Landing pages com about_photo_url',
  COUNT(*)::text
FROM landing_pages
WHERE about_photo_url IS NOT NULL
ORDER BY metric;

-- ============================================
-- QUERY 2: Detalhes por landing page (últimas 50)
-- ============================================
SELECT 
  id,
  subdomain,
  status,
  briefing_data->>'name' as nome_medico,
  briefing_data->>'specialty' as especialidade,
  CASE 
    WHEN meta_title IS NOT NULL THEN '✅'
    ELSE '❌'
  END as meta_title,
  CASE 
    WHEN meta_description IS NOT NULL THEN '✅'
    ELSE '❌'
  END as meta_description,
  CASE 
    WHEN meta_keywords IS NOT NULL THEN '✅'
    ELSE '❌'
  END as meta_keywords,
  CASE 
    WHEN og_image_url IS NOT NULL THEN '✅ (custom)'
    WHEN about_photo_url IS NOT NULL THEN '✅ (about)'
    WHEN photo_url IS NOT NULL THEN '✅ (photo)'
    ELSE '❌'
  END as imagem_og,
  created_at::date as criada_em
FROM landing_pages
ORDER BY created_at DESC
LIMIT 50;

-- ============================================
-- QUERY 3: Landing pages que precisam de atenção
-- (sem campos SEO)
-- ============================================
SELECT 
  id,
  subdomain,
  status,
  briefing_data->>'name' as nome_medico,
  briefing_data->>'specialty' as especialidade,
  created_at::date as criada_em,
  CASE 
    WHEN meta_title IS NULL THEN 'Falta meta_title'
    WHEN meta_description IS NULL THEN 'Falta meta_description'
    WHEN meta_keywords IS NULL THEN 'Falta meta_keywords'
    WHEN og_image_url IS NULL AND about_photo_url IS NULL AND photo_url IS NULL THEN 'Falta imagem'
    ELSE 'OK'
  END as problema
FROM landing_pages
WHERE meta_title IS NULL 
   OR meta_description IS NULL 
   OR meta_keywords IS NULL
   OR (og_image_url IS NULL AND about_photo_url IS NULL AND photo_url IS NULL)
ORDER BY created_at DESC;
