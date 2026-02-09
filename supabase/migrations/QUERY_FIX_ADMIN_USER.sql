-- Query para diagnosticar e corrigir problemas com usuário admin
-- Execute esta query no SQL Editor do Supabase

-- 1. Verificar se existe usuário admin em auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at
FROM auth.users
WHERE email = (SELECT value FROM pg_settings WHERE name = 'app.settings.admin_email' LIMIT 1)
   OR email LIKE '%admin%'
ORDER BY created_at DESC
LIMIT 5;

-- 2. Verificar roles do usuário admin
SELECT 
  ur.id,
  ur.user_id,
  ur.role,
  ur.created_at,
  u.email
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE ur.role = 'admin'
ORDER BY ur.created_at DESC;

-- 3. Verificar se há problemas com RLS
-- Desabilitar temporariamente RLS para verificar dados (apenas para diagnóstico)
-- SET row_security = off;
-- SELECT * FROM public.user_roles WHERE role = 'admin';
-- SET row_security = on;

-- 4. Criar/atualizar role admin para um usuário específico
-- Substitua 'USER_ID_AQUI' pelo ID do usuário admin
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('USER_ID_AQUI', 'admin')
-- ON CONFLICT (user_id, role) DO NOTHING;

-- 5. Query para encontrar usuário admin pelo email e adicionar role se não existir
-- Substitua 'admin@exemplo.com' pelo email do admin
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Buscar ID do usuário pelo email
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@exemplo.com' -- ALTERE AQUI COM O EMAIL DO ADMIN
  LIMIT 1;
  
  IF admin_user_id IS NOT NULL THEN
    -- Adicionar role admin se não existir
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Role admin adicionada para usuário: %', admin_user_id;
  ELSE
    RAISE NOTICE 'Usuário não encontrado com o email fornecido';
  END IF;
END $$;

-- 6. Verificar políticas RLS da tabela user_roles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_roles';
