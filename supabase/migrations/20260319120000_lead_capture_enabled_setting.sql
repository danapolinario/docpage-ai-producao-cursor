-- Toggle público: o site precisa ler lead_capture_enabled antes do login (modal na home).
INSERT INTO public.admin_settings (key, value, description)
VALUES (
  'lead_capture_enabled',
  to_jsonb(true),
  'Exibe o modal de captura de lead antes do briefing (home SaaS)'
)
ON CONFLICT (key) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can read lead capture enabled setting" ON public.admin_settings;
CREATE POLICY "Anyone can read lead capture enabled setting"
ON public.admin_settings
FOR SELECT
USING (key = 'lead_capture_enabled');
