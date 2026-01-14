-- Create analytics_events table for tracking user and landing page events
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  landing_page_id uuid NULL,
  event_type text NOT NULL,
  metadata jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy: users can insert their own events
CREATE POLICY "Users can insert their own analytics events"
ON public.analytics_events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: users can view their own analytics events
CREATE POLICY "Users can view their own analytics events"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Optional index for faster queries by user and date
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_created_at
ON public.analytics_events (user_id, created_at DESC);
