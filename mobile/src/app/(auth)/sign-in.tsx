import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { ApiError, getBaseUrl } from "@/api/client";
import type { OrgChoice } from "@/api/types";
import { useAuth } from "@/auth/AuthProvider";
import { ALLOW_SERVER_OVERRIDE } from "@/config";
import { Button, C, Callout, Field, Screen, inputStyle, s } from "@/ui";

export default function SignIn() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgs, setOrgs] = useState<OrgChoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [server, setServer] = useState("");

  // Re-read on focus, not just on mount: this screen stays mounted underneath
  // the server screen, so after saving a new address it kept displaying the old
  // one — which reads as "Save did nothing" when the save in fact worked.
  useFocusEffect(
    useCallback(() => {
      void getBaseUrl().then(setServer);
    }, []),
  );

  const submit = async (orgId?: string) => {
    setBusy(true);
    setError(null);
    try {
      const choice = await login(email, password, orgId);
      if (choice) setOrgs(choice);
      // a session change redirects through the (auth) layout
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Text style={[s.h1, { marginBottom: 4 }]}>Sign in</Text>
      <Text style={[s.muted, { marginBottom: 20 }]}>Use the email and password from your invitation.</Text>

      {orgs ? (
        <View>
          <Text style={[s.body, { marginBottom: 10 }]}>You belong to more than one organisation. Choose one:</Text>
          {orgs.map((o) => (
            <Button key={o.org_id} title={`${o.org_name} (${o.role_code})`} onPress={() => void submit(o.org_id)} style={{ marginBottom: 8 }} />
          ))}
          <Button title="Back" variant="quiet" onPress={() => setOrgs(null)} />
        </View>
      ) : (
        <View>
          <Field label="Email">
            <TextInput
              style={inputStyle}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="username"
              autoComplete="email"
            />
          </Field>
          <Field label="Password">
            <TextInput
              style={inputStyle}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              autoComplete="password"
              onSubmitEditing={() => void submit()}
            />
          </Field>
          {error && <Callout tone="critical" title={error} />}
          <Button title="Sign in" variant="primary" onPress={() => void submit()} disabled={!email.trim() || !password} loading={busy} />
        </View>
      )}

      {/* Development only. In a build a worker installs, a changeable server
          is how someone collects their password (config.ts). */}
      {ALLOW_SERVER_OVERRIDE && (
        <Pressable onPress={() => router.push("/server")} style={{ marginTop: 28 }} accessibilityRole="link">
          <Text style={[s.muted, { textAlign: "center" }]}>
            Server: <Text style={{ color: C.accentInk }}>{server || "…"}</Text> · change
          </Text>
        </Pressable>
      )}
    </Screen>
  );
}
