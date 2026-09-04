import { zodResolver } from '@hookform/resolvers/zod';
import { router, type Href } from 'expo-router';
import { Check, ChevronDown, Eye, EyeOff, LogIn, ShieldCheck, UserPlus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DEMO_PASSWORD, getLoginAccountOption, loginAccountOptions, type LoginAccountOption } from '@/auth/demo-personas';
import { getPostAuthRouteForSession } from '@/auth/post-auth-routing';
import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Card } from '@/components/common/card';
import { Screen } from '@/components/common/screen';
import { getSafeFeedbackMessage } from '@/features/feedback/error-messages';
import { useFeedback } from '@/features/feedback/feedback-provider';
import { localizeFormError } from '@/features/localization/form-errors';
import { useTranslation } from '@/features/localization/use-translation';
import { colors, radii, spacing } from '@/theme/tokens';
import { loginSchema, type LoginFormValues } from '@/types/forms';
import { useAuthStore } from '@/store/auth-store';

export default function LoginScreen() {
  const [accountSelectorOpen, setAccountSelectorOpen] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const authError = useAuthStore((state) => state.error);
  const feedback = useFeedback();
  const t = useTranslation();
  const {
    control,
    formState: { errors },
    handleSubmit,
    setValue,
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: loginAccountOptions[0].email,
      password: DEMO_PASSWORD,
      persona: loginAccountOptions[0].persona,
      workerCode: loginAccountOptions[0].code,
    },
    resolver: zodResolver(loginSchema),
  });
  const selectedEmail = useWatch({ control, name: 'email' }) ?? loginAccountOptions[0].email;
  const selectedOption = getLoginAccountOption(selectedEmail);
  const availableHeight = height - insets.top - insets.bottom;
  const compact = availableHeight < 720;
  const veryCompact = availableHeight < 620;
  const layout = {
    brandMarkSize: veryCompact ? 44 : compact ? 50 : 58,
    cardGap: veryCompact ? spacing.sm : compact ? spacing.md : spacing.lg,
    cardPadding: veryCompact ? spacing.md : compact ? spacing.lg : spacing.lg,
    controlHeight: veryCompact ? 44 : compact ? 48 : 54,
    fieldGap: compact ? spacing.xs : spacing.sm,
    formGap: veryCompact ? spacing.sm : compact ? spacing.md : spacing.xl,
    inputHeight: veryCompact ? 44 : compact ? 48 : 50,
    screenJustify: compact ? ('flex-start' as const) : ('center' as const),
  };

  function selectAccount(option: LoginAccountOption) {
    setValue('persona', option.persona, { shouldValidate: true });
    setValue('email', option.email, { shouldValidate: true });
    setValue('password', option.password, { shouldValidate: true });
    setValue('workerCode', option.code, { shouldValidate: true });
    setAccountSelectorOpen(false);
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values);
      const session = useAuthStore.getState().session;
      if (!session) {
        feedback.showError('Unable to sign in. Please try again.');
        return;
      }
      feedback.showSuccess('Signed in successfully');
      router.replace((await getPostAuthRouteForSession(session)) as Href);
    } catch (caught) {
      feedback.showError(getSafeFeedbackMessage(caught, 'Unable to sign in. Please try again.'));
    }
  });

  return (
    <Screen showOffline={false} style={{ flexGrow: 1, justifyContent: layout.screenJustify }}>
      <View style={[styles.keyboard, { gap: layout.formGap }]} testID="login-keyboard-container">
        <View style={styles.brandRow}>
          <View style={[styles.mark, { height: layout.brandMarkSize, width: layout.brandMarkSize }]}>
            <AppText color={colors.white} variant="subheading">
              C
            </AppText>
          </View>
          <View>
            <AppText variant="title">{t('login.welcome')}</AppText>
            <AppText muted>{t('login.signInToContinue')}</AppText>
          </View>
        </View>

        <Card style={[styles.form, { gap: layout.cardGap, padding: layout.cardPadding }]} testID="login-form-card">
          <View style={styles.mockPill}>
            <ShieldCheck color={colors.accentDark} size={16} />
            <AppText color={colors.accentDark} variant="caption">
              {(process.env.EXPO_PUBLIC_API_MODE ?? 'mock') === 'real' ? 'Real mobile API' : t('login.mockApiLogin')}
            </AppText>
          </View>
          <AppText muted variant="small">
            Development test password: {DEMO_PASSWORD}
          </AppText>

          <View style={[styles.field, { gap: layout.fieldGap }]}>
            <AppText variant="label">Account</AppText>
            <Pressable
              accessibilityLabel="Account selector"
              accessibilityRole="button"
              onPress={() => setAccountSelectorOpen(true)}
              testID="persona-selector-field"
              style={({ pressed }) => [styles.selectorField, { minHeight: layout.controlHeight }, pressed && styles.pressed]}>
              <View style={styles.selectorText}>
                <AppText variant="label">{selectedOption.label}</AppText>
                <AppText muted numberOfLines={1} variant="caption">
                  {selectedOption.subtitle}
                </AppText>
              </View>
              <ChevronDown color={colors.slate500} size={20} />
            </Pressable>
          </View>

          <View style={[styles.field, { gap: layout.fieldGap }]}>
            <AppText variant="label">{t('login.password')}</AppText>
            <Controller
              control={control}
              name="password"
              render={({ field: { onBlur, onChange, value } }) => (
                <View style={styles.passwordField}>
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder={t('login.demoPassword')}
                    placeholderTextColor={colors.slate500}
                    secureTextEntry={!passwordVisible}
                    style={[styles.input, styles.passwordInput, { minHeight: layout.inputHeight }]}
                    testID="login-password-input"
                    textContentType="password"
                    value={value}
                  />
                  <Pressable
                    accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
                    accessibilityRole="button"
                    onPress={() => setPasswordVisible((visible) => !visible)}
                    style={styles.passwordToggle}
                    testID="login-password-toggle">
                    {passwordVisible ? <EyeOff color={colors.slate500} size={20} /> : <Eye color={colors.slate500} size={20} />}
                  </Pressable>
                </View>
              )}
            />
            {errors.password ? (
              <AppText color={colors.red} variant="small">
                {localizeFormError(errors.password.message, t)}
              </AppText>
            ) : null}
          </View>

          {authError ? (
            <AppText color={colors.red} variant="small">
              {getSafeFeedbackMessage(authError, 'Unable to sign in. Please try again.')}
            </AppText>
          ) : null}

          <AppButton icon={LogIn} loading={loading} onPress={onSubmit} testID="login-submit">
            {t('login.signIn')}
          </AppButton>
          <AppButton icon={UserPlus} onPress={() => router.push('/signup')} testID="signup-link" variant="secondary">
            Create Crowd Worker account
          </AppButton>
        </Card>
      </View>

      {accountSelectorOpen ? (
        <AccountSelectorModal
          onClose={() => setAccountSelectorOpen(false)}
          onSelect={selectAccount}
          selectedEmail={selectedEmail}
        />
      ) : null}
    </Screen>
  );
}

function AccountSelectorModal({
  onClose,
  onSelect,
  selectedEmail,
}: {
  onClose: () => void;
  onSelect: (option: LoginAccountOption) => void;
  selectedEmail: string;
}) {
  const t = useTranslation();

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible>
      <View style={styles.modalRoot} testID="persona-selector-modal">
        <Pressable accessibilityLabel={t('common.close')} style={styles.modalScrim} onPress={onClose} />
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <View>
              <AppText variant="subheading">Choose account</AppText>
              <AppText muted variant="small">
                Seeded local development users
              </AppText>
            </View>
            <Pressable accessibilityLabel={t('common.close')} accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
              <X color={colors.ink} size={20} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.optionList}>
              {loginAccountOptions.map((option) => {
                const selected = selectedEmail === option.email;
                return (
                  <Pressable
                    key={option.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => onSelect(option)}
                    testID={`login-account-option-${option.id}`}
                    style={({ pressed }) => [styles.optionRow, selected && styles.optionRowSelected, pressed && styles.pressed]}>
                    <View style={styles.checkSlot}>{selected ? <Check color={colors.accentDark} size={18} /> : null}</View>
                    <View style={styles.optionText}>
                      <AppText variant="label">{option.label}</AppText>
                      <AppText muted variant="small">
                        {option.subtitle}
                      </AppText>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    gap: spacing.xl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  mark: {
    width: 58,
    height: 58,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  form: {
    gap: spacing.lg,
  },
  mockPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.greenSoft,
  },
  field: {
    gap: spacing.sm,
  },
  selectorField: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  selectorText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.78,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    color: colors.ink,
    backgroundColor: colors.white,
    fontSize: 16,
  },
  passwordField: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 52,
  },
  passwordToggle: {
    position: 'absolute',
    right: 6,
    top: 5,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15,23,42,0.42)',
  },
  sheet: {
    maxHeight: '82%',
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
    backgroundColor: colors.white,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  optionList: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  optionRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  optionRowSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.greenSoft,
  },
  checkSlot: {
    width: 22,
    alignItems: 'center',
    paddingTop: 1,
  },
  optionText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
});
