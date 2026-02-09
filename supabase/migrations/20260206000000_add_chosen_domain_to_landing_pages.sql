-- ============================================
-- Adicionar campo chosen_domain na tabela landing_pages
-- ============================================
-- Este campo armazena o domínio completo escolhido pelo usuário (com extensão)
-- Exemplo: "meudominio.com.br" ou "meunovodominio.med.br"
-- Diferente de custom_domain (domínio próprio já existente) e subdomain (usado para docpage.com.br)

-- Adicionar coluna chosen_domain
ALTER TABLE public.landing_pages 
ADD COLUMN IF NOT EXISTS chosen_domain VARCHAR(255);

-- Comentário explicativo
COMMENT ON COLUMN public.landing_pages.chosen_domain IS 
'Domínio completo escolhido pelo usuário durante o checkout (com extensão). Ex: "meudominio.com.br". Usado para exibição e emails após publicação.';

-- Atualizar registros existentes com dados de pending_checkouts
-- Para landing pages que já foram criadas, buscar o domínio escolhido de pending_checkouts
UPDATE public.landing_pages lp
SET chosen_domain = pc.domain
FROM public.pending_checkouts pc
WHERE lp.id = pc.landing_page_id
  AND pc.processed = true
  AND lp.chosen_domain IS NULL
  AND pc.domain IS NOT NULL
  AND (pc.domain LIKE '%.com.br' OR pc.domain LIKE '%.med.br' OR pc.domain LIKE '%.com' OR pc.domain LIKE '%.br');

-- Se não encontrou por landing_page_id, tentar por user_id (mais recente)
UPDATE public.landing_pages lp
SET chosen_domain = subquery.domain
FROM (
  SELECT DISTINCT ON (user_id) 
    user_id,
    domain
  FROM public.pending_checkouts
  WHERE processed = true
    AND domain IS NOT NULL
    AND (domain LIKE '%.com.br' OR domain LIKE '%.med.br' OR domain LIKE '%.com' OR domain LIKE '%.br')
  ORDER BY user_id, created_at DESC
) AS subquery
WHERE lp.user_id = subquery.user_id
  AND lp.chosen_domain IS NULL;

-- Criar índice para melhorar performance em consultas
CREATE INDEX IF NOT EXISTS idx_landing_pages_chosen_domain ON public.landing_pages(chosen_domain);
