import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";

function appBase(): string {
  const raw =
    Deno.env.get("APP_URL") ??
    Deno.env.get("SITE_URL") ??
    "http://localhost:5173";
  return raw.replace(/\/$/, "");
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  const base = appBase();

  if (oauthError) {
    return Response.redirect(`${base}/Account?calendar=error`, 302);
  }

  if (!code || !state) {
    return Response.redirect(`${base}/Account?calendar=error`, 302);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

  if (!supabaseUrl || !serviceKey || !clientId || !clientSecret) {
    return Response.redirect(`${base}/Account?calendar=error`, 302);
  }

  const supabaseUrlClean = supabaseUrl.replace(/\/$/, "");
  const redirectUri = `${supabaseUrlClean}/functions/v1/google-calendar-callback`;

  const tokenRes = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    return Response.redirect(`${base}/Account?calendar=error`, 302);
  }

  const tokens = await tokenRes.json() as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  if (!tokens.access_token) {
    return Response.redirect(`${base}/Account?calendar=error`, 302);
  }

  const userId = state;
  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: upsertError } = await admin.from("calendar_tokens").upsert(
    {
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (upsertError) {
    return Response.redirect(`${base}/Account?calendar=error`, 302);
  }

  return Response.redirect(`${base}/Account?calendar=connected`, 302);
});
