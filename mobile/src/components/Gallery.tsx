// The capture grid: local outbox rows first (with upload state), then the
// server's assets that have no local twin (confirmed earlier, or captured on
// another install). A server tile fetches its signed URL only when shown.

import { Image } from "expo-image";
import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import type { AssetRow } from "@/api/types";
import type { CaptureRow } from "@/db/outbox";
import { useAssetUrl } from "@/query/hooks";
import { assetStatus, captureStatus, meta, TONE_COLOR } from "@/status";
import { C, s } from "@/ui";
import { useUploadProgress } from "@/upload/progress";

export function Gallery({
  local,
  remote,
  onRemove,
}: {
  local: CaptureRow[];
  remote: AssetRow[];
  /** Drop a capture before submitting. Undefined once the batch has gone. */
  onRemove?: (opts: { captureId?: string; assetId?: string }) => void;
}) {
  const localAssetIds = new Set(local.map((r) => r.asset_id).filter(Boolean));
  const localSha = new Set(local.map((r) => r.sha256).filter(Boolean));
  const remoteOnly = remote.filter((a) => !localAssetIds.has(a.id) && !localSha.has(a.sha256));
  if (local.length === 0 && remoteOnly.length === 0) {
    return <Text style={[s.muted, { paddingVertical: 12 }]}>No captures yet.</Text>;
  }
  return (
    <View style={g.grid}>
      {local.map((r) => <LocalTile key={r.id} row={r} onRemove={onRemove} />)}
      {remoteOnly.map((a) => <RemoteTile key={a.id} asset={a} onRemove={onRemove} />)}
    </View>
  );
}

function RemoveButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Remove this capture"
      style={g.remove}
    >
      <Text style={g.removeText}>×</Text>
    </Pressable>
  );
}

function LocalTile({ row, onRemove }: { row: CaptureRow; onRemove?: (o: { captureId?: string; assetId?: string }) => void }) {
  const progress = useUploadProgress();
  const m = meta(captureStatus, row.status);
  const pct = row.status === "uploading" ? Math.round((progress.get(row.id) ?? 0) * 100) : null;
  const isVideo = row.mime.startsWith("video/");
  // The uploader deletes the local file once the bytes are confirmed, to keep
  // the phone's storage free. This tile still owns the asset_id, so it fetches
  // the signed URL the same way a remote tile does — otherwise a capture that
  // uploaded SUCCESSFULLY is the one you cannot look at.
  const needsRemote = !row.local_uri && !!row.asset_id && !isVideo;
  const remote = useAssetUrl(row.asset_id ?? "", needsRemote);
  const uri = row.local_uri ?? (needsRemote ? remote.data?.url : undefined);
  return (
    <View style={g.tile} accessibilityLabel={`${row.filename}, ${m.label}`}>
      {uri && !isVideo ? (
        <Image source={{ uri }} style={g.img} contentFit="cover" cachePolicy="memory-disk" />
      ) : (
        <View style={[g.img, g.ph]}><Text style={{ color: C.muted, fontSize: 20 }}>{isVideo ? "▶" : "…"}</Text></View>
      )}
      <Tag tone={m.tone} text={pct != null ? `${pct}%` : m.label} />
      {row.status === "failed" && row.last_error ? (
        <Text numberOfLines={2} style={g.err}>{row.last_error}</Text>
      ) : null}
      {onRemove && (
        <RemoveButton onPress={() => onRemove({ captureId: row.id, assetId: row.asset_id ?? undefined })} />
      )}
    </View>
  );
}

function RemoteTile({ asset, onRemove }: { asset: AssetRow; onRemove?: (o: { captureId?: string; assetId?: string }) => void }) {
  const [wanted, setWanted] = useState(false);
  const viewable = asset.status === "ready";
  const url = useAssetUrl(asset.id, wanted && viewable);
  const m = meta(assetStatus, asset.status);
  const isVideo = (asset.mime_type ?? "").startsWith("video/");
  return (
    <Pressable
      style={g.tile}
      onLayout={() => setWanted(true)}
      onPress={() => {
        if (url.data?.url) void Linking.openURL(url.data.url);
      }}
      accessibilityRole="button"
      accessibilityLabel={`${asset.filename ?? "capture"}, ${m.label}`}
    >
      {url.data?.url && !isVideo ? (
        <Image source={{ uri: url.data.url }} style={g.img} contentFit="cover" cachePolicy="memory-disk" />
      ) : (
        <View style={[g.img, g.ph]}><Text style={{ color: C.muted, fontSize: 20 }}>{isVideo ? "▶" : viewable ? "…" : "◌"}</Text></View>
      )}
      <Tag tone={m.tone} text={m.label} />
      {onRemove && <RemoveButton onPress={() => onRemove({ assetId: asset.id })} />}
    </Pressable>
  );
}

function Tag({ tone, text }: { tone: keyof typeof TONE_COLOR; text: string }) {
  const c = TONE_COLOR[tone];
  return (
    <View style={[g.tag, { backgroundColor: c.bg }]}>
      <Text style={[g.tagText, { color: c.fg }]}>{text}</Text>
    </View>
  );
}

const g = StyleSheet.create({
  remove: {
    position: "absolute", top: 4, right: 4, width: 24, height: 24, borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.62)", alignItems: "center", justifyContent: "center",
  },
  removeText: { color: "#fff", fontSize: 15, lineHeight: 17, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tile: { width: "31%", aspectRatio: 1, borderRadius: 8, overflow: "hidden", backgroundColor: "#E7ECF0", borderWidth: 1, borderColor: C.line },
  img: { width: "100%", height: "100%" },
  ph: { alignItems: "center", justifyContent: "center" },
  tag: { position: "absolute", left: 4, bottom: 4, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 10, fontWeight: "700" },
  err: { position: "absolute", top: 4, left: 4, right: 4, fontSize: 9, color: "#fff", backgroundColor: "rgba(194,65,12,0.85)", padding: 3, borderRadius: 4 },
});
