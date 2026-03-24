-- Google Calendar OAuth token storage (per user)
CREATE TABLE IF NOT EXISTS public.calendar_tokens (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only read their own row (app / future calendar sync)
CREATE POLICY "calendar_tokens_select_own"
  ON public.calendar_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Edge Function uses service role to upsert; these policies cover direct client use if needed later
CREATE POLICY "calendar_tokens_insert_own"
  ON public.calendar_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "calendar_tokens_update_own"
  ON public.calendar_tokens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.calendar_tokens IS 'Google Calendar OAuth tokens; written by google-calendar-callback Edge Function.';
