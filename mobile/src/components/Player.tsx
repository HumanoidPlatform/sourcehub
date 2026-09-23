// Watching back a clip, without leaving the app.
//
// A worker who has just filmed something should be able to look at it while
// they are still standing where they filmed it — a clip the phone kept with a
// warning ("dark in 4 of 9 frames") is exactly the one worth a second look,
// and a re-shoot costs nothing on site and a rejected batch afterwards.
//
// The player is the platform's: expo-video's VideoView with its own controls.
// The source is the local file while the outbox still has one, and the signed
// URL once the uploader has deleted it.

import { useVideoPlayer, VideoView } from "expo-video";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function Player({ uri, title, onClose }: { uri: string; title?: string | null; onClose: () => void }) {
  // Plays as soon as it is on screen: the worker tapped the clip to watch it.
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.play();
  });

  return (
    <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={p.root}>
        <VideoView style={p.video} player={player} nativeControls contentFit="contain" />
        <SafeAreaView style={p.bar} pointerEvents="box-none">
          <Pressable onPress={onClose} accessibilityRole="button" style={p.close} hitSlop={8}>
            <Text style={p.closeText}>Close</Text>
          </Pressable>
          {title ? (
            <Text numberOfLines={1} style={p.title}>
              {title}
            </Text>
          ) : null}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const p = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  video: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  bar: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  close: { backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  closeText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  title: { color: "rgba(255,255,255,0.85)", flexShrink: 1, fontSize: 13 },
});
