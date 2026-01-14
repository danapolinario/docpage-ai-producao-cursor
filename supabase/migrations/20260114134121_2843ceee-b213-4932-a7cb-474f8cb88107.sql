-- Corrigir function search_path para update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Corrigir function search_path para check_subdomain_available
CREATE OR REPLACE FUNCTION public.check_subdomain_available(check_subdomain TEXT)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 
    FROM public.landing_pages 
    WHERE subdomain = LOWER(check_subdomain)
  );
END;
$$;

-- Corrigir RLS policy permissiva - adicionar validação de landing_page existente
DROP POLICY IF EXISTS "Public can insert analytics events" ON public.analytics_events;
CREATE POLICY "Public can insert analytics events"
  ON public.analytics_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.landing_pages
      WHERE landing_pages.id = landing_page_id
      AND landing_pages.status = 'published'
    )
  );