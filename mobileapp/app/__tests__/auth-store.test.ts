import { beforeEach, describe, expect, it } from '@jest/globals';
import * as SecureStore from 'expo-secure-store';

import { getLandingRouteForSession } from '@/auth/persona-routing';
import { getStoredSession, SESSION_KEY } from '@/services/secure-session';
import { useAuthStore } from '@/store/auth-store';

describe('auth store demo sessions', () => {
  beforeEach(async () => {
    await useAuthStore.getState().logout();
    useAuthStore.setState({
      bootstrapped: false,
      error: undefined,
      loading: false,
      session: null,
    });
  });

  it('stores the selected persona after login', async () => {
    await useAuthStore.getState().login({
      email: 'multi@cosaarthi.local',
      password: 'Cosaarthi#2026',
      persona: 'tenant',
      workerCode: 'COSAARTHI-MULTI',
    });

    expect(useAuthStore.getState().session?.user.persona).toBe('tenant');
    expect(useAuthStore.getState().session?.user.email).toBe('multi@cosaarthi.local');
    expect(useAuthStore.getState().session?.user.availablePersonas).toEqual(['tenant', 'aggregator', 'qa', 'crowd']);
  });

  it('restores a saved current demo session on bootstrap', async () => {
    await useAuthStore.getState().login({
      email: 'multi@cosaarthi.local',
      password: 'Cosaarthi#2026',
      persona: 'tenant',
      workerCode: 'COSAARTHI-MULTI',
    });
    useAuthStore.setState({ bootstrapped: false, session: null });

    await useAuthStore.getState().bootstrap();

    expect(useAuthStore.getState().session?.user.persona).toBe('tenant');
    expect(getLandingRouteForSession(useAuthStore.getState().session)).toBe('/tenant');
  });

  it('clears the session and SecureStore on logout, then routes to login', async () => {
    await useAuthStore.getState().login({
      email: 'builder@cosaarthi.local',
      password: 'Cosaarthi#2026',
      persona: 'builder',
      workerCode: 'COSAARTHI-BUILDER',
    });
    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().session).toBeNull();
    expect(await getStoredSession()).toBeNull();
    expect(getLandingRouteForSession(useAuthStore.getState().session)).toBe('/login');
  });

  it('clears a stale legacy Asha session instead of auto-restoring it', async () => {
    await SecureStore.setItemAsync(
      SESSION_KEY,
      JSON.stringify({
        accessToken: 'mock-access-asha.worker@cosaarthi.example',
        expiresAt: '2026-08-17T00:00:00.000Z',
        refreshToken: 'mock-refresh-COSAARTHI-1087',
        user: {
          email: 'asha.worker@cosaarthi.example',
          persona: 'crowd_worker',
        },
      }),
    );

    await useAuthStore.getState().bootstrap();

    expect(useAuthStore.getState().session).toBeNull();
    expect(await getStoredSession()).toBeNull();
  });

  it('switches users by clearing and then storing a new persona session', async () => {
    await useAuthStore.getState().login({
      email: 'anita@crowd.in',
      password: 'Cosaarthi#2026',
      persona: 'crowd',
      workerCode: 'COSAARTHI-CROWD',
    });
    await useAuthStore.getState().logout();
    await useAuthStore.getState().login({
      email: 'platform@cosaarthi.local',
      password: 'Cosaarthi#2026',
      persona: 'platform',
      workerCode: 'COSAARTHI-PLATFORM',
    });

    expect(useAuthStore.getState().session?.user.persona).toBe('platform');
    expect(useAuthStore.getState().session?.user.email).toBe('platform@cosaarthi.local');
  });

  it('switches between available personas without clearing the account session', async () => {
    await useAuthStore.getState().login({
      email: 'multi@cosaarthi.local',
      password: 'Cosaarthi#2026',
      persona: 'tenant',
      workerCode: 'COSAARTHI-MULTI',
    });

    await useAuthStore.getState().switchPersona('aggregator');

    const session = useAuthStore.getState().session;
    expect(session?.user.persona).toBe('aggregator');
    expect(session?.user.email).toBe('multi@cosaarthi.local');
    expect(getLandingRouteForSession(session)).toBe('/aggregator');
    expect((await getStoredSession())?.user.persona).toBe('aggregator');
  });
});
