CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'user'
);


--
-- Name: check_subdomain_available(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_subdomain_available(check_subdomain text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.landing_pages 
    WHERE subdomain = lower(check_subdomain)
  );
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_landing_pages_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_landing_pages_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: landing_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.landing_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    subdomain text NOT NULL,
    custom_domain text,
    slug text NOT NULL,
    briefing_data jsonb NOT NULL,
    content_data jsonb NOT NULL,
    design_settings jsonb NOT NULL,
    section_visibility jsonb,
    layout_variant integer DEFAULT 0,
    photo_url text,
    about_photo_url text,
    meta_title text,
    meta_description text,
    meta_keywords text[],
    og_image_url text,
    schema_markup jsonb,
    status text DEFAULT 'draft'::text NOT NULL,
    published_at timestamp with time zone,
    view_count integer DEFAULT 0,
    last_viewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT landing_pages_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])))
);


--
-- Name: otp_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.otp_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    code text NOT NULL,
    name text,
    expires_at timestamp with time zone NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: landing_pages landing_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.landing_pages
    ADD CONSTRAINT landing_pages_pkey PRIMARY KEY (id);


--
-- Name: landing_pages landing_pages_subdomain_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.landing_pages
    ADD CONSTRAINT landing_pages_subdomain_key UNIQUE (subdomain);


--
-- Name: otp_codes otp_codes_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otp_codes
    ADD CONSTRAINT otp_codes_email_key UNIQUE (email);


--
-- Name: otp_codes otp_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otp_codes
    ADD CONSTRAINT otp_codes_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_landing_pages_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_landing_pages_status ON public.landing_pages USING btree (status);


--
-- Name: idx_landing_pages_subdomain; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_landing_pages_subdomain ON public.landing_pages USING btree (subdomain);


--
-- Name: idx_landing_pages_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_landing_pages_user_id ON public.landing_pages USING btree (user_id);


--
-- Name: idx_otp_codes_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_otp_codes_email ON public.otp_codes USING btree (email);


--
-- Name: idx_user_roles_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_role ON public.user_roles USING btree (role);


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);


--
-- Name: landing_pages update_landing_pages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_landing_pages_updated_at BEFORE UPDATE ON public.landing_pages FOR EACH ROW EXECUTE FUNCTION public.update_landing_pages_updated_at();


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: landing_pages Admins can update all landing pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all landing pages" ON public.landing_pages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: landing_pages Admins can view all landing pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all landing pages" ON public.landing_pages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: landing_pages Anyone can view published landing pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view published landing pages" ON public.landing_pages FOR SELECT TO anon USING ((status = 'published'::text));


--
-- Name: landing_pages Users can create their own landing pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own landing pages" ON public.landing_pages FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: landing_pages Users can delete their own landing pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own landing pages" ON public.landing_pages FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: landing_pages Users can update their own landing pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own landing pages" ON public.landing_pages FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: landing_pages Users can view their own landing pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own landing pages" ON public.landing_pages FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: landing_pages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

--
-- Name: otp_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;