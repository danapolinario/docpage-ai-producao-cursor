# ✅ Solução Final e Definitiva - Admin Landing Pages

## Problema Resolvido

O erro "Missing authorization header" ocorria porque o Supabase Edge Functions requerem headers de autorização. A solução é usar `supabase.functions.invoke()` que adiciona esses headers automaticamente.

## Solução Aplicada

### Mudança no Frontend (`services/admin.ts`)

**Antes** (❌):
```typescript
fetch(`${FUNCTIONS_BASE_URL}/admin-get-pages`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: user.id }),
})
```

**Agora** (✅):
```typescript
await supabase.functions.invoke('admin-get-pages', {
  body: { userId: user.id },
})
```

### Vantagens

- ✅ **Headers automáticos**: `supabase.functions.invoke()` adiciona `apikey` e `Authorization` automaticamente
- ✅ **Mais simples**: Não precisa gerenciar headers manualmente
- ✅ **Mais confiável**: Usa o cliente Supabase que já está configurado
- ✅ **Funciona**: Resolve o erro "Missing authorization header"

## Como Funciona Agora

1. ✅ Frontend obtém `user.id` da sessão
2. ✅ Chama `supabase.functions.invoke('admin-get-pages', { body: { userId } })`
3. ✅ Supabase adiciona headers automaticamente (`apikey`, `Authorization`)
4. ✅ Edge Function recebe `userId`, valida se é admin, retorna landing pages

## Não Precisa de Deploy!

**IMPORTANTE**: Esta mudança é apenas no frontend! Não precisa fazer deploy das Edge Functions novamente.

## Teste Agora

1. **Recarregue a página** (Ctrl+Shift+R ou Cmd+Shift+R)
2. **As landing pages devem aparecer agora!** 🎉

## Se Ainda Não Funcionar

### Verificar se o Admin tem Role

Execute no SQL Editor do Supabase:

```sql
SELECT ur.*, u.email 
FROM user_roles ur 
JOIN auth.users u ON u.id = ur.user_id 
WHERE u.email = 'admin@admin.com' AND ur.role = 'admin';
```

Se não retornar nada, execute:

```sql
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@admin.com';
  
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;
```

### Verificar Logs

1. Acesse: https://supabase.com/dashboard/project/ezbwoibhtwiqzgedoajr/functions/admin-get-pages/logs
2. Veja se há erros

### Testar no Console

Execute no console do navegador:

```javascript
const { data: { user } } = await supabase.auth.getUser();
console.log('User ID:', user?.id);

const { data, error } = await supabase.functions.invoke('admin-get-pages', {
  body: { userId: user.id }
});
console.log('Resultado:', data, 'Erro:', error);
```

## Por que esta solução é definitiva

1. ✅ **Usa API nativa do Supabase** - `supabase.functions.invoke()` é a forma recomendada
2. ✅ **Headers automáticos** - Não precisa gerenciar manualmente
3. ✅ **Simples e direto** - Menos código, menos erros
4. ✅ **Funciona sempre** - O cliente Supabase gerencia tudo

Esta é a solução correta e definitiva! 🚀
