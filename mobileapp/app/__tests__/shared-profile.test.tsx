import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import HomeTab from '@/app/(tabs)/home';
import { demoPersonaOptions } from '@/auth/demo-personas';
import { getLandingRouteForSession } from '@/auth/persona-routing';
import { mockApiAdapter } from '@/api/mock-adapter';
import { RoleDashboard } from '@/components/demo/role-dashboard';
import { SharedProfileScreen } from '@/components/profile/shared-profile-screen';
import { buildUserLanguagePreferences } from '@/features/localization/locales';
import { translate } from '@/features/localization/strings';
import { getStoredSession } from '@/services/secure-session';
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
}));

jest.mock('@/hooks/use-odp-queries', () => ({
  __esModule: true,
  useAvailableTasks: jest.fn(() => ({ data: [], isLoading: false })),
  useCertifications: jest.fn(() => ({
    data: [
      { status: 'certified', title: 'Visual QC' },
      { status: 'in_progress', title: 'Model Eval' },
    ],
    isLoading: false,
  })),
  useHomeSummary: jest.fn(() => ({
    data: {
      edgePipeline: [],
      nextAction: 'Review your available work.',
      queuedUploads: 0,
      readiness: [],
      todayEarnings: 0,
      todayStats: {
        clipsCompleted: 0,
        earnings: 0,
        labelsCompleted: 0,
        unitsCompleted: 0,
      },
    },
    isLoading: false,
  })),
  useKitCustody: jest.fn(() => ({
    data: {
      kitName: 'Vision Kit A',
    },
    isLoading: false,
  })),
}));

jest.mock('@/features/uploads/use-upload-queue', () => ({
  __esModule: true,
  useUploadQueue: jest.fn(() => ({ data: [] })),
}));

async function loginAs(option: (typeof demoPersonaOptions)[number]) {
  const session = await mockApiAdapter.login({
    email: option.email,
    password: option.password,
    persona: option.persona,
    workerCode: option.code,
  });
  useAuthStore.setState({
    bootstrapped: true,
    error: undefined,
    loading: false,
    session,
  });
  await useLocalizationStore.getState().saveForUser(session.user.email, buildUserLanguagePreferences('te', 'IN'));
  useGuidanceSettingsStore.setState({ bootstrapped: true, voiceGuidanceEnabled: true });
  return session;
}

async function loginAndPersistAs(option: (typeof demoPersonaOptions)[number]) {
  await useAuthStore.getState().login({
    email: option.email,
    password: option.password,
    persona: option.persona,
    workerCode: option.code,
  });
  const session = useAuthStore.getState().session;
  if (!session) {
    throw new Error(`Expected ${option.label} login to create a session`);
  }
  await useLocalizationStore.getState().saveForUser(session.user.email, buildUserLanguagePreferences('te', 'IN'));
  useGuidanceSettingsStore.setState({ bootstrapped: true, voiceGuidanceEnabled: true });
  return session;
}

describe('shared persona profile', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await useAuthStore.getState().logout();
    useAuthStore.setState({
      bootstrapped: true,
      error: undefined,
      loading: false,
      session: null,
    });
    useLocalizationStore.setState({
      bootstrapped: false,
      currentUserEmail: null,
      preference: null,
    });
    useGuidanceSettingsStore.setState({ bootstrapped: true, voiceGuidanceEnabled: true });
  });

  it.each(demoPersonaOptions)('keeps $label landing route and exposes profile access', async (option) => {
    const session = await loginAs(option);
    const screen =
      option.persona === 'crowd'
        ? await render(<HomeTab />)
        : await render(<RoleDashboard config={personaConfigs[option.persona]} />);

    expect(getLandingRouteForSession(session)).toBe(personaConfigs[option.persona].landingRoute);
    expect(screen.getByTestId('persona-header-profile')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('persona-header-profile'));
    const mockedRouter = (jest.requireMock('expo-router') as { router: { push: jest.Mock } }).router;
    expect(mockedRouter.push).toHaveBeenCalledWith('/account-profile');
  });

  it.each(demoPersonaOptions)('renders shared profile session data for $label without secrets', async (option) => {
    const session = await loginAs(option);
    const screen = await render(<SharedProfileScreen />);

    expect(screen.getByText(translate('profile.profile', 'te').toUpperCase())).toBeTruthy();
    expect(screen.getByText(session.user.name)).toBeTruthy();
    expect(screen.getByText(session.user.email)).toBeTruthy();
    expect(screen.getAllByText(session.user.id).length).toBeGreaterThan(0);
    expect(screen.getAllByText(personaConfigs[option.persona].label).length).toBeGreaterThan(0);
    expect(screen.getAllByText(session.user.entity.name).length).toBeGreaterThan(0);
    expect(screen.getAllByText(session.user.entity.id).length).toBeGreaterThan(0);
    expect(screen.getByTestId('profile-settings-row')).toBeTruthy();
    expect(screen.getByTestId('profile-language-region-row')).toBeTruthy();
    expect(screen.getByTestId('profile-voice-guidance-row')).toBeTruthy();
    expect(screen.queryByText(session.accessToken)).toBeNull();
    expect(screen.queryByText(session.refreshToken)).toBeNull();
  });

  it('shows Crowd-specific worker profile status', async () => {
    await loginAs(demoPersonaOptions.find((option) => option.persona === 'crowd')!);
    const screen = await render(<SharedProfileScreen />);

    expect(screen.getByText(translate('profile.workerId', 'te'))).toBeTruthy();
    expect(screen.getByText(translate('profile.certificationStatus', 'te'))).toBeTruthy();
    expect(screen.getByText(`1/2 ${translate('profile.certified', 'te')}`)).toBeTruthy();
    expect(screen.getByText(translate('profile.assignedKit', 'te'))).toBeTruthy();
    expect(screen.getByText('Vision Kit A')).toBeTruthy();
  });

  it('opens Settings and Language & Region from Profile', async () => {
    await loginAs(demoPersonaOptions[0]);
    const screen = await render(<SharedProfileScreen />);

    await fireEvent.press(screen.getByTestId('profile-settings-row'));
    await fireEvent.press(screen.getByTestId('profile-language-region-row'));

    const mockedRouter = (jest.requireMock('expo-router') as { router: { push: jest.Mock } }).router;
    expect(mockedRouter.push).toHaveBeenCalledWith('/settings');
    expect(mockedRouter.push).toHaveBeenCalledWith('/language-region');
  });

  it('preserves language preference when switching persona and reopening Profile', async () => {
    const session = await mockApiAdapter.login({
      email: 'multi@cosaarthi.local',
      password: 'Cosaarthi#2026',
      persona: 'tenant',
      workerCode: 'COSAARTHI-MULTI',
    });
    useAuthStore.setState({
      bootstrapped: true,
      error: undefined,
      loading: false,
      session,
    });
    await useLocalizationStore.getState().saveForUser(session.user.email, buildUserLanguagePreferences('te', 'IN'));
    await useAuthStore.getState().switchPersona('aggregator');
    const screen = await render(<SharedProfileScreen />);

    expect(useLocalizationStore.getState().preference).toEqual({
      languageCode: 'te',
      locale: 'te-IN',
      regionCode: 'IN',
    });
    expect(useAuthStore.getState().session?.user.email).toBe(session.user.email);
    expect(screen.getAllByText('Aggregator').length).toBeGreaterThan(0);
  });

  it('uses localized logout confirmation, supports cancel, and clears session on confirm', async () => {
    const session = await loginAndPersistAs(demoPersonaOptions.find((option) => option.persona === 'builder')!);
    await expect(getStoredSession()).resolves.toMatchObject({ accessToken: session.accessToken });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const screen = await render(<SharedProfileScreen />);

    await fireEvent.press(screen.getByTestId('profile-logout-button'));
    expect(alertSpy).toHaveBeenLastCalledWith('లాగ్ అవుట్?', 'మీరు ఖచ్చితంగా లాగ్ అవుట్ చేయాలనుకుంటున్నారా?', expect.any(Array));
    expect(useAuthStore.getState().session?.user.email).toBe(session.user.email);

    await fireEvent.press(screen.getByTestId('profile-logout-button'));
    const buttons = alertSpy.mock.calls.at(-1)?.[2] as { onPress?: () => void; text: string }[];
    expect(buttons[0].text).toBe('రద్దు');
    expect(buttons[1].text).toBe('లాగ్ అవుట్');
    buttons[1].onPress?.();

    await waitFor(async () => {
      expect(useAuthStore.getState().session).toBeNull();
      expect(await getStoredSession()).toBeNull();
    });
    const mockedRouter = (jest.requireMock('expo-router') as { router: { replace: jest.Mock } }).router;
    expect(mockedRouter.replace).toHaveBeenCalledWith('/login');
  });
});
