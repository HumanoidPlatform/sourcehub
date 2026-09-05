import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import { getBaseUrl, setBaseUrl } from "@/api/client";
import { useAuth, useSession } from "@/auth/AuthProvider";
import { deleteLocal } from "@/capture/files";
import { discardFailed, onOutboxChange, retryFailed, summary, type OutboxSummary } from "@/db/outbox";
import { Button, Callout, Field, Screen, inputStyle, s } from "@/ui";
import { useUploadLog } from "@/upload/log";
import { uploader } from "@/upload/uploader";

export default function Settings() {
  const session = useSession();
  const { logout } = useAuth();
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [box, setBox] = useState<OutboxSummary>({ queued: 0, failed: 0, confirmed: 0 });
  const log = useUploadLog();

  useEffect(() => {
    void getBaseUrl().then(setUrl);
    const load = () => void summary().then(setBox);
    load();
    return onOutboxChange(load);
  }, []);

  const signOut = () => {
    const warn = box.queued + box.failed;
    Alert.alert(
      "Sign out?",
      warn ? `${warn} capture${warn === 1 ? "" : "s"} on this phone ${warn === 1 ? "has" : "have"} not been uploaded yet. They stay here until you sign back in.` : "You can sign back in any time.",
      [
        { text: "Stay", style: "cancel" },
        { text: "Sign out", style: "destructive", onPress: () => void logout().then(() => router.replace("/sign-in")) },
      ],
    );
  };

  return (
    <Screen>
      <View style={s.card}>
        <Text style={[s.label, { marginBottom: 4 }]}>Signed in as</Text>
        <Text style={s.body}>{session.full_name}</Text>
        <Text style={s.muted}>{session.email} · {session.org_name}</Text>
      </View>

      <View style={s.card}>
        <Text style={[s.label, { marginBottom: 4 }]}>Uploads on this phone</Text>
        <Text style={s.body}>{box.queued} waiting · {box.failed} failed · {box.confirmed} done</Text>
        <Text style={[s.muted, { marginTop: 4 }]}>Uploads run while the app is open and connected. Uninstalling deletes captures that have not been uploaded.</Text>
        <View style={[s.row, { marginTop: 10 }]}>
          <Button title="Upload now" onPress={() => uploader.kick()} style={{ flex: 1 }} />
          <Button title="Retry failed" onPress={() => void retryFailed().then(() => uploader.kick())} disabled={!box.failed} style={{ flex: 1 }} />
        </View>
        {box.failed > 0 && (
          <Button
            title="Discard failed"
            variant="danger"
            style={{ marginTop: 8 }}
            onPress={() =>
              Alert.alert("Discard all failed captures?", "The files are deleted from this phone.", [
                { text: "Keep", style: "cancel" },
                { text: "Discard", style: "destructive", onPress: () => void discardFailed().then((rows) => Promise.all(rows.map((r) => deleteLocal(r.local_uri)))) },
              ])
            }
          />
        )}
      </View>

      <View style={s.card}>
        <Text style={[s.label, { marginBottom: 6 }]}>Upload log</Text>
        {log.length === 0 ? (
          <Text style={s.muted}>Nothing yet. Each step the uploader takes is listed here, newest first.</Text>
        ) : (
          log.slice(0, 30).map((e, i) => (
            <Text key={i} style={[s.mono, { marginBottom: 3 }]} selectable>
              {new Date(e.at).toLocaleTimeString()} {e.capture.slice(0, 8)} {e.step} {"→"} {e.outcome}
              {e.detail ? `: ${e.detail}` : ""}
            </Text>
          ))
        )}
      </View>

      <View style={s.card}>
        <Field label="API address" hint="Change only if the pilot lead tells you to.">
          <TextInput style={inputStyle} value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" />
        </Field>
        <Button title="Save address" onPress={() => void setBaseUrl(url)} disabled={!/^https?:\/\/.+/.test(url.trim())} />
      </View>

      <Callout title={`Cosarathi Capture ${Constants.expoConfig?.version ?? ""}`}>Role: {session.role}</Callout>
      <Button title="Sign out" variant="danger" onPress={signOut} />
    </Screen>
  );
}
