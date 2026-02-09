-- Query para restaurar role admin para um usuário específico
-- Execute esta query no SQL Editor do Supabase após substituir o email

-- IMPORTANTE: Substitua 'SEU_EMAIL_ADMIN@exemplo.com' pelo email do seu usuário admin
DO $$
DECLARE
  admin_email TEXT := 'SEU_EMAIL_ADMIN@exemplo.com'; -- ALTERE AQUI
  admin_user_id UUID;
BEGIN
  -- Buscar ID do usuário pelo email
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email
  LIMIT 1;
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado com o email: %', admin_email;
  END IF;
  
  RAISE NOTICE 'Usuário encontrado: % (ID: %)', admin_email, admin_user_id;
  
  -- Verificar se já tem role admin
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = admin_user_id AND role = 'admin'
  ) THEN
    RAISE NOTICE 'Usuário já possui role admin';
  ELSE
    -- Adicionar role admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Role admin adicionada com sucesso para usuário: %', admin_user_id;
  END IF;
  
  -- Verificar resultado final
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = admin_user_id AND role = 'admin'
  ) THEN
    RAISE NOTICE '✓ Verificação: Usuário agora possui role admin';
  ELSE
    RAISE EXCEPTION 'Erro: Não foi possível adicionar role admin';
  END IF;
END $$;

-- Query alternativa: Adicionar role admin diretamente (se souber o user_id)
-- Descomente e substitua 'USER_ID_AQUI' pelo ID do usuário
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('USER_ID_AQUI', 'admin')
-- ON CONFLICT (user_id, role) DO NOTHING;

-- Query para listar todos os usuários admin
SELECT 
  ur.id AS role_id,
  ur.user_id,
  ur.role,
  ur.created_at AS role_created_at,
  u.email,
  u.email_confirmed_at,
  u.created_at AS user_created_at
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE ur.role = 'admin'
ORDER BY ur.created_at DESC;
