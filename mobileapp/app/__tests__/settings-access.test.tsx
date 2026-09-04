import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { ReactElement } from 'react';

import LanguageRegionScreen from '@/app/language-region';
import LocaleSetupScreen from '@/app/locale-setup';
import ProfileTab from '@/app/(tabs)/profile';
import SettingsScreen from '@/app/settings';
import { RoleDashboard } from '@/components/demo/role-dashboard';
import { buildUserLanguagePreferences } from '@/features/localization/locales';
import { clearStoredLanguagePreference, getStoredLanguagePreference, saveStoredLanguagePreference } from '@/features/localization/language-preferences';
import { translate } from '@/features/localization/strings';
import { personaConfigs } from '@/features/personas/persona-config';
import { useAuthStore } from '@/store/auth-store';
import { useGuidanceSettingsStore } from '@/store/guidance-settings-store';
import { useLocalizationStore } from '@/store/localization-store';
import type { AuthSession } from '@/types/domain';

jest.mock('expo-router', () => ({
  __esModule: true,
  router: {
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  },
  useLocalSearchParams: jest.fn(() => ({})),
}));

jest.mock('@/hooks/use-odp-queries', () => ({
  __esModule: true,
  useCertifications: jest.fn(() => ({ data: [] })),
  useKitCustody: jest.fn(() => ({ data: { kitName: 'Vision Kit A' } })),
}));

const safeAreaMetrics = {
  frame: { height: 844, width: 390, x: 0, y: 0 },
  insets: { bottom: 34, left: 0, right: 0, top: 47 },
};

function renderWithSafeArea(element: ReactElement) {
  return render(<SafeAreaProvider initialMetrics={safeAreaMetrics}>{element}</SafeAreaProvider>);
}

const session: AuthSession = {
  accessToken: 'token',
  authMode: 'demo',
  expiresAt: '2026-08-17T00:00:00.000Z',
  refreshToken: 'refresh',
  sessionVersion: 2,
  user: {
    availablePersonas: ['crowd', 'tenant', 'aggregator'],
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
};

describe('settings access and language region controls', () => {
  beforeEach(async () => {
    const mockedRouter = (jest.requireMock('expo-router') as { router: { back: jest.Mock; push: jest.Mock; replace: jest.Mock } }).router;
    const mockedUseLocalSearchParams = (jest.requireMock('expo-router') as { useLocalSearchParams: jest.Mock }).useLocalSearchParams;
    jest.clearAllMocks();
    mockedRouter.back.mockClear();
    mockedRouter.push.mockClear();
    mockedRouter.replace.mockClear();
    mockedUseLocalSearchParams.mockReturnValue({});
    await clearStoredLanguagePreference('anita@crowd.in');
    await saveStoredLanguagePreference('anita@crowd.in', buildUserLanguagePreferences('te', 'IN'));
    useAuthStore.setState({
      bootstrapped: true,
      error: undefined,
      loading: false,
      session,
    });
    useLocalizationStore.setState({
      bootstrapped: true,
      currentUserEmail: 'anita@crowd.in',
      preference: buildUserLanguagePreferences('te', 'IN'),
    });
    useGuidanceSettingsStore.setState({
      bootstrapped: true,
      voiceGuidanceEnabled: true,
    });
  });

  it('keeps the legacy Crowd profile route on the shared Profile experience', async () => {
    const screen = await render(<ProfileTab />);

    expect(screen.getByText(translate('profile.profile', 'te').toUpperCase())).toBeTruthy();
    expect(screen.getByText('Anita Rao')).toBeTruthy();
    expect(screen.getByTestId('profile-settings-row')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('profile-settings-row'));
    const mockedRouter = (jest.requireMock('expo-router') as { router: { push: jest.Mock } }).router;
    expect(mockedRouter.push).toHaveBeenCalledWith('/settings');
  });

  it('shows a visible Profile entry from role dashboard headers', async () => {
    const screen = await render(<RoleDashboard config={personaConfigs.tenant} />);

    expect(screen.getByTestId('persona-header-profile')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('persona-header-profile'));
    const mockedRouter = (jest.requireMock('expo-router') as { router: { push: jest.Mock } }).router;
    expect(mockedRouter.push).toHaveBeenCalledWith('/account-profile');
  });

  it('opens Language & Region from Settings', async () => {
    const screen = await render(<SettingsScreen />);

    expect(screen.getByTestId('settings-language-region-open')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('settings-language-region-open'));
    const mockedRouter = (jest.requireMock('expo-router') as { router: { push: jest.Mock } }).router;
    expect(mockedRouter.push).toHaveBeenCalledWith('/language-region');
  });

  it('shows current language, region, voice guidance and automatic voice controls', async () => {
    const screen = await render(<LanguageRegionScreen />);

    expect(screen.getByText(translate('languageRegion.title', 'te'))).toBeTruthy();
    expect(screen.getByText('తెలుగు')).toBeTruthy();
    expect(screen.getByText('India')).toBeTruthy();
    expect(screen.getAllByText(translate('settings.voiceGuidance', 'te')).length).toBeGreaterThan(0);
    expect(screen.getByText(translate('languageRegion.voiceAutomatic', 'te'))).toBeTruthy();

    await fireEvent.press(screen.getByTestId('language-region-language-row'));
    const mockedRouter = (jest.requireMock('expo-router') as { router: { push: jest.Mock } }).router;
    expect(mockedRouter.push).toHaveBeenCalledWith('/locale-setup?mode=settings&step=language');

    await fireEvent.press(screen.getByTestId('language-region-region-row'));
    expect(mockedRouter.push).toHaveBeenCalledWith('/locale-setup?mode=settings&step=region');
  });

  it('saves language immediately from the settings language selector', async () => {
    const mockedUseLocalSearchParams = (jest.requireMock('expo-router') as { useLocalSearchParams: jest.Mock }).useLocalSearchParams;
    mockedUseLocalSearchParams.mockReturnValue({ mode: 'settings', step: 'language' });
    const screen = await renderWithSafeArea(<LocaleSetupScreen />);

    expect(screen.getByText(translate('languageRegion.changeLanguage', 'te'))).toBeTruthy();
    await fireEvent.press(screen.getByTestId('language-option-hi'));

    await waitFor(() => {
      const mockedRouter = (jest.requireMock('expo-router') as { router: { replace: jest.Mock } }).router;
      expect(mockedRouter.replace).toHaveBeenCalledWith('/language-region');
    });
    expect(await getStoredLanguagePreference('anita@crowd.in')).toEqual({
      languageCode: 'hi',
      locale: 'hi-IN',
      regionCode: 'IN',
    });
    expect(useLocalizationStore.getState().preference?.languageCode).toBe('hi');
  });

  it('saves region immediately from the settings region selector', async () => {
    const mockedUseLocalSearchParams = (jest.requireMock('expo-router') as { useLocalSearchParams: jest.Mock }).useLocalSearchParams;
    mockedUseLocalSearchParams.mockReturnValue({ mode: 'settings', step: 'region' });
    const screen = await renderWithSafeArea(<LocaleSetupScreen />);

    expect(screen.getByText(translate('languageRegion.changeRegion', 'te'))).toBeTruthy();
    await fireEvent.press(screen.getByTestId('region-option-US'));

    await waitFor(() => {
      const mockedRouter = (jest.requireMock('expo-router') as { router: { replace: jest.Mock } }).router;
      expect(mockedRouter.replace).toHaveBeenCalledWith('/language-region');
    });
    expect(await getStoredLanguagePreference('anita@crowd.in')).toEqual({
      languageCode: 'te',
      locale: 'te-US',
      regionCode: 'US',
    });
    expect(useLocalizationStore.getState().preference?.regionCode).toBe('US');
  });
});
