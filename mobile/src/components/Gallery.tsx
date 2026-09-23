// The capture grid: local outbox rows first (with upload state), then the
// server's assets that have no local twin (confirmed earlier, or captured on
// another install). A server tile fetches its signed URL only when shown.

import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import type { AssetRow } from "@/api/types";
import { frameAt } from "@/capture/frames";
import type { CaptureRow } from "@/db/outbox";
import { useAssetUrl } from "@/query/hooks";
import { assetStatus, captureStatus, meta, TONE_COLOR } from "@/status";
import { C, s } from "@/ui";
import { useUploadProgress } from "@/upload/progress";
import { Player } from "./Player";

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

/** A still from the clip itself, so a video tile is a picture rather than a
 *  grey box. The same thumbnailer the frame checks use; a file it cannot open
 *  simply has no poster, and the tile falls back to the play glyph. */
function usePoster(uri: string | undefined, isVideo: boolean): string | null {
  const [poster, setPoster] = useState<string | null>(null);
  useEffect(() => {
    if (!uri || !isVideo) {
      setPoster(null);
      return;
    }
    let alive = true;
    // Half a second in: the first frames of a recording are often the dark
    // ones from before the sensor settled.
    frameAt(uri, 0.5)
      .then((f) => alive && setPoster(f.uri))
      .catch(() => alive && setPoster(null));
    return () => {
      alive = false;
    };
  }, [uri, isVideo]);
  return poster;
}

/** What a tile shows, and what happens when it is tapped. A video plays in the
 *  app (components/Player.tsx); a photo opens where it always did. */
function Tile({
  uri,
  isVideo,
  label,
  placeholder,
  children,
}: {
  uri: string | undefined;
  isVideo: boolean;
  label: string;
  /** what to show until there is something to show */
  placeholder: string;
  children?: React.ReactNode;
}) {
  const poster = usePoster(uri, isVideo);
  const [playing, setPlaying] = useState(false);
  const shown = isVideo ? poster : uri;
  const open = () => {
    if (!uri) return;
    if (isVideo) setPlaying(true);
    else void Linking.openURL(uri);
  };
  return (
    <Pressable
      style={g.tile}
      onPress={open}
      disabled={!uri}
      accessibilityRole="button"
      accessibilityLabel={isVideo ? `Play ${label}` : label}
    >
      {shown ? (
        <Image source={{ uri: shown }} style={g.img} contentFit="cover" cachePolicy="memory-disk" />
      ) : (
        <View style={[g.img, g.ph]}><Text style={{ color: C.muted, fontSize: 20 }}>{placeholder}</Text></View>
      )}
      {/* Over the poster, so a still frame reads as a clip at a glance. */}
      {isVideo && shown ? (
        <View style={g.play} pointerEvents="none"><Text style={g.playText}>▶</Text></View>
      ) : null}
      {children}
      {playing && uri ? <Player uri={uri} title={label} onClose={() => setPlaying(false)} /> : null}
    </Pressable>
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

/** What the phone flagged about this capture before queueing it, as one line.
 *  A row written before the checks existed, or a column that will not parse,
 *  simply has nothing to say. */
function flagged(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed.map((f) => String((f as { message?: unknown }).message ?? "")).filter(Boolean).join(" ") || null;
  } catch {
    return null;
  }
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
  const flags = flagged(row.checks);
  const needsRemote = !row.local_uri && !!row.asset_id;
  const remote = useAssetUrl(row.asset_id ?? "", needsRemote);
  const uri = row.local_uri ?? (needsRemote ? remote.data?.url : undefined);
  return (
    <Tile uri={uri} isVideo={isVideo} label={row.filename} placeholder={isVideo ? "▶" : "…"}>
      <Tag tone={m.tone} text={pct != null ? `${pct}%` : m.label} />
      {row.status === "failed" && row.last_error ? (
        <Text numberOfLines={2} style={g.err}>{row.last_error}</Text>
      ) : flags ? (
        // The capture was kept and is uploading normally; this says why a
        // reviewer may query it, while the worker is still on site to redo it.
        <Text numberOfLines={2} style={g.flag}>{flags}</Text>
      ) : null}
      {onRemove && (
        <RemoveButton onPress={() => onRemove({ captureId: row.id, assetId: row.asset_id ?? undefined })} />
      )}
    </Tile>
  );
}

function RemoteTile({ asset, onRemove }: { asset: AssetRow; onRemove?: (o: { captureId?: string; assetId?: string }) => void }) {
  const viewable = asset.status === "ready";
  const url = useAssetUrl(asset.id, viewable);
  const m = meta(assetStatus, asset.status);
  const isVideo = (asset.mime_type ?? "").startsWith("video/");
  return (
    <Tile
      uri={url.data?.url}
      isVideo={isVideo}
      label={asset.filename ?? "capture"}
      placeholder={isVideo ? "▶" : viewable ? "…" : "◌"}
    >
      <Tag tone={m.tone} text={m.label} />
      {onRemove && <RemoveButton onPress={() => onRemove({ assetId: asset.id })} />}
    </Tile>
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
  play: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center", justifyContent: "center",
  },
  playText: { color: "#fff", fontSize: 26, textShadowColor: "rgba(0,0,0,0.7)", textShadowRadius: 6 },
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
  flag: { position: "absolute", top: 4, left: 4, right: 4, fontSize: 9, color: "#fff", backgroundColor: "rgba(154,98,16,0.85)", padding: 3, borderRadius: 4 },
});
