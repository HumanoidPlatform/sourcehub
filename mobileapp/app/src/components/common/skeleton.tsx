import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme/tokens';

export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <View style={styles.wrap}>
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} style={styles.card}>
          <View style={styles.lineWide} />
          <View style={styles.line} />
          <View style={styles.lineShort} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  lineWide: {
    width: '70%',
    height: 16,
    borderRadius: radii.xs,
    backgroundColor: colors.surfaceMuted,
  },
  line: {
    width: '92%',
    height: 12,
    borderRadius: radii.xs,
    backgroundColor: colors.surfaceMuted,
  },
  lineShort: {
    width: '42%',
    height: 12,
    borderRadius: radii.xs,
    backgroundColor: colors.surfaceMuted,
  },
});
