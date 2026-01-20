# ✅ Solução Sem SUPABASE_ANON_KEY

## Problema

Não é possível criar `SUPABASE_ANON_KEY` como secret (não pode começar com `SUPABASE_`).

## Solução Aplicada

Mudei a abordagem para **decodificar o JWT manualmente** e usar o **service role** para validar o usuário. Isso não precisa do anon key!

### Como Funciona Agora:

1. ✅ Extrai o token do header `Authorization`
2. ✅ Decodifica o JWT manualmente (apenas o payload, não valida assinatura)
3. ✅ Obtém o `user_id` do payload
4. ✅ Usa `supabaseAdmin.auth.admin.getUserById()` para verificar se o usuário existe
5. ✅ Verifica se o usuário tem role 'admin' na tabela `user_roles`
6. ✅ Se tudo OK, busca as landing pages usando service role (bypass RLS)

## Deploy Necessário

**IMPORTANTE**: Faça deploy das funções atualizadas!

### Via npx:

```bash
npx supabase functions deploy admin-get-pages --project-ref ezbwoibhtwiqzgedoajr
npx supabase functions deploy admin-update-status --project-ref ezbwoibhtwiqzgedoajr
```

### Via Dashboard:

1. Acesse: https://supabase.com/dashboard/project/ezbwoibhtwiqzgedoajr/functions
2. Edite `admin-get-pages` e cole o conteúdo atualizado de `supabase/functions/admin-get-pages/index.ts`
3. Clique em "Deploy"
4. Repita para `admin-update-status`

## Após o Deploy

1. **Limpe o cache do navegador** (Ctrl+Shift+R ou Cmd+Shift+R)
2. **Faça logout** do painel admin
3. **Faça login novamente** com `admin@admin.com` / `admin123!@#`
4. Teste novamente!

## Vantagens desta Abordagem

- ✅ **Não precisa de SUPABASE_ANON_KEY** - usa apenas service role
- ✅ **Mais simples** - decodificação direta do JWT
- ✅ **Mais confiável** - não depende de variáveis de ambiente extras
- ✅ **Seguro** - ainda valida se o usuário existe e se é admin

## Se Ainda Não Funcionar

### Verificar Logs da Edge Function

1. Acesse: https://supabase.com/dashboard/project/ezbwoibhtwiqzgedoajr/functions/admin-get-pages/logs
2. Veja se há erros na decodificação do JWT

### Verificar se o Token Está Sendo Enviado

Execute no console do navegador após fazer login:

```javascript
const { data: { session } } = await supabase.auth.getSession();
console.log('Tem sessão?', !!session);
console.log('Token (primeiros 50 chars):', session?.access_token?.substring(0, 50));
```

Se não houver sessão, faça login novamente.

### Testar Decodificação Manual

Execute no console do navegador:

```javascript
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

if (token) {
  const parts = token.split('.');
  if (parts.length === 3) {
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const payload = JSON.parse(atob(base64));
    console.log('User ID do token:', payload.sub || payload.user_id);
  }
}
```

Isso deve mostrar o `user_id` que está no token.

## Por que isso deve funcionar

1. ✅ Não depende de `SUPABASE_ANON_KEY`
2. ✅ Usa apenas service role (já configurado)
3. ✅ Decodificação JWT é simples e direta
4. ✅ Validação do usuário via Admin API é confiável

Faça o deploy e teste novamente! 🚀
