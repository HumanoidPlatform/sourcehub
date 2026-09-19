import { Redirect, Stack, usePathname } from "expo-router";
import { useAuth } from "@/auth/AuthProvider";
import { useConsent } from "@/consentStore";
import { C, OfflineBanner } from "@/ui";

export default function AppLayout() {
  const { session, ready } = useAuth();
  const path = usePathname();
  const consent = useConsent(session?.user_id);
  if (!ready) return null;
  if (!session) return <Redirect href="/sign-in" />;
  if (session.must_change_password && path !== "/change-password") return <Redirect href="/change-password" />;
  // The privacy notice comes after the password and before everything else.
  // Wait for the store rather than guess: redirecting on "not read yet" would
  // flash the notice at someone who agreed to it yesterday.
  if (!consent.ready) return null;
  if (!session.must_change_password && !consent.accepted && path !== "/consent") return <Redirect href="/consent" />;
  // …and away from it once accepted. The consent screen itself never
  // navigates: both directions are decided here, from one piece of state, so
  // there is no moment where a navigation and the saved answer can disagree.
  if (consent.accepted && path === "/consent") return <Redirect href="/assignments" />;
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
        <Stack.Screen name="consent" options={{ title: "Privacy notice", headerBackVisible: false, gestureEnabled: false }} />
      </Stack>
    </>
  );
}
