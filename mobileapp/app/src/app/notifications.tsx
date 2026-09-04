import { router } from 'expo-router';
import { ArrowLeft, Bell, CheckCircle2 } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Badge } from '@/components/common/badge';
import { Card } from '@/components/common/card';
import { EmptyState } from '@/components/common/empty-state';
import { Screen } from '@/components/common/screen';
import { SkeletonList } from '@/components/common/skeleton';
import { useTranslation } from '@/features/localization/use-translation';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '@/hooks/use-odp-queries';
import { colors, spacing } from '@/theme/tokens';
import { formatShortDate } from '@/utils/format';

export default function NotificationsScreen() {
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const unreadCount = notifications.filter((item) => !item.read).length;
  const t = useTranslation();

  return (
    <Screen>
      <AppButton icon={ArrowLeft} onPress={() => router.back()} style={styles.backButton} variant="ghost">
        {t('common.back')}
      </AppButton>
      <View>
        <AppText muted variant="small">
          {t('notifications.notifications')}
        </AppText>
        <AppText variant="title">{t('notifications.workerAlerts')}</AppText>
      </View>

      {unreadCount ? (
        <AppButton icon={CheckCircle2} loading={markAllRead.isPending} onPress={() => markAllRead.mutate()} variant="secondary">
          {t('notifications.markAllRead')}
        </AppButton>
      ) : null}

      {isLoading ? (
        <SkeletonList rows={3} />
      ) : notifications.length ? (
        notifications.map((item) => (
          <Card key={item.id} style={styles.card}>
            <View style={styles.row}>
              {item.tone === 'success' ? (
                <CheckCircle2 color={colors.green} size={20} />
              ) : (
                <Bell color={item.tone === 'warning' ? colors.amber : colors.cobalt} size={20} />
              )}
              <View style={styles.text}>
                <AppText variant="subheading">{item.title}</AppText>
                <AppText muted>{item.body}</AppText>
                <AppText muted variant="small">
                  {formatShortDate(item.createdAt)}
                </AppText>
              </View>
              {!item.read ? <Badge label={t('common.new')} tone="info" /> : null}
            </View>
            {!item.read ? (
              <AppButton loading={markRead.isPending} onPress={() => markRead.mutate(item.id)} variant="ghost">
                {t('notifications.markRead')}
              </AppButton>
            ) : null}
          </Card>
        ))
      ) : (
        <EmptyState body={t('notifications.noAlerts')} icon={Bell} title={t('notifications.allClear')} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 0,
  },
  card: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
});
