-- ============================================
-- Query para corrigir chosen_domain a partir do subdomain
-- ============================================
-- Esta query infere o chosen_domain a partir do subdomain quando não há dados em pending_checkouts
-- ATENÇÃO: Esta é uma solução de fallback para casos onde os dados não foram salvos corretamente

-- 1. Primeiro, tentar atualizar a partir de pending_checkouts (se houver dados)
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

-- 2. Atualizar chosen_domain para landing pages que têm custom_domain mas não têm chosen_domain
UPDATE public.landing_pages lp
SET chosen_domain = lp.custom_domain
WHERE 
  lp.custom_domain IS NOT NULL
  AND lp.chosen_domain IS NULL;

-- 3. Inferir chosen_domain a partir do subdomain para casos onde:
--    - Não tem custom_domain
--    - Não tem chosen_domain
--    - Subdomain não começa com "custom-" (que são gerados automaticamente)
--    - Subdomain tem pelo menos 3 caracteres (para evitar subdomínios muito curtos/aleatórios)
--    - Subdomain não parece ser aleatório (não tem muitos caracteres repetidos ou padrões estranhos)
UPDATE public.landing_pages lp
SET chosen_domain = lp.subdomain || '.com.br'
WHERE 
  lp.chosen_domain IS NULL
  AND lp.custom_domain IS NULL
  AND lp.subdomain NOT LIKE 'custom-%'
  AND LENGTH(lp.subdomain) >= 3
  -- Excluir subdomínios que parecem ser aleatórios (muitos caracteres repetidos ou muito curtos)
  AND lp.subdomain !~ '^(.)\1{4,}$' -- Não é o mesmo caractere repetido 5+ vezes
  AND lp.subdomain NOT IN ('xxx', 'xxx', 'test', 'teste', 'demo', 'example');

-- 4. Verificar resultado após atualizações
SELECT 
  lp.id,
  lp.subdomain,
  lp.custom_domain,
  lp.chosen_domain,
  lp.status,
  lp.created_at,
  CASE 
    WHEN lp.chosen_domain IS NOT NULL THEN '✓ Corrigido'
    WHEN lp.subdomain LIKE 'custom-%' THEN 'Subdomain gerado automaticamente (domínio próprio)'
    WHEN lp.custom_domain IS NOT NULL THEN 'Tem custom_domain mas não chosen_domain'
    ELSE 'Ainda precisa de atenção manual'
  END AS status_correcao
FROM 
  public.landing_pages lp
WHERE 
  lp.chosen_domain IS NULL
ORDER BY 
  lp.created_at DESC;
