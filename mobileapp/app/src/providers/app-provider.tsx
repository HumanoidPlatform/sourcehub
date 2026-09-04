import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import type { PropsWithChildren } from 'react';
import { useEffect, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { getSafeFeedbackMessage } from '@/features/feedback/error-messages';
import { FeedbackProvider, useFeedback } from '@/features/feedback/feedback-provider';
import { useQueueProcessor } from '@/features/uploads/use-queue-processor';
import { initUploadQueue } from '@/services/upload-queue';
import { useAuthStore } from '@/store/auth-store';
import { useGuidanceSettingsStore } from '@/store/guidance-settings-store';

function AppBootstrap() {
  const bootstrapAuth = useAuthStore((state) => state.bootstrap);
  const bootstrapGuidanceSettings = useGuidanceSettingsStore((state) => state.bootstrap);
  const feedback = useFeedback();
  useQueueProcessor();

  useEffect(() => {
    let mounted = true;

    async function runStartupStep(label: string, action: () => Promise<unknown>) {
      try {
        await action();
      } catch (error) {
        if (mounted) {
          feedback.showError(getSafeFeedbackMessage(error, `${label} failed during app startup.`));
        }
      }
    }

    async function boot() {
      try {
        await runStartupStep('Upload queue initialization', initUploadQueue);
        await runStartupStep('Voice guidance settings', bootstrapGuidanceSettings);
        await runStartupStep('Session restore', bootstrapAuth);
      } finally {
        if (mounted) {
          await SplashScreen.hideAsync().catch((error: unknown) => {
            feedback.showError(getSafeFeedbackMessage(error, 'Could not finish app startup.'));
          });
        }
      }
    }

    void boot();

    return () => {
      mounted = false;
    };
  }, [bootstrapAuth, bootstrapGuidanceSettings, feedback]);

  return null;
}

export function AppProvider({ children }: PropsWithChildren) {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 1000 * 30,
          },
        },
      }),
    [],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <FeedbackProvider>
          <StatusBar style="dark" />
          <AppBootstrap />
          {children}
        </FeedbackProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
