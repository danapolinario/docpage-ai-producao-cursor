-- Script para garantir que o usuário admin tenha a role 'admin'
-- Execute este SQL após criar a tabela user_roles

-- 1. Encontrar o ID do usuário admin
DO $$
DECLARE
  admin_user_id UUID;
  admin_email TEXT := 'admin@admin.com';
BEGIN
  -- Buscar usuário admin
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email;
  
  -- Se encontrou, garantir que tem a role admin
  IF admin_user_id IS NOT NULL THEN
    -- Inserir role admin (ignora se já existir)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Role admin verificada/atribuída ao usuário: % (email: %)', admin_user_id, admin_email;
  ELSE
    RAISE NOTICE 'Usuário % não encontrado. Faça login primeiro via /admin para criar o usuário.', admin_email;
  END IF;
END $$;

-- 2. Verificar todas as roles admin existentes
SELECT 
  ur.id as role_id,
  ur.user_id,
  u.email,
  ur.role,
  ur.created_at
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE ur.role = 'admin'
ORDER BY ur.created_at DESC;
