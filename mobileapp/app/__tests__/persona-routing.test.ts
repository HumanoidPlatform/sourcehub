import { describe, expect, it } from '@jest/globals';

import { getLandingRouteForPersona, getLandingRouteForSession } from '@/auth/persona-routing';
import type { AuthSession, Persona } from '@/types/domain';

const routes: { persona: Persona; route: string }[] = [
  { persona: 'platform', route: '/platform' },
  { persona: 'client', route: '/client' },
  { persona: 'tenant', route: '/tenant' },
  { persona: 'aggregator', route: '/aggregator' },
  { persona: 'qa', route: '/qa' },
  { persona: 'partner', route: '/partner' },
  { persona: 'sponsor', route: '/sponsor' },
  { persona: 'crowd', route: '/home' },
  { persona: 'ide', route: '/ide' },
  { persona: 'builder', route: '/builder' },
];

describe('persona routing', () => {
  it.each(routes)('routes $persona to $route', ({ persona, route }) => {
    expect(getLandingRouteForPersona(persona)).toBe(route);
  });

  it('routes anonymous users to login', () => {
    expect(getLandingRouteForSession(null)).toBe('/login');
  });

  it('routes an authenticated session by its stored persona', () => {
    const session = {
      user: {
        persona: 'tenant',
      },
    } as AuthSession;

    expect(getLandingRouteForSession(session)).toBe('/tenant');
  });
});
