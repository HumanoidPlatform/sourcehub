// The console chrome: rail, topbar, notification bell, theme cycler.
//
// Ported from the prototype's §9 CHROME over the same class names. Navigation
// is derived from the session's role, exactly as the prototype's NAV registry
// keys pages by persona.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { get } from "@api/client";
import type { NotificationPage } from "@api/types";
import { useSession } from "@shared/auth";
import { BrandMark, BYLINE } from "@shared/brand";
import { fmtAgo, fmtDateTime } from "@shared/format";
import { markRead, notificationHref } from "@shared/notifications";
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

export type Theme = "system" | "light" | "dark";

function applyTheme(t: Theme) {
  const root = document.documentElement;
  if (t === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", t);
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
  const bellButtonRef = useRef<HTMLButtonElement>(null);
  const bellPanelId = useId();

  // The phone/tablet drawer. Below 840px the stylesheet moves the rail
  // off-canvas and shows it only for .rail[data-open], behind a .scrim, opened
  // by a .railtoggle — all three were styled and never rendered, so on a phone
  // there was no way to reach any page. Above 840px none of this has any
  // effect: the rail is always in flow and .railtoggle/.scrim are display:none.
  const [railOpen, setRailOpen] = useState(false);
  const railToggleRef = useRef<HTMLButtonElement>(null);
  const railRef = useRef<HTMLElement>(null);
  const location = useLocation();

  // Following a link closes the drawer — otherwise it sits over the page you
  // just asked for.
  useEffect(() => {
    setRailOpen(false);
    setBellOpen(false);
  }, [location.pathname]);

  // A route change in a single-page app is silent: the browser does not reload,
  // so a screen reader announces nothing, and keyboard focus stays on the link
  // that was followed — in a rail that may now be off-screen — with the new
  // page's content behind it. The window also kept the old page's scroll
  // position. So on every change of path, start the new page the way a full
  // page load would: at the top, with focus on its heading (every page renders
  // a View, whose h1 exists from the first paint, loading or not). Not on the
  // first render — that is a page load, and the browser has already handled
  // it — and the path is compared rather than a "first run" flag, because
  // StrictMode runs this effect twice on mount.
  const mainRef = useRef<HTMLElement>(null);
  const shownPath = useRef(location.pathname);
  useEffect(() => {
    if (shownPath.current === location.pathname) return;
    shownPath.current = location.pathname;
    const main = mainRef.current;
    if (!main) return;
    window.scrollTo(0, 0);
    (main.querySelector<HTMLElement>("h1") ?? main).focus({ preventScroll: true });
  }, [location.pathname]);

  useEffect(() => {
    if (!railOpen) return;
    // Focus goes into the drawer, or a keyboard user opens it and stays on the
    // button behind the scrim.
    railRef.current?.querySelector<HTMLElement>(".rail-item")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setRailOpen(false);
        railToggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [railOpen]);

  useEffect(() => applyTheme(theme), [theme]);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!bellOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setBellOpen(false);
        bellButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [bellOpen]);

  const bell = useQuery({
    queryKey: ["notifications"],
    queryFn: () => get<NotificationPage>("/notifications"),
    refetchInterval: 20_000,
  });
  const unread = bell.data?.unread ?? 0;

  // A direct choice rather than a cycle: the account menu offers all three, so
  // nobody has to click past "light" to reach "dark".
  const chooseTheme = (next: Theme) => {
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
      {/* "" or undefined, never a boolean: React writes data-open="false" for
          false, and .rail[data-open] matches on presence — the drawer would sit
          permanently open on phones. */}
      <aside className="rail" id="primary-rail" ref={railRef} data-open={railOpen ? "" : undefined}>
        <div className="rail-head">
          {/* the logo leads home, as a logo does */}
          <BrandMark to="/" />
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
        {/* The rail once ended with a "Design system" link — a developer
            reference in every persona's nav — and a bare "Theme: system" text
            button. The theme now lives in the account menu, where it is
            conventionally found; /design is still reachable by URL in local dev
            builds (router.tsx) and absent from production. What is left here is
            the one place inside the console that names the company. */}
        <div className="rail-foot">
          <span className="rail-byline">{BYLINE}</span>
        </div>
      </aside>
      {/* Tapping outside the open drawer closes it. Only rendered while open; the
          stylesheet hides it above 840px regardless. */}
      {railOpen && <div className="scrim" aria-hidden="true" onClick={() => setRailOpen(false)} />}

      <div className="main">
        <header className="topbar">
          <button
            ref={railToggleRef}
            type="button"
            className="iconbtn railtoggle"
            aria-label={railOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={railOpen}
            aria-controls="primary-rail"
            onClick={() => setRailOpen((o) => !o)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="crumbs">
            <b>{WORKSPACE[session.role] ?? session.role}</b>
            <span aria-hidden="true">·</span>
            <span>{session.org_name}</span>
          </div>
          <div className="topbar-spacer" style={{ flex: 1 }} />
          <div className="topbar-tools hostrel" ref={bellRef}>
            <button
              ref={bellButtonRef}
              type="button"
              className="iconbtn"
              aria-label={`Notifications, ${unread} unread`}
              aria-expanded={bellOpen}
              aria-controls={bellOpen ? bellPanelId : undefined}
              onClick={() => setBellOpen((o) => !o)}
            >
              {/* A bell, drawn in currentColor so it takes .iconbtn's --ink-2 and
                  follows the theme. Hidden from assistive tech: the button's
                  aria-label already says what it is and how many are unread. */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                aria-hidden="true" focusable="false">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              {/* .ping, not .push: the stylesheet's badge is .iconbtn .ping,
                  and .push is the margin-left:auto utility — so the unread
                  count rendered as bare text beside the icon. */}
              {unread > 0 && <i className="ping" aria-hidden="true">{unread > 99 ? "99+" : unread}</i>}
            </button>
            {/* A panel, not a menu. It was role="menu" with menuitem links,
                but it also holds a heading and a button and had none of a
                menu's arrow-key behaviour, so a screen reader announced a menu
                that did not act like one. As a labelled, non-modal panel that
                follows its button in the DOM, Tab walks into it naturally and
                Escape closes it. */}
            {bellOpen && (
              <div className="pop" id={bellPanelId} role="dialog" aria-label="Notifications">
                <div className="pop-head">
                  <b>Notifications</b>
                  <button
                    type="button"
                    className="btn"
                    data-variant="quiet"
                    data-size="sm"
                    style={{ marginLeft: "auto" }}
                    disabled={unread === 0}
                    onClick={() => void markRead(qc).catch(() => {})}
                  >
                    Mark all read
                  </button>
                </div>
                <div className="pop-list">
                  {(bell.data?.items ?? []).slice(0, 8).map((n) => {
                    const href = notificationHref(n);
                    const content = (
                      <span>
                        {/* the dot is visual only */}
                        {!n.read && <span className="sr">Unread: </span>}
                        <span className="txt">{n.body}</span>
                        <time className="ts" dateTime={n.created_at} title={fmtDateTime(n.created_at)}
                          style={{ display: "block" }}>
                          {fmtAgo(n.created_at)}
                        </time>
                      </span>
                    );
                    return href ? (
                      <Link
                        key={n.id}
                        to={href}
                        className="pop-item"
                        data-unread={!n.read}
                        onClick={() => {
                          setBellOpen(false);
                          // Opening it is reading it. Fire and forget: the page
                          // it leads to must not wait on the bell.
                          if (!n.read) void markRead(qc, n.id).catch(() => {});
                        }}
                      >
                        {content}
                      </Link>
                    ) : (
                      <div key={n.id} className="pop-item" data-unread={!n.read}>
                        {content}
                      </div>
                    );
                  })}
                  {!bell.data?.items?.length && (
                    <div className="pop-item muted">Nothing yet.</div>
                  )}
                </div>
                {/* The bell shows the latest 8; everything else was unreachable. */}
                <div className="pop-foot">
                  <Link to="/notifications" onClick={() => setBellOpen(false)}>See all notifications</Link>
                </div>
              </div>
            )}
          </div>
          <ProfileMenu theme={theme} onTheme={chooseTheme} />
        </header>
        {/* tabIndex -1: focusable by script and by the skip link, not by Tab */}
        <main id="main" ref={mainRef} tabIndex={-1}>{children}</main>
      </div>
    </div>
  );
}
