import { zodResolver } from '@hookform/resolvers/zod';
import { router, type Href } from 'expo-router';
import { Check, Eye, EyeOff, UserPlus } from 'lucide-react-native';
import { useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { getPostAuthRouteForSession } from '@/auth/post-auth-routing';
import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Card } from '@/components/common/card';
import { Screen } from '@/components/common/screen';
import { getSafeFeedbackMessage } from '@/features/feedback/error-messages';
import { useFeedback } from '@/features/feedback/feedback-provider';
import { colors, radii, spacing } from '@/theme/tokens';
import { signupSchema, type SignupFormValues } from '@/types/forms';
import { useAuthStore } from '@/store/auth-store';

export default function SignupScreen() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const signup = useAuthStore((state) => state.signup);
  const loading = useAuthStore((state) => state.loading);
  const authError = useAuthStore((state) => state.error);
  const feedback = useFeedback();
  const {
    control,
    formState: { errors },
    handleSubmit,
    setValue,
  } = useForm<SignupFormValues>({
    defaultValues: {
      confirmPassword: '',
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      phone: '',
      termsAccepted: false,
    },
    resolver: zodResolver(signupSchema),
  });
  const termsAccepted = useWatch({ control, name: 'termsAccepted' }) ?? false;

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signup(values);
      const session = useAuthStore.getState().session;
      if (!session) {
        feedback.showError('Account created, but sign-in did not complete.');
        return;
      }
      feedback.showSuccess('Crowd Worker account created');
      router.replace((await getPostAuthRouteForSession(session)) as Href);
    } catch (caught) {
      feedback.showError(getSafeFeedbackMessage(caught, 'Could not create account. Please try again.'));
    }
  });

  return (
    <Screen showOffline={false}>
      <View style={styles.header}>
        <View style={styles.mark}>
          <AppText color={colors.white} variant="subheading">
            C
          </AppText>
        </View>
        <View style={styles.headerText}>
          <AppText variant="title">Create your Cosaarthi account</AppText>
          <AppText muted>New accounts start as Crowd Workers.</AppText>
        </View>
      </View>

      <Card style={styles.form}>
        <View style={styles.nameRow}>
          <FieldError error={errors.firstName?.message} style={styles.nameField}>
            <AppText variant="label">First name</AppText>
            <Controller
              control={control}
              name="firstName"
              render={({ field: { onBlur, onChange, value } }) => (
                <TextInput
                  autoComplete="given-name"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  style={styles.input}
                  testID="signup-first-name"
                  value={value}
                />
              )}
            />
          </FieldError>
          <FieldError error={errors.lastName?.message} style={styles.nameField}>
            <AppText variant="label">Last name</AppText>
            <Controller
              control={control}
              name="lastName"
              render={({ field: { onBlur, onChange, value } }) => (
                <TextInput
                  autoComplete="family-name"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  style={styles.input}
                  testID="signup-last-name"
                  value={value}
                />
              )}
            />
          </FieldError>
        </View>

        <FieldError error={errors.email?.message}>
          <AppText variant="label">Email</AppText>
          <Controller
            control={control}
            name="email"
            render={({ field: { onBlur, onChange, value } }) => (
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="worker@cosaarthi.example"
                placeholderTextColor={colors.slate500}
                style={styles.input}
                testID="signup-email"
                value={value}
              />
            )}
          />
        </FieldError>

        <FieldError error={errors.phone?.message}>
          <AppText variant="label">Phone</AppText>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onBlur, onChange, value } }) => (
              <TextInput
                autoComplete="tel"
                keyboardType="phone-pad"
                onBlur={onBlur}
                onChangeText={onChange}
                style={styles.input}
                testID="signup-phone"
                value={value}
              />
            )}
          />
        </FieldError>

        <FieldError error={errors.password?.message}>
          <AppText variant="label">Password</AppText>
          <PasswordInput
            control={control}
            name="password"
            passwordVisible={passwordVisible}
            setPasswordVisible={setPasswordVisible}
            testID="signup-password"
          />
        </FieldError>

        <FieldError error={errors.confirmPassword?.message}>
          <AppText variant="label">Confirm password</AppText>
          <PasswordInput
            control={control}
            name="confirmPassword"
            passwordVisible={passwordVisible}
            setPasswordVisible={setPasswordVisible}
            testID="signup-confirm-password"
          />
        </FieldError>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: termsAccepted }}
          onPress={() => setValue('termsAccepted', !termsAccepted, { shouldValidate: true })}
          style={({ pressed }) => [styles.termsRow, pressed && styles.pressed]}
          testID="signup-terms">
          <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
            {termsAccepted ? <Check color={colors.white} size={16} /> : null}
          </View>
          <AppText style={styles.termsText}>I accept the local development terms.</AppText>
        </Pressable>
        {errors.termsAccepted?.message ? (
          <AppText color={colors.red} variant="small">
            {errors.termsAccepted.message}
          </AppText>
        ) : null}

        {authError ? (
          <AppText color={colors.red} variant="small">
            {getSafeFeedbackMessage(authError, 'Could not create account.')}
          </AppText>
        ) : null}

        <AppButton icon={UserPlus} loading={loading} onPress={onSubmit} testID="signup-submit">
          Create account
        </AppButton>
        <AppButton onPress={() => router.replace('/login')} variant="ghost">
          Back to sign in
        </AppButton>
      </Card>
    </Screen>
  );
}

function PasswordInput({
  control,
  name,
  passwordVisible,
  setPasswordVisible,
  testID,
}: {
  control: ReturnType<typeof useForm<SignupFormValues>>['control'];
  name: 'password' | 'confirmPassword';
  passwordVisible: boolean;
  setPasswordVisible: Dispatch<SetStateAction<boolean>>;
  testID: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onBlur, onChange, value } }) => (
        <View style={styles.passwordField}>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onBlur={onBlur}
            onChangeText={onChange}
            secureTextEntry={!passwordVisible}
            style={[styles.input, styles.passwordInput]}
            testID={testID}
            textContentType="newPassword"
            value={value}
          />
          <Pressable
            accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
            onPress={() => setPasswordVisible((visible) => !visible)}
            style={styles.passwordToggle}>
            {passwordVisible ? <EyeOff color={colors.slate500} size={20} /> : <Eye color={colors.slate500} size={20} />}
          </Pressable>
        </View>
      )}
    />
  );
}

function FieldError({
  children,
  error,
  style,
}: {
  children: ReactNode;
  error?: string;
  style?: object;
}) {
  return (
    <View style={[styles.field, style]}>
      {children}
      {error ? (
        <AppText color={colors.red} variant="small">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  checkboxChecked: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  field: {
    gap: spacing.sm,
  },
  form: {
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
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
  mark: {
    width: 58,
    height: 58,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  nameField: {
    flex: 1,
    minWidth: 180,
  },
  nameRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
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
  pressed: {
    opacity: 0.78,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  termsText: {
    flex: 1,
    minWidth: 0,
  },
});
