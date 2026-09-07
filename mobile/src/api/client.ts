// The fetch wrapper: bearer header, single-flight refresh on 401, error
// mapping. A port of the console's api/client.ts with two substitutions:
// tokens live in SecureStore (two keys, because a SecureStore value is capped
// at 2 KB and the JWT alone can approach it), the profile in SQLite, and the
// base URL is whatever the pilot lead typed on the sign-in screen.
//
// The ONLY module that calls fetch for the API. The uploader's PUT to object
// storage is the one deliberate exception: no bearer, the URL is the credential.

import * as SecureStore from "expo-secure-store";
import { DEFAULT_API_URL } from "@/config";
import { getKv, setKv } from "@/db/kv";
import type { OrgChoice, Session } from "./types";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// --- base URL ---------------------------------------------------------------

let baseUrl: string | null = null;

export async function getBaseUrl(): Promise<string> {
  const url = baseUrl ?? ((await getKv("server_url")) || process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL);
  baseUrl = url;
  return url.replace(/\/+$/, "");
}

export async function setBaseUrl(url: string): Promise<void> {
  baseUrl = url.trim().replace(/\/+$/, "");
  await setKv("server_url", baseUrl);
}

// --- session ----------------------------------------------------------------

const ACCESS = "sh.access";
const REFRESH = "sh.refresh";

let current: Session | null = null;
let loaded = false;
let onSessionChange: ((s: Session | null) => void) | null = null;

export function bindSessionListener(fn: (s: Session | null) => void): void {
  onSessionChange = fn;
}

export async function loadSession(): Promise<Session | null> {
  if (loaded) return current;
  const [access, refresh, profile] = await Promise.all([
    SecureStore.getItemAsync(ACCESS),
    SecureStore.getItemAsync(REFRESH),
    getKv("profile"),
  ]);
  if (access && refresh && profile) {
    const p = JSON.parse(profile) as Omit<Session, "access_token" | "refresh_token">;
    current = { ...p, access_token: access, refresh_token: refresh };
  } else {
    current = null;
  }
  loaded = true;
  return current;
}

export async function saveSession(s: Session | null): Promise<void> {
  current = s;
  loaded = true;
  if (s) {
    const { access_token, refresh_token, ...profile } = s;
    await Promise.all([
      SecureStore.setItemAsync(ACCESS, access_token),
      SecureStore.setItemAsync(REFRESH, refresh_token),
      setKv("profile", JSON.stringify(profile)),
    ]);
  } else {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS),
      SecureStore.deleteItemAsync(REFRESH),
      setKv("profile", ""),
    ]);
  }
  onSessionChange?.(s);
}

// --- refresh, single-flight ------------------------------------------------

let refreshing: Promise<Session | null> | null = null;

async function tryRefresh(): Promise<Session | null> {
  const cur = await loadSession();
  if (!cur?.refresh_token) return null;
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const base = await getBaseUrl();
        const r = await fetch(`${base}/api/v1/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: cur.refresh_token }),
        });
        if (r.status === 401) {
          // the session is truly dead: revoked, expired, or rotated away
          await saveSession(null);
          return null;
        }
        if (!r.ok) return cur; // a server hiccup is not a sign-out
        const s = (await r.json()) as Session;
        await saveSession(s);
        return s;
      } catch {
        return cur; // offline: keep the session, retry later
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}

// --- requests ---------------------------------------------------------------

export async function api<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  retried = false,
): Promise<T> {
  // never send a request while a refresh is rotating the tokens under it
  if (refreshing) await refreshing;
  const session = await loadSession();
  const base = await getBaseUrl();

  let r: Response;
  try {
    r = await fetch(`${base}/api/v1${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "No connection to the server.");
  }

  if (r.status === 401 && !retried && !path.startsWith("/auth/")) {
    const renewed = await tryRefresh();
    if (renewed) return api<T>(method, path, body, true);
  }

  if (r.status === 204) return undefined as T;

  let data: unknown = null;
  try {
    data = await r.json();
  } catch {
    data = null;
  }

  if (!r.ok) {
    const detail =
      data && typeof data === "object" && "detail" in data
        ? typeof (data as { detail: unknown }).detail === "string"
          ? (data as { detail: string }).detail
          : "The request was not accepted."
        : `Request failed (${r.status}).`;
    throw new ApiError(r.status, detail);
  }
  return data as T;
}

export const get = <T = unknown>(path: string) => api<T>("GET", path);
export const post = <T = unknown>(path: string, body?: unknown) => api<T>("POST", path, body);
export const del = <T = unknown>(path: string) => api<T>("DELETE", path);

// --- auth -------------------------------------------------------------------

export async function login(
  email: string,
  password: string,
  orgId?: string,
): Promise<OrgChoice[] | null> {
  const r = await post<Session | { choose_org: true; organisations: OrgChoice[] }>("/auth/login", {
    email: email.trim(),
    password,
    org_id: orgId,
  });
  if ("choose_org" in r && r.choose_org) return r.organisations;
  await saveSession(r as Session);
  return null;
}

export async function logout(): Promise<void> {
  const s = await loadSession();
  try {
    if (s) await post("/auth/logout", { refresh_token: s.refresh_token });
  } catch {
    // the server session may already be gone; the local sign-out proceeds
  }
  await saveSession(null);
}

export async function pingServer(url: string): Promise<boolean> {
  // r.ok alone is not enough: Metro answers 200 on every path it does not
  // know, so pointing this app at the Expo dev server on :8081 passed the
  // test and then failed every real call. Ask the body who it is.
  try {
    const r = await fetch(`${url.replace(/\/+$/, "")}/health`);
    if (!r.ok) return false;
    const body = (await r.json()) as { status?: string };
    return body?.status === "ok";
  } catch {
    return false;
  }
}
