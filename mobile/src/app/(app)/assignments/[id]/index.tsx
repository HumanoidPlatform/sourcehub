// One assignment: what to capture, how far along it is, the gallery of local
// and uploaded captures, and the three actions — Start, Capture, Submit.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import { ApiError, del, post } from "@/api/client";
import type { Assignment, AssetRow } from "@/api/types";
import { deleteCapture, discardCapture, discardFailed, retryCapture, retryFailed, type CaptureRow } from "@/db/outbox";
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

  const start = useMutation({
    mutationFn: () => post<Assignment>(`/assignments/${id}/start`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["assignments"] }),
    onError: (e) => setError(e instanceof ApiError ? e.message : "Could not start."),
  });
  const submit = useMutation({
    mutationFn: () => post<Assignment>(`/assignments/${id}/submit`, { note: note.trim() || null }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["assignments"] });
      router.back();
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Could not submit."),
  });

  if (!a) {
    return (
      <Screen>
        {list.isLoading ? <Text style={s.muted}>Loading…</Text> : <Callout tone="critical" title="This assignment is no longer yours." />}
      </Screen>
    );
  }

  const m = meta(assignmentStatus, a.status);
  const unit = a.task.target_unit ?? "units";
  const spec = a.task.capture_spec ?? {};
  // The API sends every declared key, set or not, so an unanswered one arrives
  // as null and used to print "orientation: null" at the worker — and an all
  // unanswered spec drew an empty card. A requirement nobody stated is not one.
  const stated = Object.entries(spec).filter(
    ([, v]) => v != null && v !== "" && !(Array.isArray(v) && v.length === 0),
  );
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
  const canCapture = ["assigned", "in_progress", "rejected"].includes(a.status);
  const canSubmit = ["in_progress", "rejected"].includes(a.status) && a.assets.ready >= 1 && pendingLocal === 0 && failedLocal === 0;

  const goCapture = async () => {
    setError(null);
    if (a.status === "assigned" || a.status === "rejected") {
      try {
        await start.mutateAsync();
      } catch {
        return;
      }
    }
    router.push(`/assignments/${id}/capture`);
  };

  const confirmSubmit = () => {
    Alert.alert(
      "Submit for review?",
      `${a.assets.ready} ${unit} will go to ${"your aggregator"} for review. You cannot add more until they answer.`,
      [{ text: "Not yet", style: "cancel" }, { text: "Submit", onPress: () => submit.mutate() }],
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

      {a.status === "rejected" && a.decision_note ? (
        <Callout tone="critical" title="Sent back — what to change">{a.decision_note}</Callout>
      ) : null}
      {a.status === "submitted" ? <Callout tone="attention" title="Awaiting review">Your aggregator is looking at this batch.</Callout> : null}
      {a.status === "accepted" ? <Callout tone="success" title="Accepted">Nothing more to do here.</Callout> : null}

      <View style={s.card}>
        <Text style={[s.label, { marginBottom: 6 }]}>Progress</Text>
        <Meter value={a.assets.ready} max={a.quantity} />
        <Text style={[s.body, { marginTop: 8 }]}>
          <Text style={{ fontWeight: "700" }}>{a.assets.ready}</Text> of {a.quantity} {unit} uploaded
        </Text>
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
              <Text key={r.code} style={[s.muted, { marginLeft: 10 }]}>
                {r.n} × {rejectionLabel[r.code] ?? r.code.replace(/_/g, " ")}
              </Text>
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
      {["in_progress", "rejected"].includes(a.status) && (
        <View style={{ marginBottom: 14 }}>
          <Field label="Note for the reviewer (optional)">
            <TextInput style={[inputStyle, { minHeight: 70 }]} multiline value={note} onChangeText={setNote} placeholder="Aisles 1 and 2 done; shelf 3 was restocking." />
          </Field>
          <Button title="Submit for review" variant="primary" onPress={confirmSubmit} disabled={!canSubmit} loading={submit.isPending} />
          {!canSubmit && (
            <Text style={[s.muted, { marginTop: 6 }]}>
              {a.assets.ready < 1
                ? "Upload at least one capture first."
                : pendingLocal > 0
                  ? "Wait for the uploads to finish."
                  : failedLocal > 0
                    ? "Retry or discard the failed captures first."
                    : ""}
            </Text>
          )}
        </View>
      )}

      <Text style={[s.label, { marginBottom: 8, marginTop: 6 }]}>Captures</Text>
      <Gallery
        local={outbox}
        remote={(assets.data ?? []) as AssetRow[]}
        onRemove={a.status === "in_progress" || a.status === "rejected" ? removeCapture : undefined}
      />
    </Screen>
  );
}
