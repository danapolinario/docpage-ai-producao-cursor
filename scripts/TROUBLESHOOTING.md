# Troubleshooting - Geração de HTML Estático

## Problema: Todos os erros retornam "Erro desconhecido"

### Possíveis Causas e Soluções

#### 1. Edge Function não está deployada

**Sintoma:** Todos os erros retornam status HTTP diferente de 200

**Solução:**
```bash
# No terminal, na raiz do projeto
supabase functions deploy generate-static-html
```

**Verificar se está deployada:**
- Acesse: Supabase Dashboard > Edge Functions
- Procure por `generate-static-html`
- Se não existir, faça o deploy

#### 2. Migration não foi executada (bucket não permite HTML)

**Sintoma:** Erro ao fazer upload: "Invalid file type" ou similar

**Solução:**
1. Acesse: Supabase Dashboard > SQL Editor
2. Execute o arquivo: `supabase/migrations/20260210000001_allow_html_in_storage.sql`
3. Ou execute manualmente:
```sql
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg', 
  'image/png', 
  'image/webp', 
  'image/gif',
  'text/html',
  'text/html; charset=utf-8'
]
WHERE id = 'landing-pages';
```

#### 3. Service Role Key incorreta

**Sintoma:** Erro 401 (Unauthorized) ou 403 (Forbidden)

**Solução:**
1. Acesse: Supabase Dashboard > Settings > API
2. Copie a chave "service_role" (secret)
3. Atualize o arquivo `.env`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=sua-chave-aqui
   ```

#### 4. URL do Supabase incorreta

**Sintoma:** Erro de conexão ou "Function not found"

**Solução:**
1. Verifique a URL no `.env`:
   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   ```
2. A URL deve terminar com `.supabase.co` (sem `/rest/v1`)

## Como verificar o que está acontecendo

### 1. Testar a Edge Function manualmente

Via Supabase Dashboard:
1. Vá em Edge Functions > generate-static-html
2. Clique em "Invoke"
3. Body: `{"landingPageId": "uuid-de-uma-landing-page"}`
4. Veja a resposta e os logs

Via cURL:
```bash
curl -X POST https://SEU_PROJETO.supabase.co/functions/v1/generate-static-html \
  -H "Authorization: Bearer SUA_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"landingPageId": "uuid-aqui"}'
```

### 2. Verificar logs da Edge Function

1. Supabase Dashboard > Edge Functions > generate-static-html
2. Aba "Logs"
3. Veja os erros detalhados

### 3. Verificar se o bucket permite HTML

Execute no SQL Editor:
```sql
SELECT allowed_mime_types 
FROM storage.buckets 
WHERE id = 'landing-pages';
```

Deve incluir `text/html` e `text/html; charset=utf-8`

## Próximos passos

1. Execute o script novamente com as melhorias de debug
2. Veja a mensagem de erro detalhada da primeira landing page testada
3. Siga as soluções acima baseado no erro específico
