-- Criar bucket landing-pages (nome usado no código)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'landing-pages', 
  'landing-pages', 
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para o bucket landing-pages
CREATE POLICY "Public can view landing-pages photos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'landing-pages');

CREATE POLICY "Authenticated users can upload to landing-pages"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'landing-pages');

CREATE POLICY "Users can update landing-pages photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'landing-pages');

CREATE POLICY "Users can delete landing-pages photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'landing-pages');