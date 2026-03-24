import "../styles/Home.scss";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function Home() {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardError, setLeaderboardError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLeaderboard() {
      setLeaderboardError(null);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, honeycomb, display_name, full_name")
          .order("honeycomb", { ascending: false })
          .limit(5);

        if (error) {
          // If the table/column isn't ready yet, just hide the leaderboard.
          if (!error.message?.toLowerCase().includes("does not exist")) {
            setLeaderboardError("Leaderboard is not available right now.");
          }
          return;
        }

        if (!isMounted) return;
        setLeaderboard(data || []);
      } catch (_e) {
        if (!isMounted) return;
        setLeaderboardError("Leaderboard is not available right now.");
      }
    }

    loadLeaderboard();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="Home_Style">
      <div className="container home-container">
        <section className="home-card">
          <header className="home-card-header">
            <h1 className="home-title">Welcome to honeycomb</h1>
            <p className="home-subtitle">Choose what you want to focus on today.</p>
          </header>

          <div className="home-primary-action">
            <h2 className="home-focus-label">Focus</h2>
            <p className="home-focus-helper">
              Start a focused session to earn honeycombs while you work.
            </p>
            <button
              type="button"
              className="home-button home-button--primary"
              onClick={() => navigate("/Timer")}
            >
              Start focus timer
            </button>
          </div>

          <div className="home-secondary-actions">
            <button
              type="button"
              className="home-button home-button--ghost"
              onClick={() => navigate("/Todo")}
            >
              Open todo list
            </button>
            <button
              type="button"
              className="home-button home-button--ghost"
              onClick={() => navigate("/Shop")}
            >
              Visit shop
            </button>
          </div>

          {(leaderboard.length > 0 || leaderboardError) && (
            <section className="home-leaderboard" aria-label="Top honeycombs">
              <h2 className="home-leaderboard-title">Top honeycombs</h2>
              {leaderboardError && (
                <p className="home-leaderboard-error">{leaderboardError}</p>
              )}
              {!leaderboardError && leaderboard.length > 0 && (
                <ol className="home-leaderboard-list">
                  {leaderboard.map((entry, index) => {
                    const name =
                      entry.display_name ||
                      entry.full_name ||
                      `User ${String(entry.id).slice(0, 6)}`;
                    return (
                      <li key={entry.id} className="home-leaderboard-item">
                        <span className="home-leaderboard-rank">#{index + 1}</span>
                        <span className="home-leaderboard-name">{name}</span>
                        <span className="home-leaderboard-score">
                          {entry.honeycomb ?? 0} hc
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          )}
        </section>
      </div>
    </div>
  );
}

export default Home;