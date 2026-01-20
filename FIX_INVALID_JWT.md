# 🔧 Fix - Invalid JWT Error

## Problema

Erro `401 (Unauthorized)` com mensagem `Invalid JWT` ao tentar buscar landing pages no painel admin.

## Causa

O token JWT pode estar:
1. Expirado
2. Não sendo enviado corretamente
3. Sendo decodificado incorretamente na Edge Function

## Soluções Aplicadas

### 1. Frontend (`services/admin.ts`)

- ✅ Adicionado refresh automático da sessão se expirada
- ✅ Retry automático com novo token após refresh
- ✅ Melhor tratamento de erros

### 2. Edge Function (`admin-get-pages/index.ts`)

- ✅ Corrigida decodificação do JWT (adicionado padding para base64)
- ✅ Melhor tratamento de erros na decodificação

## Próximos Passos

### 1. Fazer Deploy das Correções

**Opção A: Via npx**

```bash
npx supabase functions deploy admin-get-pages --project-ref ezbwoibhtwiqzgedoajr
npx supabase functions deploy admin-update-status --project-ref ezbwoibhtwiqzgedoajr
```

**Opção B: Via Dashboard**

1. Acesse: https://supabase.com/dashboard/project/ezbwoibhtwiqzgedoajr/functions
2. Edite `admin-get-pages` e cole o conteúdo atualizado
3. Clique em "Deploy"
4. Repita para `admin-update-status`

### 2. Testar

1. **Limpe o cache do navegador** (Ctrl+Shift+R ou Cmd+Shift+R)
2. **Faça logout** do painel admin
3. **Faça login novamente** com `admin@admin.com` / `admin123!@#`
4. As landing pages devem aparecer agora!

## Se Ainda Não Funcionar

### Verificar Sessão no Console

Abra o console do navegador (F12) e execute:

```javascript
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
console.log('Token:', session?.access_token?.substring(0, 50) + '...');
```

Se `session` for `null`, você precisa fazer login novamente.

### Verificar Logs da Edge Function

1. Acesse: https://supabase.com/dashboard/project/ezbwoibhtwiqzgedoajr/functions/admin-get-pages/logs
2. Veja se há erros relacionados à decodificação do JWT

### Testar Manualmente

Execute no console do navegador após fazer login:

```javascript
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

if (!token) {
  console.error('Sem token! Faça login novamente.');
} else {
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
}
```

## O que foi corrigido

1. ✅ **Refresh automático de sessão** - Se o token expirar, tenta fazer refresh automaticamente
2. ✅ **Retry com novo token** - Se receber 401, faz refresh e tenta novamente
3. ✅ **Decodificação JWT corrigida** - Adicionado padding correto para base64
4. ✅ **Melhor tratamento de erros** - Mensagens mais claras sobre o que deu errado

Após o deploy, o erro deve desaparecer! 🚀
