-- Lista todos os leads para utilizadores com role admin (somente leitura operacional).
-- Não expõe resume_token nem progress_data.

CREATE OR REPLACE FUNCTION public.get_all_leads_admin()
RETURNS TABLE (
  id uuid,
  name character varying,
  email character varying,
  whatsapp character varying,
  status character varying,
  user_id uuid,
  landing_page_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.id,
    l.name,
    l.email,
    l.whatsapp,
    l.status,
    l.user_id,
    l.landing_page_id,
    l.created_at,
    l.updated_at
  FROM public.leads l
  WHERE public.has_role(auth.uid(), 'admin'::public.app_role)
  ORDER BY l.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_all_leads_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_all_leads_admin() TO authenticated;

COMMENT ON FUNCTION public.get_all_leads_admin() IS 'Leads ordenados por created_at DESC; apenas admin; sem token nem progress_data';
