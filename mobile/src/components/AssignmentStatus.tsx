// The top of an assignment: how far along it is, and the one thing to do next.
//
// It replaces a callout, a progress card and a send block that each said part
// of the same thing. The bar is segmented so "2 accepted, 2 in review, 1 to
// retake" reads at a glance; the primary button is whatever moves the work
// forward now (batches.ts nextAction), and anything else possible is a quiet
// link under it.

import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { Action, NextAction } from "@/batches";
import { TONE_COLOR } from "@/status";
import { Button, C, inputStyle, s } from "@/ui";

export interface StatusCounts {
  accepted: number;
  in_review: number;
  rework: number;
  draft: number;
  quantity: number;
}

const SEG = {
  accepted: TONE_COLOR.success.fg,
  in_review: TONE_COLOR.attention.fg,
  rework: TONE_COLOR.critical.fg,
  draft: C.accent,
};

export function AssignmentStatus({
  counts,
  unit,
  left,
  next,
  message,
  pendingLocal,
  failedLocal,
  busy,
  note,
  onNote,
  onAction,
}: {
  counts: StatusCounts;
  unit: string;
  /** units still to capture */
  left: number;
  next: NextAction;
  /** said instead of buttons: reassigned, accepted */
  message?: { title: string; body: string } | null;
  pendingLocal: number;
  failedLocal: number;
  busy: boolean;
  note: string;
  onNote: (v: string) => void;
  onAction: (a: Action) => void;
}) {
  const [noting, setNoting] = useState(false);
  const total = Math.max(counts.quantity, 1);
  const seg = (n: number, color: string, key: string) =>
    n > 0 ? <View key={key} style={{ flex: n / total, backgroundColor: color }} /> : null;
  const legend: [string, string][] = [];
  if (counts.accepted) legend.push([SEG.accepted, `${counts.accepted} accepted`]);
  if (counts.in_review) legend.push([SEG.in_review, `${counts.in_review} in review`]);
  if (counts.rework) legend.push([SEG.rework, `${counts.rework} to retake`]);
  if (counts.draft) legend.push([SEG.draft, `${counts.draft} not sent`]);
  if (!message && left > 0) legend.push([C.line, `${left} left`]);

  return (
    <View style={[s.card, { paddingVertical: 16 }]}>
      <Text style={st.big}>
        {counts.accepted} <Text style={st.of}>of {counts.quantity} {unit} accepted</Text>
      </Text>
      <View style={st.bar} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: counts.quantity, now: counts.accepted }}>
        {seg(counts.accepted, SEG.accepted, "a")}
        {seg(counts.in_review, SEG.in_review, "r")}
        {seg(counts.rework, SEG.rework, "w")}
        {seg(counts.draft, SEG.draft, "d")}
      </View>
      {legend.length > 0 && (
        <View style={st.legend}>
          {legend.map(([color, text]) => (
            <View key={text} style={st.legendItem}>
              <View style={[st.dot, { backgroundColor: color }]} />
              <Text style={s.muted}>{text}</Text>
            </View>
          ))}
        </View>
      )}
      {pendingLocal > 0 ? <Text style={[s.muted, { marginTop: 6 }]}>{pendingLocal} uploading from this phone…</Text> : null}
      {failedLocal > 0 ? (
        <Text style={[s.muted, { marginTop: 6, color: C.danger }]}>{failedLocal} failed to upload — see below</Text>
      ) : null}

      {message ? (
        <View style={st.message}>
          <Text style={[s.body, { fontWeight: "700" }]}>{message.title}</Text>
          <Text style={[s.body, { marginTop: 2 }]}>{message.body}</Text>
        </View>
      ) : (
        <View style={{ marginTop: 14 }}>
          {next.primary === "send" && noting && (
            <TextInput
              style={[inputStyle, { minHeight: 60, marginBottom: 10 }]}
              multiline
              value={note}
              onChangeText={onNote}
              placeholder="Anything the reviewer should know (optional)"
            />
          )}
          {next.primary ? (
            <Button
              title={label(next.primary, counts, unit)}
              variant="primary"
              onPress={() => onAction(next.primary as Action)}
              loading={busy}
            />
          ) : next.waiting ? (
            <Text style={[s.body, st.waiting]}>{next.waiting}</Text>
          ) : null}
          <View style={st.links}>
            {next.secondary ? (
              <Link text={label(next.secondary, counts, unit, left)} onPress={() => onAction(next.secondary as Action)} />
            ) : null}
            {next.primary === "send" && !noting ? <Link text="Add a note for the reviewer" onPress={() => setNoting(true)} /> : null}
          </View>
        </View>
      )}
    </View>
  );
}

function label(a: Action, c: StatusCounts, unit: string, left?: number): string {
  const n = (k: number) => `${k} ${k === 1 ? unit.replace(/s$/, "") : unit}`;
  switch (a) {
    case "retake":
      return `Retake ${n(c.rework)}`;
    case "send":
      return `Send ${n(c.draft)} for review`;
    case "start":
      return "Start and capture";
    case "capture":
      return left != null ? `Capture more (${left} left)` : "Capture";
  }
}

function Link({ text, onPress }: { text: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={8} style={{ paddingVertical: 6 }}>
      <Text style={st.link}>{text}</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  big: { fontSize: 28, fontWeight: "800", color: C.ink },
  of: { fontSize: 15, fontWeight: "500", color: C.muted },
  bar: { flexDirection: "row", height: 10, borderRadius: 5, overflow: "hidden", backgroundColor: "#E7ECF0", marginTop: 10 },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  message: { marginTop: 14, padding: 12, borderRadius: 8, backgroundColor: "#EDF1F4" },
  waiting: { textAlign: "center", color: C.muted, paddingVertical: 10 },
  links: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", columnGap: 20, marginTop: 6 },
  link: { color: C.accentInk, fontWeight: "600", fontSize: 15 },
});
