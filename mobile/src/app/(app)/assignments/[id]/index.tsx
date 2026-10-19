// One assignment: what to capture, how far along it is, the captures by where
// they stand, and the actions — Start, Capture, Send for review, Retake.
//
// A worker sends what they have as a batch whenever they like and goes on
// capturing (batches.ts). What the aggregator accepted is shown apart and
// cannot be touched; what they sent back can be retaken or removed.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { ApiError, del, post } from "@/api/client";
import type { Assignment, AssetRow } from "@/api/types";
import {
  type Action, boardStatus, byDuration, handedOver, hoursText, isRevoked, localUnits, nextAction, ownNote, progressOf,
  remaining, requirementLabels, sections, unitsOf, unitText,
} from "@/batches";
import { deleteCapture, discardCapture, discardFailed, retryCapture, retryFailed } from "@/db/outbox";
import { cachedCamera } from "@/qa_pipeline/device/camera";
import { type CameraCaps, deviceFindings, thisDevice } from "@/qa_pipeline/device/device";
import { exampleImages, refreshExamples } from "@/qa_pipeline/examples/load";
import { useAssignmentAssets, useAssignments, useOutbox, useRejections } from "@/query/hooks";
import { assignmentStatus, meta, rejectionLabel } from "@/status";
import { Button, C, Callout, Pill, Screen, s } from "@/ui";
import { dropCaptures } from "@/upload/drop";
import { uploader } from "@/upload/uploader";
import { AssignmentStatus } from "@/components/AssignmentStatus";
import { DocumentList } from "@/components/DocumentList";
import { ReworkList } from "@/components/ReworkList";
import { Gallery } from "@/components/Gallery";
import { referenceSections } from "@/documents";

export default function AssignmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const list = useAssignments();
  const a = (list.data ?? []).find((x) => x.id === id);
  const assets = useAssignmentAssets(id);
  const outbox = useOutbox(id);
  const refused = useRejections(id);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Fetch and label the client's example photos while the worker is reading
  // the brief, so the camera never waits on a download. Each one is labelled
  // once and the image is thrown away; a second visit to this screen costs
  // nothing. Best-effort and silent — offline, the capture screen falls back
  // to the word check and records that it did.
  const taskId = a?.task.id;
  const exampleIds = exampleImages(a?.task.client_documents).map((d) => d.id).join(",");
  useEffect(() => {
    if (!taskId || !exampleIds) return;
    void refreshExamples(taskId, a?.task.client_documents);
    // a.task.client_documents is re-read on every render; the ids are what
    // actually change, and they are what decides whether there is work to do.
  }, [taskId, exampleIds]); // eslint-disable-line react-hooks/exhaustive-deps

  // What the camera can take, as the capture screen last probed it. Re-read
  // on focus: the first visit to the camera is what answers it, and the
  // worker comes back here afterwards.
  const [camera, setCamera] = useState<CameraCaps | null>(null);
  useFocusEffect(
    useCallback(() => {
      void cachedCamera().then(setCamera);
    }, []),
  );

  const start = useMutation({
    mutationFn: () => post<Assignment>(`/assignments/${id}/start`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["assignments"] }),
    onError: (e) => setError(e instanceof ApiError ? e.message : "Could not start."),
  });
  const submit = useMutation({
    mutationFn: () => post<Assignment>(`/assignments/${id}/submit`, { note: note.trim() || null }),
    onSuccess: () => {
      // Stay here: the worker carries on capturing while this batch is read.
      setNote("");
      void qc.invalidateQueries({ queryKey: ["assignments"] });
      void assets.refetch();
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Could not send."),
  });

  // Taken off this worker: anything still on the phone can no longer be
  // uploaded, so it is cleared once, and the screen says how much.
  const [dropped, setDropped] = useState(0);
  const cleared = useRef(false);
  const revokedAt = a?.revoked_at ?? null;
  useEffect(() => {
    if (!revokedAt || cleared.current) return;
    const unsent = outbox.filter((r) => r.status !== "confirmed");
    if (unsent.length === 0) return;
    cleared.current = true;
    // deleteCapture, not discardCapture: that one only matches failed rows, so
    // queued captures stayed — and kept being presigned until the server refused.
    void Promise.all(unsent.map((r) => deleteCapture(r.id)))
      .then((rows) => {
        const gone = rows.filter((r): r is NonNullable<typeof r> => r !== null);
        setDropped(gone.length);
        return dropCaptures(gone);
      })
      .catch(() => {
        cleared.current = false; // the next outbox change tries again
      });
  }, [revokedAt, outbox]);

  if (!a) {
    return (
      <Screen>
        {list.isLoading ? (
          <Text style={s.muted}>Loading…</Text>
        ) : list.isError && !list.data ? (
          // No list to look in is not the same as not being in it: a network
          // failure used to tell the worker the assignment was taken away.
          <>
            <Callout tone="attention" title="Could not load your assignments.">
              Check the connection and try again.
            </Callout>
            <Button title="Try again" onPress={() => void list.refetch()} />
          </>
        ) : (
          <Callout tone="critical" title="This assignment is no longer yours." />
        )}
      </Screen>
    );
  }

  const m = meta(assignmentStatus, boardStatus(a));
  const unit = a.task.target_unit;
  // a share in hours of footage: its clips add up their running time (db/510)
  const hours = byDuration(a);
  const captures = (n: number) => (hours ? `${n} clip${n === 1 ? "" : "s"}` : unitText(unit, n));
  const spec = a.task.capture_spec ?? {};
  // The subject gets its own card, above the technical requirements: it is
  // the one line a worker should read before the first shot, and the phone
  // will hold them to it after each one.
  const subject = spec.subject ?? null;
  // Remove a capture the worker does not want to send. A row still on the
  // phone takes its file and its server slot with it (upload/drop.ts); a
  // capture that only exists on the server is asked of the server directly,
  // and its refusal ("sent for review") is shown. Freeing the slot is what
  // lets them shoot a replacement against a full quota.
  const removeCapture = ({ captureId, assetId }: { captureId?: string; assetId?: string }) => {
    Alert.alert("Remove this capture?", "It will not be sent for review.", [
      { text: "Keep", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              if (captureId) {
                const row = await deleteCapture(captureId);
                if (row) await dropCaptures([row]);
              } else if (assetId) {
                await del(`/assets/${assetId}`);
              }
              await Promise.all([assets.refetch(), list.refetch()]);
            } catch (e) {
              Alert.alert("Could not remove it", e instanceof Error ? e.message : "Try again.");
            }
          })();
        },
      },
    ]);
  };

  const refusedTotal = refused.reduce((n, r) => n + r.n, 0);
  const pendingLocal = outbox.filter((r) => r.status !== "confirmed" && r.status !== "failed").length;
  const failedRows = outbox.filter((r) => r.status === "failed");
  const failedLocal = failedRows.length;
  const revoked = isRevoked(a);
  const progress = progressOf(a);
  const parts = sections((assets.data ?? []) as AssetRow[], a.batches ?? []);
  // Still on the phone and on its way up: these take a slot like any capture,
  // or in hours, their running time.
  const onPhone = localUnits(a, outbox.filter((r) => r.status !== "confirmed"));
  const left = remaining(a, onPhone);
  const changeable = !revoked && (a.status === "in_progress" || a.status === "rejected");
  const next = nextAction(a, pendingLocal, failedLocal, onPhone);
  // the newest note a reviewer wrote in their own words, not the one the
  // console builds from the marks — those reasons are on each row already
  const reviewerNote = ownNote((a.batches ?? []).find((b) => b.status === "reviewed" && b.rework_count > 0)?.decision_note);
  const unsentLocal = outbox.filter((r) => r.status !== "confirmed");
  const started = a.status !== "assigned";
  const requirements = requirementLabels(spec);
  // Where this phone falls short of the task's own device requirements
  // (qa_pipeline/device/device.ts). A warning, never a gate: the worker may
  // still start; a capture from a phone that falls short is refused at the
  // shutter (qa_pipeline/pipeline.ts).
  const phone = deviceFindings(thisDevice(), camera, spec, unit);

  const goCapture = async (replaces?: string) => {
    setError(null);
    if (a.status === "assigned" || a.status === "rejected") {
      try {
        await start.mutateAsync();
      } catch {
        return;
      }
    }
    router.push(replaces ? `/assignments/${id}/capture?replaces=${replaces}` : `/assignments/${id}/capture`);
  };

  const confirmSubmit = () => {
    const n = progress.draft;
    const what = hours ? `${captures(n)} (${hoursText(unitsOf(a).draft)})` : captures(n);
    Alert.alert(
      "Send for review?",
      `${what} ${n === 1 ? "goes" : "go"} to your aggregator as one batch. You can keep capturing while they look at it.`,
      [{ text: "Not yet", style: "cancel" }, { text: "Send", onPress: () => submit.mutate() }],
    );
  };

  const onAction = (act: Action) => {
    if (act === "send") confirmSubmit();
    else if (act === "retake") void goCapture(parts.rework[0]?.id);
    else void goCapture();
  };

  const retry = async () => {
    await retryFailed(id);
    uploader.kick();
  };
  const discard = () => {
    Alert.alert("Discard failed captures?", "The files are deleted from this phone.", [
      { text: "Keep", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: () => void discardFailed(id).then(dropCaptures),
      },
    ]);
  };

  const message = revoked
    ? {
        title: "Reassigned to another crowd member",
        body: `${handedOver(a)}${
          dropped ? ` ${dropped} capture${dropped === 1 ? "" : "s"} still on this phone could not be sent and were removed.` : ""
        }`,
      }
    : a.status === "accepted"
      ? { title: "All accepted", body: "Nothing more to do here." }
      : null;

  const brief = (
    <>
      {(a.instructions || a.task.instructions) && (
        <>
          {a.task.instructions ? <Text style={s.body}>{a.task.instructions}</Text> : null}
          {a.instructions ? <Text style={[s.body, { marginTop: a.task.instructions ? 8 : 0 }]}>{a.instructions}</Text> : null}
        </>
      )}
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
    </>
  );

  return (
    <Screen>
      <View style={[s.row, { justifyContent: "space-between", marginBottom: 4 }]}>
        <Text style={[s.h1, { flex: 1, marginRight: 8 }]}>{a.task.title}</Text>
        <Pill tone={m.tone}>{m.label}</Pill>
      </View>
      <Text style={[s.mono, { marginBottom: 14 }]}>{a.task.reference_code}{a.due_on ? ` · due ${a.due_on}` : ""}</Text>

      {error && <Callout tone="critical" title={error} />}
      {phone.length > 0 && (
        <Callout tone="attention" title="This phone may not meet this task's requirements">
          {phone.map((f) => f.message).join(" ")} Captures that fall short will be refused.
        </Callout>
      )}

      <AssignmentStatus
        counts={{ ...unitsOf(a), quantity: a.quantity }}
        clips={{ draft: progress.draft, rework: progress.rework }}
        hours={hours}
        unit={unit}
        left={left}
        next={next}
        message={message}
        pendingLocal={pendingLocal}
        failedLocal={failedLocal}
        busy={start.isPending || submit.isPending}
        note={note}
        onNote={setNote}
        onAction={onAction}
      />

      {/* Before the first shot the brief is what matters; after it, the work is. */}
      {!started && <Section title="Task brief">{brief}</Section>}

      <ReworkList
        assets={parts.rework}
        note={reviewerNote}
        onRetake={changeable ? (assetId) => void goCapture(assetId) : undefined}
        onRemove={changeable ? (assetId) => removeCapture({ assetId }) : undefined}
      />

      {failedRows.length > 0 && (
        <View style={s.card}>
          <Text style={[s.label, { marginBottom: 6 }]}>Failed uploads</Text>
          {failedRows.map((r) => (
            <View key={r.id} style={{ marginBottom: 12 }}>
              <Text style={s.body}>{r.filename}</Text>
              <Text style={[s.muted, { color: C.danger }]} selectable>{r.last_error ?? "Unknown error"}</Text>
              <View style={[s.row, { marginTop: 6 }]}>
                <Button title="Retry" onPress={() => void retryCapture(r.id).then(() => uploader.kick())} style={{ flex: 1 }} />
                <Button
                  title="Discard"
                  variant="danger"
                  style={{ flex: 1 }}
                  onPress={() => void discardCapture(r.id).then((row) => (row ? dropCaptures([row]) : undefined))}
                />
              </View>
            </View>
          ))}
          {failedRows.length > 1 && (
            <View style={s.row}>
              <Button title="Retry all" onPress={() => void retry()} style={{ flex: 1 }} />
              <Button title="Discard all" variant="danger" onPress={discard} style={{ flex: 1 }} />
            </View>
          )}
        </View>
      )}

      {/* Only what this button would send, plus anything still on its way up. */}
      {(parts.draft.length > 0 || unsentLocal.length > 0) && (
        <View style={{ marginBottom: 16 }}>
          <Text style={[s.label, { marginBottom: 8 }]}>Not sent yet ({progress.draft + pendingLocal})</Text>
          <Gallery local={unsentLocal} remote={parts.draft} onRemove={changeable ? removeCapture : undefined} empty={null} bare />
        </View>
      )}

      {parts.inReview.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={[s.label, { marginBottom: 8 }]}>Sent for review</Text>
          {parts.inReview.map((grp) => (
            <View key={`r${grp.batch_no}`} style={{ marginBottom: 10 }}>
              <Text style={[s.muted, { marginBottom: 6 }]}>
                Batch {grp.batch_no} · {captures(grp.assets.length)}
                {grp.batch?.submitted_at ? ` · sent ${when(grp.batch.submitted_at)}` : ""}
              </Text>
              <Gallery local={[]} remote={grp.assets} empty={null} bare />
            </View>
          ))}
        </View>
      )}

      {parts.accepted.length > 0 && (
        <Section title={`Accepted (${parts.accepted.reduce((n, g) => n + g.assets.length, 0)})`} folded>
          {parts.accepted.map((grp) => (
            <View key={`a${grp.batch_no}`} style={{ marginBottom: 10 }}>
              <Text style={[s.muted, { marginBottom: 6 }]}>
                Batch {grp.batch_no} · {grp.assets.length} accepted
                {grp.batch?.decided_at ? ` · ${when(grp.batch.decided_at)}` : ""}
              </Text>
              <Gallery local={[]} remote={grp.assets} empty={null} bare />
            </View>
          ))}
        </Section>
      )}

      {started && <Section title="Task brief" folded>{brief}</Section>}
      <DocumentList sections={referenceSections(a.task)} />

      {/* Refused captures never left the phone, so this is the only place
          they are counted. */}
      {refusedTotal > 0 && (
        <Section title={`Refused on this phone (${refusedTotal})`} folded>
          {refused.map((r) => (
            <View key={r.code} style={{ marginBottom: 4 }}>
              <Text style={s.muted}>
                {r.n} × {rejectionLabel[r.code] ?? r.code.replace(/_/g, " ")}
              </Text>
              {/* What the phone actually said, which is where the number is. */}
              {r.message ? <Text style={[s.muted, { marginLeft: 10, fontSize: 12 }]}>{r.message}</Text> : null}
            </View>
          ))}
        </Section>
      )}
    </Screen>
  );
}

/** "3:30 PM" today, "3 Oct" before. */
function when(iso: string): string {
  const d = new Date(iso);
  const today = new Date().toDateString() === d.toDateString();
  return today
    ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString([], { day: "numeric", month: "short" });
}

/** A titled block that can fold away. */
function Section({ title, folded = false, children }: { title: string; folded?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(!folded);
  return (
    <View style={{ marginBottom: 16 }}>
      <Pressable onPress={() => setOpen(!open)} accessibilityRole="button" style={st.sectionHead}>
        <Text style={s.label}>{title}</Text>
        <Text style={s.muted}>{open ? "Hide" : "Show"}</Text>
      </Pressable>
      {open && <View style={[s.card, { marginTop: 8 }]}>{children}</View>}
    </View>
  );
}

const st = StyleSheet.create({
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  chip: { backgroundColor: "#EDF1F4", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 13, color: C.ink },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
});
