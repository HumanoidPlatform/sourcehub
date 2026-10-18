// One offer: the brief, whether this phone can do it, and the answer.
//
// The worker used to answer from an email link (web /offer?token=…). This
// screen is that page on the phone, with one thing in front of Accept that the
// page never had: the device check the assignment screen runs. A phone under
// the task's floors is told so here, and cannot take a place it could not
// fill. Accepting lands on the new assignment, where Start and capture live.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { ApiError, post } from "@/api/client";
import { requirementLabels } from "@/batches";
import { OFFER_STATE_TEXT, offerAmount, placesText, respondBy } from "@/offers";
import { cachedCamera } from "@/qa_pipeline/device/camera";
import { type CameraCaps, deviceFindings, thisDevice } from "@/qa_pipeline/device/device";
import { useOffers } from "@/query/hooks";
import { Button, C, Callout, Pill, Screen, s, useOnline } from "@/ui";

export default function Offer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const online = useOnline();
  const q = useOffers();
  const o = (q.data ?? []).find((x) => x.id === id);
  // The server's reason when the answer was refused: the last place went to
  // someone else while this screen was open, or the offer was withdrawn.
  const [refused, setRefused] = useState<string | null>(null);

  // What the camera can take, as the capture screen last probed it — the same
  // read the assignment screen does, for the same check.
  const [camera, setCamera] = useState<CameraCaps | null>(null);
  useFocusEffect(
    useCallback(() => {
      void cachedCamera().then(setCamera);
    }, []),
  );

  const answer = useMutation({
    mutationFn: (action: "accept" | "decline") =>
      post<{ state: string; assignment_id: string | null }>(`/me/offers/${id}/respond`, { action }),
    onSuccess: (r, action) => {
      void qc.invalidateQueries({ queryKey: ["offers"] });
      void qc.invalidateQueries({ queryKey: ["assignments"] });
      void qc.invalidateQueries({ queryKey: ["notifications"] });
      if (action === "accept" && r.assignment_id) router.replace(`/assignments/${r.assignment_id}`);
      else router.back();
    },
    onError: (e) => {
      setRefused(e instanceof ApiError ? e.message : "Could not send your answer. Try again.");
      void q.refetch();
    },
  });

  if (!o) {
    return (
      <Screen>
        {q.isLoading ? <Text style={s.muted}>Loading…</Text> : <Callout tone="neutral" title="This offer is no longer available." />}
        <Button title="Back" variant="quiet" onPress={() => router.back()} style={{ marginTop: 12 }} />
      </Screen>
    );
  }

  const spec = o.task.capture_spec ?? {};
  const subject = spec.subject ?? null;
  const requirements = requirementLabels(spec);
  // where this phone falls short of the task's device requirements: a warning
  // before accepting, never a bar to it; captures that fall short are refused
  const phone = deviceFindings(thisDevice(), camera, spec, o.task.target_unit);
  const open = o.state === "open" && !refused;
  const canAnswer = open && online && !answer.isPending;
  const pill = open ? "Offer" : o.response === "accepted" ? "Accepted" : o.response === "declined" ? "Declined" : "Closed";

  const decline = () =>
    Alert.alert("Decline this offer?", "Your aggregator will see that you passed on it.", [
      { text: "Keep thinking", style: "cancel" },
      { text: "Decline", style: "destructive", onPress: () => answer.mutate("decline") },
    ]);

  return (
    <Screen>
      <View style={[s.row, { justifyContent: "space-between", marginBottom: 4 }]}>
        <Text style={[s.h1, { flex: 1, marginRight: 8 }]}>{o.task.title}</Text>
        <Pill tone={open ? "attention" : o.response === "accepted" ? "success" : "neutral"}>{pill}</Pill>
      </View>
      <Text style={[s.mono, { marginBottom: 14 }]}>{o.task.reference_code} · {o.org_name}</Text>

      {refused ? <Callout tone="critical" title={refused} /> : null}
      {!open && !refused ? (
        <Callout tone={o.response === "accepted" ? "success" : "neutral"} title={OFFER_STATE_TEXT[o.state] ?? "This offer can no longer be answered."} />
      ) : null}
      {open && phone.length > 0 && (
        <Callout tone="attention" title="This phone may not meet this task's requirements">
          {phone.map((f) => f.message).join(" ")} Captures that fall short will be refused.
        </Callout>
      )}

      {/* The brief, as the assignment screen shows it once accepted: a worker
          decides on the same words they will be held to. */}
      <View style={[s.card, { marginBottom: 14 }]}>
        <Text style={[s.body, { fontWeight: "600" }]}>{offerAmount(o)}{o.due_on ? ` · due ${o.due_on}` : ""}</Text>
        <Text style={[s.muted, { marginTop: 4 }]}>{respondBy(o)} · {placesText(o)}</Text>
        {o.instructions ? <Text style={[s.body, { marginTop: 10 }]}>{o.instructions}</Text> : null}
        {o.task.instructions ? <Text style={[s.body, { marginTop: o.instructions ? 8 : 10 }]}>{o.task.instructions}</Text> : null}
        {subject && (
          <View style={{ marginTop: 10 }}>
            <Text style={[s.body, { fontWeight: "600" }]}>What to capture: {subject.domain}</Text>
            {subject.must_show.length > 0 && <Text style={s.muted}>Must show: {subject.must_show.join(", ")}</Text>}
            {subject.must_not_show.length > 0 && <Text style={s.muted}>Must not show: {subject.must_not_show.join(", ")}</Text>}
          </View>
        )}
        {requirements.length > 0 && (
          <View style={st.chips}>
            {requirements.map((r) => (
              <View key={r} style={st.chip}>
                <Text style={st.chipText}>{r}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {open ? (
        <>
          {!online && <Text style={[s.muted, { marginBottom: 8 }]}>Connect to the internet to answer.</Text>}
          <Button
            title={answer.isPending ? "Sending…" : "Accept"}
            onPress={() => answer.mutate("accept")}
            disabled={!canAnswer}
          />
          <Button title="Decline" variant="quiet" onPress={decline} disabled={!canAnswer} style={{ marginTop: 8 }} />
        </>
      ) : o.response === "accepted" && o.assignment_id ? (
        <Button title="Open assignment" onPress={() => router.replace(`/assignments/${o.assignment_id}`)} />
      ) : null}
    </Screen>
  );
}

const st = StyleSheet.create({
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  chip: { backgroundColor: "#EDF1F4", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 13, color: C.ink },
});
