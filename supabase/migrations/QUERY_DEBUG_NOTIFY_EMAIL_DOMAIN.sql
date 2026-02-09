-- ============================================
-- Query para diagnosticar problema de domínio no email de notificação
-- ============================================
-- Esta query mostra quais landing pages publicadas não têm chosen_domain
-- e verifica se há dados em pending_checkouts que poderiam ser usados

SELECT 
  lp.id,
  lp.subdomain,
  lp.custom_domain,
  lp.chosen_domain,
  lp.status,
  lp.created_at,
  -- Verificar se há dados em pending_checkouts
  pc.domain AS pending_domain,
  pc.has_custom_domain AS pending_has_custom_domain,
  pc.custom_domain AS pending_custom_domain,
  pc.processed AS pending_processed,
  -- Determinar qual domínio DEVERIA ser usado no email
  CASE 
    WHEN lp.chosen_domain IS NOT NULL THEN 
      '✓ DEVE USAR: ' || lp.chosen_domain
    WHEN lp.custom_domain IS NOT NULL THEN 
      '✓ DEVE USAR: ' || lp.custom_domain
    WHEN pc.domain IS NOT NULL AND pc.has_custom_domain = false THEN 
      '⚠ DEVERIA USAR (de pending_checkouts): ' || pc.domain || ' (mas chosen_domain está NULL)'
    WHEN pc.domain IS NOT NULL AND pc.has_custom_domain = true AND pc.custom_domain IS NOT NULL THEN 
      '⚠ DEVERIA USAR (de pending_checkouts): ' || pc.custom_domain || ' (mas chosen_domain está NULL)'
    ELSE 
      '✗ SEM DOMÍNIO ESCOLHIDO - Usará subdomain.docpage.com.br'
  END AS dominio_que_deve_ser_usado,
  -- URL que está sendo usada atualmente (se chosen_domain estiver NULL)
  CASE 
    WHEN lp.chosen_domain IS NOT NULL THEN 
      'https://' || lp.chosen_domain
    WHEN lp.custom_domain IS NOT NULL THEN 
      'https://' || lp.custom_domain
    ELSE 
      'https://' || lp.subdomain || '.docpage.com.br (FALLBACK - INCORRETO)'
  END AS url_atual
FROM 
  public.landing_pages lp
LEFT JOIN 
  public.pending_checkouts pc ON lp.id = pc.landing_page_id AND pc.processed = true
WHERE 
  lp.status = 'published'
  AND lp.chosen_domain IS NULL
ORDER BY 
  lp.created_at DESC;
