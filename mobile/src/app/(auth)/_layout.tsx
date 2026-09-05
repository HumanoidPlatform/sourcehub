import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/auth/AuthProvider";
import { C } from "@/ui";

export default function AuthLayout() {
  const { session, ready } = useAuth();
  if (ready && session) return <Redirect href="/assignments" />;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: C.bg },
        headerShadowVisible: false,
        headerTintColor: C.ink,
        contentStyle: { backgroundColor: C.bg },
      }}
    >
      <Stack.Screen name="sign-in" options={{ title: "Cosarathi Capture" }} />
      <Stack.Screen name="server" options={{ title: "Server", presentation: "modal" }} />
    </Stack>
  );
}
