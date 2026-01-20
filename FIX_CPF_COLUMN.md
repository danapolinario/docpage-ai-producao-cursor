# 🔧 Fix - Coluna CPF não encontrada

## Problema

Erro ao tentar salvar CPF: `Could not find the 'cpf' column of 'landing_pages' in the schema cache`

## Solução

A coluna `cpf` não existe na tabela `landing_pages`. Você precisa adicioná-la.

### Passo 1: Adicionar Coluna CPF

1. Acesse o SQL Editor no Supabase: https://supabase.com/dashboard/project/ezbwoibhtwiqzgedoajr/sql/new

2. Execute este SQL:

```sql
-- Adicionar coluna CPF à tabela landing_pages
ALTER TABLE public.landing_pages 
ADD COLUMN IF NOT EXISTS cpf VARCHAR(14);

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.landing_pages.cpf IS 'CPF do titular para registro do domínio (somente números, 11 dígitos)';
```

3. Clique em **"Run"** para executar

### Passo 2: Verificar se foi criada

Execute este SQL para verificar:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'landing_pages' 
AND column_name = 'cpf';
```

Se retornar uma linha, a coluna foi criada com sucesso! ✅

### Passo 3: Testar novamente

1. Tente salvar o CPF novamente na aplicação
2. Deve funcionar agora

## Alternativa: Via CLI (se tiver Supabase CLI configurado)

Se você tiver o Supabase CLI linkado ao projeto:

```bash
# Criar nova migration
supabase migration new add_cpf_column

# Editar o arquivo criado e adicionar o SQL acima
# Depois aplicar:
supabase db push
```

## Nota

A coluna CPF armazena dados sensíveis. Ela está excluída da view pública `landing_pages_public` por segurança.
