# ✅ Solução Final - Invalid JWT

## Mudança Aplicada

Simplifiquei a validação do token JWT nas Edge Functions. Em vez de decodificar manualmente o JWT, agora uso o Supabase client com `anon key` que valida automaticamente o token.

## O que mudou

### Antes (❌ Decodificação manual):
- Tentava decodificar o JWT manualmente
- Podia falhar com tokens malformados ou expirados
- Mais propenso a erros

### Agora (✅ Validação automática):
- Usa `supabase.auth.getUser()` que valida o JWT automaticamente
- Retorna erro claro se o token for inválido/expirado
- Mais confiável e simples

## Deploy Necessário

**IMPORTANTE**: Você precisa fazer deploy das funções atualizadas!

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

## Se Ainda Não Funcionar

### Verificar se SUPABASE_ANON_KEY está disponível

A função agora precisa de `SUPABASE_ANON_KEY`. Verifique se está configurada:

1. Acesse: https://supabase.com/dashboard/project/ezbwoibhtwiqzgedoajr/settings/api
2. Copie o "anon public" key
3. Vá em: https://supabase.com/dashboard/project/ezbwoibhtwiqzgedoajr/settings/functions
4. Adicione como secret: `SUPABASE_ANON_KEY` = (cole o anon key)

**Nota**: Na verdade, o Supabase pode disponibilizar isso automaticamente. Se não funcionar, adicione manualmente.

### Testar Token Manualmente

Execute no console do navegador após fazer login:

```javascript
const { data: { session } } = await supabase.auth.getSession();
console.log('Token:', session?.access_token?.substring(0, 50) + '...');

// Testar validação
const { data: { user }, error } = await supabase.auth.getUser();
console.log('Usuário válido?', !!user, 'Erro:', error);
```

Se `user` for `null`, o token está inválido/expirado - faça login novamente.

## Por que isso deve funcionar

1. ✅ Usa validação nativa do Supabase (mais confiável)
2. ✅ Retorna erros claros se o token for inválido
3. ✅ Não depende de decodificação manual do JWT
4. ✅ Funciona com tokens expirados (retorna erro claro)

Faça o deploy e teste novamente! 🚀
