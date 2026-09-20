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

// Exported so the auth provider can tell, from a `storage` event, that another
// tab changed the session.
export const SESSION_KEY = "sourcehub.session";
const KEY = SESSION_KEY;

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

// Why a session ended without the user signing out, so the sign-in page can
// say so instead of appearing out of nowhere.
export type SessionEnd = "expired" | "elsewhere";

let onSessionChange: ((s: Session | null, ended?: SessionEnd) => void) | null = null;
export function bindSessionListener(fn: (s: Session | null, ended?: SessionEnd) => void): void {
  onSessionChange = fn;
}

let refreshing: Promise<Session | null> | null = null;

async function tryRefresh(): Promise<Session | null> {
  const current = loadSession();
  if (!current?.refresh_token) return null;
  if (!refreshing) {
    refreshing = (async () => {
      // The reset lives in `finally`. It used to follow `await fetch(...)`, so
      // when the refresh request itself THREW — a dropped connection, a VPN
      // reconnecting — the line was never reached. `refreshing` stayed a
      // rejected promise, every later 401 in that tab was handed the same
      // rejection, and the console failed on every screen until a reload.
      try {
        const r = await fetch(`${BASE}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: current.refresh_token }),
        });
        // Only a refused refresh token ends the session. Any failed refresh
        // used to — so a 502 while the API restarted signed out everyone who
        // happened to make a request, and told them nothing. A server error
        // keeps the session: this request fails, and the next one tries again.
        if (r.status === 401) {
          saveSession(null);
          onSessionChange?.(null, "expired");
          return null;
        }
        if (!r.ok) return null;
        const s = (await r.json()) as Session;
        saveSession(s);
        onSessionChange?.(s);
        return s;
      } finally {
        refreshing = null;
      }
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
export const del = <T = unknown>(path: string) => api<T>("DELETE", path);

// The one deliberate exception to "only api() calls fetch": a presigned-URL
// upload sends bytes straight to object storage. No auth header — the URL is
// the credential — and no JSON wrapper.
export async function putFile(
  url: string,
  file: File,
  // What the presign said this upload needs. Storage is no longer always ours,
  // and the headers a PUT must carry depend on the provider behind the URL —
  // the phone app learned this the hard way with Azure.
  headers: Record<string, string> = {},
): Promise<void> {
  const r = await fetch(url, { method: "PUT", body: file, headers });
  if (!r.ok) throw new ApiError(r.status, "Upload failed — try the file again");
}

export interface PutResult {
  status: number;
  body: string | null;
}

// The same PUT, over XHR, for the worker's upload dialog. fetch cannot report
// upload progress and XHR can; that is the whole reason this exists next to
// putFile rather than replacing it. Semantics mirror the phone's uploadAsync
// so the state machine's putOutcome() stays the one place a status code is
// judged: RESOLVE on any HTTP status, resolve {status: 0} on a network error
// or a stalled socket (both retryable), and reject only when the caller
// aborts. No total timeout — a 100 MB PUT on a slow link legitimately takes
// minutes; a socket that reports no progress for stallMs is what gets cut.
export function xhrPut(
  url: string,
  body: Blob,
  // exactly what presign returned, nothing added, no bearer — see putFile
  headers: Record<string, string>,
  opts: { onProgress?: (sent: number, total: number) => void; signal?: AbortSignal; stallMs?: number } = {},
): Promise<PutResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const stallMs = opts.stallMs ?? 60_000;
    let stall: ReturnType<typeof setTimeout> | null = null;
    let settled = false;

    const finish = (r: PutResult) => {
      if (settled) return;
      settled = true;
      if (stall) clearTimeout(stall);
      opts.signal?.removeEventListener("abort", onAbort);
      resolve(r);
    };
    const onAbort = () => {
      if (settled) return;
      settled = true;
      if (stall) clearTimeout(stall);
      xhr.abort();
      reject(new DOMException("upload aborted", "AbortError"));
    };
    const armStall = () => {
      if (stall) clearTimeout(stall);
      stall = setTimeout(() => {
        xhr.abort();
        finish({ status: 0, body: null });
      }, stallMs);
    };

    if (opts.signal?.aborted) {
      reject(new DOMException("upload aborted", "AbortError"));
      return;
    }
    opts.signal?.addEventListener("abort", onAbort);

    xhr.open("PUT", url, true);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => {
      armStall();
      if (e.lengthComputable) opts.onProgress?.(e.loaded, e.total);
    };
    xhr.onload = () => finish({ status: xhr.status, body: xhr.responseText || null });
    xhr.onerror = () => finish({ status: 0, body: null });
    xhr.ontimeout = () => finish({ status: 0, body: null });
    armStall();
    xhr.send(body);
  });
}
