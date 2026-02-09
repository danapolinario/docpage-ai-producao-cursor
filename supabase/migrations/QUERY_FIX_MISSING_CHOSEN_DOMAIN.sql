-- ============================================
-- Query para identificar e corrigir chosen_domain faltante
-- ============================================
-- Esta query identifica landing pages que deveriam ter chosen_domain mas não têm
-- e mostra os dados disponíveis em pending_checkouts para correção

-- 1. Identificar landing pages sem chosen_domain mas com dados em pending_checkouts
SELECT 
  lp.id,
  lp.subdomain,
  lp.custom_domain,
  lp.chosen_domain,
  lp.status,
  lp.created_at,
  pc.domain AS pending_domain,
  pc.has_custom_domain AS pending_has_custom_domain,
  pc.custom_domain AS pending_custom_domain,
  pc.processed AS pending_processed,
  CASE 
    WHEN pc.domain IS NOT NULL AND pc.has_custom_domain = false THEN 
      'DEVE TER chosen_domain = ' || pc.domain
    WHEN pc.domain IS NOT NULL AND pc.has_custom_domain = true AND pc.custom_domain IS NOT NULL THEN 
      'DEVE TER chosen_domain = ' || pc.custom_domain
    ELSE 
      'Sem dados em pending_checkouts'
  END AS acao_recomendada
FROM 
  public.landing_pages lp
LEFT JOIN 
  public.pending_checkouts pc ON lp.id = pc.landing_page_id AND pc.processed = true
WHERE 
  lp.chosen_domain IS NULL
  AND pc.domain IS NOT NULL
ORDER BY 
  lp.created_at DESC;

-- 2. Query para atualizar chosen_domain a partir de pending_checkouts
-- ATENÇÃO: Execute esta query apenas após revisar os resultados da query acima
UPDATE public.landing_pages lp
SET chosen_domain = CASE 
  WHEN pc.has_custom_domain = true AND pc.custom_domain IS NOT NULL THEN 
    pc.custom_domain
  WHEN pc.domain IS NOT NULL THEN 
    pc.domain
  ELSE 
    NULL
END
FROM 
  public.pending_checkouts pc
WHERE 
  lp.id = pc.landing_page_id
  AND pc.processed = true
  AND lp.chosen_domain IS NULL
  AND (
    (pc.has_custom_domain = true AND pc.custom_domain IS NOT NULL) OR
    (pc.has_custom_domain = false AND pc.domain IS NOT NULL)
  );

-- 2.1. Atualizar chosen_domain para landing pages que têm custom_domain mas não têm chosen_domain
-- (casos onde o usuário informou domínio próprio mas chosen_domain não foi salvo)
UPDATE public.landing_pages lp
SET chosen_domain = lp.custom_domain
WHERE 
  lp.custom_domain IS NOT NULL
  AND lp.chosen_domain IS NULL;

-- 3. Verificar landing pages que ainda não têm chosen_domain após atualização
-- Estas podem precisar de correção manual ou são casos antigos sem dados em pending_checkouts
SELECT 
  lp.id,
  lp.subdomain,
  lp.custom_domain,
  lp.chosen_domain,
  lp.status,
  lp.created_at,
  CASE 
    WHEN lp.subdomain LIKE 'custom-%' THEN 'Provavelmente domínio próprio (subdomain gerado)'
    WHEN lp.custom_domain IS NOT NULL THEN 'Tem custom_domain mas não chosen_domain'
    ELSE 'Apenas subdomain - pode ser caso antigo ou domínio não informado'
  END AS observacao
FROM 
  public.landing_pages lp
WHERE 
  lp.chosen_domain IS NULL
ORDER BY 
  lp.created_at DESC;
