import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { ReactElement } from 'react';

import { loginAccountOptions } from '@/auth/demo-personas';
import LoginScreen from '@/app/(auth)/login';
import { useLocalizationStore } from '@/store/localization-store';
import { useAuthStore } from '@/store/auth-store';

jest.mock('expo-router', () => ({
  __esModule: true,
  router: {
    back: jest.fn(),
    replace: jest.fn(),
  },
}));

const safeAreaMetrics = {
  frame: { height: 844, width: 390, x: 0, y: 0 },
  insets: { bottom: 34, left: 0, right: 0, top: 47 },
};

function renderWithSafeArea(element: ReactElement) {
  return render(<SafeAreaProvider initialMetrics={safeAreaMetrics}>{element}</SafeAreaProvider>);
}

describe('LoginScreen account selector', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_API_MODE = 'mock';
    useAuthStore.setState({
      bootstrapped: true,
      error: undefined,
      loading: false,
      session: null,
    });
    useLocalizationStore.setState({
      bootstrapped: true,
      currentUserEmail: null,
      preference: null,
    });
  });

  it('shows one account dropdown and keeps password immediately visible', async () => {
    const screen = await renderWithSafeArea(<LoginScreen />);

    expect(screen.getByText('Account')).toBeTruthy();
    expect(screen.getByTestId('persona-selector-field')).toBeTruthy();
    expect(screen.getByText('Platform')).toBeTruthy();
    expect(screen.queryByTestId('login-email-input')).toBeNull();
    expect(screen.getByTestId('login-password-input')).toBeTruthy();
    expect(screen.getByText('Sign in')).toBeTruthy();
    expect(screen.getByText('Development test password: Cosaarthi#2026')).toBeTruthy();

    expect(screen.queryByTestId('login-account-option-client')).toBeNull();
    expect(screen.queryByText('AI Builder')).toBeNull();
  });

  it('opens a modal selector with all seeded accounts and marks the current selection', async () => {
    const screen = await renderWithSafeArea(<LoginScreen />);

    await fireEvent.press(screen.getByTestId('persona-selector-field'));

    await waitFor(() => {
      expect(screen.getByTestId('persona-selector-modal')).toBeTruthy();
    });
    for (const option of loginAccountOptions) {
      expect(screen.getByTestId(`login-account-option-${option.id}`)).toBeTruthy();
      expect(screen.getAllByText(option.label).length).toBeGreaterThan(0);
    }
    expect(screen.getByTestId('login-account-option-platform').props.accessibilityState.selected).toBe(true);
  });

  it('selects an account, closes the modal, and maps seeded credentials without logging in', async () => {
    const login = jest.fn(() => Promise.resolve());
    useAuthStore.setState({ login });
    const screen = await renderWithSafeArea(<LoginScreen />);

    await fireEvent.press(screen.getByTestId('persona-selector-field'));
    await waitFor(() => {
      expect(screen.getByTestId('login-account-option-client')).toBeTruthy();
    });
    await fireEvent.press(screen.getByTestId('login-account-option-client'));

    await waitFor(() => {
      expect(screen.queryByTestId('persona-selector-modal')).toBeNull();
    });
    expect(screen.getByText('Client')).toBeTruthy();
    expect(screen.getByText('client@cosaarthi.local')).toBeTruthy();
    expect(screen.getByTestId('login-password-input').props.value).toBe('Cosaarthi#2026');
    expect(screen.getByTestId('login-submit')).toBeTruthy();
    expect(login).not.toHaveBeenCalled();
  });

});
