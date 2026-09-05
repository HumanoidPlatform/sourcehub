// The console chrome: rail, topbar, notification bell, theme cycler.
//
// Ported from the prototype's §9 CHROME over the same class names. Navigation
// is derived from the session's role, exactly as the prototype's NAV registry
// keys pages by persona.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { get, post } from "@api/client";
import { useSession } from "@shared/auth";
import { BrandMark } from "@shared/brand";
import { ProfileMenu } from "./ProfileMenu";

interface NavItem {
  to: string;
  label: string;
}

const NAV: Record<string, NavItem[]> = {
  client: [
    { to: "/", label: "Overview" },
    { to: "/requests", label: "Requests" },
    { to: "/requests/new", label: "New request" },
    { to: "/deliveries", label: "Deliveries" },
    { to: "/billing", label: "Billing" },
  ],
  tenant: [
    { to: "/", label: "Overview" },
    { to: "/opportunities", label: "Opportunities" },
    { to: "/proposals", label: "Proposals" },
    { to: "/contracts", label: "Contracts" },
    { to: "/network", label: "Network" },
    { to: "/qa", label: "QA and delivery" },
  ],
  aggregator: [
    { to: "/", label: "Overview" },
    { to: "/tasks", label: "Tasks" },
    { to: "/review", label: "Review" },
    { to: "/roster", label: "Crowd roster" },
    { to: "/equipment", label: "Equipment" },
  ],
  // a field worker who signs in here sees their assignments read-only;
  // capture happens in the phone app
  worker: [
    { to: "/", label: "My assignments" },
  ],
  business: [
    { to: "/", label: "Overview" },
    { to: "/tasks", label: "Engagements" },
    { to: "/capacity", label: "Capacity" },
    { to: "/equipment", label: "Equipment" },
  ],
  sponsor: [
    { to: "/", label: "Overview" },
    { to: "/inventory", label: "Inventory" },
    { to: "/loans", label: "Requests" },
  ],
  platform_admin: [
    { to: "/", label: "Accounts" },
    { to: "/onboarding", label: "Onboarding" },
    { to: "/billing", label: "Billing" },
    { to: "/activity", label: "Activity" },
  ],
};

export const WORKSPACE: Record<string, string> = {
  client: "Client",
  tenant: "Delivery partner",
  aggregator: "Aggregator",
  business: "Business partner",
  sponsor: "Device sponsor",
  platform_admin: "Platform operations",
  worker: "Crowd worker",
};

type Theme = "system" | "light" | "dark";

function applyTheme(t: Theme) {
  const root = document.documentElement;
  if (t === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", t);
}

interface NotificationRow {
  id: string;
  body: string;
  link_page: string | null;
  read: boolean;
  created_at: string;
}

export function Shell({ children }: { children: ReactNode }) {
  const session = useSession();
  const qc = useQueryClient();
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem("sourcehub.theme") as Theme) || "system";
    } catch {
      return "system";
    }
  });
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => applyTheme(theme), [theme]);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const bell = useQuery({
    queryKey: ["notifications"],
    queryFn: () => get<{ unread: number; items: NotificationRow[] }>("/notifications"),
    refetchInterval: 20_000,
  });

  const cycleTheme = () => {
    const next: Theme = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    setTheme(next);
    try {
      localStorage.setItem("sourcehub.theme", next);
    } catch {
      /* fine */
    }
  };

  const nav = NAV[session.role] ?? NAV.client!;

  return (
    <div className="app">
      <a className="skip" href="#main">Skip to content</a>
      <aside className="rail">
        <div className="rail-head">
          <BrandMark />
        </div>
        <div className="rail-ctx">
          <div className="rail-ctx-name">{session.org_name}</div>
          <div className="rail-ctx-meta">{WORKSPACE[session.role] ?? session.role} workspace</div>
        </div>
        <nav className="rail-nav" aria-label="Primary">
          <div className="rail-group">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) => "rail-item" + (isActive ? " is-active" : "")}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
        <div className="rail-foot">
          <NavLink to="/design" className="rail-item">Design system</NavLink>
          <button type="button" className="rail-item" onClick={cycleTheme}>
            Theme: {theme}
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="crumbs">
            <b>{WORKSPACE[session.role] ?? session.role}</b>
            <span aria-hidden="true">·</span>
            <span>{session.org_name}</span>
          </div>
          <div className="topbar-spacer" style={{ flex: 1 }} />
          <div className="topbar-tools hostrel" ref={bellRef}>
            <button
              type="button"
              className="iconbtn"
              aria-label={`Notifications, ${bell.data?.unread ?? 0} unread`}
              onClick={() => setBellOpen((o) => !o)}
            >
              ◔{(bell.data?.unread ?? 0) > 0 && <i className="push">{bell.data?.unread}</i>}
            </button>
            {bellOpen && (
              <div className="pop" role="menu">
                <div className="pop-head">
                  <b>Notifications</b>
                  <button
                    type="button"
                    className="btn"
                    data-variant="quiet"
                    data-size="sm"
                    onClick={() => {
                      void post("/notifications/read").then(() =>
                        qc.invalidateQueries({ queryKey: ["notifications"] }),
                      );
                    }}
                  >
                    Mark all read
                  </button>
                </div>
                <div className="pop-list">
                  {(bell.data?.items ?? []).slice(0, 8).map((n) => (
                    <div key={n.id} className="pop-item" data-unread={!n.read}>
                      {n.body}
                    </div>
                  ))}
                  {!bell.data?.items?.length && (
                    <div className="pop-item muted">Nothing yet.</div>
                  )}
                </div>
              </div>
            )}
          </div>
          <ProfileMenu />
        </header>
        <main id="main">{children}</main>
      </div>
    </div>
  );
}
