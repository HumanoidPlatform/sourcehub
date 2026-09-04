import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme/tokens';

import { AppText } from './app-text';

export function SectionHeader({ title, detail }: { detail?: string; title: string }) {
  return (
    <View style={styles.row}>
      <AppText variant="subheading">{title}</AppText>
      {detail ? (
        <AppText muted variant="small">
          {detail}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.xs,
  },
});
