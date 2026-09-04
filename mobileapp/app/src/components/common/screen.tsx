import { useContext, type PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaInsetsContext, SafeAreaView } from 'react-native-safe-area-context';

import { OfflineBanner } from '@/components/common/offline-banner';
import { TabBarHeightContext } from '@/components/common/tab-bar-metrics';
import { colors, spacing } from '@/theme/tokens';

type ScreenProps = PropsWithChildren<{
  bottomPadding?: number;
  contentMaxWidth?: number;
  keyboardAvoiding?: boolean;
  keyboardVerticalOffset?: number;
  padded?: boolean;
  scroll?: boolean;
  showOffline?: boolean;
  style?: StyleProp<ViewStyle>;
}>;

export function Screen({
  bottomPadding,
  children,
  contentMaxWidth = 640,
  keyboardAvoiding = true,
  keyboardVerticalOffset,
  padded = true,
  scroll = true,
  showOffline = true,
  style,
}: ScreenProps) {
  const insets = useContext(SafeAreaInsetsContext) ?? { bottom: 0, left: 0, right: 0, top: 0 };
  const tabBarHeight = useContext(TabBarHeightContext);
  const bottomReserve = Math.max(insets.bottom, tabBarHeight);
  const resolvedBottomPadding = (bottomPadding ?? (scroll ? spacing.xxxl : spacing.lg)) + bottomReserve;
  const contentStyle = [
    styles.content,
    padded && styles.padded,
    contentMaxWidth ? { maxWidth: contentMaxWidth } : null,
    style,
    { paddingBottom: resolvedBottomPadding },
  ];
  const keyboardOffset = keyboardVerticalOffset ?? (Platform.OS === 'ios' ? insets.top : 0);
  const body = scroll ? (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={contentStyle}>
      {children}
    </ScrollView>
  ) : (
    <View style={[contentStyle, styles.nonScrollContent]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      {showOffline ? <OfflineBanner /> : null}
      {keyboardAvoiding ? (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={keyboardOffset} style={styles.keyboardAvoider}>
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  keyboardAvoider: {
    flex: 1,
  },
  content: {
    alignSelf: 'center',
    flexGrow: 1,
    gap: spacing.lg,
    width: '100%',
  },
  padded: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  nonScrollContent: {
    flex: 1,
  },
});
