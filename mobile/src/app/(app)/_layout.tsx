import { Redirect, Stack, usePathname } from "expo-router";
import { useAuth } from "@/auth/AuthProvider";
import { C, OfflineBanner } from "@/ui";

export default function AppLayout() {
  const { session, ready } = useAuth();
  const path = usePathname();
  if (!ready) return null;
  if (!session) return <Redirect href="/sign-in" />;
  if (session.must_change_password && path !== "/change-password") return <Redirect href="/change-password" />;
  return (
    <>
      <OfflineBanner />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: C.bg },
          headerShadowVisible: false,
          headerTintColor: C.ink,
          contentStyle: { backgroundColor: C.bg },
        }}
      >
        <Stack.Screen name="assignments/index" options={{ title: "My assignments" }} />
        <Stack.Screen name="assignments/[id]/index" options={{ title: "Assignment" }} />
        <Stack.Screen name="assignments/[id]/capture" options={{ title: "Capture", headerShown: false }} />
        <Stack.Screen name="notifications" options={{ title: "Notifications", presentation: "modal" }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
        <Stack.Screen name="change-password" options={{ title: "Set a new password" }} />
      </Stack>
    </>
  );
}
