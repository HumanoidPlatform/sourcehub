import { router } from 'expo-router';
import { ArrowLeft, ChevronRight, Globe2, Languages, MapPin, Volume2, Wand2 } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Badge } from '@/components/common/badge';
import { Card } from '@/components/common/card';
import { Screen } from '@/components/common/screen';
import { getSafeFeedbackMessage } from '@/features/feedback/error-messages';
import { useFeedback } from '@/features/feedback/feedback-provider';
import { getLanguageOption, getRegionOption } from '@/features/localization/locales';
import { useTranslation } from '@/features/localization/use-translation';
import { useAuthStore } from '@/store/auth-store';
import { useGuidanceSettingsStore } from '@/store/guidance-settings-store';
import { useLocalizationStore } from '@/store/localization-store';
import { colors, radii, spacing } from '@/theme/tokens';

export default function LanguageRegionScreen() {
  const session = useAuthStore((state) => state.session);
  const localizationBootstrapped = useLocalizationStore((state) => state.bootstrapped);
  const currentUserEmail = useLocalizationStore((state) => state.currentUserEmail);
  const preference = useLocalizationStore((state) => state.preference);
  const loadLanguagePreference = useLocalizationStore((state) => state.loadForUser);
  const voiceGuidanceEnabled = useGuidanceSettingsStore((state) => state.voiceGuidanceEnabled);
  const settingsBootstrapped = useGuidanceSettingsStore((state) => state.bootstrapped);
  const setVoiceGuidanceEnabled = useGuidanceSettingsStore((state) => state.setVoiceGuidanceEnabled);
  const feedback = useFeedback();
  const t = useTranslation();
  const language = getLanguageOption(preference?.languageCode);
  const region = getRegionOption(preference?.regionCode);
  const userEmail = session?.user.email;
  const hasPreference = Boolean(preference);

  useEffect(() => {
    if (!userEmail) {
      router.replace('/login');
      return;
    }
    if (currentUserEmail !== userEmail || (!localizationBootstrapped && !hasPreference)) {
      loadLanguagePreference(userEmail).catch((error) =>
        feedback.showError(getSafeFeedbackMessage(error, 'Could not load language preference.')),
      );
    }
  }, [currentUserEmail, feedback, hasPreference, loadLanguagePreference, localizationBootstrapped, userEmail]);

  return (
    <Screen>
      <AppButton icon={ArrowLeft} onPress={() => router.back()} style={styles.backButton} variant="ghost">
        {t('common.back')}
      </AppButton>

      <View style={styles.header}>
        <View style={styles.mark}>
          <Globe2 color={colors.white} size={26} />
        </View>
        <View style={styles.headerText}>
          <AppText muted variant="small">
            {t('app.settings')}
          </AppText>
          <AppText variant="title">{t('languageRegion.title')}</AppText>
          <AppText muted>
            {t('languageRegion.accountScope')}
          </AppText>
        </View>
      </View>

      <Card style={styles.card}>
        <SettingRow
          detail={language?.englishName ?? preference?.languageCode ?? t('languageRegion.chooseAppLanguage')}
          icon={Languages}
          label={t('languageRegion.language')}
          onPress={() => router.push('/locale-setup?mode=settings&step=language')}
          testID="language-region-language-row"
          value={language?.nativeName ?? t('common.notConfigured')}
        />
        <SettingRow
          detail={preference?.locale ?? t('languageRegion.chooseWorkingRegion')}
          icon={MapPin}
          label={t('languageRegion.region')}
          onPress={() => router.push('/locale-setup?mode=settings&step=region')}
          testID="language-region-region-row"
          value={region?.regionName ?? preference?.regionCode ?? t('common.notConfigured')}
        />
      </Card>

      <Card style={styles.card}>
        <View style={styles.staticRow}>
          <View style={styles.rowIcon}>
            <Volume2 color={colors.accentDark} size={20} />
          </View>
          <View style={styles.rowText}>
            <AppText variant="label">{t('settings.voiceGuidance')}</AppText>
            <AppText muted variant="small">
              {t('languageRegion.voiceLocaleDetail')} {preference?.locale ?? t('languageRegion.chooseAppLanguage')}.
            </AppText>
          </View>
          <Badge label={voiceGuidanceEnabled ? t('common.on') : t('common.off')} tone={voiceGuidanceEnabled ? 'success' : 'neutral'} />
          <Switch
            disabled={!settingsBootstrapped}
            onValueChange={(value) => {
              void setVoiceGuidanceEnabled(value)
                .then(() => feedback.showSuccess(`Voice Guidance ${value ? 'ON' : 'OFF'}`))
                .catch((error) => feedback.showError(getSafeFeedbackMessage(error, 'Could not update Voice Guidance.')));
            }}
            testID="language-region-voice-guidance-switch"
            thumbColor={voiceGuidanceEnabled ? colors.accent : colors.slate500}
            trackColor={{ false: colors.slate300, true: colors.greenSoft }}
            value={voiceGuidanceEnabled}
          />
        </View>
        <View style={styles.staticRow}>
          <View style={styles.rowIcon}>
            <Wand2 color={colors.accentDark} size={20} />
          </View>
          <View style={styles.rowText}>
            <AppText variant="label">{t('profile.voiceGuidance')}</AppText>
            <AppText muted variant="small">
              {t('languageRegion.voiceAutomatic')}
            </AppText>
          </View>
          <Badge label={t('common.automatic')} tone="info" />
        </View>
      </Card>
    </Screen>
  );
}

function SettingRow({
  detail,
  icon: Icon,
  label,
  onPress,
  testID,
  value,
}: {
  detail: string;
  icon: typeof Languages;
  label: string;
  onPress: () => void;
  testID: string;
  value: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.pressableRow, pressed && styles.pressed]}
      testID={testID}>
      <View style={styles.rowIcon}>
        <Icon color={colors.accentDark} size={20} />
      </View>
      <View style={styles.rowText}>
        <AppText variant="label">{label}</AppText>
        <AppText variant="subheading">{value}</AppText>
        <AppText muted variant="small">
          {detail}
        </AppText>
      </View>
      <ChevronRight color={colors.slate500} size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  mark: {
    width: 54,
    height: 54,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  card: {
    gap: spacing.sm,
  },
  pressableRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  staticRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cyanSoft,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.78,
  },
});
