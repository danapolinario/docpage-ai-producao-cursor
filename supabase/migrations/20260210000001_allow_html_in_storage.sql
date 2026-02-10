-- ============================================
-- Migration: Permitir arquivos HTML no bucket landing-pages
-- ============================================
-- Atualiza o bucket landing-pages para permitir upload de arquivos HTML
-- para armazenamento de HTML estático das landing pages

-- Atualizar allowed_mime_types do bucket para incluir HTML
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg', 
  'image/png', 
  'image/webp', 
  'image/gif',
  'text/html',
  'text/html; charset=utf-8'
]
WHERE id = 'landing-pages';

-- Garantir que políticas RLS permitem leitura pública de HTML
-- (Já existe política "Public can view landing-pages photos" que cobre todos os arquivos)

-- Política adicional para garantir que Edge Functions podem fazer upload de HTML
-- (Já existe política "Authenticated users can upload to landing-pages" que cobre isso)
