import type { ComponentType, PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import type { LucideProps } from 'lucide-react-native';

import { colors, radii, spacing } from '@/theme/tokens';

import { AppText } from './app-text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type AppButtonProps = PropsWithChildren<{
  accessibilityLabel?: string;
  disabled?: boolean;
  icon?: ComponentType<LucideProps>;
  loading?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
  variant?: ButtonVariant;
}>;

export function AppButton({
  accessibilityLabel,
  children,
  disabled,
  icon: Icon,
  loading,
  onPress,
  style,
  testID,
  variant = 'primary',
}: AppButtonProps) {
  const foreground = variant === 'primary' || variant === 'danger' ? colors.white : colors.ink;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        (disabled || loading) && styles.disabled,
        pressed && !disabled ? styles.pressed : null,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={foreground} size="small" />
      ) : (
        <View style={styles.content}>
          {Icon ? <Icon color={foreground} size={18} strokeWidth={2.4} /> : null}
          <AppText color={foreground} style={styles.label} variant="label">
            {children}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    maxWidth: '100%',
    flexShrink: 1,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
    flexShrink: 1,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  label: {
    textAlign: 'center',
  },
  primary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.78,
  },
});
