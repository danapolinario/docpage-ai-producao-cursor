-- ============================================
-- Query para visualizar variáveis de domínio e subdomínio das landing pages
-- ============================================
-- Esta query mostra de forma qualitativa quais variáveis cada landing page possui:
-- - subdomain: subdomínio usado em docpage.com.br (sem extensão)
-- - custom_domain: domínio próprio já existente informado pelo usuário
-- - chosen_domain: domínio completo escolhido pelo usuário (com extensão, ex: "meudominio.com.br")

SELECT 
  lp.id,
  lp.status,
  lp.created_at,
  -- Variáveis de subdomínio
  lp.subdomain AS "Subdomínio (sem extensão)",
  CASE 
    WHEN lp.subdomain IS NOT NULL THEN '✓'
    ELSE '✗'
  END AS "Tem Subdomínio",
  -- Variáveis de domínio
  lp.custom_domain AS "Domínio Próprio",
  CASE 
    WHEN lp.custom_domain IS NOT NULL THEN '✓'
    ELSE '✗'
  END AS "Tem Domínio Próprio",
  lp.chosen_domain AS "Domínio Escolhido (com extensão)",
  CASE 
    WHEN lp.chosen_domain IS NOT NULL THEN '✓'
    ELSE '✗'
  END AS "Tem Domínio Escolhido",
  -- Resumo qualitativo
  CASE 
    WHEN lp.chosen_domain IS NOT NULL THEN 'Domínio Escolhido: ' || lp.chosen_domain
    WHEN lp.custom_domain IS NOT NULL THEN 'Domínio Próprio: ' || lp.custom_domain
    ELSE 'Apenas Subdomínio: ' || lp.subdomain || '.docpage.com.br'
  END AS "Resumo do Domínio",
  -- URL de preview baseada no status
  CASE 
    WHEN lp.status = 'published' AND lp.chosen_domain IS NOT NULL THEN 
      'https://' || lp.chosen_domain
    WHEN lp.status = 'published' AND lp.custom_domain IS NOT NULL THEN 
      'https://' || lp.custom_domain
    WHEN lp.chosen_domain IS NOT NULL THEN 
      'https://' || REGEXP_REPLACE(lp.chosen_domain, '\.(com\.br|med\.br|com|br)$', '', 'g') || '.docpage.com.br'
    WHEN lp.custom_domain IS NOT NULL THEN 
      'https://' || REGEXP_REPLACE(lp.custom_domain, '\.(com\.br|med\.br|com|br)$', '', 'g') || '.docpage.com.br'
    ELSE 
      'https://' || lp.subdomain || '.docpage.com.br'
  END AS "URL Preview"
FROM 
  public.landing_pages lp
ORDER BY 
  lp.created_at DESC;
