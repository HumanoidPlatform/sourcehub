// The camera. Stays open between shots so a shelf run is one session; every
// capture goes straight to the outbox and the upload loop takes it from there.

import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ensureLocationPermission } from "@/capture/location";
import { CaptureRejected, useCapture } from "@/capture/useCapture";
import { MAX_VIDEO_SECONDS } from "@/config";
import { useAssignments } from "@/query/hooks";
import { TONE_COLOR } from "@/status";
import { Button, C, Callout, s } from "@/ui";
import { mediaKinds } from "@/validation/rules";

export default function Capture() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const list = useAssignments();
  const a = (list.data ?? []).find((x) => x.id === id);
  const cam = useRef<CameraView>(null);
  const [camPerm, requestCam] = useCameraPermissions();
  const [micPerm, requestMic] = useMicrophonePermissions();
  const [mode, setMode] = useState<"picture" | "video">("picture");
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [locationOk, setLocationOk] = useState(true);
  const spec = a?.task.capture_spec;
  const save = useCapture(id ?? "", a?.task.reference_code ?? "capture", spec, a?.task.target_unit);

  // The server sends a list; a task made before capture-spec inheritance sends
  // a string. Reading it raw is what used to open a video-only task in photo
  // mode and hide the toggle on a task that accepts both.
  const kinds = mediaKinds(spec, a?.task.target_unit);
  // A fresh array every render, so the effect below watches its contents.
  const kindKey = kinds.join(",");
  const maxSeconds = Math.min(MAX_VIDEO_SECONDS, spec?.max_duration_s ?? MAX_VIDEO_SECONDS);

  useEffect(() => {
    if (!camPerm?.granted) void requestCam();
    void ensureLocationPermission().then(setLocationOk);
  }, [camPerm?.granted, requestCam]);

  useEffect(() => {
    if (kindKey === "video") setMode("video");
  }, [kindKey]);

  if (!camPerm) return null;
  if (!camPerm.granted) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.pad}>
          <Callout tone="attention" title="Camera access is needed">Allow the camera in the phone's settings, then come back.</Callout>
          <Button title="Open settings" onPress={() => void Linking.openSettings()} style={{ marginBottom: 10 }} />
          <Button title="Back" variant="quiet" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  // A warning does not stop the capture — it is kept, flagged, and the reason
  // travels with it to QA. Only a block throws, and the catch below renders it.
  const kept = (warnings: { message: string }[]) => {
    setCount((n) => n + 1);
    setNotice(warnings.length > 0 ? warnings.map((w) => w.message).join(" ") : null);
  };

  const shoot = async () => {
    if (!cam.current || busy) return;
    setError(null);
    try {
      if (mode === "picture") {
        setBusy(true);
        const photo = await cam.current.takePictureAsync({ quality: 0.9, exif: true, skipProcessing: false });
        if (photo?.uri) {
          kept(await save({ uri: photo.uri, width: photo.width, height: photo.height }, "photo"));
        }
      } else if (!recording) {
        if (!micPerm?.granted) {
          const r = await requestMic();
          if (!r.granted) {
            setError("Microphone access is needed for video.");
            return;
          }
        }
        setRecording(true);
        const video = await cam.current.recordAsync({ maxDuration: maxSeconds });
        setRecording(false);
        if (video?.uri) {
          setBusy(true);
          kept(await save({ uri: video.uri }, "video"));
        }
      } else {
        cam.current.stopRecording();
      }
    } catch (e) {
      setRecording(false);
      // A rejection has already deleted the file and left the queue untouched,
      // so the counter not advancing is the correct outcome, not a failure.
      if (e instanceof CaptureRejected) setNotice(null);
      setError(e instanceof Error ? e.message : "Capture failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={c.root}>
      <CameraView ref={cam} style={c.camera} facing="back" mode={mode} mute={false} />
      <SafeAreaView style={c.overlay} pointerEvents="box-none">
        <View style={c.top}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" style={c.chip}>
            <Text style={c.chipText}>Done</Text>
          </Pressable>
          <Text style={c.counter}>{count} saved</Text>
          {kinds.length > 1 && (
            <Pressable onPress={() => !recording && setMode(mode === "picture" ? "video" : "picture")} accessibilityRole="button" style={c.chip}>
              <Text style={c.chipText}>{mode === "picture" ? "Photo" : "Video"} ▾</Text>
            </Pressable>
          )}
        </View>
        {/* Said once, before the run rather than after it: a whole shelf run
            used to be capturable with no coordinates and nothing to show for it. */}
        {spec?.require_gps && !locationOk ? (
          <Text style={c.warn}>This task needs a location on every capture. Turn location on in settings.</Text>
        ) : null}
        {error ? <Text style={c.error}>{error}</Text> : null}
        {notice ? <Text style={c.warn}>{notice}</Text> : null}
        <View style={c.bottom}>
          <Pressable
            onPress={() => void shoot()}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={mode === "picture" ? "Take photo" : recording ? "Stop recording" : "Start recording"}
            style={({ pressed }) => [c.shutter, mode === "video" && c.shutterVideo, recording && c.shutterRec, (pressed || busy) && { opacity: 0.7 }]}
          />
          <Text style={c.hint}>{recording ? `Recording… up to ${maxSeconds} s` : mode === "picture" ? "Tap to take a photo" : "Tap to start, tap again to stop"}</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const c = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  camera: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  overlay: { flex: 1, justifyContent: "space-between" },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12 },
  chip: { backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  chipText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  counter: { color: "#fff", fontWeight: "700", fontSize: 15, textShadowColor: "#000", textShadowRadius: 4 },
  error: { color: "#fff", backgroundColor: C.danger, padding: 8, marginHorizontal: 12, borderRadius: 8, textAlign: "center" },
  // The capture was kept: the attention tone, not the danger one.
  warn: { color: TONE_COLOR.attention.fg, backgroundColor: TONE_COLOR.attention.bg, padding: 8, marginHorizontal: 12, marginTop: 6, borderRadius: 8, textAlign: "center" },
  bottom: { alignItems: "center", paddingBottom: 28 },
  shutter: { width: 76, height: 76, borderRadius: 38, backgroundColor: "#fff", borderWidth: 5, borderColor: "rgba(255,255,255,0.4)" },
  shutterVideo: { backgroundColor: "#E03B24" },
  shutterRec: { borderRadius: 14, width: 60, height: 60, marginVertical: 8 },
  hint: { color: "#fff", marginTop: 10, fontSize: 13, textShadowColor: "#000", textShadowRadius: 4 },
});
