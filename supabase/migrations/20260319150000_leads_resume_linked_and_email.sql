-- Retomada com token após linkLeadToUser (user_id preenchido) + progresso gravação pós-login.
-- Retomada por OTP: utilizador sem localStorage mas com e-mail igual ao lead na BD.

CREATE OR REPLACE FUNCTION public.get_lead_by_resume_token(token_input text)
RETURNS SETOF public.leads
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.leads
  WHERE resume_token = token_input
    AND (
      user_id IS NULL
      OR user_id = auth.uid()
    )
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.update_lead_funnel_by_token(
  token_input text,
  p_progress jsonb DEFAULT NULL,
  p_status text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.leads
  SET
    progress_data = COALESCE(p_progress, progress_data),
    status = COALESCE(p_status, status),
    updated_at = now()
  WHERE resume_token = token_input
    AND (
      user_id IS NULL
      OR user_id = auth.uid()
    );
END;
$$;

-- E-mail da sessão = e-mail do lead; um lead por e-mail (UNIQUE).
CREATE OR REPLACE FUNCTION public.get_lead_for_funnel_resume()
RETURNS SETOF public.leads
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.*
  FROM public.leads l
  INNER JOIN auth.users u ON u.id = auth.uid()
  WHERE lower(trim(l.email)) = lower(trim(u.email::text))
    AND (l.user_id IS NULL OR l.user_id = auth.uid())
  ORDER BY l.updated_at DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_lead_for_funnel_resume() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_lead_for_funnel_resume() TO authenticated;

COMMENT ON FUNCTION public.get_lead_for_funnel_resume() IS 'OTP / sessão: recupera lead do funil pelo e-mail auth.users alinhado a leads.email';
