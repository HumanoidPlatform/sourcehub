import { StyleSheet, View, type DimensionValue } from 'react-native';

import { colors, radii } from '@/theme/tokens';

type ProgressBarProps = {
  progress: number;
  tone?: 'accent' | 'warning' | 'danger';
};

export function ProgressBar({ progress, tone = 'accent' }: ProgressBarProps) {
  const width = `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%` as DimensionValue;
  const fillColor = tone === 'danger' ? colors.red : tone === 'warning' ? colors.amber : colors.accent;

  return (
    <View accessibilityRole="progressbar" style={styles.track}>
      <View style={[styles.fill, { width, backgroundColor: fillColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    overflow: 'hidden',
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
  },
  fill: {
    height: '100%',
    borderRadius: radii.sm,
  },
});
