import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { useAuthStore } from '@/store/auth-store';
import { colors, spacing } from '@/theme/tokens';

export default function ResetSessionScreen() {
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    let mounted = true;

    async function reset() {
      await logout();
      if (mounted) {
        router.replace('/login');
      }
    }

    reset();
    return () => {
      mounted = false;
    };
  }, [logout]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.accent} />
      <AppText color={colors.white} variant="subheading">
        Clearing saved demo session
      </AppText>
      <AppText color={colors.slate200} variant="small">
        You will return to the persona selector.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.ink,
  },
});
