import { router } from 'expo-router';
import { ArrowLeft, ChevronRight, Database, Globe2, LockKeyhole, ServerCog, Smartphone, Volume2 } from 'lucide-react-native';
import { useEffect } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

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
import { colors, spacing } from '@/theme/tokens';

export default function SettingsScreen() {
  const mode = process.env.EXPO_PUBLIC_API_MODE ?? 'mock';
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'Not configured';
  const session = useAuthStore((state) => state.session);
  const voiceGuidanceEnabled = useGuidanceSettingsStore((state) => state.voiceGuidanceEnabled);
  const settingsBootstrapped = useGuidanceSettingsStore((state) => state.bootstrapped);
  const setVoiceGuidanceEnabled = useGuidanceSettingsStore((state) => state.setVoiceGuidanceEnabled);
  const localizationBootstrapped = useLocalizationStore((state) => state.bootstrapped);
  const currentUserEmail = useLocalizationStore((state) => state.currentUserEmail);
  const preference = useLocalizationStore((state) => state.preference);
  const loadLanguagePreference = useLocalizationStore((state) => state.loadForUser);
  const feedback = useFeedback();
  const t = useTranslation();
  const language = getLanguageOption(preference?.languageCode);
  const region = getRegionOption(preference?.regionCode);
  const userEmail = session?.user.email;
  const hasPreference = Boolean(preference);

  useEffect(() => {
    if (userEmail && (currentUserEmail !== userEmail || (!localizationBootstrapped && !hasPreference))) {
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
      <View>
        <AppText muted variant="small">
          {t('app.settings')}
        </AppText>
        <AppText variant="title">{t('app.settings')}</AppText>
      </View>

      <Card style={styles.card}>
        <View style={styles.row}>
          <Globe2 color={colors.accentDark} size={22} />
          <View style={styles.text}>
            <AppText variant="label">{t('settings.languageRegion')}</AppText>
            <AppText muted variant="small">
              {preference
                ? `${language?.nativeName ?? preference.languageCode} · ${region?.regionName ?? preference.regionCode} · ${preference.locale}`
                : t('settings.notConfigured')}
            </AppText>
            <AppText muted variant="caption">
              {t('settings.languageRegionDetail')}
            </AppText>
          </View>
          <AppButton
            icon={ChevronRight}
            onPress={() => router.push('/language-region')}
            style={styles.smallButton}
            testID="settings-language-region-open"
            variant="secondary">
            {t('common.open')}
          </AppButton>
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.row}>
          <ServerCog color={colors.accentDark} size={22} />
          <View style={styles.text}>
            <AppText variant="label">{t('settings.backendMode')}</AppText>
            <AppText muted variant="small">
              {mode === 'real' ? apiUrl : t('settings.mockApiAdapter')}
            </AppText>
          </View>
          <Badge label={mode} tone={mode === 'real' ? 'success' : 'info'} />
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.row}>
          <LockKeyhole color={colors.accentDark} size={22} />
          <View style={styles.text}>
            <AppText variant="label">{t('settings.sessionStorage')}</AppText>
            <AppText muted variant="small">
              {t('settings.sessionStorageDetail')}
            </AppText>
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.row}>
          <Database color={colors.accentDark} size={22} />
          <View style={styles.text}>
            <AppText variant="label">{t('settings.offlineQueue')}</AppText>
            <AppText muted variant="small">
              {t('settings.offlineQueueDetail')}
            </AppText>
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.row}>
          <Smartphone color={colors.accentDark} size={22} />
          <View style={styles.text}>
            <AppText variant="label">{t('settings.largeTouchTargets')}</AppText>
            <AppText muted variant="small">
              {t('settings.largeTouchTargetsDetail')}
            </AppText>
          </View>
          <Switch disabled value trackColor={{ false: colors.slate300, true: colors.greenSoft }} />
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.row}>
          <Volume2 color={colors.accentDark} size={22} />
          <View style={styles.text}>
            <AppText variant="label">{t('settings.voiceGuidance')}</AppText>
            <AppText muted variant="small">
              {t('settings.voiceGuidanceDetail')} {preference?.locale ?? t('languageRegion.chooseAppLanguage')}.
            </AppText>
            <AppText muted variant="caption">
              {t('settings.voiceAutomatic')}
            </AppText>
          </View>
          <Switch
            disabled={!settingsBootstrapped}
            onValueChange={(value) => {
              void setVoiceGuidanceEnabled(value)
                .then(() => feedback.showSuccess(`Voice Guidance ${value ? 'ON' : 'OFF'}`))
                .catch((error) => feedback.showError(getSafeFeedbackMessage(error, 'Could not update Voice Guidance.')));
            }}
            thumbColor={voiceGuidanceEnabled ? colors.accent : colors.slate500}
            trackColor={{ false: colors.slate300, true: colors.greenSoft }}
            value={voiceGuidanceEnabled}
          />
        </View>
      </Card>
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
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  smallButton: {
    flexGrow: 1,
    minWidth: 92,
  },
});
