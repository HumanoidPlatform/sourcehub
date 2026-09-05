// The handful of primitives every screen is built from. Deliberately plain:
// the app is used one-handed in a shop aisle, so big targets, high contrast,
// and one accent colour.

import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState, type ReactNode } from "react";
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TONE_COLOR, type Tone } from "@/status";

export const C = {
  bg: "#F3F5F7",
  surface: "#FFFFFF",
  ink: "#16202B",
  muted: "#5B6873",
  line: "#D5DCE3",
  accent: "#0E7C86",
  accentInk: "#0B5F67",
  danger: "#C2410C",
};

export function Screen({ children, scroll = true, padded = true, style }: { children: ReactNode; scroll?: boolean; padded?: boolean; style?: StyleProp<ViewStyle> }) {
  const inner = <View style={[padded && s.pad, style]}>{children}</View>;
  return (
    <SafeAreaView style={s.safe} edges={["bottom", "left", "right"]}>
      {scroll ? <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">{inner}</ScrollView> : inner}
    </SafeAreaView>
  );
}

export function Button({
  title, onPress, variant = "default", disabled, loading, style,
}: {
  title: string; onPress: () => void; variant?: "default" | "primary" | "danger" | "quiet";
  disabled?: boolean; loading?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: off }}
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        s.btn,
        variant === "primary" && s.btnPrimary,
        variant === "danger" && s.btnDanger,
        variant === "quiet" && s.btnQuiet,
        off && s.btnOff,
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" || variant === "danger" ? "#fff" : C.ink} />
      ) : (
        <Text style={[s.btnText, (variant === "primary" || variant === "danger") && { color: "#fff" }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  const c = TONE_COLOR[tone];
  return (
    <View style={[s.pill, { backgroundColor: c.bg }]}>
      <Text style={[s.pillText, { color: c.fg }]}>{children}</Text>
    </View>
  );
}

export function Meter({ value, max, tone = "active" }: { value: number; max: number; tone?: Tone }) {
  const pct = max > 0 ? Math.min(100, Math.round((100 * value) / max)) : 0;
  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: pct }} style={s.meter}>
      <View style={[s.meterFill, { width: `${pct}%`, backgroundColor: TONE_COLOR[pct >= 100 ? "success" : tone].fg }]} />
    </View>
  );
}

export function Callout({ tone = "neutral", title, children }: { tone?: Tone; title: string; children?: ReactNode }) {
  const c = TONE_COLOR[tone];
  return (
    <View style={[s.callout, { borderLeftColor: c.fg, backgroundColor: c.bg }]}>
      <Text style={[s.calloutTitle, { color: c.fg }]}>{title}</Text>
      {children ? <Text style={s.calloutBody}>{children}</Text> : null}
    </View>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={s.empty}>
      <Text style={s.emptyTitle}>{title}</Text>
      {hint ? <Text style={s.emptyHint}>{hint}</Text> : null}
    </View>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      {children}
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => NetInfo.addEventListener((st) => setOnline(!!st.isConnected)), []);
  return online;
}

export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <View style={s.offline}>
      <Text style={s.offlineText}>Offline — captures are saved and will upload when you reconnect.</Text>
    </View>
  );
}

export const inputStyle = {
  borderWidth: 1, borderColor: C.line, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12,
  fontSize: 16, backgroundColor: C.surface, color: C.ink,
} as const;

export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1 },
  pad: { padding: 16 },
  btn: { minHeight: 48, paddingHorizontal: 16, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  btnPrimary: { backgroundColor: C.accent, borderColor: C.accent },
  btnDanger: { backgroundColor: C.danger, borderColor: C.danger },
  btnQuiet: { backgroundColor: "transparent", borderColor: "transparent" },
  btnOff: { opacity: 0.45 },
  btnText: { fontSize: 16, fontWeight: "600", color: C.ink },
  pill: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pillText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.3, textTransform: "uppercase" },
  meter: { height: 8, backgroundColor: "#E7ECF0", borderRadius: 4, overflow: "hidden" },
  meterFill: { height: "100%", borderRadius: 4 },
  callout: { borderLeftWidth: 3, borderRadius: 8, padding: 12, marginBottom: 12 },
  calloutTitle: { fontWeight: "700", fontSize: 14, marginBottom: 2 },
  calloutBody: { color: C.ink, fontSize: 14, lineHeight: 20 },
  empty: { padding: 28, alignItems: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: C.ink },
  emptyHint: { fontSize: 14, color: C.muted, marginTop: 6, textAlign: "center" },
  label: { fontSize: 12, fontWeight: "600", color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  hint: { fontSize: 12, color: C.muted, marginTop: 4 },
  offline: { backgroundColor: "#FBF0DA", paddingVertical: 8, paddingHorizontal: 16 },
  offlineText: { color: "#9A6210", fontSize: 13, fontWeight: "600" },
  card: { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.line, padding: 14, marginBottom: 12 },
  h1: { fontSize: 22, fontWeight: "700", color: C.ink },
  h2: { fontSize: 17, fontWeight: "700", color: C.ink },
  body: { fontSize: 15, color: C.ink, lineHeight: 21 },
  muted: { fontSize: 13, color: C.muted },
  mono: { fontFamily: "monospace", fontSize: 12, color: C.muted },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
});
