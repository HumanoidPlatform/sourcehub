// The fetch wrapper: auth header, one-shot refresh on 401, error mapping.
//
// The ONLY module that calls fetch. A feature that reaches past this loses
// refresh handling and consistent error shapes.

const BASE = "/api/v1";

export interface Session {
  access_token: string;
  refresh_token: string;
  user_id: string;
  // Optional: a session stored before these fields existed lacks them; the UI
  // falls back and the values arrive with the next token refresh.
  full_name?: string;
  email?: string;
  org_id: string;
  org_kind: string;
  org_name: string;
  role: string;
  scope: string;
  capabilities: string[];
  must_change_password: boolean;
}

const KEY = "sourcehub.session";

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function saveSession(s: Session | null): void {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable — the session just won't survive a reload */
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let onSessionChange: ((s: Session | null) => void) | null = null;
export function bindSessionListener(fn: (s: Session | null) => void): void {
  onSessionChange = fn;
}

let refreshing: Promise<Session | null> | null = null;

async function tryRefresh(): Promise<Session | null> {
  const current = loadSession();
  if (!current?.refresh_token) return null;
  if (!refreshing) {
    refreshing = (async () => {
      const r = await fetch(`${BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: current.refresh_token }),
      });
      refreshing = null;
      if (!r.ok) {
        saveSession(null);
        onSessionChange?.(null);
        return null;
      }
      const s = (await r.json()) as Session;
      saveSession(s);
      onSessionChange?.(s);
      return s;
    })();
  }
  return refreshing;
}

export async function api<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  retried = false,
): Promise<T> {
  const session = loadSession();
  const r = await fetch(BASE + path, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (r.status === 401 && !retried && !path.startsWith("/auth/")) {
    const renewed = await tryRefresh();
    if (renewed) return api<T>(method, path, body, true);
  }

  if (r.status === 204) return undefined as T;

  let data: unknown;
  try {
    data = await r.json();
  } catch {
    data = null;
  }

  if (!r.ok) {
    const detail =
      data && typeof data === "object" && "detail" in data
        ? typeof (data as { detail: unknown }).detail === "string"
          ? ((data as { detail: string }).detail)
          : "Request failed validation"
        : `Request failed (${r.status})`;
    throw new ApiError(r.status, detail);
  }
  return data as T;
}

export const get = <T = unknown>(path: string) => api<T>("GET", path);
export const post = <T = unknown>(path: string, body?: unknown) => api<T>("POST", path, body);
export const patch = <T = unknown>(path: string, body?: unknown) => api<T>("PATCH", path, body);

// The one deliberate exception to "only api() calls fetch": a presigned-URL
// upload sends bytes straight to object storage. No auth header — the URL is
// the credential — and no JSON wrapper.
export async function putFile(url: string, file: File): Promise<void> {
  const r = await fetch(url, { method: "PUT", body: file });
  if (!r.ok) throw new ApiError(r.status, "Upload failed — try the file again");
}
