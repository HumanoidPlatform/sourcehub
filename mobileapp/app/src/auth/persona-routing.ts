import type { AuthSession, Persona } from '@/types/domain';

export function getLandingRouteForPersona(persona: Persona) {
  switch (persona) {
    case 'platform':
      return '/platform';
    case 'client':
      return '/client';
    case 'tenant':
      return '/tenant';
    case 'aggregator':
      return '/aggregator';
    case 'qa':
      return '/qa';
    case 'partner':
      return '/partner';
    case 'sponsor':
      return '/sponsor';
    case 'ide':
      return '/ide';
    case 'builder':
      return '/builder';
    case 'crowd':
    default:
      return '/home';
  }
}

export function getLandingRouteForSession(session: AuthSession | null) {
  return session ? getLandingRouteForPersona(session.user.persona) : '/login';
}
