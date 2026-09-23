// The camera. Stays open between shots so a shelf run is one session; every
// capture goes straight to the outbox and the upload loop takes it from there.

import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ensureLocationPermission } from "@/capture/location";
import { type Held, medianOff, type Tilt, watchTilt } from "@/capture/tilt";
import { type CaptureOutcome, CaptureRejected, useCapture } from "@/capture/useCapture";
import { MAX_VIDEO_SECONDS } from "@/config";
import { useAssignments } from "@/query/hooks";
import { TONE_COLOR } from "@/status";
import { Button, C, Callout, s } from "@/ui";
import { mediaKinds } from "@/validation/rules";

/** A level, shown only on a task whose client asked for squareness.
 *
 * The bar counter-rotates with roll so it reads as the horizon rather than as
 * part of the phone, and it goes amber the moment the capture would be
 * flagged — the point is to prevent the tilted shot, not to report it.
 */
function Level({ tilt, tolerance }: { tilt: Tilt | null; tolerance: number }) {
  if (!tilt) return null;
  const off = Math.round(tilt.off);
  const bad = tilt.off > tolerance;
  const tint = bad ? TONE_COLOR.attention.bg : "rgba(255,255,255,0.9)";
  return (
    <View style={c.level} pointerEvents="none" accessibilityLabel={`${off} degrees off square`}>
      <View style={[c.levelBar, { backgroundColor: tint, transform: [{ rotate: `${-tilt.roll}deg` }] }]} />
      <Text style={[c.levelText, bad && { color: TONE_COLOR.attention.bg }]}>
        {bad ? `${off}° off` : "level"}
      </Text>
    </View>
  );
}

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
  const [notice, setNotice] = useState<{ text: string; tone: "warn" | "ok" } | null>(null);
  // "Checking clip… 12/40" while a video's frames are being looked at
  const [checking, setChecking] = useState<{ done: number; total: number } | null>(null);
  // How the phone is being held, for a task that asked for an orientation.
  // The ref is what the shutter and the recording read; the state only drives
  // the on-screen hint.
  const held = useRef<Held | null>(null);
  const [heldNow, setHeldNow] = useState<Held | null>(null);
  // While a recording runs, every reading is counted. The majority is what the
  // clip was shot as — one wobble through the 45° diagonal does not decide it.
  const holdTally = useRef<{ portrait: number; landscape: number } | null>(null);
  // Every squareness reading taken while the recording ran. A clip is held for
  // minutes; the instant the shutter was pressed says nothing about it.
  const tiltSamples = useRef<number[] | null>(null);
  const [locationOk, setLocationOk] = useState(true);
  // The ref is what the shutter reads; the state only drives the level, and
  // only moves when the whole degree does, so a 10 Hz sensor does not re-render
  // the camera ten times a second.
  const tilt = useRef<Tilt | null>(null);
  const [level, setLevel] = useState<Tilt | null>(null);
  const spec = a?.task.capture_spec;
  const save = useCapture(id ?? "", a?.task.reference_code ?? "capture", spec, a?.task.target_unit);

  // The server sends a list; a task made before capture-spec inheritance sends
  // a string. Reading it raw is what used to open a video-only task in photo
  // mode and hide the toggle on a task that accepts both.
  const kinds = mediaKinds(spec, a?.task.target_unit);
  // A fresh array every render, so the effect below watches its contents.
  const kindKey = kinds.join(",");
  const maxSeconds = Math.min(MAX_VIDEO_SECONDS, spec?.max_duration_s ?? MAX_VIDEO_SECONDS);
  const minSeconds = typeof spec?.min_duration_s === "number" && spec.min_duration_s > 0 ? spec.min_duration_s : null;
  // Picking a clip the phone already holds is allowed only where the client
  // said so: a recording made here is provably from this place and time, a
  // file from the gallery is whatever the worker had.
  const allowLibrary = spec?.allow_library === true && kinds.includes("video");
  // Only a client who asked for squareness gets the sensor, the level, or the
  // warning. A number the console never sent means tilt is not part of this job.
  const maxTilt = typeof spec?.max_tilt_deg === "number" && spec.max_tilt_deg > 0 ? spec.max_tilt_deg : null;
  const wantOrientation =
    spec?.orientation === "landscape" || spec?.orientation === "portrait" ? spec.orientation : null;

  useEffect(() => {
    if (!camPerm?.granted) void requestCam();
    void ensureLocationPermission().then(setLocationOk);
  }, [camPerm?.granted, requestCam]);

  useEffect(() => {
    if (kindKey === "video") setMode("video");
  }, [kindKey]);

  // Declared above the permission gate below, like every other hook here, so
  // it must decide for itself whether to do anything — this effect still runs
  // while the camera-permission screen is showing.
  //
  // One sensor subscription serves both readers: the level, where the client
  // asked for squareness, and the orientation, where they asked for a way up.
  useEffect(() => {
    if (!camPerm?.granted || (maxTilt == null && wantOrientation == null)) return;
    let shown = -1;
    let shownHeld: Held | null = null;
    const stop = watchTilt((t) => {
      tilt.current = t;
      held.current = t.held;
      if (holdTally.current && t.held) holdTally.current[t.held]++;
      if (tiltSamples.current) tiltSamples.current.push(t.off);
      if (maxTilt != null) {
        const whole = Math.round(t.off);
        if (whole !== shown) {
          shown = whole;
          setLevel(t);
        }
      }
      if (wantOrientation != null && t.held !== shownHeld) {
        shownHeld = t.held;
        setHeldNow(t.held);
      }
    });
    return stop;
  }, [camPerm?.granted, maxTilt, wantOrientation]);

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
  // One message per line: two findings read as two things, not a paragraph.
  const warn = (warnings: { message: string }[]) =>
    setNotice(warnings.length > 0 ? { text: warnings.map((w) => w.message).join("\n"), tone: "warn" } : null);

  const kept = (warnings: { message: string }[], onSubject = false) => {
    setCount((n) => n + 1);
    if (warnings.length > 0 || !onSubject) warn(warnings);
    else setNotice({ text: `Looks like ${spec?.subject?.domain ?? "the subject"}.`, tone: "ok" });
  };

  // The subject check is the one verdict the worker answers themselves: the
  // file waits on disk until they do. Keep queues it, warning attached, for
  // the reviewer to see; Retake throws it away and counts the refusal.
  const settle = (o: CaptureOutcome) => {
    if (o.kept) {
      kept(o.findings, o.onSubject);
      return;
    }
    // Everything else the phone noticed goes on screen BEFORE the question, so
    // the worker answers it knowing the rest rather than reading it afterwards.
    const others = o.findings.filter((f) => f !== o.finding);
    warn(others.length > 0 ? others : [o.finding]);
    Alert.alert(`Doesn't look like ${spec?.subject?.domain ?? "the subject"}`, `${o.finding.message} Keep it anyway, or shoot it again?`, [
      { text: "Retake", style: "destructive", onPress: () => void o.retake().then(() => setNotice(null)) },
      { text: "Keep", onPress: () => void o.keep().then(kept) },
    ]);
  };

  // Every clip, recorded or picked, goes through the same save and the same
  // settle; only where the file and its facts come from differs.
  const saveClip = async (result: Parameters<typeof save>[0], attitude: Tilt | null, shotAs?: Held | null) => {
    setBusy(true);
    // Said before the first frame is pulled: checking a clip takes seconds, and
    // a screen that shows nothing looks like a phone that has hung.
    setChecking({ done: 0, total: 0 });
    setNotice(null);
    try {
      settle(
        await save(result, "video", attitude, (done, total) => setChecking({ done, total }), shotAs),
      );
    } finally {
      setChecking(null);
    }
  };

  const pick = async () => {
    if (busy || recording) return;
    setError(null);
    try {
      const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["videos"], videoMaxDuration: maxSeconds });
      const a = r.assets?.[0];
      if (r.canceled || !a) return;
      // The picker knows the file's length and frame size; the timer and the
      // first frame are for recordings, which arrive knowing neither.
      // A file from the gallery was shot who knows when: no attitude, no hold.
      // Its own frame is the only evidence of the way up, which is what
      // rules.ts falls back to.
      await saveClip({ uri: a.uri, width: a.width || undefined, height: a.height || undefined, duration: a.duration != null ? a.duration / 1000 : null }, null, null);
    } catch (e) {
      if (e instanceof CaptureRejected) setNotice(null);
      setError(e instanceof Error ? e.message : "Could not use that clip.");
    } finally {
      setBusy(false);
    }
  };

  // The phone is turned the wrong way for a task that asked for a way up.
  // Null while it sits on the 45 degree diagonal or lies flat, where gravity
  // cannot say — no accusation on a reading the phone does not have.
  const wrongHold =
    wantOrientation != null && mode === "video" && heldNow != null && heldNow !== wantOrientation && !checking;
  // Beyond the squareness the client asked for, while it is still costing
  // nothing to straighten up. The level bar guides the correction; this says
  // what ignoring it costs.
  const tooTilted = recording && maxTilt != null && level != null && level.off > maxTilt;

  const shoot = async () => {
    if (!cam.current || busy) return;
    setError(null);
    try {
      if (mode === "picture") {
        setBusy(true);
        const photo = await cam.current.takePictureAsync({ quality: 0.9, exif: true, skipProcessing: false });
        if (photo?.uri) {
          // The stored frame's dimensions plus the tag that says which way
          // up it is; rules.ts reads the two together.
          const exifOrientation = typeof photo.exif?.Orientation === "number" ? photo.exif.Orientation : null;
          settle(await save({ uri: photo.uri, width: photo.width, height: photo.height, exifOrientation }, "photo", tilt.current));
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
        // Nothing from the last capture competes with what this one says.
        setNotice(null);
        // recordAsync resolves when recording STOPS, so the attitude has to be
        // taken now — how the phone was held when the shot began, not where it
        // was put down afterwards. The clock too: a recording comes back as a
        // file with no length, and the timer is how long the worker filmed.
        const attitude = tilt.current;
        const began = Date.now();
        // The way the phone is held is sampled for the whole recording rather
        // than read at the end: the container's own rotation is not evidence
        // (the app is locked to portrait, so every clip is tagged portrait),
        // and the last instant is where the phone was put down.
        holdTally.current = { portrait: 0, landscape: 0 };
        if (held.current) holdTally.current[held.current]++;
        tiltSamples.current = tilt.current ? [tilt.current.off] : [];
        const video = await cam.current.recordAsync({ maxDuration: maxSeconds });
        const duration = (Date.now() - began) / 1000;
        const tally = holdTally.current;
        holdTally.current = null;
        const offs = tiltSamples.current ?? [];
        tiltSamples.current = null;
        setRecording(false);
        const shotAs: Held | null =
          tally.landscape === tally.portrait ? held.current : tally.landscape > tally.portrait ? "landscape" : "portrait";
        // How square the clip was held over its length, not at its first frame.
        const middle = medianOff(offs);
        const heldAs = middle != null ? { ...(tilt.current ?? attitude ?? { roll: 0, pitch: 0, held: null }), off: middle } : attitude;
        if (video?.uri) await saveClip({ uri: video.uri, duration }, heldAs, shotAs);
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
          {allowLibrary && mode === "video" && (
            <Pressable onPress={() => void pick()} disabled={busy || recording} accessibilityRole="button" accessibilityLabel="Choose a clip from the gallery" style={c.chip}>
              <Text style={c.chipText}>Gallery</Text>
            </Pressable>
          )}
        </View>
        {/* Said once, before the run rather than after it: a whole shelf run
            used to be capturable with no coordinates and nothing to show for it. */}
        {spec?.require_gps && !locationOk ? (
          <Text style={c.warn}>This task needs a location on every capture. Turn location on in settings.</Text>
        ) : null}
        {error ? <Text style={c.error}>{error}</Text> : null}
        {/* Said while the phone can still be turned, not after a minute of
            filming: the point is to prevent the refusal, as the level is.
            Louder once the recording is running, where it is costing the
            worker their time — and it stays up for as long as the hold is
            wrong, so it cannot be missed between glances at the subject. */}
        {wrongHold ? (
          <Text style={recording ? c.error : c.warn}>
            {recording
              ? `Still ${heldNow} — turn the phone ${wantOrientation} or this clip will be refused.`
              : `Turn the phone ${wantOrientation} to record.`}
          </Text>
        ) : null}
        {tooTilted && level ? (
          <Text style={c.error}>
            Hold the phone square — {Math.round(level.off)}° off; this clip will be refused.
          </Text>
        ) : null}
        {notice ? <Text style={notice.tone === "ok" ? c.ok : c.warn}>{notice.text}</Text> : null}
        {checking ? (
          <Text style={c.checking}>
            {checking.total > 0 ? `Checking clip… ${checking.done}/${checking.total}` : "Checking clip…"}
          </Text>
        ) : null}
        {maxTilt != null ? <Level tilt={level} tolerance={maxTilt} /> : null}
        <View style={c.bottom}>
          <Pressable
            onPress={() => void shoot()}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={mode === "picture" ? "Take photo" : recording ? "Stop recording" : "Start recording"}
            style={({ pressed }) => [c.shutter, mode === "video" && c.shutterVideo, recording && c.shutterRec, (pressed || busy) && { opacity: 0.7 }]}
          />
          <Text style={c.hint}>
            {recording
              ? `Recording… up to ${maxSeconds} s`
              : mode === "picture"
                ? "Tap to take a photo"
                : minSeconds != null
                  ? `Tap to start, tap again to stop · ${minSeconds}–${maxSeconds} s`
                  : "Tap to start, tap again to stop"}
          </Text>
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
  ok: { color: TONE_COLOR.success.fg, backgroundColor: TONE_COLOR.success.bg, padding: 8, marginHorizontal: 12, marginTop: 6, borderRadius: 8, textAlign: "center" },
  checking: { color: "#fff", backgroundColor: "rgba(0,0,0,0.55)", padding: 8, marginHorizontal: 12, marginTop: 6, borderRadius: 8, textAlign: "center" },
  level: { alignItems: "center", justifyContent: "center", flex: 1 },
  levelBar: { width: 120, height: 2, borderRadius: 1 },
  levelText: { color: "rgba(255,255,255,0.9)", marginTop: 10, fontSize: 13, fontWeight: "600", textShadowColor: "#000", textShadowRadius: 4 },
  bottom: { alignItems: "center", paddingBottom: 28 },
  shutter: { width: 76, height: 76, borderRadius: 38, backgroundColor: "#fff", borderWidth: 5, borderColor: "rgba(255,255,255,0.4)" },
  shutterVideo: { backgroundColor: "#E03B24" },
  shutterRec: { borderRadius: 14, width: 60, height: 60, marginVertical: 8 },
  hint: { color: "#fff", marginTop: 10, fontSize: 13, textShadowColor: "#000", textShadowRadius: 4 },
});
