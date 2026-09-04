import { describe, expect, it } from '@jest/globals';

import { loginSchema } from '@/types/forms';

describe('loginSchema', () => {
  it('accepts a valid Crowd Mobile login payload', () => {
    const parsed = loginSchema.parse({
      email: 'Platform@Cosaarthi.Local',
      password: 'Cosaarthi#2026',
      persona: 'platform',
      workerCode: 'COSAARTHI-PLATFORM',
    });

    expect(parsed.email).toBe('platform@cosaarthi.local');
    expect(parsed.password).toBe('Cosaarthi#2026');
  });

  it('rejects invalid email and short passwords', () => {
    const parsed = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'short',
      persona: 'crowd',
    });

    expect(parsed.success).toBe(false);
  });
});
