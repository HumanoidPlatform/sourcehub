import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { AuthProvider } from "@/auth/AuthProvider";
import { queryClient, wireQueryClient } from "@/query/queryClient";
import { UploaderMount } from "@/upload/UploaderMount";

export default function RootLayout() {
  useEffect(() => wireQueryClient(), []);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UploaderMount />
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
