// The board: every assignment the worker holds, grouped by what needs them
// first. Polls every 30 s and on foreground; pull to refresh.

import { Link, useRouter } from "expo-router";
import { useMemo } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Assignment, OfferRow } from "@/api/types";
import { boardStatus, strandedAssignments, summary, unitsOf } from "@/batches";
import { dropAssignment } from "@/db/outbox";
import { useSession } from "@/auth/AuthProvider";
import { offerAmount, openOffers, placesText, respondBy } from "@/offers";
import { useAssignments, useNotifications, useOffers, useOutboxSummary } from "@/query/hooks";
import { SECTION_ORDER, assignmentStatus, meta } from "@/status";
import { Button, C, Callout, Empty, Meter, Pill, s } from "@/ui";
import { dropCaptures } from "@/upload/drop";
import { uploadService } from "@/upload/service";

const SECTION_TITLE: Record<string, string> = {
  rejected: "Needs rework",
  in_progress: "In progress",
  assigned: "New",
  submitted: "Awaiting review",
  accepted: "Accepted",
  reassigned: "Given to someone else",
};

export default function Board() {
  const session = useSession();
  const router = useRouter();
  const q = useAssignments();
  const bell = useNotifications();
  const outbox = useOutboxSummary();
  // Tasks offered and not yet answered come first: they are the one thing
  // on the board with a clock running against the worker (offers.ts).
  const offers = useOffers();
  const offered = useMemo(() => openOffers(offers.data ?? []), [offers.data]);

  const sections = useMemo(() => {
    const rows = q.data ?? [];
    // Filed by what needs the worker, read off the batch counts: an
    // assignment stays in progress through every round on the server.
    return SECTION_ORDER.map((st) => ({ status: st, rows: rows.filter((a) => boardStatus(a) === st) })).filter((x) => x.rows.length);
  }, [q.data]);

  // Captures queued for assignments no longer on the list: the task ended
  // (db/600) or the share was cancelled, so they can never be sent. Counted
  // apart, since "open the assignment" is no help for an assignment that is gone.
  const stranded = q.isSuccess ? strandedAssignments(outbox, q.data) : [];
  const strandedN = stranded.reduce((n, id) => n + outbox[id].queued + outbox[id].failed, 0);
  const mine = Object.entries(outbox).filter(([id]) => !stranded.includes(id)).map(([, x]) => x);
  const queued = mine.reduce((n, x) => n + x.queued, 0);
  const failed = mine.reduce((n, x) => n + x.failed, 0);
  const removeStranded = () =>
    Alert.alert(
      "Remove these captures?",
      "The work was taken off you, so they can never be sent. The files are deleted from this phone.",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => void Promise.all(stranded.map((id) => dropAssignment(id).then(dropCaptures))),
        },
      ],
    );

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
        refreshControl={
          <RefreshControl
            refreshing={q.isFetching && !q.isLoading}
            onRefresh={() => void Promise.all([q.refetch(), offers.refetch()])}
          />
        }
      >
        {(queued > 0 || failed > 0) && (
          <Callout tone={failed ? "critical" : "active"} title={failed ? `${failed} upload${failed === 1 ? "" : "s"} failed` : `${queued} upload${queued === 1 ? "" : "s"} in progress`}>
            {failed
              ? "Open the assignment to retry or discard them."
              : uploadService.available
                ? "They carry on in the background, even with the screen off."
                : "Keep the app open on this Wi-Fi until they finish."}
          </Callout>
        )}
        {strandedN > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Callout tone="attention" title={`${strandedN} capture${strandedN === 1 ? "" : "s"} for work taken off you`}>
              The task ended or your share was cancelled, so they can never be sent.
            </Callout>
            <Button title="Remove them" variant="danger" onPress={removeStranded} />
          </View>
        )}
        {q.isError && <Callout tone="critical" title="Could not reach the server">Pull down to try again.</Callout>}
        {q.data && q.data.length === 0 && offered.length === 0 && (
          <Empty title="Nothing assigned yet" hint="When your aggregator assigns or offers you work it appears here." />
        )}
        {offered.length > 0 && (
          <View style={{ marginBottom: 18 }}>
            <Text style={[s.label, { marginBottom: 8 }]}>Offered to you</Text>
            {offered.map((o) => (
              <OfferCard key={o.id} o={o} onPress={() => router.push(`/offers/${o.id}`)} />
            ))}
          </View>
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

/** An offer not yet answered: what, how much, and how long there is to say.
 *  The answer itself lives on the offer screen, behind the brief and the
 *  device check — one tap here is a look, never an acceptance. */
function OfferCard({ o, onPress }: { o: OfferRow; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [s.card, { borderColor: C.accent }, pressed && { opacity: 0.85 }]}>
      <View style={[s.row, { justifyContent: "space-between", marginBottom: 6 }]}>
        <Text style={[s.h2, { flex: 1, marginRight: 8 }]} numberOfLines={2}>{o.task.title}</Text>
        <Pill tone="attention">Offer</Pill>
      </View>
      <Text style={[s.mono, { marginBottom: 8 }]}>{o.task.reference_code} · {o.org_name}</Text>
      <Text style={s.body}>{offerAmount(o)}{o.due_on ? ` · due ${o.due_on}` : ""}</Text>
      <Text style={[s.muted, { marginTop: 6 }]}>{respondBy(o)} · {placesText(o)}</Text>
    </Pressable>
  );
}

function Card({ a, queued, failed, onPress }: { a: Assignment; queued: number; failed: number; onPress: () => void }) {
  const where = boardStatus(a);
  const m = meta(assignmentStatus, where);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }]}>
      <View style={[s.row, { justifyContent: "space-between", marginBottom: 6 }]}>
        <Text style={[s.h2, { flex: 1, marginRight: 8 }]} numberOfLines={2}>{a.task.title}</Text>
        <Pill tone={m.tone}>{m.label}</Pill>
      </View>
      <Text style={[s.mono, { marginBottom: 8 }]}>{a.task.reference_code}{a.due_on ? ` · due ${a.due_on}` : ""}</Text>
      <Meter value={unitsOf(a).accepted} max={a.quantity} />
      <Text style={[s.muted, { marginTop: 6 }]}>
        {summary(a)}
        {queued ? ` · ${queued} uploading` : ""}
        {failed ? ` · ${failed} failed` : ""}
      </Text>
      {where === "rejected" && a.decision_note ? (
        <Text style={[s.body, { color: C.danger, marginTop: 6 }]} numberOfLines={2}>{a.decision_note}</Text>
      ) : null}
    </Pressable>
  );
}
