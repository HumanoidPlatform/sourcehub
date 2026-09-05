import NetInfo from "@react-native-community/netinfo";
import { QueryClient, focusManager, onlineManager } from "@tanstack/react-query";
import { AppState, type AppStateStatus } from "react-native";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 10_000 },
  },
});

/** refetch on foreground and on reconnect, the way a browser tab would */
export function wireQueryClient(): () => void {
  const sub = AppState.addEventListener("change", (s: AppStateStatus) => {
    focusManager.setFocused(s === "active");
  });
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => setOnline(!!state.isConnected)),
  );
  return () => sub.remove();
}
