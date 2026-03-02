import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentSession, onAuthStateChange, signOutUser } from "../lib/authentication";
import { supabase } from "../lib/supabaseClient";
import "../styles/Navbar.scss";

export function Navbar() {
  const [session, setSession] = useState(null);
  const [honeycombBalance, setHoneycombBalance] = useState(0);
  const navigate = useNavigate();

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

  async function handleLogout() {
    await signOutUser();
    setHoneycombBalance(0);
    navigate("/Sign_In", { replace: true });
  }

  return (
    <nav className="navbar">
      {session ? (
        <>
          <div className="navbar-links">
            <Link to="/">
              <button className="navbar-button">Home</button>
            </Link>
            <Link to="/Todo">
              <button className="navbar-button">Todo</button>
            </Link>
            <Link to="/Timer">
              <button className="navbar-button">Timer</button>
            </Link>
            <Link to="/Shop">
              <button className="navbar-button">Shop</button>
            </Link>
            <button className="navbar-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
          <div className="honeycomb-tracker" aria-live="polite">
            Honeycombs: {honeycombBalance}
          </div>
        </>
      ) : (
        <div className="navbar-links">
          <Link to="/Sign_In?mode=signup">
            <button className="navbar-button">Sign Up</button>
          </Link>
          <Link to="/Sign_In?mode=login">
            <button className="navbar-button">Log In</button>
          </Link>
        </div>
      )}
    </nav>
  );
}
