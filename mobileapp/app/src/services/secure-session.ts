import * as SecureStore from 'expo-secure-store';

import type { AuthSession } from '@/types/domain';

export const SESSION_KEY = 'odp.mobile.auth.session.v1';
export const CURRENT_SESSION_VERSION = 2;

const supportedPersonas = new Set(['aggregator', 'builder', 'client', 'crowd', 'ide', 'partner', 'platform', 'qa', 'sponsor', 'tenant']);

function isRestorableSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const session = value as Partial<AuthSession>;
  const user = session.user;
  if (!user) {
    return false;
  }

  const expiresAt = Date.parse(session.expiresAt ?? '');
  return (
    session.sessionVersion === CURRENT_SESSION_VERSION &&
    (session.authMode === 'demo' || session.authMode === 'real') &&
    typeof session.accessToken === 'string' &&
    typeof session.refreshToken === 'string' &&
    typeof session.expiresAt === 'string' &&
    Number.isFinite(expiresAt) &&
    expiresAt > Date.now() &&
    Boolean(user.email) &&
    Boolean(user.persona) &&
    supportedPersonas.has(user.persona) &&
    Array.isArray(user.availablePersonas) &&
    user.availablePersonas.every((persona) => supportedPersonas.has(persona))
  );
}

export async function saveSession(session: AuthSession) {
  await SecureStore.setItemAsync(
    SESSION_KEY,
    JSON.stringify({
      ...session,
      authMode: session.authMode ?? 'demo',
      sessionVersion: CURRENT_SESSION_VERSION,
    }),
  );
}

export async function getStoredSession() {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (isRestorableSession(parsed)) {
      return parsed;
    }
  } catch {
    // Invalid JSON should not keep the app trapped behind the splash router.
  }

  await clearStoredSession();
  return null;
}

export async function clearStoredSession() {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
