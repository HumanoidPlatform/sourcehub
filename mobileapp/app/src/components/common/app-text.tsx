import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

import { isRtlLanguage } from '@/features/localization/locales';
import { useLocalizationStore } from '@/store/localization-store';
import { colors, typography } from '@/theme/tokens';

type AppTextVariant = 'title' | 'heading' | 'subheading' | 'body' | 'small' | 'caption' | 'label';

type AppTextProps = PropsWithChildren<
  TextProps & {
    color?: string;
    muted?: boolean;
    variant?: AppTextVariant;
    weight?: '400' | '500' | '600' | '700' | '800';
  }
>;

export function AppText({
  children,
  color,
  muted,
  style,
  variant = 'body',
  weight,
  ...props
}: AppTextProps) {
  const languageCode = useLocalizationStore((state) => state.preference?.languageCode);
  const isRtl = isRtlLanguage(languageCode);
  return (
    <Text
      {...props}
      style={[
        styles.base,
        styles[variant],
        muted && styles.muted,
        weight ? { fontWeight: weight } : null,
        isRtl ? styles.rtl : null,
        color ? { color } : null,
        style,
      ]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.ink,
    flexShrink: 1,
    letterSpacing: 0,
  },
  title: {
    fontSize: typography.title,
    lineHeight: 34,
    fontWeight: '800',
  },
  heading: {
    fontSize: typography.heading,
    lineHeight: 28,
    fontWeight: '800',
  },
  subheading: {
    fontSize: typography.subheading,
    lineHeight: 24,
    fontWeight: '700',
  },
  body: {
    fontSize: typography.body,
    lineHeight: 21,
    fontWeight: '400',
  },
  small: {
    fontSize: typography.small,
    lineHeight: 18,
    fontWeight: '400',
  },
  caption: {
    fontSize: typography.caption,
    lineHeight: 16,
    fontWeight: '600',
  },
  label: {
    fontSize: typography.small,
    lineHeight: 18,
    fontWeight: '700',
  },
  muted: {
    color: colors.slate500,
  },
  rtl: {
    writingDirection: 'rtl',
    textAlign: 'right',
  },
});
