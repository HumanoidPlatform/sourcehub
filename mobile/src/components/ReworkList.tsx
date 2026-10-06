// Captures the aggregator sent back, one row each: the picture on the left,
// why on the right, and the two things that can be done about it. Nothing is
// written over the picture — the worker needs to see the frame they are
// replacing, and the reason reads better as a sentence beside it.

import { Image } from "expo-image";
import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import type { AssetRow } from "@/api/types";
import { useAssetUrl } from "@/query/hooks";
import { Button, C, s } from "@/ui";
import { Player } from "./Player";

export function ReworkList({
  assets,
  note,
  onRetake,
  onRemove,
}: {
  assets: AssetRow[];
  /** a note the reviewer wrote themselves, shown once above the rows */
  note?: string | null;
  /** undefined where the assignment can no longer be changed */
  onRetake?: (assetId: string) => void;
  onRemove?: (assetId: string) => void;
}) {
  if (assets.length === 0) return null;
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[s.label, { marginBottom: 8 }]}>Needs a retake ({assets.length})</Text>
      {note ? <Text style={[s.body, st.note]}>“{note}”</Text> : null}
      {assets.map((a) => (
        <Row key={a.id} asset={a} onRetake={onRetake} onRemove={onRemove} />
      ))}
    </View>
  );
}

function Row({
  asset,
  onRetake,
  onRemove,
}: {
  asset: AssetRow;
  onRetake?: (assetId: string) => void;
  onRemove?: (assetId: string) => void;
}) {
  const url = useAssetUrl(asset.id, true);
  const [playing, setPlaying] = useState(false);
  const isVideo = (asset.mime_type ?? "").startsWith("video/");
  const reason = asset.review_label ?? asset.review_reason ?? "Sent back";
  const open = () => {
    const u = url.data?.url;
    if (!u) return;
    if (isVideo) setPlaying(true);
    else void Linking.openURL(u);
  };
  return (
    <View style={[s.card, st.row]}>
      <Pressable onPress={open} accessibilityRole="button" accessibilityLabel="Open the capture" style={st.thumb}>
        {url.data?.url && !isVideo ? (
          <Image source={{ uri: url.data.url }} style={st.img} contentFit="cover" cachePolicy="memory-disk" />
        ) : (
          <View style={[st.img, st.ph]}>
            <Text style={{ color: C.muted, fontSize: 20 }}>{isVideo ? "▶" : "…"}</Text>
          </View>
        )}
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={[s.body, { fontWeight: "700" }]}>{reason}</Text>
        {asset.review_note ? <Text style={[s.muted, { marginTop: 2 }]} numberOfLines={3}>{asset.review_note}</Text> : null}
        <View style={st.actions}>
          {onRetake ? <Button title="Retake" variant="primary" onPress={() => onRetake(asset.id)} style={st.retake} /> : null}
          {onRemove ? (
            <Pressable onPress={() => onRemove(asset.id)} accessibilityRole="button" hitSlop={8}>
              <Text style={st.remove}>Remove</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      {playing && url.data?.url ? <Player uri={url.data.url} title={asset.filename ?? "capture"} onClose={() => setPlaying(false)} /> : null}
    </View>
  );
}

const st = StyleSheet.create({
  note: { fontStyle: "italic", color: C.muted, marginBottom: 8 },
  row: { flexDirection: "row", gap: 12, alignItems: "flex-start", padding: 10 },
  thumb: { width: 84, height: 84, borderRadius: 8, overflow: "hidden" },
  img: { width: "100%", height: "100%" },
  ph: { alignItems: "center", justifyContent: "center", backgroundColor: "#E7ECF0" },
  actions: { flexDirection: "row", alignItems: "center", gap: 18, marginTop: 8 },
  retake: { paddingHorizontal: 18, minHeight: 36, paddingVertical: 6 },
  remove: { color: C.danger, fontWeight: "600", fontSize: 15 },
});
