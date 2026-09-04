import { mockApiAdapter } from './mock-adapter';
import { realApiAdapter } from './real-adapter';

import type { OdpApiAdapter } from '@/api/adapter';

export function createOdpApi(): OdpApiAdapter {
  const mode = process.env.EXPO_PUBLIC_API_MODE ?? 'real';
  return mode === 'mock' ? mockApiAdapter : realApiAdapter;
}

export const odpApi = createOdpApi();
