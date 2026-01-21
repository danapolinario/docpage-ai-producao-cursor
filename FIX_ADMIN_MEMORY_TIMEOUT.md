# 🔧 Fix: Memory Limit Exceeded e Timeout no /admin

## Problema

O painel admin estava falhando com:
- `Memory limit exceeded`
- `canceling statement due to statement timeout` (código 57014)
- A Edge Function estava excedendo limites de memória e tempo

## Causa

A query `SELECT * FROM landing_pages` estava:
1. **Carregando JSONB grandes** (`briefing_data` e `content_data`) na memória
2. **Retornando muitos registros** sem limite
3. **Causando timeout** na query PostgreSQL (57014)
4. **Excedendo limite de memória** da Edge Function

## Solução Implementada

### 1. Query Otimizada
- ✅ Selecionar apenas campos básicos (sem JSONB grandes)
- ✅ Limitar resultado a 300 registros
- ✅ Remover `briefing_data` e `content_data` da query inicial

### 2. Campos Retornados
Agora a query retorna apenas:
- `id`
- `subdomain`
- `custom_domain`
- `status`
- `created_at`
- `updated_at`
- `published_at`
- `user_id`

### 3. Briefing Data
- `briefing_data` é retornado como `{ name: null, contactEmail: null }`
- O frontend pode buscar esses dados separadamente se necessário (lazy loading)

### 4. Limite de Registros
- Limite de **300 registros** para evitar timeout
- Se houver mais de 300, considerar implementar paginação

## Deploy

### Opção 1: Via Dashboard do Supabase (Recomendado)

1. Acesse: https://supabase.com/dashboard/project/ezbwoibhtwiqzgedoajr/functions
2. Clique em `admin-get-pages`
3. Cole o conteúdo atualizado de `supabase/functions/admin-get-pages/index.ts`
4. Clique em "Deploy"

### Opção 2: Via CLI

```bash
npx supabase functions deploy admin-get-pages --project-ref ezbwoibhtwiqzgedoajr
```

## Melhorias Futuras (Opcional)

Se ainda houver problemas de performance:

### 1. Implementar Paginação
```typescript
// Adicionar parâmetros de paginação
const { page = 1, limit = 50 } = body
const offset = (page - 1) * limit

const { data } = await supabaseAdmin
  .from('landing_pages')
  .select('...')
  .order('created_at', { ascending: false })
  .range(offset, offset + limit - 1)
```

### 2. Criar Função SQL no Banco
Criar uma função SQL que extraia apenas campos específicos do JSONB:

```sql
CREATE OR REPLACE FUNCTION get_admin_landing_pages_optimized()
RETURNS TABLE (
  id uuid,
  subdomain text,
  custom_domain text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  published_at timestamptz,
  user_id uuid,
  doctor_name text,
  doctor_email text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lp.id,
    lp.subdomain,
    lp.custom_domain,
    lp.status,
    lp.created_at,
    lp.updated_at,
    lp.published_at,
    lp.user_id,
    (lp.briefing_data->>'name')::text as doctor_name,
    (lp.briefing_data->>'contactEmail')::text as doctor_email
  FROM landing_pages lp
  ORDER BY lp.created_at DESC
  LIMIT 500;
END;
$$ LANGUAGE plpgsql;
```

### 3. Adicionar Índices
Se a tabela `landing_pages` for muito grande, adicionar índices:

```sql
CREATE INDEX IF NOT EXISTS idx_landing_pages_created_at ON landing_pages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_landing_pages_status ON landing_pages(status);
CREATE INDEX IF NOT EXISTS idx_landing_pages_user_id ON landing_pages(user_id);
```

## Verificação

Após o deploy:

1. **Acesse `/admin` em produção**
2. **Verifique se as landing pages aparecem** (sem timeout)
3. **Verifique os logs**:
   - https://supabase.com/dashboard/project/ezbwoibhtwiqzgedoajr/functions/admin-get-pages/logs
4. **Verifique se não há mais erros de memory limit ou timeout**

## Nota sobre Briefing Data

O `briefing_data.name` e `briefing_data.contactEmail` aparecerão como `null` inicialmente. Se necessário, podemos:

1. **Implementar lazy loading** no frontend para buscar esses dados sob demanda
2. **Criar uma função SQL** que extraia apenas esses campos do JSONB
3. **Fazer uma query separada** apenas para esses campos (mais leve)

Por enquanto, a prioridade é fazer o painel funcionar sem timeout.
