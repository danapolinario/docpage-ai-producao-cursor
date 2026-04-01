-- Inserção pública de lead + retorno da linha (id, resume_token, etc.).
-- O padrão .insert().select() no cliente falha: a política SELECT só permite
-- auth.uid() = user_id, e leads anónimos têm user_id NULL (a linha inserida não é legível).

CREATE OR REPLACE FUNCTION public.create_lead_public(
  p_name text,
  p_email text,
  p_whatsapp text DEFAULT NULL,
  p_marketing_consent boolean DEFAULT false,
  p_terms_accepted boolean DEFAULT false,
  p_privacy_accepted boolean DEFAULT false
)
RETURNS public.leads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_row public.leads;
BEGIN
  INSERT INTO public.leads (
    name,
    email,
    whatsapp,
    marketing_consent,
    terms_accepted,
    privacy_accepted,
    status
  )
  VALUES (
    trim(p_name),
    lower(trim(p_email)),
    NULLIF(trim(p_whatsapp), ''),
    COALESCE(p_marketing_consent, false),
    COALESCE(p_terms_accepted, false),
    COALESCE(p_privacy_accepted, false),
    'lead_captured'
  )
  RETURNING * INTO new_row;

  RETURN new_row;
END;
$$;

REVOKE ALL ON FUNCTION public.create_lead_public(text, text, text, boolean, boolean, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_lead_public(text, text, text, boolean, boolean, boolean) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.create_lead_public(text, text, text, boolean, boolean, boolean) IS 'Cria lead no funil público e devolve a linha completa; evita RLS no SELECT pós-insert';
