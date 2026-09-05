import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, TextInput } from "react-native";
import { getBaseUrl, pingServer, setBaseUrl } from "@/api/client";
import { Button, Callout, Field, Screen, inputStyle, s } from "@/ui";

export default function Server() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [state, setState] = useState<"idle" | "testing" | "ok" | "bad">("idle");

  useEffect(() => {
    void getBaseUrl().then(setUrl);
  }, []);

  const test = async () => {
    setState("testing");
    setState((await pingServer(url)) ? "ok" : "bad");
  };

  const save = async () => {
    await setBaseUrl(url);
    router.back();
  };

  return (
    <Screen>
      <Text style={[s.body, { marginBottom: 14 }]}>
        The address of the Cosarathi API as this phone can reach it. On the pilot Wi-Fi that is the
        dev machine's address, never localhost.
      </Text>
      <Field label="API address" hint="e.g. http://192.168.1.20:8000">
        <TextInput style={inputStyle} value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" />
      </Field>
      {state === "ok" && <Callout tone="success" title="The server answered." />}
      {state === "bad" && <Callout tone="critical" title="No answer from that address.">Check the Wi-Fi, the address, and that the API is running with --host 0.0.0.0.</Callout>}
      <Button title="Test" onPress={() => void test()} loading={state === "testing"} style={{ marginBottom: 10 }} />
      <Button title="Save" variant="primary" onPress={() => void save()} disabled={!/^https?:\/\/.+/.test(url.trim())} />
    </Screen>
  );
}
