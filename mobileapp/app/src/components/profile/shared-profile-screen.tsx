import { router } from 'expo-router';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  ChevronRight,
  CircleHelp,
  Globe2,
  Info,
  LogOut,
  Settings,
  Volume2,
} from 'lucide-react-native';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useEffect } from 'react';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Badge } from '@/components/common/badge';
import { Card } from '@/components/common/card';
import { Screen } from '@/components/common/screen';
import { SectionHeader } from '@/components/common/section-header';
import { getSafeFeedbackMessage } from '@/features/feedback/error-messages';
import { useFeedback } from '@/features/feedback/feedback-provider';
import { getLanguageOption, getRegionOption } from '@/features/localization/locales';
import type { StringKey } from '@/features/localization/strings';
import { useTranslation } from '@/features/localization/use-translation';
import { personaConfigs } from '@/features/personas/persona-config';
import { useCertifications, useKitCustody } from '@/hooks/use-odp-queries';
import { useAuthStore } from '@/store/auth-store';
import { useGuidanceSettingsStore } from '@/store/guidance-settings-store';
import { useLocalizationStore } from '@/store/localization-store';
import { colors, radii, spacing } from '@/theme/tokens';
import type { AuthSession } from '@/types/domain';

type ProfileRow = {
  label: string;
  value?: string | null;
};

type TFunction = (key: StringKey) => string;

export function SharedProfileScreen() {
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);
  const preference = useLocalizationStore((state) => state.preference);
  const loadLanguagePreference = useLocalizationStore((state) => state.loadForUser);
  const feedback = useFeedback();
  const t = useTranslation();
  const voiceGuidanceEnabled = useGuidanceSettingsStore((state) => state.voiceGuidanceEnabled);
  const language = getLanguageOption(preference?.languageCode);
  const region = getRegionOption(preference?.regionCode);
  const certifications = useCertifications();
  const kit = useKitCustody();

  useEffect(() => {
    if (!session) {
      router.replace('/login');
      return;
    }
    void loadLanguagePreference(session.user.email);
  }, [loadLanguagePreference, session]);

  if (!session) {
    return null;
  }

  const user = session.user;
  const personaConfig = personaConfigs[user.persona];
  const accountRows: ProfileRow[] = [
    { label: t('profile.email'), value: user.email },
    { label: t('profile.phone'), value: user.phone },
    { label: t('profile.userId'), value: user.id },
    { label: t('profile.accountStatus'), value: getAccountStatus(session, t) },
    { label: t('languageRegion.region'), value: region ? `${region.regionName} · ${preference?.locale}` : preference?.regionCode },
  ];
  const organizationRows: ProfileRow[] = [
    { label: t('profile.organization'), value: user.entity.name },
    { label: t('profile.entityId'), value: user.entity.id },
    { label: t('profile.entityType'), value: user.entity.type.replace(/_/g, ' ') },
    { label: t('profile.tenant'), value: user.tenant.name },
    { label: t('profile.tenantId'), value: user.tenant.id },
  ];
  const personaRows = getPersonaRows(session, {
    assignedKit: kit.data?.kitName,
    certifications: certifications.data,
    t,
  });

  async function confirmLogout() {
    try {
      await logout();
      feedback.showSuccess('Signed out successfully');
      router.replace('/login');
    } catch (error) {
      feedback.showError(getSafeFeedbackMessage(error, 'Unable to sign out. Please try again.'));
    }
  }

  function requestLogout() {
    Alert.alert(
      t('profile.logoutTitle'),
      t('profile.logoutMessage'),
      [
        { style: 'cancel', text: t('common.cancel') },
        {
          onPress: () => {
            void confirmLogout();
          },
          style: 'destructive',
          text: t('profile.logoutAction'),
        },
      ],
    );
  }

  return (
    <Screen>
      <AppButton icon={ArrowLeft} onPress={() => router.back()} style={styles.backButton} variant="ghost">
        {t('common.back')}
      </AppButton>

      <Card style={styles.hero}>
        <View style={styles.avatar}>
          <AppText color={colors.white} variant="heading">
            {getInitials(user.name || user.email)}
          </AppText>
        </View>
        <View style={styles.heroText}>
          <AppText muted variant="small">
            {t('profile.profile').toUpperCase()}
          </AppText>
          <AppText variant="title">{user.name}</AppText>
          <AppText muted>{personaConfig.label}</AppText>
          <AppText muted variant="small">
            {user.entity.name}
          </AppText>
        </View>
        <Badge label={user.persona} tone="purple" />
      </Card>

      <SectionHeader title={t('profile.account')} />
      <Card style={styles.card}>
        <InfoRows rows={accountRows} />
        <NavigationRow
          detail={language && region ? `${language.nativeName} · ${region.regionName}` : t('profile.chooseLanguageRegion')}
          icon={Globe2}
          label={t('languageRegion.title')}
          onPress={() => router.push('/language-region')}
          testID="profile-language-region-row"
        />
      </Card>

      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Building2 color={colors.accentDark} size={20} />
          <AppText variant="label">{t('profile.organization')}</AppText>
        </View>
        <InfoRows rows={organizationRows} />
      </Card>

      {personaRows.length ? (
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <BadgeCheck color={colors.accentDark} size={20} />
            <AppText variant="label">
              {personaConfig.label} {t('profile.status')}
            </AppText>
          </View>
          <InfoRows rows={personaRows} />
        </Card>
      ) : null}

      <SectionHeader title={t('profile.preferences')} />
      <Card style={styles.card}>
        <NavigationRow
          detail={t('profile.settingsDetail')}
          icon={Settings}
          label={t('app.settings')}
          onPress={() => router.push('/settings')}
          testID="profile-settings-row"
        />
        <NavigationRow
          detail={voiceGuidanceEnabled ? t('common.on') : t('common.off')}
          icon={Volume2}
          label={t('profile.voiceGuidance')}
          onPress={() => router.push('/language-region')}
          testID="profile-voice-guidance-row"
        />
      </Card>

      <SectionHeader title={t('profile.support')} />
      <Card style={styles.card}>
        <StaticRow detail={t('profile.helpDetail')} icon={CircleHelp} label={t('profile.help')} mockLabel={t('common.mock')} />
        <StaticRow detail={t('profile.aboutDetail')} icon={Info} label={t('profile.about')} mockLabel={t('common.mock')} />
      </Card>

      <SectionHeader title={t('profile.logout')} />
      <AppButton icon={LogOut} onPress={requestLogout} testID="profile-logout-button" variant="danger">
        {t('profile.logoutAction')}
      </AppButton>
    </Screen>
  );
}

function InfoRows({ rows }: { rows: ProfileRow[] }) {
  const visibleRows = rows.filter((row) => Boolean(row.value));
  if (!visibleRows.length) {
    return null;
  }
  return (
    <View style={styles.infoRows}>
      {visibleRows.map((row) => (
        <View key={row.label} style={styles.infoRow}>
          <AppText muted variant="caption">
            {row.label}
          </AppText>
          <AppText variant="label">{row.value}</AppText>
        </View>
      ))}
    </View>
  );
}

function NavigationRow({
  detail,
  icon: Icon,
  label,
  onPress,
  testID,
}: {
  detail: string;
  icon: typeof Settings;
  label: string;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.navRow, pressed && styles.pressed]}
      testID={testID}>
      <View style={styles.rowIcon}>
        <Icon color={colors.accentDark} size={20} />
      </View>
      <View style={styles.rowText}>
        <AppText variant="label">{label}</AppText>
        <AppText muted variant="small">
          {detail}
        </AppText>
      </View>
      <ChevronRight color={colors.slate500} size={20} />
    </Pressable>
  );
}

function StaticRow({ detail, icon: Icon, label, mockLabel }: { detail: string; icon: typeof Info; label: string; mockLabel: string }) {
  return (
    <View style={styles.navRow}>
      <View style={styles.rowIcon}>
        <Icon color={colors.accentDark} size={20} />
      </View>
      <View style={styles.rowText}>
        <AppText variant="label">{label}</AppText>
        <AppText muted variant="small">
          {detail}
        </AppText>
      </View>
      <Badge label={mockLabel} tone="info" />
    </View>
  );
}

function getPersonaRows(
  session: AuthSession,
  extras: {
    assignedKit?: string;
    certifications?: { status: string; title: string }[];
    t: TFunction;
  },
): ProfileRow[] {
  const { user } = session;
  const config = personaConfigs[user.persona];
  const rows: ProfileRow[] = [
    { label: extras.t('profile.activeRole'), value: config.label },
    { label: extras.t('profile.roleScope'), value: config.subtitle },
  ];

  switch (user.persona) {
    case 'crowd':
      rows.push(
        { label: extras.t('profile.workerId'), value: user.id },
        { label: extras.t('profile.certificationStatus'), value: summarizeCertifications(extras.certifications, extras.t) },
        { label: extras.t('profile.assignedKit'), value: extras.assignedKit },
      );
      break;
    case 'tenant':
      rows.push({ label: extras.t('profile.organization'), value: user.entity.name });
      break;
    case 'partner':
      rows.push({ label: extras.t('profile.organization'), value: user.entity.name });
      break;
    case 'sponsor':
      rows.push({ label: extras.t('profile.organization'), value: user.entity.name });
      break;
    case 'platform':
      break;
    case 'client':
      rows.push({ label: extras.t('profile.organization'), value: user.entity.name });
      break;
    case 'builder':
      rows.push({ label: extras.t('profile.organization'), value: user.entity.name });
      break;
    case 'aggregator':
      rows.push({ label: extras.t('profile.organization'), value: user.entity.name });
      break;
    case 'ide':
      rows.push({ label: extras.t('profile.organization'), value: user.entity.name });
      break;
  }

  return rows;
}

function summarizeCertifications(certifications: { status: string; title: string }[] | undefined, t: TFunction) {
  if (!certifications?.length) {
    return undefined;
  }
  const certifiedCount = certifications.filter((cert) => cert.status === 'certified').length;
  return `${certifiedCount}/${certifications.length} ${t('profile.certified')}`;
}

function getAccountStatus(session: AuthSession, t: TFunction) {
  return new Date(session.expiresAt).getTime() > Date.now() ? t('profile.active') : t('profile.expired');
}

function getInitials(value: string) {
  return value
    .replace(/@.*/, '')
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 0,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  heroText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  card: {
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  infoRows: {
    gap: spacing.sm,
  },
  infoRow: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  navRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
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
