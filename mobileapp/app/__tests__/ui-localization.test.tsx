import React from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react-native';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import TabsLayout from '@/app/(tabs)/_layout';
import DevicesTab from '@/app/(tabs)/devices';
import HomeTab from '@/app/(tabs)/home';
import LearnTab from '@/app/(tabs)/learn';
import WalletTab from '@/app/(tabs)/wallet';
import WorkTab from '@/app/(tabs)/work';
import LanguageRegionScreen from '@/app/language-region';
import SettingsScreen from '@/app/settings';
import { RoleDashboard } from '@/components/demo/role-dashboard';
import { SharedProfileScreen } from '@/components/profile/shared-profile-screen';
import { PositioningGuidanceOverlay } from '@/components/work/positioning-guidance-overlay';
import { createPositioningService } from '@/features/capture-guidance/positioning-service';
import { VoiceGuidanceService, type SpeechDriver } from '@/features/capture-guidance/voice-guidance-service';
import { buildUserLanguagePreferences, isRtlLanguage } from '@/features/localization/locales';
import { getStoredLanguagePreference } from '@/features/localization/language-preferences';
import { translate } from '@/features/localization/strings';
import { personaConfigs } from '@/features/personas/persona-config';
import { useAuthStore } from '@/store/auth-store';
import { useGuidanceSettingsStore } from '@/store/guidance-settings-store';
import { useLocalizationStore } from '@/store/localization-store';
import type { AuthSession } from '@/types/domain';

jest.mock('expo-router', () => {
  const mockReact = require('react');
  const { Text: MockText, View: MockView } = require('react-native');
  const Tabs = ({ children }: { children: React.ReactNode }) => mockReact.createElement(MockView, null, children);
  Tabs.Screen = ({ name, options }: { name: string; options?: { href?: null; title?: string } }) =>
    options?.href === null ? null : mockReact.createElement(MockText, null, options?.title ?? name);
  return {
    __esModule: true,
    Tabs,
    router: {
      back: jest.fn(),
      push: jest.fn(),
      replace: jest.fn(),
    },
    useLocalSearchParams: jest.fn(() => ({})),
  };
});

jest.mock('@/hooks/use-odp-queries', () => ({
  __esModule: true,
  useAvailableTasks: jest.fn(() => ({ data: [], isLoading: false })),
  useCertifications: jest.fn(() => ({ data: [{ id: 'cert-1', progress: 0.7, status: 'certified', title: 'Visual QC' }], isLoading: false })),
  useHomeSummary: jest.fn(() => ({
    data: {
      edgePipeline: [],
      nextAction: 'Review your available work.',
      queuedUploads: 0,
      readiness: [],
      todayEarnings: 320,
      todayStats: {
        clipsCompleted: 3,
        earnings: 320,
        labelsCompleted: 18,
        unitsCompleted: 24,
      },
    },
    isLoading: false,
  })),
  useKitCustody: jest.fn(() => ({
    data: {
      acceptedAt: '2026-08-17T00:00:00.000Z',
      custodyStatus: 'accepted',
      devices: [],
      kitName: 'Vision Kit A',
      warnings: [],
    },
    isLoading: false,
  })),
  useLearningModules: jest.fn(() => ({
    data: [{ id: 'module-1', minutes: 8, progress: 0.4, required: true, title: 'Privacy Basics' }],
    isLoading: false,
  })),
  useMyTasks: jest.fn(() => ({ data: [], isLoading: false })),
  useWallet: jest.fn(() => ({
    data: {
      balance: 1000,
      byJobType: [],
      currency: 'INR',
      ledger: [],
      lifetime: 10000,
      pending: 250,
      weekEarnings: 1200,
      withdrawals: [],
    },
    isLoading: false,
  })),
  useWithdrawWallet: jest.fn(() => ({ data: null, isPending: false, mutate: jest.fn() })),
}));

jest.mock('@/features/uploads/use-upload-queue', () => ({
  __esModule: true,
  useUploadQueue: jest.fn(() => ({ data: [] })),
}));

const session: AuthSession = {
  accessToken: 'token',
  authMode: 'demo',
  expiresAt: '2026-08-17T00:00:00.000Z',
  refreshToken: 'refresh',
  sessionVersion: 2,
  user: {
    availablePersonas: ['tenant', 'aggregator'],
    certificationIds: [],
    email: 'multi@cosaarthi.local',
    entity: { id: 'ent-meridian', name: 'Meridian', type: 'tenant' },
    id: 'user-ops',
    locale: 'en-IN',
    name: 'Meridian Ops',
    permissions: ['tenant:read'],
    persona: 'tenant',
    phone: '+91',
    tenant: { id: 'tenant-meridian', name: 'Meridian' },
  },
};

async function setLanguage(languageCode: string, regionCode = languageCode === 'es' ? 'MX' : languageCode === 'ar' ? 'SA' : 'IN') {
  const preference = buildUserLanguagePreferences(languageCode, regionCode);
  await act(async () => {
    await useLocalizationStore.getState().saveForUser(session.user.email, preference);
  });
  return preference;
}

describe('global UI localization', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    useAuthStore.setState({
      bootstrapped: true,
      error: undefined,
      loading: false,
      session,
    });
    useLocalizationStore.setState({
      bootstrapped: true,
      currentUserEmail: session.user.email,
      preference: null,
    });
    useGuidanceSettingsStore.setState({ bootstrapped: true, voiceGuidanceEnabled: true });
    await setLanguage('en', 'US');
  });

  it('starts in English and updates Settings immediately when changed to Telugu', async () => {
    const screen = await render(<SettingsScreen />);
    expect(screen.getAllByText('App settings').length).toBeGreaterThan(0);
    expect(screen.getByText('Language & Region')).toBeTruthy();

    await setLanguage('te', 'IN');

    await waitFor(() => {
      expect(screen.getAllByText('యాప్ సెట్టింగులు').length).toBeGreaterThan(0);
      expect(screen.getByText('భాష మరియు ప్రాంతం')).toBeTruthy();
      expect(screen.getByText('వాయిస్ మార్గదర్శకం')).toBeTruthy();
    });
  }, 10000);

  it('localizes bottom tabs from the same preference', async () => {
    await setLanguage('te', 'IN');
    const screen = await render(<TabsLayout />);

    expect(screen.getByText('హోమ్')).toBeTruthy();
    expect(screen.getByText('పని')).toBeTruthy();
    expect(screen.getByText('పరికరాలు')).toBeTruthy();
    expect(screen.getByText('నేర్చుకోండి')).toBeTruthy();
    expect(screen.getByText('వాలెట్')).toBeTruthy();
  });

  it('localizes Crowd Home, Work, Devices, Learn, Wallet and Profile chrome', async () => {
    await setLanguage('te', 'IN');

    expect((await render(<HomeTab />)).getByText('ఈరోజు')).toBeTruthy();
    expect((await render(<WorkTab />)).getByText('Cosaarthi పని మోడ్‌లు')).toBeTruthy();
    expect((await render(<DevicesTab />)).getByText('కిట్ కస్టడీ')).toBeTruthy();
    expect((await render(<LearnTab />)).getByText('శిక్షణ మరియు సర్టిఫికేషన్లు')).toBeTruthy();
    expect((await render(<WalletTab />)).getByText('వాలెట్')).toBeTruthy();
    expect((await render(<SharedProfileScreen />)).getByText('ఖాతా')).toBeTruthy();
  });

  it('localizes Language & Region controls', async () => {
    await setLanguage('te', 'IN');
    const languageRegion = await render(<LanguageRegionScreen />);

    expect(languageRegion.getByText('భాష మరియు ప్రాంతం')).toBeTruthy();
    expect(languageRegion.getByText('తెలుగు')).toBeTruthy();
  });

  it('restores the saved Telugu preference after restart', async () => {
    const preference = await setLanguage('te', 'IN');

    await act(async () => {
      useLocalizationStore.setState({ bootstrapped: false, currentUserEmail: null, preference: null });
      await useLocalizationStore.getState().loadForUser(session.user.email);
    });
    expect(useLocalizationStore.getState().preference).toEqual(preference);
  });

  it('preserves Telugu UI when switching persona', async () => {
    await setLanguage('te', 'IN');
    await act(async () => {
      await useAuthStore.getState().switchPersona('aggregator');
    });
    const role = await render(<RoleDashboard config={personaConfigs.aggregator} />);

    expect(role.getByText('డెమో షెల్')).toBeTruthy();
    expect(role.getByText('చర్యలు')).toBeTruthy();
  });

  it('updates back to English immediately', async () => {
    await setLanguage('te', 'IN');
    const screen = await render(<SettingsScreen />);
    expect(screen.getAllByText('యాప్ సెట్టింగులు').length).toBeGreaterThan(0);

    await setLanguage('en', 'US');

    await waitFor(() => {
      expect(screen.getAllByText('App settings').length).toBeGreaterThan(0);
      expect(screen.getByText('Language & Region')).toBeTruthy();
    });
  });

  it('keeps camera visual guidance and TTS on the same selected Telugu locale', async () => {
    await setLanguage('te', 'IN');
    const guidance = createPositioningService('deterministic_dev_fallback', { alertDelayMs: 0 }).analyzeFrame({
      subjectCenterX: 0.92,
    });
    const overlay = await render(<PositioningGuidanceOverlay result={guidance} />);

    expect(overlay.getByText('కుడివైపు కదలండి')).toBeTruthy();
    expect(overlay.getByText('కెమెరాను కొంచెం కుడివైపు కదపండి.')).toBeTruthy();

    const driver = {
      getAvailableVoicesAsync: jest.fn(() =>
        Promise.resolve([{ identifier: 'voice-te', language: 'te-IN', name: 'Telugu', quality: 'Default' }]),
      ),
      speak: jest.fn(),
      stop: jest.fn(() => Promise.resolve()),
    } as SpeechDriver;
    const service = new VoiceGuidanceService(driver);
    await service.speakGuidance(guidance, { enabled: true, locale: useLocalizationStore.getState().preference?.locale, nowMs: 1000 });

    expect(driver.speak).toHaveBeenCalledWith(
      'కెమెరాను కొంచెం కుడివైపు కదపండి.',
      expect.objectContaining({ language: 'te-IN', voice: 'voice-te' }),
    );
  });

  it('supports Hindi, Spanish and RTL Arabic fallback behavior', async () => {
    expect(translate('tabs.work', 'hi-IN')).toBe('काम');
    expect(translate('settings.languageRegion', 'es-MX')).toBe('Idioma y región');
    expect(translate('tabs.wallet', 'ar-SA')).toBe('المحفظة');
    expect(isRtlLanguage('ar')).toBe(true);
    expect(await getStoredLanguagePreference(session.user.email)).toEqual({ languageCode: 'en', locale: 'en-US', regionCode: 'US' });
  });
});
