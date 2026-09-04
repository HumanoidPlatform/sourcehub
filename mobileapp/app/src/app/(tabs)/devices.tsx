import { Link2, PackageCheck, RefreshCw, Smartphone } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Badge } from '@/components/common/badge';
import { Card } from '@/components/common/card';
import { ProgressBar } from '@/components/common/progress-bar';
import { Screen } from '@/components/common/screen';
import { SectionHeader } from '@/components/common/section-header';
import { SkeletonList } from '@/components/common/skeleton';
import { useTranslation } from '@/features/localization/use-translation';
import { useKitCustody } from '@/hooks/use-odp-queries';
import { colors, spacing } from '@/theme/tokens';
import type { DeviceRecord } from '@/types/domain';
import { formatShortDate } from '@/utils/format';

export default function DevicesTab() {
  const { data: kit, isLoading } = useKitCustody();
  const t = useTranslation();

  return (
    <Screen>
      <View>
        <AppText muted variant="small">
          {t('tabs.devices')}
        </AppText>
        <AppText variant="title">{t('devices.kitCustody')}</AppText>
      </View>

      {isLoading || !kit ? (
        <SkeletonList rows={4} />
      ) : (
        <>
          <Card style={styles.kitCard}>
            <View style={styles.kitTop}>
              <View style={styles.kitIcon}>
                <PackageCheck color={colors.white} size={28} />
              </View>
              <View style={styles.kitText}>
                <AppText color={colors.white} variant="heading">
                  {kit.kitName}
                </AppText>
                <AppText color={colors.slate200} variant="small">
                  {kit.acceptedAt ? `${t('devices.accepted')} ${formatShortDate(kit.acceptedAt)}` : t('devices.awaitingCustody')}
                </AppText>
              </View>
              <Badge label={kit.custodyStatus.replace('_', ' ')} tone={kit.custodyStatus === 'accepted' ? 'success' : 'warning'} />
            </View>
            {kit.warnings.map((warning) => (
              <AppText key={warning} color={colors.slate200} variant="small">
                {warning}
              </AppText>
            ))}
          </Card>

          <SectionHeader detail={t('devices.custodyDetail')} title={t('devices.assignedDevices')} />
          {kit.devices.map((device) => (
            <DeviceCard key={device.id} device={device} />
          ))}

          <Card style={styles.serviceCard}>
            <AppText variant="subheading">{t('devices.pairDevice')}</AppText>
            <AppText muted>
              {t('devices.pairDeviceDetail')}
            </AppText>
            <AppButton disabled icon={Link2} variant="secondary">
              {t('devices.pairDevice')}
            </AppButton>
          </Card>
        </>
      )}
    </Screen>
  );
}

function DeviceCard({ device }: { device: DeviceRecord }) {
  const t = useTranslation();
  return (
    <Card style={styles.deviceCard}>
      <View style={styles.deviceTop}>
        <View style={styles.deviceIcon}>
          <Smartphone color={colors.accentDark} size={22} />
        </View>
        <View style={styles.deviceText}>
          <AppText variant="subheading">{device.name}</AppText>
          <AppText muted variant="small">
            {device.assetId} · {device.model}
          </AppText>
        </View>
        <Badge
          label={device.health.replace('_', ' ')}
          tone={device.health === 'good' ? 'success' : device.health === 'warning' ? 'warning' : 'danger'}
        />
      </View>
      <ProgressBar progress={device.battery} tone={device.battery < 0.25 ? 'danger' : device.battery < 0.5 ? 'warning' : 'accent'} />
      <View style={styles.deviceMeta}>
        <Meta label={t('devices.firmware')} value={device.firmware} />
        <Meta label={t('devices.sync')} value={device.syncStatus.replace('_', ' ')} />
        <Meta label={t('devices.offset')} value={`${device.timeSyncOffsetMs} ms`} />
        <Meta label={t('devices.connection')} value={device.connection.replace('_', ' ')} />
      </View>
      <AppButton icon={RefreshCw} variant="ghost">
        {t('devices.syncStatus')}
      </AppButton>
    </Card>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.meta}>
      <AppText muted variant="caption">
        {label}
      </AppText>
      <AppText variant="label">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  kitCard: {
    gap: spacing.md,
    backgroundColor: colors.darkBand,
    borderColor: colors.darkBand,
  },
  kitTop: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  kitIcon: {
    width: 52,
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  kitText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  deviceCard: {
    gap: spacing.md,
  },
  deviceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  deviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cyanSoft,
  },
  deviceText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  deviceMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  meta: {
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 132,
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
  },
  serviceCard: {
    gap: spacing.md,
  },
});
