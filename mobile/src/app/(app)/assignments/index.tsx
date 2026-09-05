// The board: every assignment the worker holds, grouped by what needs them
// first. Polls every 30 s and on foreground; pull to refresh.

import { Link, useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Assignment } from "@/api/types";
import { useSession } from "@/auth/AuthProvider";
import { useAssignments, useNotifications, useOutboxSummary } from "@/query/hooks";
import { SECTION_ORDER, assignmentStatus, meta } from "@/status";
import { C, Callout, Empty, Meter, Pill, s } from "@/ui";

const SECTION_TITLE: Record<string, string> = {
  rejected: "Needs rework",
  in_progress: "In progress",
  assigned: "New",
  submitted: "Awaiting review",
  accepted: "Accepted",
};

export default function Board() {
  const session = useSession();
  const router = useRouter();
  const q = useAssignments();
  const bell = useNotifications();
  const outbox = useOutboxSummary();

  const sections = useMemo(() => {
    const rows = q.data ?? [];
    return SECTION_ORDER.map((st) => ({ status: st, rows: rows.filter((a) => a.status === st) })).filter((x) => x.rows.length);
  }, [q.data]);

  const queued = Object.values(outbox).reduce((n, x) => n + x.queued, 0);
  const failed = Object.values(outbox).reduce((n, x) => n + x.failed, 0);

  return (
    <SafeAreaView style={s.safe} edges={["bottom"]}>
      <View style={[s.row, { paddingHorizontal: 16, paddingTop: 8, justifyContent: "space-between" }]}>
        <Text style={s.muted}>{session.full_name} · {session.org_name}</Text>
        <View style={s.row}>
          <Link href="/notifications" asChild>
            <Pressable accessibilityRole="button" accessibilityLabel={`Notifications, ${bell.data?.unread ?? 0} unread`} style={{ padding: 6 }}>
              <Text style={{ fontSize: 16, color: (bell.data?.unread ?? 0) > 0 ? C.accentInk : C.muted }}>
                ◔{(bell.data?.unread ?? 0) > 0 ? ` ${bell.data?.unread}` : ""}
              </Text>
            </Pressable>
          </Link>
          <Link href="/settings" asChild>
            <Pressable accessibilityRole="button" accessibilityLabel="Settings" style={{ padding: 6 }}>
              <Text style={{ fontSize: 16, color: C.muted }}>⚙</Text>
            </Pressable>
          </Link>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        refreshControl={<RefreshControl refreshing={q.isFetching && !q.isLoading} onRefresh={() => void q.refetch()} />}
      >
        {(queued > 0 || failed > 0) && (
          <Callout tone={failed ? "critical" : "active"} title={failed ? `${failed} upload${failed === 1 ? "" : "s"} failed` : `${queued} upload${queued === 1 ? "" : "s"} in progress`}>
            {failed ? "Open the assignment to retry or discard them." : "Keep the app open on this Wi-Fi until they finish."}
          </Callout>
        )}
        {q.isError && <Callout tone="critical" title="Could not reach the server">Pull down to try again.</Callout>}
        {q.data && q.data.length === 0 && (
          <Empty title="Nothing assigned yet" hint="When your aggregator assigns you work it appears here." />
        )}
        {sections.map((sec) => (
          <View key={sec.status} style={{ marginBottom: 18 }}>
            <Text style={[s.label, { marginBottom: 8 }]}>{SECTION_TITLE[sec.status]}</Text>
            {sec.rows.map((a) => (
              <Card key={a.id} a={a} queued={outbox[a.id]?.queued ?? 0} failed={outbox[a.id]?.failed ?? 0} onPress={() => router.push(`/assignments/${a.id}`)} />
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Card({ a, queued, failed, onPress }: { a: Assignment; queued: number; failed: number; onPress: () => void }) {
  const m = meta(assignmentStatus, a.status);
  const unit = a.task.target_unit ?? "units";
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }]}>
      <View style={[s.row, { justifyContent: "space-between", marginBottom: 6 }]}>
        <Text style={[s.h2, { flex: 1, marginRight: 8 }]} numberOfLines={2}>{a.task.title}</Text>
        <Pill tone={m.tone}>{m.label}</Pill>
      </View>
      <Text style={[s.mono, { marginBottom: 8 }]}>{a.task.reference_code}{a.due_on ? ` · due ${a.due_on}` : ""}</Text>
      <Meter value={a.assets.ready} max={a.quantity} />
      <Text style={[s.muted, { marginTop: 6 }]}>
        {a.assets.ready} of {a.quantity} {unit} uploaded
        {queued ? ` · ${queued} uploading` : ""}
        {failed ? ` · ${failed} failed` : ""}
      </Text>
      {a.status === "rejected" && a.decision_note ? (
        <Text style={[s.body, { color: C.danger, marginTop: 6 }]} numberOfLines={2}>{a.decision_note}</Text>
      ) : null}
    </Pressable>
  );
}
