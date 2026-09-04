import { create } from 'zustand';

import { odpApi } from '@/api';
import { clearStoredSession, getStoredSession, saveSession } from '@/services/secure-session';
import type { AuthSession, LoginInput, Persona, SignupInput } from '@/types/domain';

type AuthState = {
  bootstrapped: boolean;
  error?: string;
  loading: boolean;
  session: AuthSession | null;
  bootstrap: () => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  signup: (input: SignupInput) => Promise<void>;
  switchPersona: (persona: Persona) => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  bootstrapped: false,
  loading: false,
  session: null,
  async bootstrap() {
    try {
      const stored = await getStoredSession();
      const session = stored?.authMode === 'real' ? await odpApi.getCurrentSession() : stored;
      if (session) {
        await saveSession(session);
      }
      set({ bootstrapped: true, session });
    } catch {
      await clearStoredSession();
      set({ bootstrapped: true, session: null });
    }
  },
  async login(input) {
    set({ error: undefined, loading: true });
    try {
      const session = await odpApi.login(input);
      await saveSession(session);
      set({ loading: false, session });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Login failed',
        loading: false,
      });
      throw error;
    }
  },
  async logout() {
    const current = useAuthStore.getState().session;
    if (current?.authMode === 'real') {
      await odpApi.logout(current.refreshToken).catch(() => undefined);
    }
    await clearStoredSession();
    set({ session: null });
  },
  async signup(input) {
    set({ error: undefined, loading: true });
    try {
      const session = await odpApi.signup(input);
      await saveSession(session);
      set({ loading: false, session });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Signup failed',
        loading: false,
      });
      throw error;
    }
  },
  async switchPersona(persona) {
    const current = useAuthStore.getState().session;
    if (!current || !current.user.availablePersonas.includes(persona)) {
      return;
    }
    set({ error: undefined, loading: true });
    try {
      const nextSession: AuthSession =
        current.authMode === 'real'
          ? await odpApi.switchPersona(persona)
          : {
              ...current,
              user: {
                ...current.user,
                persona,
              },
            };
      await saveSession(nextSession);
      set({ loading: false, session: nextSession });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Persona switch failed',
        loading: false,
      });
      throw error;
    }
  },
}));
