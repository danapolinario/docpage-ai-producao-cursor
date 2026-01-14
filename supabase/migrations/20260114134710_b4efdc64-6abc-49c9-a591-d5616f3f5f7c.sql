-- Adicionar coluna CPF à tabela landing_pages
ALTER TABLE public.landing_pages ADD COLUMN IF NOT EXISTS cpf VARCHAR(14);

-- Criar bucket para fotos das landing pages
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'landing-photos', 
  'landing-photos', 
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para o bucket
CREATE POLICY "Public can view landing photos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'landing-photos');

CREATE POLICY "Authenticated users can upload landing photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'landing-photos');

CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'landing-photos');

CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'landing-photos');