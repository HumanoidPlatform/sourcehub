import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme/tokens';

import { AppText } from './app-text';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

const toneMap: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: colors.surfaceMuted, fg: colors.inkSoft },
  success: { bg: colors.greenSoft, fg: colors.green },
  warning: { bg: colors.amberSoft, fg: '#9A5A00' },
  danger: { bg: colors.redSoft, fg: colors.red },
  info: { bg: colors.cyanSoft, fg: colors.cobalt },
  purple: { bg: colors.lavenderSoft, fg: colors.lavender },
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  const selected = toneMap[tone];
  return (
    <View style={[styles.badge, { backgroundColor: selected.bg }]}>
      <AppText color={selected.fg} variant="caption">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radii.sm,
    flexShrink: 1,
    maxWidth: '100%',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
