import { WifiOff } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useNetworkStatus } from '@/hooks/use-network-status';
import { colors, spacing } from '@/theme/tokens';

import { AppText } from './app-text';

export function OfflineBanner() {
  const { isOffline } = useNetworkStatus();

  if (!isOffline) {
    return null;
  }

  return (
    <View accessibilityRole="alert" style={styles.banner}>
      <WifiOff color={colors.ink} size={16} />
      <AppText variant="small" weight="700">
        Offline. Captures will stay in your upload queue.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.amberSoft,
    borderBottomColor: '#F4D18C',
    borderBottomWidth: 1,
  },
});
