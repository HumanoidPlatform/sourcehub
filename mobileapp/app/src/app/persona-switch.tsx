import { router, type Href } from 'expo-router';
import { ArrowRight, Check, LogOut } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { getLandingRouteForPersona, getLandingRouteForSession } from '@/auth/persona-routing';
import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Badge } from '@/components/common/badge';
import { Card } from '@/components/common/card';
import { Screen } from '@/components/common/screen';
import { getSafeFeedbackMessage } from '@/features/feedback/error-messages';
import { useFeedback } from '@/features/feedback/feedback-provider';
import { personaConfigs } from '@/features/personas/persona-config';
import { useAuthStore } from '@/store/auth-store';
import { colors, radii, spacing } from '@/theme/tokens';
import type { Persona } from '@/types/domain';

export default function PersonaSwitchScreen() {
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);
  const switchPersona = useAuthStore((state) => state.switchPersona);
  const feedback = useFeedback();
  const [switchingPersona, setSwitchingPersona] = useState<Persona | null>(null);
  const personas = session?.user.availablePersonas ?? [];

  useEffect(() => {
    if (!session) {
      router.replace('/login');
      return;
    }
    if (personas.length <= 1) {
      router.replace(getLandingRouteForSession(session) as Href);
    }
  }, [personas.length, session]);

  async function selectPersona(persona: Persona) {
    setSwitchingPersona(persona);
    try {
      await switchPersona(persona);
      feedback.showSuccess(`${personaConfigs[persona].label} selected`);
      router.replace(getLandingRouteForPersona(persona) as Href);
    } catch (error) {
      feedback.showError(getSafeFeedbackMessage(error, 'Unable to switch persona.'));
    } finally {
      setSwitchingPersona(null);
    }
  }

  async function signOut() {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      feedback.showError(getSafeFeedbackMessage(error, 'Unable to sign out.'));
    }
  }

  if (!session || personas.length <= 1) {
    return (
      <Screen showOffline={false}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen showOffline={false}>
      <View style={styles.header}>
        <View style={styles.mark}>
          <AppText color={colors.white} variant="subheading">
            C
          </AppText>
        </View>
        <View style={styles.headerText}>
          <AppText muted variant="small">
            Signed in as {session.user.email}
          </AppText>
          <AppText variant="title">Choose workspace</AppText>
          <AppText muted>{session.user.name}</AppText>
        </View>
      </View>

      <Card style={styles.sessionCard}>
        <View style={styles.sessionTop}>
          <View style={styles.sessionText}>
            <AppText variant="label">Assigned personas</AppText>
            <AppText muted variant="small">
              {personas.length} workspaces available
            </AppText>
          </View>
          <Badge label={session.authMode === 'real' ? 'Real session' : 'Demo session'} tone="success" />
        </View>
      </Card>

      <View style={styles.optionList}>
        {personas.map((persona) => {
          const config = personaConfigs[persona];
          const selected = persona === session.user.persona;
          const busy = switchingPersona === persona;
          return (
            <Pressable
              key={persona}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => selectPersona(persona)}
              style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}
              testID={`persona-switch-option-${persona}`}>
              <View style={styles.optionText}>
                <View style={styles.optionTitle}>
                  <AppText color={selected ? colors.white : colors.ink} variant="label">
                    {config.label}
                  </AppText>
                  {selected ? <Badge label="Current" tone="purple" /> : null}
                </View>
                <AppText color={selected ? colors.slate200 : colors.slate500} variant="small">
                  {config.subtitle}
                </AppText>
              </View>
              <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
                {busy ? (
                  <ActivityIndicator color={selected ? colors.white : colors.accent} size="small" />
                ) : selected ? (
                  <Check color={colors.white} size={18} />
                ) : (
                  <ArrowRight color={colors.ink} size={18} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      <AppButton icon={LogOut} onPress={signOut} testID="persona-switch-logout" variant="secondary">
        Sign out
      </AppButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  loading: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    width: 58,
    height: 58,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  option: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.lg,
    backgroundColor: colors.white,
  },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  optionIconSelected: {
    backgroundColor: colors.accent,
  },
  optionList: {
    gap: spacing.md,
  },
  optionSelected: {
    borderColor: colors.ink,
    backgroundColor: colors.ink,
  },
  optionText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  optionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.78,
  },
  sessionCard: {
    gap: spacing.md,
  },
  sessionText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  sessionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
});
