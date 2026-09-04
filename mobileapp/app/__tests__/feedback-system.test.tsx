import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { PropsWithChildren, ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import LoginScreen from '@/app/(auth)/login';
import { getSafeFeedbackMessage } from '@/features/feedback/error-messages';
import { FeedbackProvider, useFeedback } from '@/features/feedback/feedback-provider';
import { buildUserLanguagePreferences } from '@/features/localization/locales';
import { useAuthStore } from '@/store/auth-store';
import { useLocalizationStore } from '@/store/localization-store';
import { useWorkflowStore } from '@/store/workflow-store';
import { SharedWorkflowPanel } from '@/components/workflow/shared-workflow-panel';
import type { AuthSession, LoginInput } from '@/types/domain';

jest.mock('expo-router', () => ({
  __esModule: true,
  router: {
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

const safeAreaMetrics = {
  frame: { height: 844, width: 390, x: 0, y: 0 },
  insets: { bottom: 34, left: 0, right: 0, top: 47 },
};

let lastFeedbackId = '';
let feedbackApi: ReturnType<typeof useFeedback>;

function TestProviders({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <FeedbackProvider>{children}</FeedbackProvider>
    </SafeAreaProvider>
  );
}

function renderWithFeedback(element: ReactElement) {
  return render(<TestProviders>{element}</TestProviders>);
}

function createSession(persona: AuthSession['user']['persona'] = 'crowd'): AuthSession {
  return {
    accessToken: 'test-access',
    authMode: 'demo',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
    refreshToken: 'test-refresh',
    sessionVersion: 1,
    user: {
      availablePersonas: [persona],
      certificationIds: [],
      email: 'anita@crowd.in',
      entity: {
        id: 'ent-test',
        name: 'Test Entity',
        type: persona === 'crowd' ? 'crowd_pool' : 'tenant',
      },
      id: 'user-test',
      locale: 'en-IN',
      name: 'Test User',
      permissions: ['work:read'],
      persona,
      phone: '+91 90000 0000',
      tenant: {
        id: 'tenant-meridian',
        name: 'Meridian Data Labs',
      },
    },
  };
}

function FeedbackHarness() {
  feedbackApi = useFeedback();
  return null;
}

describe('global feedback system', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
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
    useWorkflowStore.getState().resetWorkflow();
  });

  afterEach(() => {
    lastFeedbackId = '';
    jest.useRealTimers();
  });

  it('shows, manually dismisses, and automatically dismisses messages', async () => {
    const screen = await renderWithFeedback(<FeedbackHarness />);

    await act(async () => {
      lastFeedbackId = feedbackApi.showSuccess('Saved successfully', 1000);
    });
    expect(screen.getByText('Saved successfully')).toBeTruthy();
    expect(screen.getByTestId('feedback-success')).toBeTruthy();

    await act(async () => {
      feedbackApi.dismiss(lastFeedbackId);
    });
    expect(screen.queryByText('Saved successfully')).toBeNull();

    await act(async () => {
      feedbackApi.showError('Unable to save', 50);
    });
    expect(screen.getByText('Unable to save')).toBeTruthy();

    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 75);
      });
    });
    expect(screen.queryByText('Unable to save')).toBeNull();
  });

  it('maps technical errors to safe user-facing messages', () => {
    expect(getSafeFeedbackMessage(new TypeError('undefined is not an object'), 'Could not save.')).toBe('Could not save.');
    expect(getSafeFeedbackMessage(new Error('Video requirements need a minimum duration of 5 minutes.'), 'Could not save.')).toBe(
      'Video requirements need a minimum duration of 5 minutes.',
    );
  });

  it('shows login success only after async login completes and navigation remains intact', async () => {
    const login = jest.fn(async (_input: LoginInput) => {
      await Promise.resolve();
      const session = createSession('crowd');
      useAuthStore.setState({ error: undefined, loading: false, session });
    });
    useAuthStore.setState({ login });
    await useLocalizationStore.getState().saveForUser('anita@crowd.in', buildUserLanguagePreferences('en', 'IN'));
    const screen = await renderWithFeedback(<LoginScreen />);

    expect(screen.queryByText('Signed in successfully')).toBeNull();
    await fireEvent.press(screen.getByTestId('login-submit'));

    await waitFor(() => {
      expect(login).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Signed in successfully')).toBeTruthy();
    });
    const mockedRouter = (jest.requireMock('expo-router') as { router: { replace: jest.Mock } }).router;
    expect(mockedRouter.replace).toHaveBeenCalledWith('/home');
  });

  it('shows login failure when auth does not produce a session', async () => {
    const login = jest.fn(async () => {
      useAuthStore.setState({ error: 'Login failed', loading: false, session: null });
    });
    useAuthStore.setState({ login });
    const screen = await renderWithFeedback(<LoginScreen />);

    await fireEvent.press(screen.getByTestId('login-submit'));

    await waitFor(() => {
      expect(screen.getAllByText('Unable to sign in. Please try again.').length).toBeGreaterThan(0);
    });
    expect(screen.queryByText('Signed in successfully')).toBeNull();
  });

  it('shows requirement failure without mutating previous valid workflow state', async () => {
    const screen = await renderWithFeedback(<SharedWorkflowPanel accountId="client-autodrive" persona="client" userId="user-client" />);

    await waitFor(() => {
      expect(screen.getByTestId('client-required-duration-minutes')).toBeTruthy();
    });
    await act(async () => {
      screen.getByTestId('client-required-duration-minutes').props.onChangeText('1');
    });
    await waitFor(() => {
      expect(screen.getByTestId('client-required-duration-minutes').props.value).toBe('1');
    });
    fireEvent.press(screen.getByTestId('client-requirement-submit'));

    await waitFor(() => {
      expect(useWorkflowStore.getState().requirements).toHaveLength(0);
      expect(screen.getAllByText('Video requirements need a minimum duration of 5 minutes.').length).toBeGreaterThan(0);
    });
  });

  it('prevents duplicate Client requirement submissions and reports the result', async () => {
    const screen = await renderWithFeedback(<SharedWorkflowPanel accountId="client-autodrive" persona="client" userId="user-client" />);

    await fireEvent.press(screen.getByTestId('client-requirement-submit'));
    await fireEvent.press(screen.getByTestId('client-requirement-submit'));

    await waitFor(() => {
      expect(useWorkflowStore.getState().requirements).toHaveLength(1);
      expect(screen.getByText('Requirement submitted successfully')).toBeTruthy();
      expect(screen.getByText('Requirement already submitted')).toBeTruthy();
    });
  });
});
