-- ============================================
-- Migration: Criar bucket landing-pages se não existir
-- ============================================
-- Esta migration garante que o bucket landing-pages existe
-- e está configurado para aceitar imagens e HTML

-- Criar bucket landing-pages se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'landing-pages', 
  'landing-pages', 
  true,
  10485760, -- 10MB (aumentado para suportar HTML)
  ARRAY[
    'image/jpeg', 
    'image/png', 
    'image/webp', 
    'image/gif',
    'text/html',
    'text/html; charset=utf-8'
  ]
)
ON CONFLICT (id) DO UPDATE
SET 
  allowed_mime_types = ARRAY[
    'image/jpeg', 
    'image/png', 
    'image/webp', 
    'image/gif',
    'text/html',
    'text/html; charset=utf-8'
  ],
  file_size_limit = 10485760; -- 10MB

-- Políticas de storage para o bucket landing-pages
-- Remover políticas antigas se existirem (para evitar duplicatas)
DROP POLICY IF EXISTS "Public can view landing-pages photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to landing-pages" ON storage.objects;
DROP POLICY IF EXISTS "Users can update landing-pages photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete landing-pages photos" ON storage.objects;

-- Política: Leitura pública (para servir HTML estático e fotos)
CREATE POLICY "Public can view landing-pages files"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'landing-pages');

-- Política: Upload por usuários autenticados e Edge Functions
CREATE POLICY "Authenticated users can upload to landing-pages"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'landing-pages');

-- Política: Atualização por usuários autenticados e Edge Functions
CREATE POLICY "Users can update landing-pages files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'landing-pages');

-- Política: Deletar por usuários autenticados e Edge Functions
CREATE POLICY "Users can delete landing-pages files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'landing-pages');

-- Verificar se o bucket foi criado
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'landing-pages') THEN
    RAISE NOTICE 'Bucket landing-pages criado/atualizado com sucesso!';
  ELSE
    RAISE EXCEPTION 'Erro: Bucket landing-pages não foi criado';
  END IF;
END $$;
