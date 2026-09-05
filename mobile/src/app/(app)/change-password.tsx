import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TextInput } from "react-native";
import { ApiError, loadSession, post, saveSession } from "@/api/client";
import { Button, Callout, Field, Screen, inputStyle, s } from "@/ui";

export default function ChangePassword() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await post("/auth/change-password", { current_password: current, new_password: next });
      const sess = await loadSession();
      if (sess) await saveSession({ ...sess, must_change_password: false });
      router.replace("/assignments");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not change the password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Text style={[s.body, { marginBottom: 14 }]}>Your password was set for you. Choose your own before continuing.</Text>
      <Field label="Current password">
        <TextInput style={inputStyle} value={current} onChangeText={setCurrent} secureTextEntry />
      </Field>
      <Field label="New password" hint="At least 10 characters.">
        <TextInput style={inputStyle} value={next} onChangeText={setNext} secureTextEntry />
      </Field>
      {error && <Callout tone="critical" title={error} />}
      <Button title="Save" variant="primary" onPress={() => void submit()} disabled={!current || next.length < 10} loading={busy} />
    </Screen>
  );
}
