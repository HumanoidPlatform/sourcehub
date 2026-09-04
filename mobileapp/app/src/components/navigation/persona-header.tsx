import { router } from 'expo-router';
import { Bell, UserRound, type LucideProps } from 'lucide-react-native';
import type { ComponentType, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { useAuthStore } from '@/store/auth-store';
import { colors, radii, spacing } from '@/theme/tokens';

type HeaderAction = {
  accessibilityLabel: string;
  icon: ComponentType<LucideProps>;
  onPress: () => void;
  testID?: string;
};

type PersonaHeaderProps = {
  actions?: HeaderAction[];
  eyebrow: string;
  meta?: ReactNode;
  onNotificationsPress?: () => void;
  showNotifications?: boolean;
  subtitle?: string;
  title: string;
};

export function PersonaHeader({
  actions = [],
  eyebrow,
  meta,
  onNotificationsPress,
  showNotifications,
  subtitle,
  title,
}: PersonaHeaderProps) {
  const user = useAuthStore((state) => state.session?.user);
  const initials = getInitials(user?.name ?? user?.email);

  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <AppText muted variant="small">
          {eyebrow}
        </AppText>
        <AppText variant="title">{title}</AppText>
        {subtitle ? (
          <AppText muted>{subtitle}</AppText>
        ) : null}
      </View>
      <View style={styles.actions}>
        {meta}
        {showNotifications ? (
          <IconButton
            accessibilityLabel="Notifications"
            icon={Bell}
            onPress={onNotificationsPress ?? (() => router.push('/notifications'))}
            testID="persona-header-notifications"
          />
        ) : null}
        {actions.map((action) => (
          <IconButton key={action.accessibilityLabel} {...action} />
        ))}
        <Pressable
          accessibilityLabel="Profile"
          accessibilityRole="button"
          onPress={() => router.push('/account-profile')}
          style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]}
          testID="persona-header-profile">
          {initials ? (
            <AppText color={colors.white} variant="caption">
              {initials}
            </AppText>
          ) : (
            <UserRound color={colors.white} size={18} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

function IconButton({ accessibilityLabel, icon: Icon, onPress, testID }: HeaderAction) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
      testID={testID}>
      <Icon color={colors.ink} size={20} />
    </Pressable>
  );
}

function getInitials(value?: string) {
  if (!value) {
    return '';
  }
  const parts = value
    .replace(/@.*/, '')
    .split(/[\s._-]+/)
    .filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  pressed: {
    opacity: 0.78,
  },
});
