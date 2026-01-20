# 🔧 Fix CORS - Admin Functions

## Problema

Erro de CORS ao acessar `admin-get-pages`:
```
Failed to fetch
Access to fetch at 'https://ezbwoibhtwiqzgedoajr.supabase.co/functions/v1/admin-get-pages' 
from origin 'http://localhost:8081' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
It does not have HTTP ok status.
```

## Solução Aplicada

Corrigi os headers CORS nas Edge Functions para incluir:
- `Access-Control-Allow-Methods`
- `Access-Control-Max-Age`
- Status 200 explícito no OPTIONS

## Próximos Passos

### 1. Fazer Deploy das Funções Corrigidas

**Opção A: Via npx**

```bash
npx supabase functions deploy admin-get-pages --project-ref ezbwoibhtwiqzgedoajr
npx supabase functions deploy admin-update-status --project-ref ezbwoibhtwiqzgedoajr
```

**Opção B: Via Dashboard**

1. Acesse: https://supabase.com/dashboard/project/ezbwoibhtwiqzgedoajr/functions
2. Encontre `admin-get-pages` e clique em "Edit"
3. Cole o conteúdo atualizado de `supabase/functions/admin-get-pages/index.ts`
4. Clique em "Deploy"
5. Repita para `admin-update-status`

### 2. Verificar se a Função Foi Deployada

Teste diretamente no navegador ou com curl:

```bash
curl -X OPTIONS \
  'https://ezbwoibhtwiqzgedoajr.supabase.co/functions/v1/admin-get-pages' \
  -H 'Origin: http://localhost:8081' \
  -v
```

Deve retornar status 200 com headers CORS.

### 3. Verificar Variáveis de Ambiente

Certifique-se de que estas variáveis estão configuradas nas Edge Functions:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY` (disponível automaticamente)

### 4. Testar Novamente

Após o deploy:
1. Limpe o cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R)
2. Faça logout e login novamente no painel admin
3. As landing pages devem aparecer

## Se Ainda Não Funcionar

### Verificar Logs da Edge Function

1. Acesse: https://supabase.com/dashboard/project/ezbwoibhtwiqzgedoajr/functions/admin-get-pages/logs
2. Veja se há erros relacionados a CORS ou autenticação

### Testar Manualmente

Execute no console do navegador (F12) após fazer login:

```javascript
const session = await supabase.auth.getSession();
const token = session.data.session?.access_token;

fetch('https://ezbwoibhtwiqzgedoajr.supabase.co/functions/v1/admin-get-pages', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

Se funcionar aqui mas não no código, pode ser problema de cache ou timing.

### Alternativa: Usar Supabase Client Diretamente (Temporário)

Se as Edge Functions continuarem com problemas de CORS, podemos tentar uma abordagem alternativa usando o Supabase Client diretamente, mas isso requer garantir que as políticas RLS estejam funcionando corretamente.
