// Session, org switching and token refresh.
//
// A user may hold grants in several organisations; a session carries exactly
// one. Switching org is a new login/token, not a client-side filter.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { bindSessionListener, loadSession, post, saveSession, type Session } from "@api/client";

export interface OrgChoice {
  org_id: string;
  org_kind: string;
  org_name: string;
  reference_code: string;
  role_code: string;
}

interface AuthContextShape {
  session: Session | null;
  login: (email: string, password: string, orgId?: string) => Promise<OrgChoice[] | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextShape | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => loadSession());

  useEffect(() => {
    // the api client refreshes tokens behind our back; stay in step
    bindSessionListener(setSession);
  }, []);

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
      setSession(s);
      return null;
    },
    [],
  );

  const logout = useCallback(async () => {
    const s = loadSession();
    try {
      if (s) await post("/auth/logout", { refresh_token: s.refresh_token });
    } catch {
      /* the server session may already be gone; local logout proceeds */
    }
    saveSession(null);
    setSession(null);
  }, []);

  const value = useMemo(() => ({ session, login, logout }), [session, login, logout]);
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
