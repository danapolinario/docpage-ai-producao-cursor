-- ============================================
-- Verificar se Meta Tags Foram Corrigidas
-- ============================================
-- Execute esta query para verificar se as meta tags
-- foram corrigidas após executar os scripts de atualização

-- Verificar meta_title
SELECT 
  'meta_title' as campo,
  CASE 
    WHEN meta_title IS NULL THEN 'NULL'
    WHEN meta_title ILIKE '%DocPage AI%' THEN '❌ GENÉRICO (DocPage AI)'
    WHEN meta_title ILIKE '%Crie Site Profissional%' THEN '❌ GENÉRICO (Crie Site)'
    WHEN meta_title ILIKE '%SEO Otimizado%' THEN '❌ GENÉRICO (SEO Otimizado)'
    WHEN briefing_data->>'name' IS NOT NULL 
      AND meta_title LIKE '%' || (briefing_data->>'name') || '%' THEN '✅ CORRETO (tem nome do médico)'
    ELSE '⚠️ VERIFICAR (pode estar genérico)'
  END as status,
  COUNT(*) as quantidade
FROM landing_pages
GROUP BY 
  CASE 
    WHEN meta_title IS NULL THEN 'NULL'
    WHEN meta_title ILIKE '%DocPage AI%' THEN '❌ GENÉRICO (DocPage AI)'
    WHEN meta_title ILIKE '%Crie Site Profissional%' THEN '❌ GENÉRICO (Crie Site)'
    WHEN meta_title ILIKE '%SEO Otimizado%' THEN '❌ GENÉRICO (SEO Otimizado)'
    WHEN briefing_data->>'name' IS NOT NULL 
      AND meta_title LIKE '%' || (briefing_data->>'name') || '%' THEN '✅ CORRETO (tem nome do médico)'
    ELSE '⚠️ VERIFICAR (pode estar genérico)'
  END

UNION ALL

-- Verificar meta_description
SELECT 
  'meta_description' as campo,
  CASE 
    WHEN meta_description IS NULL THEN 'NULL'
    WHEN meta_description ILIKE '%Crie seu site profissional para médicos%' THEN '❌ GENÉRICO (Crie seu site)'
    WHEN meta_description ILIKE '%com IA%' THEN '❌ GENÉRICO (com IA)'
    WHEN meta_description ILIKE '%Teste grátis%' THEN '❌ GENÉRICO (Teste grátis)'
    WHEN briefing_data->>'name' IS NOT NULL 
      AND meta_description LIKE '%' || (briefing_data->>'name') || '%' THEN '✅ CORRETO (tem nome do médico)'
    ELSE '⚠️ VERIFICAR (pode estar genérico)'
  END as status,
  COUNT(*) as quantidade
FROM landing_pages
GROUP BY 
  CASE 
    WHEN meta_description IS NULL THEN 'NULL'
    WHEN meta_description ILIKE '%Crie seu site profissional para médicos%' THEN '❌ GENÉRICO (Crie seu site)'
    WHEN meta_description ILIKE '%com IA%' THEN '❌ GENÉRICO (com IA)'
    WHEN meta_description ILIKE '%Teste grátis%' THEN '❌ GENÉRICO (Teste grátis)'
    WHEN briefing_data->>'name' IS NOT NULL 
      AND meta_description LIKE '%' || (briefing_data->>'name') || '%' THEN '✅ CORRETO (tem nome do médico)'
    ELSE '⚠️ VERIFICAR (pode estar genérico)'
  END

UNION ALL

-- Verificar og_image_url
SELECT 
  'og_image_url' as campo,
  CASE 
    WHEN og_image_url IS NULL THEN 'NULL'
    WHEN og_image_url ILIKE '%og-default.png%' THEN '❌ GENÉRICO (og-default.png)'
    WHEN og_image_url ILIKE '%about_photo%' OR og_image_url ILIKE '%photo%' THEN '✅ CORRETO (foto do médico)'
    ELSE '✅ CORRETO (URL customizada)'
  END as status,
  COUNT(*) as quantidade
FROM landing_pages
GROUP BY 
  CASE 
    WHEN og_image_url IS NULL THEN 'NULL'
    WHEN og_image_url ILIKE '%og-default.png%' THEN '❌ GENÉRICO (og-default.png)'
    WHEN og_image_url ILIKE '%about_photo%' OR og_image_url ILIKE '%photo%' THEN '✅ CORRETO (foto do médico)'
    ELSE '✅ CORRETO (URL customizada)'
  END

ORDER BY campo, status;

-- Listar landing pages específicas que ainda têm valores genéricos
SELECT 
  subdomain,
  briefing_data->>'name' as nome_medico,
  CASE 
    WHEN meta_title ILIKE '%DocPage AI%' OR meta_title ILIKE '%Crie Site Profissional%' THEN '❌ meta_title genérico'
    WHEN meta_description ILIKE '%Crie seu site profissional%' OR meta_description ILIKE '%com IA%' THEN '❌ meta_description genérica'
    WHEN og_image_url ILIKE '%og-default.png%' THEN '❌ og_image_url genérico'
    ELSE 'OK'
  END as problema,
  meta_title as meta_title_atual,
  LEFT(meta_description, 100) as meta_description_preview,
  og_image_url as og_image_url_atual
FROM landing_pages
WHERE (
  (meta_title IS NOT NULL AND (meta_title ILIKE '%DocPage AI%' OR meta_title ILIKE '%Crie Site Profissional%'))
  OR (meta_description IS NOT NULL AND (meta_description ILIKE '%Crie seu site profissional%' OR meta_description ILIKE '%com IA%'))
  OR (og_image_url IS NOT NULL AND og_image_url ILIKE '%og-default.png%')
)
ORDER BY created_at DESC
LIMIT 20;
