import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { ReactElement } from 'react';

import { useAuthStore } from '@/store/auth-store';
import type { AuthSession } from '@/types/domain';

jest.mock('expo-router', () => ({
  __esModule: true,
  router: {
    replace: jest.fn(),
  },
}));

const safeAreaMetrics = {
  frame: { height: 844, width: 390, x: 0, y: 0 },
  insets: { bottom: 34, left: 0, right: 0, top: 47 },
};

const multiSession: AuthSession = {
  accessToken: 'token',
  authMode: 'demo',
  expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  refreshToken: 'refresh',
  sessionVersion: 2,
  user: {
    availablePersonas: ['tenant', 'aggregator', 'qa', 'crowd'],
    certificationIds: [],
    email: 'multi@cosaarthi.local',
    entity: { id: 'tenant-1', name: 'Cosaarthi Tenant Operations', type: 'tenant' },
    id: 'user-multi',
    locale: 'en-IN',
    name: 'Multi Persona',
    permissions: ['tenant:read', 'aggregator:read', 'qa:read', 'work:read'],
    persona: 'tenant',
    phone: '+91 90000 8000',
    tenant: { id: 'tenant-1', name: 'Cosaarthi Tenant Operations' },
  },
};

function renderWithSafeArea(element: ReactElement) {
  return render(<SafeAreaProvider initialMetrics={safeAreaMetrics}>{element}</SafeAreaProvider>);
}

describe('PersonaSwitchScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      bootstrapped: true,
      error: undefined,
      loading: false,
      session: multiSession,
    });
  });

  it('renders assigned personas and routes through the selected persona', async () => {
    const PersonaSwitchScreen = require('@/app/persona-switch').default as typeof import('@/app/persona-switch').default;
    const screen = await renderWithSafeArea(<PersonaSwitchScreen />);

    expect(screen.getByText('Choose workspace')).toBeTruthy();
    expect(screen.getByTestId('persona-switch-option-tenant')).toBeTruthy();
    expect(screen.getByTestId('persona-switch-option-aggregator')).toBeTruthy();
    expect(screen.getByTestId('persona-switch-option-qa')).toBeTruthy();
    expect(screen.getByTestId('persona-switch-option-crowd')).toBeTruthy();
    expect(screen.queryByTestId('persona-switch-option-builder')).toBeNull();

    await fireEvent.press(screen.getByTestId('persona-switch-option-aggregator'));

    await waitFor(() => {
      expect(useAuthStore.getState().session?.user.persona).toBe('aggregator');
      const mockedRouter = (jest.requireMock('expo-router') as { router: { replace: jest.Mock } }).router;
      expect(mockedRouter.replace).toHaveBeenCalledWith('/aggregator');
    });
  });
});
