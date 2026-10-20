// Session state for the whole app. A worker holds exactly one grant, so
// the organisation picker almost never appears; it is handled anyway.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { bindSessionListener, loadSession, login as apiLogin, logout as apiLogout } from "@/api/client";
import type { OrgChoice, Session } from "@/api/types";
import { endSession } from "./endSession";
import { unregisterPush } from "@/notifications/push";
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
    bindSessionListener((s) => {
      setSession(s);
      // however it ended — Sign out, or a refresh the server refused
      if (!s) void endSession();
    });
    // a store that cannot be read is a signed-out phone, not a spinner for ever
    void loadSession()
      .catch(() => null)
      .then((s) => {
        setSession(s);
        setReady(true);
      });
  }, []);

  const login = useCallback(async (email: string, password: string, orgId?: string) => {
    const choice = await apiLogin(email, password, orgId);
    if (choice) return choice;
    // A colleague's unsent captures on a shared phone stay for when they sign
    // back in: the outbox reads only the signed-in worker's rows (db/outbox.ts),
    // and Settings offers to discard the rest.
    queryClient.clear();
    uploader.kick();
    return null;
  }, []);

  const logout = useCallback(async () => {
    // Before the session goes: the server needs it to know whose token to clear.
    await unregisterPush();
    await apiLogout(); // the session listener above runs endSession
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
