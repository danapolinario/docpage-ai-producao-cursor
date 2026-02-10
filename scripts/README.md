# Scripts de Utilidade

## generate-all-static-html.ts

Script para gerar HTML estático para todas as landing pages publicadas.

## 🚀 Método Mais Simples (Recomendado)

### Opção 1: Via Script TypeScript Local

**Este é o método mais fácil - não precisa fazer deploy de nada!**

1. Configure as variáveis de ambiente:
   
   Crie/edite o arquivo `.env` na raiz do projeto:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
   ```
   
   **Onde encontrar a Service Role Key:**
   - Supabase Dashboard > Settings > API
   - Copie a chave "service_role" (secret) - ⚠️ NÃO compartilhe esta chave!

2. Execute o script:
   ```bash
   npm run generate:static-html
   ```
   
   O script irá:
   - Buscar todas as landing pages publicadas
   - Chamar a Edge Function `generate-static-html` para cada uma
   - Mostrar um resumo com sucessos e erros

### Opção 2: Via SQL Query + Edge Function Manual

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Vá em **SQL Editor**
3. Execute o arquivo: `supabase/migrations/QUERY_GENERATE_ALL_STATIC_HTML.sql`
4. Isso listará todas as landing pages publicadas com seus IDs
5. Para cada ID retornado, chame a Edge Function `generate-static-html`:

**Via Supabase Dashboard:**
- Vá em **Edge Functions** > **generate-static-html**
- Clique em **Invoke**
- No body, cole: `{"landingPageId": "UUID_DA_LANDING_PAGE"}`

**Via cURL (para cada landing page):**
```bash
curl -X POST https://SEU_PROJETO.supabase.co/functions/v1/generate-static-html \
  -H "Authorization: Bearer SUA_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"landingPageId": "UUID_DA_LANDING_PAGE"}'
```

### Opção 2: Via Script Local

1. Configure as variáveis de ambiente:
   
   **Opção A: Arquivo `.env` na raiz do projeto:**
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
   ```

   **Opção B: Variáveis de ambiente do sistema:**
   ```bash
   export VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   export SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
   ```

2. Execute o script:
   ```bash
   npm run generate:static-html
   ```

   Ou diretamente com tsx:
   ```bash
   npx tsx scripts/generate-all-static-html.ts
   ```

### O que o script faz:

- Busca todas as landing pages com `status = 'published'`
- Para cada uma, chama a Edge Function `generate-static-html`
- Gera o HTML estático e faz upload para Supabase Storage
- Retorna um resumo com sucessos e erros

### Saída esperada:

```
🚀 Iniciando geração de HTML estático para todas as landing pages publicadas...

📋 Encontradas 5 landing pages publicadas

[1/5] Gerando HTML para: drjoaosilva (uuid-123)
  ✓ Sucesso: drjoaosilva
    URL: https://seu-projeto.supabase.co/storage/v1/object/public/landing-pages/html/drjoaosilva.html
[2/5] Gerando HTML para: draanacosta (uuid-456)
  ✓ Sucesso: draanacosta
...

============================================================
📊 RESUMO
============================================================
Total de landing pages: 5
✓ Sucessos: 5
✗ Erros: 0

✅ Landing pages geradas com sucesso:
  - drjoaosilva (https://...)
  - draanacosta (https://...)
  ...

✨ Processamento concluído!
```
