// The console chrome: rail, topbar, notification bell, theme cycler.
//
// Ported from the prototype's §9 CHROME over the same class names. Navigation
// is derived from the session's role, exactly as the prototype's NAV registry
// keys pages by persona.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
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
    // what the partner is owed and what the platform took — the invoices
    // exist against this org, and until now nothing linked to them
    { to: "/billing", label: "Billing" },
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
  // /accounts, not "/" — the route existed and nothing pointed at it, so the
  // page lived at two URLs and reaching the real one left no nav item lit.
  // /contracts has always worked for Ops (it holds contract.read and
  // delivery.track, and RLS returns every contract on the platform); there was
  // simply no way to get there.
  platform_admin: [
    { to: "/accounts", label: "Accounts" },
    { to: "/onboarding", label: "Onboarding" },
    { to: "/contracts", label: "Contracts" },
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
  link_params?: Record<string, string> | null;
  read: boolean;
  created_at: string;
}

// The backend stores a deep link on every notification — "so the bell can take
// the reader to the thing itself", as notify/service.py puts it — in the
// prototype's page vocabulary. Nothing ever translated it, so clicking a
// "A proposal arrived" notification did nothing at all.
function notificationHref(n: NotificationRow): string | null {
  const id = n.link_params?.id;
  switch (n.link_page) {
    case "requestDetail": return id ? `/requests/${id}` : "/requests";
    case "requests": return "/requests";
    case "opportunities": return "/opportunities";
    case "proposals": return "/proposals";
    case "contracts": return id ? `/contracts/${id}` : "/contracts";
    case "deliveries": return id ? `/deliveries/${id}` : "/deliveries";
    case "deliveryDetail": return id ? `/deliveries/${id}` : "/deliveries";
    case "tasks": return "/tasks";
    case "qa": return "/qa";
    case "equipment": return "/equipment";
    case "loans": return "/loans";
    case "billing": return "/billing";
    // The operator's pages were missing from this map entirely, and Ops has
    // exactly one inbound notification: onboarding/service.py sends
    // link_page "onboarding" when a tenant asks for a network entity. It fell
    // through to null, so the one alert the platform operator receives was the
    // one row in the bell that did nothing when clicked.
    case "onboarding": return "/onboarding";
    case "accounts": return "/accounts";
    case "activity": return "/activity";
    default: return null;
  }
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
              {/* .ping, not .push: the stylesheet's badge is .iconbtn .ping,
                  and .push is the margin-left:auto utility — so the unread
                  count rendered as bare text beside the glyph. */}
              ◔{(bell.data?.unread ?? 0) > 0 && <i className="ping">{bell.data?.unread}</i>}
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
                  {(bell.data?.items ?? []).slice(0, 8).map((n) => {
                    const href = notificationHref(n);
                    return href ? (
                      <Link
                        key={n.id}
                        to={href}
                        role="menuitem"
                        className="pop-item"
                        data-unread={!n.read}
                        onClick={() => setBellOpen(false)}
                      >
                        {n.body}
                      </Link>
                    ) : (
                      <div key={n.id} className="pop-item" data-unread={!n.read}>
                        {n.body}
                      </div>
                    );
                  })}
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
