-- Corrigir Security Definer View - Usar security_invoker
DROP VIEW IF EXISTS public.landing_pages_public;

CREATE VIEW public.landing_pages_public
WITH (security_invoker=on) AS
SELECT 
  id,
  subdomain,
  custom_domain,
  slug,
  briefing_data,
  content_data,
  design_settings,
  section_visibility,
  layout_variant,
  photo_url,
  about_photo_url,
  meta_title,
  meta_description,
  meta_keywords,
  og_image_url,
  schema_markup,
  status,
  published_at,
  view_count,
  last_viewed_at,
  created_at,
  updated_at
FROM public.landing_pages
WHERE status = 'published';

-- Permitir acesso público à view
GRANT SELECT ON public.landing_pages_public TO anon, authenticated;

-- Corrigir função cleanup_old_analytics com search_path
DROP FUNCTION IF EXISTS public.cleanup_old_analytics();

CREATE OR REPLACE FUNCTION public.cleanup_old_analytics()
RETURNS void AS $$
BEGIN
  DELETE FROM public.analytics_events 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  UPDATE public.analytics_events 
  SET ip_address = NULL
  WHERE created_at < NOW() - INTERVAL '30 days' 
  AND ip_address IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.cleanup_old_analytics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_old_analytics() TO authenticated;