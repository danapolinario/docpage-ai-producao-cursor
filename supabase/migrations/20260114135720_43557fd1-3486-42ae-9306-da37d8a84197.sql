-- Política para admin ver todas as landing pages
CREATE POLICY "Admins can view all landing pages"
ON public.landing_pages FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Política para admin atualizar qualquer landing page
CREATE POLICY "Admins can update all landing pages"
ON public.landing_pages FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Política para admin ver todos os analytics
CREATE POLICY "Admins can view all analytics"
ON public.analytics_events FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Política para admin gerenciar custom domains
CREATE POLICY "Admins can manage all custom domains"
ON public.custom_domains FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));