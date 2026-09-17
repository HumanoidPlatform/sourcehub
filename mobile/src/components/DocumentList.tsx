// The files behind an assignment's instructions: the coordinator's own, and the
// client's guidelines, examples and acceptance criteria. What gets a capture
// rejected is written in these, and the phone never showed them.
//
// A tap asks the server for a short-lived link and opens it in the system's
// in-app browser — no download manager, no new dependency, works in Expo Go.
// The link is fetched at tap time, not with the list, because it expires in
// minutes and an assignment stays open for days.

import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ApiError, get } from "@/api/client";
import type { Attachment } from "@/api/types";
import { describeFile, type DocumentSection } from "@/documents";
import { C, s, useOnline } from "@/ui";

export function DocumentList({ sections }: { sections: DocumentSection[] }) {
  const online = useOnline();
  const [opening, setOpening] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (sections.length === 0) return null;

  const open = async (a: Attachment) => {
    setError(null);
    setOpening(a.id);
    try {
      const { url } = await get<{ url: string }>(`/attachments/${a.id}/url`);
      await WebBrowser.openBrowserAsync(url);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : `Could not open ${a.filename}.`);
    } finally {
      setOpening(null);
    }
  };

  return (
    <View style={s.card}>
      <Text style={[s.label, { marginBottom: 2 }]}>Reference documents</Text>
      {!online && <Text style={[s.muted, { marginBottom: 4 }]}>Connect to open these. Capturing still works offline.</Text>}
      {sections.map((sec) => (
        <View key={sec.title} style={{ marginTop: 10 }}>
          <Text style={[s.muted, { marginBottom: 4 }]}>{sec.title}</Text>
          {sec.items.map((a) => (
            <Pressable
              key={a.id}
              accessibilityRole="button"
              accessibilityLabel={`Open ${a.filename}`}
              disabled={!online || opening !== null}
              onPress={() => void open(a)}
              style={({ pressed }) => [
                {
                  minHeight: 48, flexDirection: "row", alignItems: "center", gap: 10,
                  paddingVertical: 8, paddingHorizontal: 10, marginBottom: 6,
                  borderWidth: 1, borderColor: C.line, borderRadius: 8, backgroundColor: C.bg,
                },
                (!online || (opening !== null && opening !== a.id)) && { opacity: 0.5 },
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.body} numberOfLines={2}>{a.filename}</Text>
                <Text style={s.muted}>{describeFile(a)}</Text>
              </View>
              <Text style={{ color: C.accentInk, fontWeight: "600" }}>{opening === a.id ? "Opening…" : "Open"}</Text>
            </Pressable>
          ))}
        </View>
      ))}
      {error && <Text style={[s.muted, { color: C.danger, marginTop: 4 }]} selectable>{error}</Text>}
    </View>
  );
}
