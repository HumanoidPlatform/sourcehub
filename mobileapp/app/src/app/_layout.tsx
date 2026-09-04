import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AppProvider } from '@/providers/app-provider';

void SplashScreen.preventAutoHideAsync().catch((error: unknown) => {
  console.warn('Unable to keep the splash screen visible during startup.', error);
});

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="platform" />
        <Stack.Screen name="client" />
        <Stack.Screen name="tenant" />
        <Stack.Screen name="aggregator" />
        <Stack.Screen name="partner" />
        <Stack.Screen name="sponsor" />
        <Stack.Screen name="ide" />
        <Stack.Screen name="builder" />
        <Stack.Screen name="qa" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="account-profile" />
        <Stack.Screen name="persona-switch" />
        <Stack.Screen name="locale-setup" />
        <Stack.Screen name="reset-session" />
        <Stack.Screen name="task/[id]" />
        <Stack.Screen name="task/[id]/start" />
        <Stack.Screen name="capture/[taskId]/index" />
        <Stack.Screen name="capture/[taskId]/image" />
        <Stack.Screen name="capture/[taskId]/video" />
        <Stack.Screen name="capture/[taskId]/audio" />
        <Stack.Screen name="annotation/[taskId]" />
        <Stack.Screen name="transcription/[taskId]" />
        <Stack.Screen name="survey/[taskId]" />
        <Stack.Screen name="rating/[taskId]" />
        <Stack.Screen name="preview/[queueId]" />
        <Stack.Screen name="upload/[queueId]" />
        <Stack.Screen name="result/[queueId]" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="appeals" />
        <Stack.Screen name="learn" />
        <Stack.Screen name="language-region" />
        <Stack.Screen name="settings" />
      </Stack>
    </AppProvider>
  );
}
