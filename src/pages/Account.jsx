import "../styles/Account.scss";
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getCurrentSession } from "../lib/authentication";
import { supabase, SUPABASE_ANON_KEY, SUPABASE_URL } from "../lib/supabaseClient";
import {
  loadBlockedSites,
  saveBlockedSites,
  DEFAULT_BLOCKED_SITES,
  normalizeDomain,
} from "../lib/blockedSites";

export default function Account() {
  const [profile, setProfile] = useState({ displayName: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [passwordNew, setPasswordNew] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [blockedSites, setBlockedSites] = useState(() => loadBlockedSites());
  const [newSite, setNewSite] = useState("");
  const [calendarConnecting, setCalendarConnecting] = useState(false);
  const [calendarMessage, setCalendarMessage] = useState(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const session = await getCurrentSession();
      if (!session?.user) {
        navigate("/Sign_In", { replace: true });
        return;
      }
      if (!isMounted) return;

      const name =
        session.user.user_metadata?.full_name ||
        session.user.user_metadata?.name ||
        "";
      setProfile({
        displayName: name,
        email: session.user.email || "",
      });
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    const cal = searchParams.get("calendar");
    if (cal === "connected") {
      setCalendarMessage({ type: "success", text: "Google Calendar connected." });
      const next = new URLSearchParams(searchParams);
      next.delete("calendar");
      setSearchParams(next, { replace: true });
      return;
    }
    if (cal === "error") {
      setCalendarMessage({
        type: "error",
        text: "Could not connect Google Calendar. Try again or check Google Cloud redirect URIs.",
      });
      const next = new URLSearchParams(searchParams);
      next.delete("calendar");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  async function handleConnectGoogleCalendar() {
    setCalendarMessage(null);
    if (!SUPABASE_URL) {
      setCalendarMessage({
        type: "error",
        text: "Supabase URL is not configured (VITE_SUPABASE_URL).",
      });
      return;
    }
    setCalendarConnecting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setCalendarMessage({ type: "error", text: "You must be signed in." });
        return;
      }
      const tokenPayload = (() => {
        try {
          const part = token.split(".")[1];
          if (!part) return null;
          return JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
        } catch {
          return null;
        }
      })();
      const tokenIssuer = tokenPayload?.iss ? String(tokenPayload.iss) : "";
      if (tokenIssuer && SUPABASE_URL && !tokenIssuer.includes(SUPABASE_URL.replace(/\/$/, ""))) {
        setCalendarMessage({
          type: "error",
          text: "Session mismatch detected. Please log out and sign in again, then reconnect Google Calendar.",
        });
        return;
      }
      const fnUrl = `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/google-calendar-auth`;
      const doRequest = async (jwt) => {
        const res = await fetch(fnUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${jwt}`,
            apikey: SUPABASE_ANON_KEY,
            "Content-Type": "application/json",
          },
        });
        const raw = await res.text();
        let body = {};
        try {
          body = raw ? JSON.parse(raw) : {};
        } catch {
          body = { error: raw };
        }
        return { res, body };
      };

      let { res, body } = await doRequest(token);
      if (res.status === 401) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        const refreshedToken = refreshed?.session?.access_token;
        if (refreshedToken) {
          ({ res, body } = await doRequest(refreshedToken));
        }
      }
      if (!res.ok) {
        setCalendarMessage({
          type: "error",
          text: body?.error || body?.details || `Request failed (${res.status}).`,
        });
        return;
      }
      if (body?.redirectUrl) {
        window.location.href = body.redirectUrl;
        return;
      }
      setCalendarMessage({ type: "error", text: "Invalid response from server." });
    } catch (err) {
      setCalendarMessage({
        type: "error",
        text: err?.message || "Could not start Google sign-in.",
      });
    } finally {
      setCalendarConnecting(false);
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.auth.updateUser({
        data: { full_name: profile.displayName },
      });

      setMessage({ type: "success", text: "Profile updated." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err?.message || "Could not update profile.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordMessage(null);
    if (passwordNew.length < 6) {
      setPasswordMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    if (passwordNew !== passwordConfirm) {
      setPasswordMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    setPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordNew });
      if (error) throw error;
      setPasswordMessage({ type: "success", text: "Password updated." });
      setPasswordNew("");
      setPasswordConfirm("");
    } catch (err) {
      setPasswordMessage({ type: "error", text: err?.message || "Could not update password." });
    } finally {
      setPasswordSaving(false);
    }
  }

  function addBlockedSite() {
    const domain = normalizeDomain(newSite);
    if (!domain || blockedSites.includes(domain)) return;
    const next = [...blockedSites, domain];
    setBlockedSites(next);
    saveBlockedSites(next);
    setNewSite("");
  }

  function removeBlockedSite(domain) {
    const next = blockedSites.filter((d) => d !== domain);
    setBlockedSites(next);
    saveBlockedSites(next);
  }

  function resetBlockedSitesToDefault() {
    setBlockedSites(DEFAULT_BLOCKED_SITES);
    saveBlockedSites(DEFAULT_BLOCKED_SITES);
  }

  return (
    <div className="Account_Style">
      <div className="cloud cloud-1" aria-hidden="true" />
      <div className="cloud cloud-2" aria-hidden="true" />
      <div className="cloud cloud-3" aria-hidden="true" />
      <div className="account-bees" aria-hidden="true">
        <img id="account-bee-left" className="bee bee-float" src="images/Test_Bee_Logo2.png" alt="" />
        <img id="account-bee-top" className="bee bee-buzz" src="images/Test_Bee_Logo4.png" alt="" />
        <img id="account-bee-right" className="bee bee-float" src="images/Test_Bee_Logo3.png" alt="" />
      </div>
      <div className="account-container">
        <h1 className="account-title">Account</h1>
        <p className="account-subtitle">
          Manage your profile, connect calendars, and add friends.
        </p>

        <section className="account-card">
          <h2 className="account-card-title">Profile</h2>
          <form onSubmit={handleSaveProfile} className="account-form">
            <label className="account-label">
              Display name
              <input
                type="text"
                className="account-input"
                value={profile.displayName}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, displayName: e.target.value }))
                }
                placeholder="Your name"
              />
            </label>
            <label className="account-label account-label--readonly">
              Email
              <input
                type="email"
                className="account-input"
                value={profile.email}
                readOnly
                aria-readonly
              />
            </label>
            <button
              type="submit"
              className="account-button"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save profile"}
            </button>
          </form>
          {message && (
            <p
              className={
                message.type === "success"
                  ? "account-message account-message--success"
                  : "account-message account-message--error"
              }
            >
              {message.text}
            </p>
          )}

          <div className="account-password-section">
            <h3 className="account-password-title">Change password</h3>
            <form onSubmit={handleChangePassword} className="account-form">
              <label className="account-label">
                New password
                <input
                  type="password"
                  className="account-input"
                  value={passwordNew}
                  onChange={(e) => setPasswordNew(e.target.value)}
                  placeholder="At least 6 characters"
                  minLength={6}
                  autoComplete="new-password"
                />
              </label>
              <label className="account-label">
                Confirm new password
                <input
                  type="password"
                  className="account-input"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
              </label>
              <button
                type="submit"
                className="account-button"
                disabled={passwordSaving}
              >
                {passwordSaving ? "Updating…" : "Change password"}
              </button>
            </form>
            {passwordMessage && (
              <p
                className={
                  passwordMessage.type === "success"
                    ? "account-message account-message--success"
                    : "account-message account-message--error"
                }
              >
                {passwordMessage.text}
              </p>
            )}
          </div>
        </section>

        <section className="account-card">
          <h2 className="account-card-title">Blocked websites</h2>
          <p className="account-card-desc">
            Sites to avoid during focus. Default: social media. Add or remove domains below.
          </p>
          <div className="account-blocked-list">
            {blockedSites.map((domain) => (
              <span key={domain} className="account-blocked-tag">
                {domain}
                <button
                  type="button"
                  className="account-blocked-remove"
                  aria-label={`Remove ${domain}`}
                  onClick={() => removeBlockedSite(domain)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="account-blocked-add">
            <input
              type="text"
              className="account-input"
              placeholder="e.g. netflix.com"
              value={newSite}
              onChange={(e) => setNewSite(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addBlockedSite())}
            />
            <button type="button" className="account-button" onClick={addBlockedSite}>
              Add
            </button>
          </div>
          <button type="button" className="account-blocked-reset" onClick={resetBlockedSitesToDefault}>
            Reset to default (social media)
          </button>
        </section>

        <section className="account-card">
          <h2 className="account-card-title">Integrations</h2>
          <p className="account-card-desc">
            Connect your calendar or Canvas to see events and assignments in your honeycomb calendar.
          </p>
          {calendarMessage && (
            <p
              className={
                calendarMessage.type === "success"
                  ? "account-message account-message--success"
                  : "account-message account-message--error"
              }
              role="status"
            >
              {calendarMessage.text}
            </p>
          )}
          <div className="account-integrations">
            <div className="account-integration">
              <div className="account-integration-info">
                <span className="account-integration-name">Google Calendar</span>
                <span className="account-integration-desc">
                  Show your Google Calendar events alongside your tasks.
                </span>
              </div>
              <button
                type="button"
                className="account-connect"
                disabled={calendarConnecting}
                onClick={handleConnectGoogleCalendar}
              >
                {calendarConnecting ? "Opening Google…" : "Connect Google Calendar"}
              </button>
            </div>
            <div className="account-integration">
              <div className="account-integration-info">
                <span className="account-integration-name">Apple Calendar</span>
                <span className="account-integration-desc">
                  Sync events from your Apple Calendar (iCloud).
                </span>
              </div>
              <button type="button" className="account-connect" disabled>
                Connect (coming soon)
              </button>
            </div>
            <div className="account-integration">
              <div className="account-integration-info">
                <span className="account-integration-name">Outlook Calendar</span>
                <span className="account-integration-desc">
                  Bring in meetings and events from Microsoft Outlook.
                </span>
              </div>
              <button type="button" className="account-connect" disabled>
                Connect (coming soon)
              </button>
            </div>
            <div className="account-integration">
              <div className="account-integration-info">
                <span className="account-integration-name">Canvas</span>
                <span className="account-integration-desc">
                  Bring in assignments and due dates from Canvas LMS.
                </span>
              </div>
              <button type="button" className="account-connect" disabled>
                Connect (coming soon)
              </button>
            </div>
          </div>
        </section>

        <section className="account-card">
          <h2 className="account-card-title">Friends</h2>
          <p className="account-card-desc">
            Add friends to share progress or compete on focus time.
          </p>
          <div className="account-friends-placeholder">
            <p>Friend invites and search will be available here soon.</p>
            <button type="button" className="account-connect" disabled>
              Add friends (coming soon)
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
