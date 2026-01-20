# ✅ Solução: Admin não vê Landing Pages

## Problema Resolvido

O painel admin não mostrava landing pages porque as queries diretas ao Supabase eram bloqueadas por RLS (Row Level Security), mesmo com a role 'admin' configurada.

## Solução Implementada

Criamos **Edge Functions** que:
1. Verificam se o usuário está autenticado
2. Verificam se o usuário tem role 'admin' na tabela `user_roles`
3. Usam `SUPABASE_SERVICE_ROLE_KEY` para bypassar RLS e buscar todas as landing pages

## Arquivos Criados/Modificados

### Novas Edge Functions:
- `supabase/functions/admin-get-pages/index.ts` - Busca todas as landing pages
- `supabase/functions/admin-update-status/index.ts` - Atualiza status das landing pages

### Arquivos Modificados:
- `services/admin.ts` - Agora usa Edge Functions em vez de queries diretas

## Passos para Resolver

### 1. Deploy das Edge Functions

**Opção A: Via npx (recomendado)**

```bash
# Deploy da função para buscar landing pages
npx supabase functions deploy admin-get-pages --project-ref ezbwoibhtwiqzgedoajr

# Deploy da função para atualizar status
npx supabase functions deploy admin-update-status --project-ref ezbwoibhtwiqzgedoajr
```

**Opção B: Via Dashboard do Supabase**

1. Acesse: https://supabase.com/dashboard/project/ezbwoibhtwiqzgedoajr/functions
2. Clique em "Create a new function"
3. Nome: `admin-get-pages`
4. Cole o conteúdo de `supabase/functions/admin-get-pages/index.ts`
5. Clique em "Deploy"
6. Repita para `admin-update-status` com o conteúdo de `supabase/functions/admin-update-status/index.ts`

### 2. Verificar Variáveis de Ambiente

As Edge Functions usam automaticamente estas variáveis (já configuradas):
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `SUPABASE_ANON_KEY` (disponível automaticamente nas Edge Functions)

**Não é necessário configurar nada adicional!**

### 3. Garantir que o Admin tem Role

Execute este SQL no Supabase SQL Editor:

```sql
-- Verificar se admin tem role
SELECT 
  ur.id,
  ur.user_id,
  u.email,
  ur.role
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE u.email = 'admin@admin.com' AND ur.role = 'admin';
```

Se não retornar nenhuma linha, execute:

```sql
-- Atribuir role admin
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

### 4. Testar

1. Faça **logout** do painel admin
2. Faça **login** novamente com `admin@admin.com` / `admin123!@#`
3. As landing pages devem aparecer agora! 🎉

## Como Funciona Agora

### Antes (❌ Não funcionava):
```
Frontend → Supabase Client (com RLS) → Bloqueado por RLS → ❌
```

### Agora (✅ Funciona):
```
Frontend → Edge Function → Verifica role admin → Service Role (bypass RLS) → ✅
```

## Troubleshooting

### Se ainda não funcionar:

1. **Verifique o console do navegador** (F12) para erros
2. **Verifique os logs das Edge Functions**:
   - https://supabase.com/dashboard/project/ezbwoibhtwiqzgedoajr/functions/admin-get-pages/logs
3. **Teste a Edge Function diretamente**:
   ```bash
   curl -X GET \
     'https://ezbwoibhtwiqzgedoajr.supabase.co/functions/v1/admin-get-pages' \
     -H 'Authorization: Bearer SEU_ACCESS_TOKEN_AQUI'
   ```
   (Substitua `SEU_ACCESS_TOKEN_AQUI` pelo token de sessão do admin)

### Erro: "Não autenticado"
- Faça logout e login novamente no painel admin

### Erro: "Acesso negado"
- Verifique se o usuário tem role 'admin' na tabela `user_roles` (Passo 3 acima)

### Erro: "Erro ao buscar landing pages"
- Verifique os logs da Edge Function no dashboard do Supabase
- Verifique se `SUPABASE_SERVICE_ROLE_KEY` está configurada

## Próximos Passos

Após o deploy, o painel admin deve funcionar normalmente e mostrar todas as landing pages cadastradas! 🚀
