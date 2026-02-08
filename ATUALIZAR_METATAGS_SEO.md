# Atualizar Metatags SEO das Landing Pages Existentes

Este documento explica como atualizar as metatags SEO das landing pages já criadas no banco de dados para remover referências ao DocPage e usar dados específicos de cada landing page.

## O que foi alterado?

As mudanças no código já fazem com que todas as landing pages (novas e existentes) usem metatags personalizadas:

- ✅ `og:site_name` agora usa o nome do médico/clínica com especialidade e CRM
- ✅ Tags Twitter específicas do DocPage foram removidas
- ✅ Todas as metatags são geradas dinamicamente a partir dos dados da landing page

## Opção 1: Migração SQL (Recomendada)

A forma mais simples é executar a migração SQL diretamente no Supabase:

### Passos:

1. Acesse o SQL Editor do Supabase:
   - https://supabase.com/dashboard/project/ezbwoibhtwiqzgedoajr/sql/new

2. Execute o arquivo de migração:
   - **Versão completa com estatísticas**: `supabase/migrations/20260205000000_update_seo_metatags.sql`
   - **Versão simples**: `supabase/migrations/20260205000001_update_seo_metatags_simple.sql` (recomendada se a primeira não funcionar)

3. A migração irá:
   - Atualizar `meta_title` para incluir nome, especialidade e CRM
   - Atualizar `meta_description` com descrição otimizada
   - Atualizar TODAS as landing pages com dados válidos do briefing

### Verificar resultado:

```sql
-- Ver quantas foram atualizadas
SELECT 
  COUNT(*) as total_atualizadas,
  COUNT(DISTINCT subdomain) as subdomains_unicos
FROM public.landing_pages
WHERE updated_at > NOW() - INTERVAL '1 minute';

-- Ver algumas landing pages atualizadas
SELECT 
  subdomain,
  meta_title,
  LEFT(meta_description, 50) as meta_desc_preview,
  updated_at
FROM public.landing_pages
WHERE updated_at > NOW() - INTERVAL '5 minutes'
ORDER BY updated_at DESC
LIMIT 10;
```

### Se não funcionar, verifique:

```sql
-- Verificar se há landing pages com dados válidos
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN briefing_data IS NOT NULL AND briefing_data::text != '{}' THEN 1 END) as com_briefing,
  COUNT(CASE 
    WHEN briefing_data->>'name' IS NOT NULL 
     AND briefing_data->>'name' != ''
     AND briefing_data->>'specialty' IS NOT NULL
     AND briefing_data->>'specialty' != ''
     AND briefing_data->>'crm' IS NOT NULL
     AND briefing_data->>'crm' != ''
     AND briefing_data->>'crmState' IS NOT NULL
     AND briefing_data->>'crmState' != ''
    THEN 1 
  END) as com_dados_completos
FROM public.landing_pages;

-- Ver estrutura de uma landing page
SELECT 
  subdomain,
  briefing_data->>'name' as nome,
  briefing_data->>'specialty' as especialidade,
  briefing_data->>'crm' as crm,
  briefing_data->>'crmState' as estado,
  meta_title,
  meta_description
FROM public.landing_pages
LIMIT 5;
```

## Opção 2: Script TypeScript

Se preferir executar via código:

### Pré-requisitos:

1. Instalar dependências (se ainda não tiver):
   ```bash
   npm install
   ```

2. Configurar variáveis de ambiente:
   - `VITE_SUPABASE_URL` ou `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Executar:

```bash
npx tsx scripts/update-existing-seo-metatags.ts
```

O script irá:
- Buscar todas as landing pages
- Atualizar apenas as que precisam (contêm "DocPage" ou estão vazias)
- Mostrar um resumo da atualização

## Importante

⚠️ **As mudanças no código já afetam todas as landing pages automaticamente!**

As metatags `og:site_name` e tags Twitter são geradas **dinamicamente** em tempo de execução, então não há necessidade de atualizar o banco de dados para essas tags específicas.

A migração SQL e o script TypeScript são úteis apenas para:
- Atualizar campos `meta_title` e `meta_description` que podem estar armazenados no banco
- Garantir consistência dos dados
- Remover referências antigas ao DocPage nos campos armazenados

## Verificação

Após executar a atualização, você pode verificar se as metatags estão corretas:

1. Acesse uma landing page publicada
2. Visualize o código-fonte (Ctrl+U ou Cmd+U)
3. Procure por `<meta property="og:site_name"` - deve mostrar o nome do médico
4. Verifique que não há tags `twitter:site` ou `twitter:creator` com "@DocPageAI"

## Notas

- As landing pages novas já usam as metatags corretas automaticamente
- As landing pages existentes também usam as metatags corretas (geradas dinamicamente)
- A atualização do banco é opcional, mas recomendada para consistência

## Troubleshooting

Se a migração não atualizar nenhuma landing page:

1. Verifique se as landing pages têm `briefing_data` válido
2. Verifique se os campos `name`, `specialty`, `crm` e `crmState` existem no JSONB
3. Execute a query de verificação acima para diagnosticar o problema
