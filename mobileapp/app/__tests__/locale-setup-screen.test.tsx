import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { ReactElement } from 'react';

import LocaleSetupScreen from '@/app/locale-setup';
import { clearStoredLanguagePreference, getStoredLanguagePreference } from '@/features/localization/language-preferences';
import { useAuthStore } from '@/store/auth-store';
import { useLocalizationStore } from '@/store/localization-store';

jest.mock('expo-router', () => ({
  __esModule: true,
  router: {
    back: jest.fn(),
    replace: jest.fn(),
  },
  useLocalSearchParams: jest.fn(() => ({})),
}));

const safeAreaMetrics = {
  frame: { height: 844, width: 390, x: 0, y: 0 },
  insets: { bottom: 34, left: 0, right: 0, top: 47 },
};

function renderWithSafeArea(element: ReactElement) {
  return render(<SafeAreaProvider initialMetrics={safeAreaMetrics}>{element}</SafeAreaProvider>);
}

describe('LocaleSetupScreen', () => {
  beforeEach(async () => {
    const mockedRouter = (jest.requireMock('expo-router') as { router: { replace: jest.Mock } }).router;
    mockedRouter.replace.mockClear();
    await clearStoredLanguagePreference('anita@crowd.in');
    useAuthStore.setState({
      bootstrapped: true,
      error: undefined,
      loading: false,
      session: {
        accessToken: 'token',
        authMode: 'demo',
        expiresAt: '2026-08-17T00:00:00.000Z',
        refreshToken: 'refresh',
        sessionVersion: 2,
        user: {
          availablePersonas: ['crowd', 'ide'],
          certificationIds: [],
          email: 'anita@crowd.in',
          entity: { id: 'ent-crowd', name: 'Crowd', type: 'crowd_pool' },
          id: 'user-anita',
          locale: 'en-IN',
          name: 'Anita Rao',
          permissions: ['work:read'],
          persona: 'crowd',
          phone: '+91',
          tenant: { id: 'tenant', name: 'Tenant' },
        },
      },
    });
    useLocalizationStore.setState({
      bootstrapped: false,
      currentUserEmail: null,
      preference: null,
    });
  });

  it('requires language and region before saving', async () => {
    const screen = await renderWithSafeArea(<LocaleSetupScreen />);

    expect(screen.getByText('Choose your language')).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByTestId('language-option-scroller').props.style).maxHeight).toBeLessThanOrEqual(360);
    expect(screen.getByTestId('save-locale-preference').props.accessibilityState.disabled).toBe(true);

    await fireEvent.press(screen.getByTestId('language-option-te'));
    expect(screen.getByText('Choose your region')).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByTestId('region-option-scroller').props.style).maxHeight).toBeLessThanOrEqual(360);
    expect(screen.getByTestId('save-locale-preference').props.accessibilityState.disabled).toBe(true);
  });

  it('saves selected language and region before entering the persona app', async () => {
    const screen = await renderWithSafeArea(<LocaleSetupScreen />);

    await fireEvent.press(screen.getByTestId('language-option-te'));
    await fireEvent.press(screen.getByTestId('region-option-IN'));
    expect(screen.getByTestId('save-locale-preference')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('save-locale-preference'));

    await waitFor(() => {
      const mockedRouter = (jest.requireMock('expo-router') as { router: { replace: jest.Mock } }).router;
      expect(mockedRouter.replace).toHaveBeenCalledWith('/home');
    });
    expect(await getStoredLanguagePreference('anita@crowd.in')).toEqual({
      languageCode: 'te',
      locale: 'te-IN',
      regionCode: 'IN',
    });
  });
});
