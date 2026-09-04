import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { getPostAuthRouteForSession } from '@/auth/post-auth-routing';
import { useAuthStore } from '@/store/auth-store';
import { colors, radii, spacing, typography } from '@/theme/tokens';

export default function HomeScreen() {
  const bootstrapped = useAuthStore((state) => state.bootstrapped);
  const session = useAuthStore((state) => state.session);

  useEffect(() => {
    if (!bootstrapped) {
      return;
    }
    let mounted = true;
    const timer = setTimeout(() => {
      getPostAuthRouteForSession(session).then((destination) => {
        if (mounted) {
          router.replace(destination);
        }
      });
    }, 550);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [bootstrapped, session]);

  return (
    <View style={styles.container}>
      <View style={styles.mark}>
        <Text style={styles.markText}>C</Text>
      </View>
      <Text style={styles.title}>Cosaarthi</Text>
      <Text style={styles.subtitle}>Preparing your Crowd workspace</Text>
      <ActivityIndicator color={colors.accent} size="small" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.ink,
  },
  mark: {
    width: 92,
    height: 92,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  markText: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
  },
  title: {
    color: colors.white,
    fontSize: typography.title,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.slate200,
    fontSize: typography.body,
  },
});
