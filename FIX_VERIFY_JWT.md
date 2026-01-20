# ✅ Fix Final - verify_jwt = false

## Problema

O erro 401 ocorre porque o Supabase está validando JWT automaticamente antes mesmo de chegar na Edge Function.

## Solução

Adicionei `verify_jwt = false` no `supabase/config.toml` para as funções `admin-get-pages` e `admin-update-status`.

## O que foi feito

Adicionei estas linhas no `supabase/config.toml`:

```toml
[functions.admin-get-pages]
verify_jwt = false

[functions.admin-update-status]
verify_jwt = false
```

## Deploy Necessário

**IMPORTANTE**: Você precisa fazer deploy novamente para aplicar a configuração!

### Via npx:

```bash
npx supabase functions deploy admin-get-pages --project-ref ezbwoibhtwiqzgedoajr
npx supabase functions deploy admin-update-status --project-ref ezbwoibhtwiqzgedoajr
```

### Via Dashboard:

1. Acesse: https://supabase.com/dashboard/project/ezbwoibhtwiqzgedoajr/functions
2. Edite `admin-get-pages`
3. Na seção "Settings" ou "Configuration", desmarque "Verify JWT" ou configure `verify_jwt = false`
4. Clique em "Deploy"
5. Repita para `admin-update-status`

**OU** simplesmente faça deploy novamente - o `config.toml` será aplicado automaticamente.

## Após o Deploy

1. **Limpe o cache do navegador** (Ctrl+Shift+R ou Cmd+Shift+R)
2. **Recarregue a página**
3. **As landing pages devem aparecer agora!** 🎉

## Por que isso resolve

- ✅ **Sem validação JWT automática**: O Supabase não bloqueia antes de chegar na função
- ✅ **Validação manual**: A função ainda valida se o usuário existe e se é admin
- ✅ **Seguro**: Usa service role para validar, não depende de JWT

Esta é a configuração correta! Faça o deploy e teste. 🚀
