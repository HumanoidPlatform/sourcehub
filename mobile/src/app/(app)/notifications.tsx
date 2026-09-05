import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { post } from "@/api/client";
import type { NotificationRow } from "@/api/types";
import { useNotifications } from "@/query/hooks";
import { Button, C, Empty, Screen, s } from "@/ui";

function target(n: NotificationRow): string | null {
  const id = n.link_params?.id ?? n.link_params?.assignment_id;
  if (n.link_page === "assignment" && id) return `/assignments/${id}`;
  return "/assignments";
}

export default function Notifications() {
  const qc = useQueryClient();
  const router = useRouter();
  const q = useNotifications();
  const markAll = useMutation({
    mutationFn: () => post("/notifications/read"),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const items = q.data?.items ?? [];
  return (
    <Screen>
      <View style={[s.row, { justifyContent: "space-between", marginBottom: 12 }]}>
        <Text style={s.muted}>{q.data?.unread ?? 0} unread</Text>
        <Button title="Mark all read" variant="quiet" onPress={() => markAll.mutate()} disabled={!q.data?.unread} />
      </View>
      {items.length === 0 && <Empty title="Nothing yet" />}
      {items.map((n) => (
        <Pressable
          key={n.id}
          onPress={() => {
            const t = target(n);
            if (t) router.push(t);
          }}
          accessibilityRole="button"
          style={[s.card, !n.read && { borderColor: C.accent }]}
        >
          <Text style={[s.body, !n.read && { fontWeight: "600" }]}>{n.body}</Text>
          <Text style={[s.muted, { marginTop: 4 }]}>{new Date(n.created_at).toLocaleString()}</Text>
        </Pressable>
      ))}
    </Screen>
  );
}
