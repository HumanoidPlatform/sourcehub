// One assignment: what to capture, how far along it is, the captures by where
// they stand, and the actions — Start, Capture, Send for review, Retake.
//
// A worker sends what they have as a batch whenever they like and goes on
// capturing (batches.ts). What the aggregator accepted is shown apart and
// cannot be touched; what they sent back can be retaken or removed.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { ApiError, del, post } from "@/api/client";
import type { Assignment, AssetRow } from "@/api/types";
import { boardStatus, cannotSend, canCapture as canCaptureMore, isRevoked, progressOf, remaining, sections, summary } from "@/batches";
import { deleteCapture, discardCapture, discardFailed, retryCapture, retryFailed, type CaptureRow } from "@/db/outbox";
import { exampleImages, refreshExamples } from "@/capture/examples";
import { deleteLocal } from "@/capture/files";
import { useAssignmentAssets, useAssignments, useOutbox, useRejections } from "@/query/hooks";
import { assignmentStatus, meta, rejectionLabel } from "@/status";
import { Button, C, Callout, Field, Meter, Pill, Screen, inputStyle, s } from "@/ui";
import { uploader } from "@/upload/uploader";
import { DocumentList } from "@/components/DocumentList";
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
    void Promise.all(unsent.map((r) => discardCapture(r.id).then((row) => deleteLocal(row?.local_uri ?? null)))).then(
      () => setDropped(unsent.length),
    );
  }, [revokedAt, outbox]);

  if (!a) {
    return (
      <Screen>
        {list.isLoading ? <Text style={s.muted}>Loading…</Text> : <Callout tone="critical" title="This assignment is no longer yours." />}
      </Screen>
    );
  }

  const m = meta(assignmentStatus, boardStatus(a));
  const unit = a.task.target_unit ?? "units";
  const spec = a.task.capture_spec ?? {};
  // The API sends every declared key, set or not, so an unanswered one arrives
  // as null and used to print "orientation: null" at the worker — and an all
  // unanswered spec drew an empty card. A requirement nobody stated is not one.
  const stated = Object.entries(spec).filter(
    ([k, v]) => k !== "subject" && v != null && v !== "" && !(Array.isArray(v) && v.length === 0),
  );
  // The subject gets its own card, above the technical requirements: it is
  // the one line a worker should read before the first shot, and the phone
  // will hold them to it after each one.
  const subject = spec.subject ?? null;
  // Remove a capture the worker does not want to send. The local row goes
  // either way; the uploaded asset needs the server too, and freeing that slot
  // is what lets them shoot a replacement against a full quota.
  const removeCapture = ({ captureId, assetId }: { captureId?: string; assetId?: string }) => {
    Alert.alert("Remove this capture?", "It will not be sent for review.", [
      { text: "Keep", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              if (assetId) await del(`/assets/${assetId}`);
              if (captureId) await deleteCapture(captureId);
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
  const where = boardStatus(a);
  const parts = sections((assets.data ?? []) as AssetRow[], a.batches ?? []);
  // Still on the phone and on its way up: these take a slot like any capture.
  const onPhone = pendingLocal + failedLocal;
  const left = remaining(a, onPhone);
  const canCapture = canCaptureMore(a, onPhone);
  const changeable = !revoked && (a.status === "in_progress" || a.status === "rejected");
  const whyNotSend = cannotSend(a, pendingLocal, failedLocal);
  const lastDecided = (a.batches ?? []).find((b) => b.status === "reviewed" && b.rework_count > 0);

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
    Alert.alert(
      "Send for review?",
      `${n} ${unit} go to your aggregator as one batch. You can keep capturing while they look at it.`,
      [{ text: "Not yet", style: "cancel" }, { text: "Send", onPress: () => submit.mutate() }],
    );
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
        onPress: () => void discardFailed(id).then((rows: CaptureRow[]) => Promise.all(rows.map((r) => deleteLocal(r.local_uri)))),
      },
    ]);
  };

  return (
    <Screen>
      <View style={[s.row, { justifyContent: "space-between", marginBottom: 4 }]}>
        <Text style={[s.h1, { flex: 1, marginRight: 8 }]}>{a.task.title}</Text>
        <Pill tone={m.tone}>{m.label}</Pill>
      </View>
      <Text style={[s.mono, { marginBottom: 14 }]}>{a.task.reference_code}{a.due_on ? ` · due ${a.due_on}` : ""}</Text>

      {revoked ? (
        <Callout tone="neutral" title="This task was given to someone else">
          {`What you uploaded was sent to your aggregator for review. Nothing more is needed from you on it.${
            dropped ? ` ${dropped} capture${dropped === 1 ? "" : "s"} still on this phone could not be sent and were removed.` : ""
          }`}
        </Callout>
      ) : null}
      {!revoked && parts.rework.length > 0 ? (
        <Callout tone="critical" title={`${parts.rework.length} to shoot again`}>
          {/* Which frames, not just how many. The aggregator marked these one
              by one; everything else they looked at is accepted and stays so.
              Each one carries its own reason on its tile below. */}
          {lastDecided?.decision_note ? `${lastDecided.decision_note}\n` : ""}
          Retake or remove each one below. The rest are accepted.
        </Callout>
      ) : null}
      {!revoked && where === "submitted" ? (
        <Callout tone="attention" title="Awaiting review">Everything is sent. Your aggregator is looking at it.</Callout>
      ) : null}
      {a.status === "accepted" ? <Callout tone="success" title="Accepted">Nothing more to do here.</Callout> : null}

      <View style={s.card}>
        <Text style={[s.label, { marginBottom: 6 }]}>Progress</Text>
        <Meter value={progress.accepted} max={a.quantity} />
        <Text style={[s.body, { marginTop: 8 }]}>{summary(a)}</Text>
        {!revoked && a.status !== "accepted" ? (
          <Text style={s.muted}>{left > 0 ? `${left} more to capture` : "Nothing more to capture"}</Text>
        ) : null}
        {pendingLocal > 0 ? <Text style={s.muted}>{pendingLocal} waiting to upload</Text> : null}
        {failedLocal > 0 ? <Text style={[s.muted, { color: C.danger }]}>{failedLocal} failed — retry or discard below</Text> : null}
        {/* Refused captures never left the phone, so this is the only place
            they are counted. Without it the progress bar simply refuses to
            move and the worker has nothing to go on. */}
        {refusedTotal > 0 ? (
          <>
            <Text style={[s.muted, { marginTop: 6 }]}>
              {refusedTotal} refused on this phone — not sent for review
            </Text>
            {refused.map((r) => (
              <View key={r.code}>
                <Text style={[s.muted, { marginLeft: 10 }]}>
                  {r.n} × {rejectionLabel[r.code] ?? r.code.replace(/_/g, " ")}
                </Text>
                {/* What the phone actually said, which is where the number is.
                    "beyond the tilt allowed" does not tell a worker whether
                    they were a degree out or thirty. */}
                {r.message ? (
                  <Text style={[s.muted, { marginLeft: 20, fontSize: 12 }]}>{r.message}</Text>
                ) : null}
              </View>
            ))}
          </>
        ) : null}
      </View>

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
                  onPress={() => void discardCapture(r.id).then((row) => deleteLocal(row?.local_uri ?? null))}
                />
              </View>
            </View>
          ))}
        </View>
      )}

      {(a.instructions || a.task.instructions) && (
        <View style={s.card}>
          <Text style={[s.label, { marginBottom: 6 }]}>Instructions</Text>
          {a.task.instructions ? <Text style={s.body}>{a.task.instructions}</Text> : null}
          {a.instructions ? <Text style={[s.body, { marginTop: a.task.instructions ? 8 : 0 }]}>{a.instructions}</Text> : null}
        </View>
      )}

      <DocumentList sections={referenceSections(a.task)} />

      {subject && (
        <View style={s.card}>
          <Text style={[s.label, { marginBottom: 6 }]}>What to capture</Text>
          <Text style={[s.body, { fontWeight: "600" }]}>{subject.domain}</Text>
          {subject.must_show.length > 0 && (
            <Text style={s.body}>
              <Text style={{ color: C.muted }}>Must show: </Text>
              {subject.must_show.join(", ")}
            </Text>
          )}
          {subject.must_not_show.length > 0 && (
            <Text style={s.body}>
              <Text style={{ color: C.muted }}>Must not show: </Text>
              {subject.must_not_show.join(", ")}
            </Text>
          )}
        </View>
      )}

      {stated.length > 0 && (
        <View style={s.card}>
          <Text style={[s.label, { marginBottom: 6 }]}>Capture requirements</Text>
          {stated.map(([k, v]) => (
            <Text key={k} style={s.body}>
              <Text style={{ color: C.muted }}>{k.replace(/_/g, " ")}: </Text>
              {String(v)}
            </Text>
          ))}
        </View>
      )}

      {error && <Callout tone="critical" title={error} />}

      {canCapture && (
        <Button
          title={a.status === "assigned" ? "Start and capture" : "Capture"}
          variant="primary"
          onPress={() => void goCapture()}
          loading={start.isPending}
          style={{ marginBottom: 10 }}
        />
      )}
      {failedLocal > 0 && (
        <View style={[s.row, { marginBottom: 10 }]}>
          <Button title="Retry failed" onPress={() => void retry()} style={{ flex: 1 }} />
          <Button title="Discard failed" variant="danger" onPress={discard} style={{ flex: 1 }} />
        </View>
      )}
      {parts.rework.length > 0 && (
        <>
          <Text style={[s.label, { marginBottom: 8, marginTop: 6 }]}>To shoot again ({parts.rework.length})</Text>
          <Gallery
            local={[]}
            remote={parts.rework}
            onRemove={changeable ? removeCapture : undefined}
            onRetake={changeable ? (assetId) => void goCapture(assetId) : undefined}
          />
          <View style={{ height: 14 }} />
        </>
      )}

      {/* What is on the server and not sent yet, plus anything still on its
          way up from this phone. Only these are sent by the button below. */}
      <Text style={[s.label, { marginBottom: 8, marginTop: 6 }]}>Not sent yet ({progress.draft})</Text>
      <Gallery
        local={outbox.filter((r) => r.status !== "confirmed")}
        remote={parts.draft}
        onRemove={changeable ? removeCapture : undefined}
        empty={revoked ? null : "Nothing waiting to be sent."}
      />
      {changeable && (
        <View style={{ marginTop: 10, marginBottom: 14 }}>
          <Field label="Note for the reviewer (optional)">
            <TextInput style={[inputStyle, { minHeight: 70 }]} multiline value={note} onChangeText={setNote} placeholder="Aisles 1 and 2 done; shelf 3 was restocking." />
          </Field>
          <Button
            title={progress.draft > 0 ? `Send ${progress.draft} for review` : "Send for review"}
            variant="primary"
            onPress={confirmSubmit}
            disabled={whyNotSend != null}
            loading={submit.isPending}
          />
          {whyNotSend ? <Text style={[s.muted, { marginTop: 6 }]}>{whyNotSend}</Text> : null}
        </View>
      )}

      {parts.inReview.map((grp) => (
        <View key={`r${grp.batch_no}`} style={{ marginBottom: 14 }}>
          <Text style={[s.label, { marginBottom: 8, marginTop: 6 }]}>
            In review · batch {grp.batch_no} ({grp.assets.length})
          </Text>
          <Gallery local={[]} remote={grp.assets} empty={null} />
        </View>
      ))}

      {parts.accepted.length > 0 && (
        <AcceptedBatches groups={parts.accepted} />
      )}
    </Screen>
  );
}

/** What the aggregator accepted, batch by batch. Settled: nothing here can be
 *  removed or retaken, so it is folded away until the worker asks to see it. */
function AcceptedBatches({ groups }: { groups: ReturnType<typeof sections>["accepted"] }) {
  const [open, setOpen] = useState(false);
  const total = groups.reduce((n, g) => n + g.assets.length, 0);
  return (
    <View style={{ marginBottom: 14 }}>
      <Pressable onPress={() => setOpen(!open)} accessibilityRole="button" style={{ paddingVertical: 6 }}>
        <Text style={[s.label, { marginTop: 6 }]}>
          {open ? "▾" : "▸"} Accepted ({total})
        </Text>
      </Pressable>
      {open &&
        groups.map((grp) => (
          <View key={`a${grp.batch_no}`} style={{ marginBottom: 10 }}>
            <Text style={[s.muted, { marginBottom: 6 }]}>
              Batch {grp.batch_no} · {grp.assets.length} accepted
              {grp.batch?.decided_at ? ` · ${grp.batch.decided_at.slice(0, 10)}` : ""}
            </Text>
            <Gallery local={[]} remote={grp.assets} empty={null} />
          </View>
        ))}
    </View>
  );
}
