# Google Calendar (Supabase)

## Google Cloud OAuth client

Authorized **redirect URI** (exact):

`https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/google-calendar-callback`

(Also add `http://localhost:54321/functions/v1/google-calendar-callback` if you test Edge Functions locally.)

## Supabase secrets (Edge Functions)

| Secret | Purpose |
|--------|---------|
| `GOOGLE_CLIENT_ID` | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret |
| `APP_URL` | Where users return after OAuth, e.g. `https://yourapp.com` or `http://localhost:5173` (no trailing slash required) |

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically to functions.

## Database

Apply migration `supabase/migrations/20260306_calendar_tokens.sql`:

```bash
npx supabase db push
```

(or run the SQL in the Supabase SQL Editor).

## Deploy functions

```bash
npx supabase functions deploy google-calendar-auth
npx supabase functions deploy google-calendar-callback
```

The app calls `google-calendar-auth` with **POST** and `Authorization: Bearer <session access token>`.
