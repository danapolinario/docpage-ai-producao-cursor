# 🔧 Fix - Tabela user_roles não encontrada (404)

## Problema

Erro 404 ao tentar acessar a tabela `user_roles`: `GET .../user_roles?select=role&user_id=eq... 404 (Not Found)`

## Solução

A tabela `user_roles` não existe no banco de dados. Você precisa criá-la.

### Passo 1: Criar Tabela e Dependências

1. Acesse o SQL Editor no Supabase:
   - https://supabase.com/dashboard/project/ezbwoibhtwiqzgedoajr/sql/new

2. Execute este SQL completo:

```sql
-- Criar enum para roles (se não existir)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Criar tabela de roles de usuário
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função security definer para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Política: Usuários podem ver suas próprias roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Política: Admins podem gerenciar todas as roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Política: Admins podem ver todas as roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

3. Clique em **"Run"** para executar

### Passo 2: Verificar se foi criada

Execute este SQL para verificar:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'user_roles';
```

Se retornar uma linha, a tabela foi criada! ✅

### Passo 3: Testar novamente

1. Tente fazer login no painel admin novamente
2. Deve funcionar agora

## Arquivo Criado

Criei o arquivo `supabase/migrations/CREATE_USER_ROLES.sql` com o SQL completo para você executar.

## O que será criado

1. ✅ Enum `app_role` com valores: 'admin', 'moderator', 'user'
2. ✅ Tabela `user_roles` com relacionamento com `auth.users`
3. ✅ Índices para performance
4. ✅ Função `has_role()` para verificar roles
5. ✅ Políticas RLS para segurança

Execute o SQL acima e teste novamente o acesso ao painel admin.
