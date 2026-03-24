import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getCurrentSession, onAuthStateChange, signOutUser } from "../lib/authentication";
import { supabase } from "../lib/supabaseClient";
import "../styles/Navbar.scss";

export function Navbar({ isCollapsed, onToggleCollapsed }) {
  const [session, setSession] = useState(null);
  const [honeycombBalance, setHoneycombBalance] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  function isActive(path) {
    if (path === "/") return location.pathname === "/" || location.pathname === "";
    return location.pathname === path;
  }

  async function handleLogout() {
    await signOutUser();
    navigate("/Sign_In", { replace: true });
  }

  useEffect(() => {
    let isMounted = true;

    async function loadSessionAndBalance() {
      const activeSession = await getCurrentSession();
      if (!isMounted) {
        return;
      }

      setSession(activeSession);
      const userId = activeSession?.user?.id;

      if (!userId) {
        setHoneycombBalance(0);
        return;
      }

      await loadHoneycombBalance(userId);
    }

    loadSessionAndBalance();

    const {
      data: { subscription },
    } = onAuthStateChange(async (nextSession) => {
      if (!isMounted) {
        return;
      }

      setSession(nextSession);
      const userId = nextSession?.user?.id;

      if (!userId) {
        setHoneycombBalance(0);
        return;
      }

      await loadHoneycombBalance(userId);
    });

    async function handleHoneycombUpdated(event) {
      const userId = event?.detail?.userId || (await getCurrentSession())?.user?.id;
      if (!userId) {
        return;
      }

      if (typeof event?.detail?.newTotal === "number") {
        setHoneycombBalance(event.detail.newTotal);
        return;
      }

      await loadHoneycombBalance(userId);
    }

    window.addEventListener("honeycomb-updated", handleHoneycombUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener("honeycomb-updated", handleHoneycombUpdated);
      subscription.unsubscribe();
    };
  }, []);

  function isMissingColumnError(error, tableName, columnName) {
    const message = (error?.message || "").toLowerCase();
    return message.includes(tableName) && message.includes(columnName) && message.includes("does not exist");
  }

  async function loadHoneycombBalance(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("honeycomb")
      .eq("id", userId)
      .single();

    if (!error) {
      setHoneycombBalance(data?.honeycomb ?? 0);
      return;
    }

    if (!isMissingColumnError(error, "profiles", "honeycomb")) {
      setHoneycombBalance(0);
      return;
    }

    const { data: legacyData, error: legacyError } = await supabase
      .from("profiles")
      .select("points")
      .eq("id", userId)
      .single();

    if (legacyError) {
      setHoneycombBalance(0);
      return;
    }

    setHoneycombBalance(legacyData?.points ?? 0);
  }

  return (
    <nav className={`navbar navbar--sidebar ${isCollapsed ? "navbar--collapsed" : ""}`} aria-label="Main navigation">
      <button
        type="button"
        className="navbar-toggle"
        onClick={onToggleCollapsed}
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? "Show navigation" : "Hide navigation"}
        title={isCollapsed ? "Show nav" : "Hide nav"}
      >
        {isCollapsed ? (
          <span className="navbar-toggle-icon" aria-hidden="true">›</span>
        ) : (
          <span className="navbar-toggle-icon" aria-hidden="true">‹</span>
        )}
      </button>
      {session ? (
        <>
          <div className="navbar-header">
            <div className="navbar-brand">
              <img src="images/Test_Bee_Logo2.png" alt="" className="navbar-brand-bee" aria-hidden="true" />
              <span className="navbar-brand-text">honeycomb</span>
            </div>
            <div className="honeycomb-tracker" aria-live="polite">
              Honeycombs: {honeycombBalance}
            </div>
          </div>
          <div className="navbar-links">
            <Link to="/" className={`navbar-link ${isActive("/") ? "navbar-link--active" : ""}`}>
              Home
            </Link>
            <Link to="/Todo" className={`navbar-link ${isActive("/Todo") ? "navbar-link--active" : ""}`}>
              Todo
            </Link>
            <Link to="/Timer" className={`navbar-link ${isActive("/Timer") ? "navbar-link--active" : ""}`}>
              Focus
            </Link>
            <Link to="/Shop" className={`navbar-link ${isActive("/Shop") ? "navbar-link--active" : ""}`}>
              Shop
            </Link>
            <Link to="/Account" className={`navbar-link ${isActive("/Account") ? "navbar-link--active" : ""}`}>
              Account
            </Link>
          </div>
          <div className="navbar-footer">
            <button type="button" className="navbar-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </>
      ) : (
        <div className="navbar-links">
          <Link to="/Sign_In?mode=signup" className="navbar-link">
            Sign Up
          </Link>
          <Link to="/Sign_In?mode=login" className="navbar-link">
            Log In
          </Link>
        </div>
      )}
    </nav>
  );
}
