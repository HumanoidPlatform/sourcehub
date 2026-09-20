// Session, org switching and token refresh.
//
// A user may hold grants in several organisations; a session carries exactly
// one. Switching org is a new login/token, not a client-side filter.
//
// Whenever the person or organisation behind the session changes — sign in,
// sign out, expiry, another tab — the query cache is emptied. It used to
// survive all of them, so the next person to sign in on the same browser was
// shown the previous person's cached lists (for up to staleTime, 15 s, with
// no refetch at all) before their own arrived.

import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  bindSessionListener, loadSession, post, saveSession, SESSION_KEY, type Session, type SessionEnd,
} from "@api/client";

export interface OrgChoice {
  org_id: string;
  org_kind: string;
  org_name: string;
  reference_code: string;
  role_code: string;
}

interface AuthContextShape {
  session: Session | null;
  /** Why the last session ended, when the user did not end it themselves. */
  ended: SessionEnd | null;
  login: (email: string, password: string, orgId?: string) => Promise<OrgChoice[] | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextShape | null>(null);

/** Who the session acts as. A token refresh keeps it; anything else changes it. */
export const identityOf = (s: Session | null) => (s ? `${s.user_id}:${s.org_id}` : null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [ended, setEnded] = useState<SessionEnd | null>(null);
  const current = useRef(session);
  current.current = session;

  // The single way the session changes: clear the cache first if the identity
  // is changing, so nothing rendered for the new one can read the old one's data.
  const adopt = useCallback(
    (next: Session | null, why: SessionEnd | null = null) => {
      if (identityOf(next) !== identityOf(current.current)) qc.clear();
      current.current = next;
      setEnded(next ? null : why);
      setSession(next);
    },
    [qc],
  );

  useEffect(() => {
    // the api client refreshes tokens behind our back; stay in step
    bindSessionListener((s, why) => adopt(s, why ?? null));
  }, [adopt]);

  useEffect(() => {
    // Tabs share one stored session, and every request reads it. A tab that
    // did not follow a sign-out elsewhere kept showing the console while every
    // request failed; one that did not follow a sign-in as someone else sent
    // requests as the new person under the old person's name and cache.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== SESSION_KEY && e.key !== null) return; // null: storage cleared
      adopt(loadSession(), "elsewhere");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [adopt]);

  const login = useCallback(
    async (email: string, password: string, orgId?: string): Promise<OrgChoice[] | null> => {
      const r = await post<Session | { choose_org: true; organisations: OrgChoice[] }>(
        "/auth/login",
        { email, password, org_id: orgId },
      );
      if ("choose_org" in (r as object) && (r as { choose_org?: boolean }).choose_org) {
        return (r as { organisations: OrgChoice[] }).organisations;
      }
      const s = r as Session;
      saveSession(s);
      adopt(s);
      return null;
    },
    [adopt],
  );

  const logout = useCallback(async () => {
    const s = loadSession();
    try {
      if (s) await post("/auth/logout", { refresh_token: s.refresh_token });
    } catch {
      /* the server session may already be gone; local logout proceeds */
    }
    saveSession(null);
    adopt(null);
  }, [adopt]);

  const value = useMemo(() => ({ session, ended, login, logout }), [session, ended, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextShape {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}

export function useSession(): Session {
  const { session } = useAuth();
  if (!session) throw new Error("useSession without a session");
  return session;
}

/**
 * Where to go after signing in: the page the user was on when the session
 * ended (or the link they followed while signed out), which the router puts in
 * the sign-in page's history state. Only a path on this site is honoured.
 */
export function returnPath(state: unknown): string {
  const from = (state as { from?: unknown } | null)?.from;
  if (typeof from !== "string" || !from.startsWith("/") || from.startsWith("//")) return "/";
  if (from === "/login" || from.startsWith("/login?")) return "/";
  return from;
}
