import { router, useLocalSearchParams, type Href } from 'expo-router';
import { ArrowLeft, Check, Globe2, Search } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getLandingRouteForSession } from '@/auth/persona-routing';
import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Badge } from '@/components/common/badge';
import { Card } from '@/components/common/card';
import { Screen } from '@/components/common/screen';
import { getSafeFeedbackMessage } from '@/features/feedback/error-messages';
import { useFeedback } from '@/features/feedback/feedback-provider';
import {
  buildUserLanguagePreferences,
  getDeviceLocaleSuggestion,
  getLanguageOption,
  getRegionOption,
  isRtlLanguage,
  searchLanguages,
  searchRegions,
  type LanguageOption,
  type RegionOption,
} from '@/features/localization/locales';
import { useTranslation } from '@/features/localization/use-translation';
import { useAuthStore } from '@/store/auth-store';
import { useLocalizationStore } from '@/store/localization-store';
import { colors, radii, spacing } from '@/theme/tokens';

type SetupStep = 'language' | 'region';

export default function LocaleSetupScreen() {
  const params = useLocalSearchParams<{ mode?: string; step?: string }>();
  const mode = params.mode === 'settings' ? 'settings' : 'first-login';
  const initialStep = mode === 'settings' && params.step === 'region' ? 'region' : 'language';
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const session = useAuthStore((state) => state.session);
  const localizationBootstrapped = useLocalizationStore((state) => state.bootstrapped);
  const currentUserEmail = useLocalizationStore((state) => state.currentUserEmail);
  const preference = useLocalizationStore((state) => state.preference);
  const loadForUser = useLocalizationStore((state) => state.loadForUser);
  const saveForUser = useLocalizationStore((state) => state.saveForUser);
  const feedback = useFeedback();
  const t = useTranslation();
  const [firstLoginStep, setFirstLoginStep] = useState<SetupStep>('language');
  const [languageQuery, setLanguageQuery] = useState('');
  const [regionQuery, setRegionQuery] = useState('');
  const [draftLanguage, setDraftLanguage] = useState<string | null>(null);
  const [draftRegion, setDraftRegion] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const languageResults = useMemo(() => searchLanguages(languageQuery), [languageQuery]);
  const regionResults = useMemo(() => searchRegions(regionQuery), [regionQuery]);
  const deviceSuggestion = getDeviceLocaleSuggestion();
  const preferenceLanguageCode = preference?.languageCode;
  const preferenceRegionCode = preference?.regionCode;
  const selectedLanguage = draftLanguage ?? (mode === 'settings' ? preferenceLanguageCode ?? null : null);
  const selectedRegion = draftRegion ?? (mode === 'settings' ? preferenceRegionCode ?? null : null);
  const selectedLanguageOption = getLanguageOption(selectedLanguage ?? undefined);
  const selectedRegionOption = getRegionOption(selectedRegion ?? undefined);
  const isRtl = isRtlLanguage(selectedLanguage ?? undefined);
  const step = mode === 'settings' ? initialStep : firstLoginStep;
  const userEmail = session?.user.email;
  const availableHeight = height - insets.top - insets.bottom;
  const compact = availableHeight < 740;
  const veryCompact = availableHeight < 640;
  const pickerMaxHeight = Math.max(
    veryCompact ? 168 : 190,
    Math.min(availableHeight * (veryCompact ? 0.3 : compact ? 0.36 : 0.44), compact ? 278 : 360),
  );
  const layout = {
    cardGap: veryCompact ? spacing.md : compact ? spacing.md : spacing.lg,
    formGap: veryCompact ? spacing.md : compact ? spacing.md : spacing.lg,
    markSize: veryCompact ? 46 : compact ? 52 : 58,
    screenJustify: compact ? ('flex-start' as const) : ('center' as const),
    searchHeight: veryCompact ? 44 : compact ? 48 : 50,
  };

  useEffect(() => {
    if (!userEmail) {
      router.replace('/login');
      return;
    }
    if (currentUserEmail === userEmail && localizationBootstrapped) {
      return;
    }
    loadForUser(userEmail)
      .then(() => undefined)
      .catch((error) => feedback.showError(getSafeFeedbackMessage(error, 'Could not load language preference.')));
  }, [currentUserEmail, feedback, loadForUser, localizationBootstrapped, userEmail]);

  async function persistPreference(languageCode: string, regionCode: string, route: Href) {
    if (!userEmail) {
      return;
    }

    setSaving(true);
    const nextPreference = buildUserLanguagePreferences(languageCode, regionCode);
    try {
      await saveForUser(userEmail, nextPreference);
      feedback.showSuccess('Language and region updated');
      router.replace(route);
    } catch (error) {
      feedback.showError(getSafeFeedbackMessage(error, 'Could not save language and region.'));
    } finally {
      setSaving(false);
    }
  }

  function chooseLanguage(language: LanguageOption) {
    setDraftLanguage(language.languageCode);
    if (mode === 'settings') {
      if (selectedRegion) {
        void persistPreference(language.languageCode, selectedRegion, '/language-region');
      } else {
        router.replace('/locale-setup?mode=settings&step=region');
      }
      return;
    }
    setFirstLoginStep('region');
  }

  function chooseRegion(region: RegionOption) {
    setDraftRegion(region.regionCode);
    if (mode === 'settings') {
      if (selectedLanguage) {
        void persistPreference(selectedLanguage, region.regionCode, '/language-region');
      } else {
        router.replace('/locale-setup?mode=settings&step=language');
      }
    }
  }

  async function savePreference() {
    if (!session || !selectedLanguage || !selectedRegion) {
      return;
    }

    await persistPreference(
      selectedLanguage,
      selectedRegion,
      (mode === 'settings' ? '/language-region' : getLandingRouteForSession(session)) as Href,
    );
  }

  return (
    <Screen showOffline={false} style={{ flexGrow: 1, justifyContent: layout.screenJustify }}>
      <View style={[styles.keyboard, { gap: layout.formGap }]} testID="locale-setup-keyboard-container">
        <View style={[styles.header, { gap: layout.formGap }]}>
          {mode === 'settings' ? (
            <AppButton icon={ArrowLeft} onPress={() => router.back()} style={styles.backButton} variant="ghost">
              {t('common.back')}
            </AppButton>
          ) : null}
          <View style={[styles.mark, { height: layout.markSize, width: layout.markSize }]}>
            <Globe2 color={colors.white} size={28} />
          </View>
          <View style={styles.headerText}>
            <AppText muted variant="small">
              {mode === 'settings' ? t('languageRegion.title') : t('languageRegion.firstLoginSetup')}
            </AppText>
            <AppText style={isRtl ? styles.rtlText : undefined} variant="title">
              {step === 'language'
                ? mode === 'settings'
                  ? t('languageRegion.changeLanguage')
                  : t('languageRegion.chooseLanguage')
                : mode === 'settings'
                  ? t('languageRegion.changeRegion')
                  : t('languageRegion.chooseRegion')}
            </AppText>
            <AppText muted>
              {step === 'language' ? t('languageRegion.selectLanguageDetail') : t('languageRegion.selectRegionDetail')}
            </AppText>
          </View>
        </View>

        {deviceSuggestion ? (
          <Card style={styles.suggestion}>
            <AppText muted variant="small">
              {t('languageRegion.suggestedFromDevice')}: {deviceSuggestion}
            </AppText>
            <AppText muted variant="caption">
              {t('languageRegion.explicitChoice')}
            </AppText>
          </Card>
        ) : null}

        <Card style={[styles.card, { gap: layout.cardGap }]} testID="locale-setup-picker-card">
          <View style={styles.progressRow}>
            <Badge label={selectedLanguageOption?.nativeName ?? t('languageRegion.languageRequired')} tone={selectedLanguage ? 'success' : 'warning'} />
            <Badge label={selectedRegionOption?.regionName ?? t('languageRegion.regionRequired')} tone={selectedRegion ? 'success' : 'warning'} />
          </View>

          {step === 'language' ? (
            <PickerList
              emptyLabel={t('languageRegion.emptyLanguages')}
              onSelectLanguage={chooseLanguage}
              query={languageQuery}
              listMaxHeight={pickerMaxHeight}
              compact={compact}
              selectedLanguage={selectedLanguage}
              searchHeight={layout.searchHeight}
              setQuery={setLanguageQuery}
              type="language"
              values={languageResults}
            />
          ) : (
            <PickerList
              emptyLabel={t('languageRegion.emptyRegions')}
              onSelectRegion={chooseRegion}
              query={regionQuery}
              listMaxHeight={pickerMaxHeight}
              compact={compact}
              selectedRegion={selectedRegion}
              searchHeight={layout.searchHeight}
              setQuery={setRegionQuery}
              type="region"
              values={regionResults}
            />
          )}
        </Card>

        <View style={styles.actions}>
          {mode === 'first-login' && step === 'region' ? (
            <AppButton onPress={() => setFirstLoginStep('language')} variant="secondary">
              {t('common.changeLanguage')}
            </AppButton>
          ) : null}
          {mode === 'first-login' || !selectedLanguage || !selectedRegion ? (
            <AppButton disabled={!selectedLanguage || !selectedRegion} loading={saving} onPress={savePreference} testID="save-locale-preference">
              {mode === 'settings' ? t('common.savePreference') : t('common.saveAndContinue')}
            </AppButton>
          ) : null}
          {mode === 'settings' && selectedLanguage && selectedRegion ? (
            <AppText muted variant="caption">
              {t('common.selectingSaves')}
            </AppText>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

function PickerList({
  emptyLabel,
  onSelectLanguage,
  onSelectRegion,
  query,
  compact,
  listMaxHeight,
  selectedLanguage,
  selectedRegion,
  searchHeight,
  setQuery,
  type,
  values,
}: {
  emptyLabel: string;
  compact: boolean;
  listMaxHeight: number;
  onSelectLanguage?: (language: LanguageOption) => void;
  onSelectRegion?: (region: RegionOption) => void;
  query: string;
  selectedLanguage?: string | null;
  selectedRegion?: string | null;
  searchHeight: number;
  setQuery: (value: string) => void;
  type: 'language' | 'region';
  values: LanguageOption[] | RegionOption[];
}) {
  const t = useTranslation();
  return (
    <View style={styles.picker}>
      <View style={[styles.searchField, { minHeight: searchHeight }]}>
        <Search color={colors.slate500} size={18} />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder={type === 'language' ? t('languageRegion.searchLanguages') : t('languageRegion.searchRegions')}
          placeholderTextColor={colors.slate500}
          style={styles.searchInput}
          testID={`${type}-search-input`}
          value={query}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.optionList}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        style={[styles.optionScroller, { maxHeight: listMaxHeight }]}
        testID={`${type}-option-scroller`}>
        {values.length ? (
          values.map((value) =>
            type === 'language' ? (
              <LanguageRow
                key={(value as LanguageOption).languageCode}
                compact={compact}
                language={value as LanguageOption}
                onPress={() => onSelectLanguage?.(value as LanguageOption)}
                selected={selectedLanguage === (value as LanguageOption).languageCode}
              />
            ) : (
              <RegionRow
                key={(value as RegionOption).regionCode}
                compact={compact}
                onPress={() => onSelectRegion?.(value as RegionOption)}
                region={value as RegionOption}
                selected={selectedRegion === (value as RegionOption).regionCode}
              />
            ),
          )
        ) : (
          <AppText muted>{emptyLabel}</AppText>
        )}
      </ScrollView>
    </View>
  );
}

function LanguageRow({ compact, language, onPress, selected }: { compact: boolean; language: LanguageOption; onPress: () => void; selected: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.optionRow, compact && styles.optionRowCompact, selected && styles.optionSelected, pressed && styles.pressed]}
      testID={`language-option-${language.languageCode}`}>
      <View style={styles.checkSlot}>{selected ? <Check color={colors.accentDark} size={18} /> : null}</View>
      <View style={styles.optionText}>
        <AppText style={isRtlLanguage(language.languageCode) ? styles.rtlText : undefined} variant="label">
          {language.nativeName}
        </AppText>
        {language.englishName ? (
          <AppText muted variant="small">
            {language.englishName}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

function RegionRow({ compact, onPress, region, selected }: { compact: boolean; onPress: () => void; region: RegionOption; selected: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.optionRow, compact && styles.optionRowCompact, selected && styles.optionSelected, pressed && styles.pressed]}
      testID={`region-option-${region.regionCode}`}>
      <View style={styles.checkSlot}>{selected ? <Check color={colors.accentDark} size={18} /> : null}</View>
      <View style={styles.optionText}>
        <AppText variant="label">{region.regionName}</AppText>
        <AppText muted variant="small">
          {region.regionCode}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    gap: spacing.lg,
  },
  header: {
    gap: spacing.md,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 0,
  },
  mark: {
    width: 58,
    height: 58,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  headerText: {
    gap: spacing.xs,
  },
  suggestion: {
    gap: spacing.xs,
  },
  card: {
    gap: spacing.lg,
  },
  progressRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  picker: {
    gap: spacing.md,
  },
  searchField: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
  },
  searchInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 16,
  },
  optionList: {
    gap: spacing.xs,
  },
  optionScroller: {
    flexGrow: 0,
  },
  optionRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  optionRowCompact: {
    minHeight: 52,
  },
  optionSelected: {
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
  actions: {
    gap: spacing.md,
  },
  rtlText: {
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  pressed: {
    opacity: 0.78,
  },
});
