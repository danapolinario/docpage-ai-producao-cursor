-- Função RPC para buscar landing page por domínio (chosen_domain ou custom_domain)
-- Normaliza: lowercase, trim, remove protocolo e www. para comparação
CREATE OR REPLACE FUNCTION get_landing_page_by_domain(domain_input text)
RETURNS SETOF landing_pages
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  domain_normalized text;
  domain_with_www text;
BEGIN
  -- Normalizar: trim, lowercase, remover protocolo (https://), remover www.
  domain_normalized := LOWER(TRIM(domain_input));
  domain_normalized := REGEXP_REPLACE(domain_normalized, '^https?://', '', 'i');
  domain_normalized := REGEXP_REPLACE(domain_normalized, '^www\.', '');
  domain_normalized := TRIM(BOTH '/' FROM domain_normalized);
  domain_with_www := 'www.' || domain_normalized;

  RETURN QUERY
  SELECT *
  FROM landing_pages
  WHERE (
    (chosen_domain IS NOT NULL AND (
      LOWER(TRIM(REGEXP_REPLACE(REGEXP_REPLACE(chosen_domain, '^https?://', '', 'i'), '^www\.', ''))) = domain_normalized
      OR LOWER(TRIM(chosen_domain)) = domain_with_www
    ))
    OR (custom_domain IS NOT NULL AND (
      LOWER(TRIM(REGEXP_REPLACE(REGEXP_REPLACE(custom_domain, '^https?://', '', 'i'), '^www\.', ''))) = domain_normalized
      OR LOWER(TRIM(custom_domain)) = domain_with_www
    ))
  )
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION get_landing_page_by_domain(text) IS 'Busca landing page por chosen_domain ou custom_domain (normalizado)';
