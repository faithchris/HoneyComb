import { Navbar } from "./components/Navbar";
import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";

const NAV_COLLAPSED_KEY = "honeycomb_nav_collapsed";

export function Layout() {
  const [navCollapsed, setNavCollapsed] = useState(() => {
    try {
      return localStorage.getItem(NAV_COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(NAV_COLLAPSED_KEY, String(navCollapsed));
    } catch (_) {}
  }, [navCollapsed]);

  const toggleNav = () => setNavCollapsed((c) => !c);

  return (
    <div className={`app-layout ${navCollapsed ? "app-layout--nav-collapsed" : ""}`}>
      <Navbar isCollapsed={navCollapsed} onToggleCollapsed={toggleNav} />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}