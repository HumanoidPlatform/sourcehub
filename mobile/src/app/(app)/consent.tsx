// The privacy notice, shown once per user and notice version before anything
// else in the app (the redirect is in _layout.tsx). Two ways out: agree, or
// sign out. There is deliberately no third.

import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { useAuth, useSession } from "@/auth/AuthProvider";
import { NOTICE, POLICY_URL, hasPlaceholders } from "@/consent";
import { acceptConsent } from "@/consentStore";
import { Button, C, Callout, Screen, s } from "@/ui";

export default function Consent() {
  const session = useSession();
  const { logout } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const agree = async () => {
    setBusy(true);
    setError(null);
    try {
      // No navigation here: _layout.tsx sends an accepted user on to their
      // assignments, from the same state this call has just updated.
      await acceptConsent(session.user_id);
    } catch {
      // the local store failed — rare, and worth saying rather than looping
      setError("Could not save your answer on this phone. Try again.");
      setBusy(false);
    }
  };

  return (
    <Screen>
      {hasPlaceholders() && (
        <Callout tone="critical" title="DRAFT — wording not yet approved">
          The operator name, contact address or retention period has not been filled in. This build must not be given to crowd resources.
        </Callout>
      )}

      <Text style={[s.h1, { marginBottom: 6 }]}>{NOTICE.title}</Text>
      <Text style={[s.body, { marginBottom: 14 }]}>{NOTICE.intro}</Text>

      {NOTICE.sections.map((sec) => (
        <View key={sec.heading} style={s.card}>
          <Text style={[s.body, { fontWeight: "700", marginBottom: 4 }]}>{sec.heading}</Text>
          <Text style={s.body}>{sec.body}</Text>
        </View>
      ))}

      <Button title="Read the full policy" variant="quiet" onPress={() => void WebBrowser.openBrowserAsync(POLICY_URL)} style={{ marginBottom: 6 }} />

      {error && <Callout tone="critical" title={error} />}

      <Button title="I agree" variant="primary" onPress={() => void agree()} loading={busy} style={{ marginBottom: 10 }} />
      <Button
        title="Not now — sign me out"
        onPress={() => void logout().then(() => router.replace("/sign-in"))}
        disabled={busy}
      />
      <Text style={[s.muted, { textAlign: "center", marginTop: 12, color: C.muted }]}>
        You can read this again any time in Settings.
      </Text>
    </Screen>
  );
}
