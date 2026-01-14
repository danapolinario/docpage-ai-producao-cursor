-- ============================================
-- Políticas de Storage para Fotos
-- ============================================
-- Execute este SQL após criar o bucket 'landing-page-photos' no Storage

-- Política: Usuários podem fazer upload de fotos
CREATE POLICY "Users can upload photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'landing-page-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política: Fotos são públicas (para exibição nas landing pages)
CREATE POLICY "Photos are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'landing-page-photos');

-- Política: Usuários podem deletar suas próprias fotos
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'landing-page-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
