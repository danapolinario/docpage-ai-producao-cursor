# 🔧 Fix - Admin não vê landing pages no painel

## Problema

O painel admin mostra "Nenhuma landing page cadastrada ainda." mesmo tendo landing pages criadas.

## Causa

O usuário admin não tem a role 'admin' na tabela `user_roles`, então as políticas RLS bloqueiam o acesso às landing pages.

## Solução

### Passo 1: Verificar se o usuário admin existe e obter o ID

1. Acesse o SQL Editor no Supabase:
   - https://supabase.com/dashboard/project/ezbwoibhtwiqzgedoajr/sql/new

2. Execute este SQL para encontrar o ID do usuário admin:

```sql
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'admin@admin.com';
```

Anote o `id` retornado (será um UUID).

### Passo 2: Verificar se a role admin existe

Execute este SQL:

```sql
SELECT * 
FROM public.user_roles 
WHERE user_id = 'SEU_USER_ID_AQUI' AND role = 'admin';
```

Substitua `SEU_USER_ID_AQUI` pelo ID obtido no Passo 1.

Se não retornar nenhuma linha, você precisa criar a role.

### Passo 3: Criar/Atribuir a role admin

Execute este SQL (substitua `SEU_USER_ID_AQUI` pelo ID do usuário):

```sql
-- Inserir role admin para o usuário (ignora se já existir)
INSERT INTO public.user_roles (user_id, role)
VALUES ('SEU_USER_ID_AQUI', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

### Passo 4: Verificar novamente

Execute novamente o SQL do Passo 2. Deve retornar uma linha agora.

### Passo 5: Testar o painel admin

1. Faça logout do painel admin
2. Faça login novamente com `admin@admin.com` / `admin123!@#`
3. As landing pages devem aparecer agora!

## Solução Automática (Script Completo)

Se preferir, execute este script completo que faz tudo automaticamente:

```sql
-- 1. Encontrar ou criar usuário admin (se necessário)
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Buscar usuário admin
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@admin.com';
  
  -- Se não encontrou, criar (requer permissões de admin)
  IF admin_user_id IS NULL THEN
    RAISE NOTICE 'Usuário admin@admin.com não encontrado. Você precisa criar manualmente via Supabase Auth ou fazer login primeiro.';
  ELSE
    -- Garantir que a role admin existe
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Role admin atribuída ao usuário: %', admin_user_id;
  END IF;
END $$;

-- 2. Verificar todas as roles admin existentes
SELECT 
  ur.id,
  ur.user_id,
  u.email,
  ur.role,
  ur.created_at
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE ur.role = 'admin';
```

## Alternativa: Usar a função admin-login

A função `admin-login` deveria criar a role automaticamente ao fazer login. Se não funcionou:

1. Verifique se as variáveis `ADMIN_EMAIL` e `ADMIN_PASSWORD` estão configuradas no Supabase:
   - Settings > Edge Functions > Secrets
   - Deve ter: `ADMIN_EMAIL=admin@admin.com` e `ADMIN_PASSWORD=admin123!@#`

2. Faça logout e login novamente no painel admin

3. A função deve criar/verificar a role automaticamente

## Verificar se está funcionando

Execute este SQL para ver todas as landing pages (como admin):

```sql
SELECT 
  id,
  subdomain,
  status,
  user_id,
  created_at
FROM public.landing_pages
ORDER BY created_at DESC;
```

Se você conseguir ver as landing pages com este SQL, mas não no painel, o problema pode ser na autenticação do frontend. Verifique o console do navegador para erros.
