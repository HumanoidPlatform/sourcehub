import { describe, expect, it } from '@jest/globals';

import { signupSchema } from '@/types/forms';

describe('signupSchema', () => {
  it('accepts a valid Crowd Worker signup payload', () => {
    const parsed = signupSchema.parse({
      confirmPassword: 'Cosaarthi#2026',
      email: 'new.worker@cosaarthi.example',
      firstName: 'New',
      lastName: 'Worker',
      password: 'Cosaarthi#2026',
      phone: '+91 90000 11111',
      termsAccepted: true,
    });

    expect(parsed.email).toBe('new.worker@cosaarthi.example');
    expect(parsed.termsAccepted).toBe(true);
  });

  it('requires accepted terms and matching passwords', () => {
    const parsed = signupSchema.safeParse({
      confirmPassword: 'Cosaarthi#2027',
      email: 'new.worker@cosaarthi.example',
      firstName: 'New',
      lastName: 'Worker',
      password: 'Cosaarthi#2026',
      phone: '+91 90000 11111',
      termsAccepted: false,
    });

    expect(parsed.success).toBe(false);
  });
});
