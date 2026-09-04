import type { ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import type { LucideProps } from 'lucide-react-native';

import { colors, spacing } from '@/theme/tokens';

import { AppText } from './app-text';

export function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  body: string;
  icon: ComponentType<LucideProps>;
  title: string;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.iconWrap}>
        <Icon color={colors.accent} size={22} />
      </View>
      <AppText variant="subheading">{title}</AppText>
      <AppText muted style={styles.center}>
        {body}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xxl,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cyanSoft,
  },
  center: {
    textAlign: 'center',
  },
});
