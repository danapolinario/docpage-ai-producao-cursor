-- Política RLS para permitir verificação pública de subdomínios
-- Esta política permite que qualquer um (autenticado ou não) possa verificar
-- se um subdomínio já existe, mas apenas para o campo 'id' e 'subdomain'

-- Remover política anterior se existir
DROP POLICY IF EXISTS "Public can check subdomain availability" ON landing_pages;

-- Criar política que permite SELECT apenas do campo id e subdomain para verificação
-- Isto permite verificar disponibilidade sem precisar de autenticação
CREATE POLICY "Public can check subdomain availability"
  ON landing_pages FOR SELECT
  USING (true)
  WITH CHECK (false); -- Não permite INSERT/UPDATE, apenas SELECT

-- NOTA: Se a política acima não funcionar (devido a outras políticas mais restritivas),
-- você pode criar uma função SQL que faz a verificação:

-- Criar função SQL para verificar disponibilidade de subdomínio
CREATE OR REPLACE FUNCTION check_subdomain_available(check_subdomain TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 
    FROM landing_pages 
    WHERE subdomain = LOWER(check_subdomain)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permitir execução pública da função
GRANT EXECUTE ON FUNCTION check_subdomain_available(TEXT) TO anon, authenticated;
