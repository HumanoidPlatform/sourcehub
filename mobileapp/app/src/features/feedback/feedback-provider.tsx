import { X } from 'lucide-react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { AppText } from '@/components/common/app-text';
import { colors, radii, shadows, spacing } from '@/theme/tokens';

export type FeedbackType = 'success' | 'error' | 'warning' | 'info';

type FeedbackMessage = {
  durationMs: number;
  id: string;
  message: string;
  type: FeedbackType;
};

type FeedbackInput = {
  durationMs?: number;
  message: string;
  type: FeedbackType;
};

type FeedbackContextValue = {
  dismiss: (id: string) => void;
  show: (input: FeedbackInput) => string;
  showError: (message: string, durationMs?: number) => string;
  showInfo: (message: string, durationMs?: number) => string;
  showSuccess: (message: string, durationMs?: number) => string;
  showWarning: (message: string, durationMs?: number) => string;
};

const noopFeedback: FeedbackContextValue = {
  dismiss: () => undefined,
  show: () => '',
  showError: () => '',
  showInfo: () => '',
  showSuccess: () => '',
  showWarning: () => '',
};

const FeedbackContext = createContext<FeedbackContextValue>(noopFeedback);

const toneMap = {
  error: {
    backgroundColor: colors.redSoft,
    borderColor: colors.red,
    foreground: colors.red,
  },
  info: {
    backgroundColor: colors.cyanSoft,
    borderColor: colors.cobalt,
    foreground: colors.cobalt,
  },
  success: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
    foreground: colors.green,
  },
  warning: {
    backgroundColor: colors.amberSoft,
    borderColor: colors.amber,
    foreground: '#9A5A00',
  },
} satisfies Record<FeedbackType, { backgroundColor: string; borderColor: string; foreground: string }>;

function durationForType(type: FeedbackType) {
  return type === 'error' || type === 'warning' ? 5200 : 3600;
}

function nextMessageId() {
  return `feedback-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function FeedbackProvider({ children }: PropsWithChildren) {
  const insets = useContext(SafeAreaInsetsContext) ?? { bottom: 0, left: 0, right: 0, top: 0 };
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setMessages((current) => current.filter((message) => message.id !== id));
  }, []);

  const show = useCallback(
    ({ durationMs, message, type }: FeedbackInput) => {
      const id = nextMessageId();
      const resolvedDuration = durationMs ?? durationForType(type);
      setMessages((current) => [...current.filter((item) => item.message !== message), { durationMs: resolvedDuration, id, message, type }].slice(-3));
      const timer = setTimeout(() => dismiss(id), resolvedDuration);
      timers.current.set(id, timer);
      return id;
    },
    [dismiss],
  );

  const value = useMemo<FeedbackContextValue>(
    () => ({
      dismiss,
      show,
      showError: (message, durationMs) => show({ durationMs, message, type: 'error' }),
      showInfo: (message, durationMs) => show({ durationMs, message, type: 'info' }),
      showSuccess: (message, durationMs) => show({ durationMs, message, type: 'success' }),
      showWarning: (message, durationMs) => show({ durationMs, message, type: 'warning' }),
    }),
    [dismiss, show],
  );

  useEffect(
    () => () => {
      timers.current.forEach((timer) => clearTimeout(timer));
      timers.current.clear();
    },
    [],
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <View style={[styles.host, { paddingTop: insets.top + spacing.sm, pointerEvents: 'box-none' }]}>
        {messages.map((item) => (
          <FeedbackToast key={item.id} message={item} onDismiss={() => dismiss(item.id)} />
        ))}
      </View>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  return useContext(FeedbackContext);
}

function FeedbackToast({ message, onDismiss }: { message: FeedbackMessage; onDismiss: () => void }) {
  const tone = toneMap[message.type];
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[styles.toast, { backgroundColor: tone.backgroundColor, borderColor: tone.borderColor }]}
      testID={`feedback-${message.type}`}>
      <AppText color={tone.foreground} style={styles.message} variant="label">
        {message.message}
      </AppText>
      <Pressable accessibilityLabel="Dismiss message" accessibilityRole="button" onPress={onDismiss} style={styles.dismissButton} testID="feedback-dismiss">
        <X color={tone.foreground} size={18} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  toast: {
    width: '100%',
    maxWidth: 640,
    minHeight: 48,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.card,
  },
  message: {
    flex: 1,
    minWidth: 0,
  },
  dismissButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
