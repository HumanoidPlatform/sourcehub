// Mounted once the worker is fully in (signed in, password set, notice
// accepted — see (app)/_layout.tsx), so the permission prompt never interrupts
// those screens. Renders nothing.
//
//   * registers this phone for push, and again whenever Expo issues a new token
//   * a push arriving while the app is open refreshes the bell and the board at
//     once, instead of at the next 30-second poll
//   * a tapped push opens what the bell row would, and marks that row read

import { useQueryClient } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { post } from "@/api/client";
import { target, type NotificationLink } from "./link";
import { registerForPush } from "./push";

// Outside the component: the handler decides how a push shows while the app is
// in front, and it must be set before the first one arrives.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

interface PushData extends NotificationLink {
  notification_id?: string;
}

export function PushMount() {
  const qc = useQueryClient();
  const router = useRouter();
  const opened = useRef<Set<string>>(new Set());

  useEffect(() => {
    void registerForPush();
    const renewed = Notifications.addPushTokenListener(() => {
      // The native token changed; ask for the Expo token again and send it.
      void registerForPush();
    });
    const received = Notifications.addNotificationReceivedListener(() => {
      void qc.invalidateQueries({ queryKey: ["notifications"] });
      void qc.invalidateQueries({ queryKey: ["assignments"] });
    });

    const open = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const data = (response.notification.request.content.data ?? {}) as PushData;
      // Once per notification: a cold start reports the same tap through both
      // the listener and getLastNotificationResponseAsync.
      const key = data.notification_id ?? response.notification.request.identifier;
      if (opened.current.has(key)) return;
      opened.current.add(key);
      if (data.notification_id) {
        void post(`/notifications/${data.notification_id}/read`)
          .then(() => qc.invalidateQueries({ queryKey: ["notifications"] }))
          .catch(() => undefined);
      }
      router.push(target(data));
    };
    const tapped = Notifications.addNotificationResponseReceivedListener(open);
    // The tap that launched the app from closed.
    void Notifications.getLastNotificationResponseAsync().then(open);

    return () => {
      renewed.remove();
      received.remove();
      tapped.remove();
    };
  }, [qc, router]);

  return null;
}
