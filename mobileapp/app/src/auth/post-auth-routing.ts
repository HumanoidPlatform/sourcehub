import { getLandingRouteForSession } from '@/auth/persona-routing';
import type { AuthSession } from '@/types/domain';

export async function getPostAuthRouteForSession(session: AuthSession | null) {
  if (!session) {
    return '/login';
  }

  return session.user.availablePersonas.length > 1 ? '/persona-switch' : getLandingRouteForSession(session);
}
