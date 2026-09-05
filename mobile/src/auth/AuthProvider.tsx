// Session state for the whole app. A worker holds exactly one grant, so
// the organisation picker almost never appears; it is handled anyway.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { bindSessionListener, loadSession, login as apiLogin, logout as apiLogout } from "@/api/client";
import type { OrgChoice, Session } from "@/api/types";
import { purgeOtherUsers } from "@/db/outbox";
import { queryClient } from "@/query/queryClient";
import { uploader } from "@/upload/uploader";

interface AuthShape {
  session: Session | null;
  ready: boolean;
  login: (email: string, password: string, orgId?: string) => Promise<OrgChoice[] | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthShape | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    bindSessionListener(setSession);
    void loadSession().then((s) => {
      setSession(s);
      setReady(true);
    });
  }, []);

  const login = useCallback(async (email: string, password: string, orgId?: string) => {
    const choice = await apiLogin(email, password, orgId);
    if (choice) return choice;
    const s = await loadSession();
    if (s) {
      await purgeOtherUsers(s.user_id);
      queryClient.clear();
      uploader.kick();
    }
    return null;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    queryClient.clear();
  }, []);

  const value = useMemo(() => ({ session, ready, login, logout }), [session, ready, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthShape {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}

export function useSession(): Session {
  const { session } = useAuth();
  if (!session) throw new Error("useSession without a session");
  return session;
}
