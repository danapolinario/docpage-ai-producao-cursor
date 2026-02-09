-- ============================================
-- Verificar Status de SEO - Versão Simples
-- ============================================
-- Execute esta query para ver um resumo rápido

SELECT 
  'Total de landing pages' as metric,
  COUNT(*)::text as count
FROM landing_pages
UNION ALL
SELECT 
  'Com meta_title',
  COUNT(*)::text
FROM landing_pages
WHERE meta_title IS NOT NULL
UNION ALL
SELECT 
  'Com meta_description',
  COUNT(*)::text
FROM landing_pages
WHERE meta_description IS NOT NULL
UNION ALL
SELECT 
  'Com meta_keywords',
  COUNT(*)::text
FROM landing_pages
WHERE meta_keywords IS NOT NULL
UNION ALL
SELECT 
  'Com og_image_url',
  COUNT(*)::text
FROM landing_pages
WHERE og_image_url IS NOT NULL
UNION ALL
SELECT 
  'SEM meta_title',
  COUNT(*)::text
FROM landing_pages
WHERE meta_title IS NULL
UNION ALL
SELECT 
  'SEM meta_description',
  COUNT(*)::text
FROM landing_pages
WHERE meta_description IS NULL
UNION ALL
SELECT 
  'SEM meta_keywords',
  COUNT(*)::text
FROM landing_pages
WHERE meta_keywords IS NULL
UNION ALL
SELECT 
  'SEM og_image_url',
  COUNT(*)::text
FROM landing_pages
WHERE og_image_url IS NULL
ORDER BY metric;
