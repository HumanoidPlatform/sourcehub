import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Badge } from '@/components/common/badge';
import { Card } from '@/components/common/card';
import { Screen } from '@/components/common/screen';
import { SectionHeader } from '@/components/common/section-header';
import { SkeletonList } from '@/components/common/skeleton';
import { localizeFormError } from '@/features/localization/form-errors';
import { useTranslation } from '@/features/localization/use-translation';
import { useWallet, useWithdrawWallet } from '@/hooks/use-odp-queries';
import { colors, radii, spacing } from '@/theme/tokens';
import { withdrawSchema, type WithdrawFormValues } from '@/types/forms';
import { formatCurrency, formatShortDate } from '@/utils/format';

export default function WalletTab() {
  const { data: wallet, isLoading } = useWallet();
  const withdraw = useWithdrawWallet();
  const t = useTranslation();
  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<WithdrawFormValues>({
    defaultValues: {
      amount: '500',
    },
    resolver: zodResolver(withdrawSchema),
  });

  const onWithdraw = handleSubmit((values) => {
    withdraw.mutate({ amount: Number(values.amount) });
  });

  return (
    <Screen>
      <View>
        <AppText muted variant="small">
          {t('wallet.earnings')}
        </AppText>
        <AppText variant="title">{t('wallet.title')}</AppText>
      </View>

      {isLoading || !wallet ? (
        <SkeletonList rows={3} />
      ) : (
        <>
          <Card style={styles.balanceCard}>
            <AppText color={colors.white} variant="small">
              {t('wallet.availableBalance')}
            </AppText>
            <AppText color={colors.white} style={styles.balance} variant="title">
              {formatCurrency(wallet.balance, wallet.currency)}
            </AppText>
            <View style={styles.walletStats}>
              <WalletStat label={t('wallet.pending')} value={formatCurrency(wallet.pending, wallet.currency)} />
              <WalletStat label={t('wallet.thisWeek')} value={formatCurrency(wallet.weekEarnings, wallet.currency)} />
              <WalletStat label={t('wallet.lifetime')} value={formatCurrency(wallet.lifetime, wallet.currency)} />
            </View>
          </Card>

          <SectionHeader detail={t('wallet.earningsByJobTypeDetail')} title={t('wallet.earningsByJobType')} />
          <View style={styles.jobTypeGrid}>
            {wallet.byJobType.map((entry) => (
              <View key={entry.label} style={styles.jobType}>
                <AppText muted variant="caption">
                  {entry.label}
                </AppText>
                <AppText variant="label">{formatCurrency(entry.amount, wallet.currency)}</AppText>
              </View>
            ))}
          </View>

          <SectionHeader detail={t('wallet.withdrawDetail')} title={t('wallet.withdraw')} />
          <Card style={styles.withdrawCard}>
            <View style={styles.field}>
              <AppText variant="label">{t('wallet.amount')}</AppText>
              <Controller
                control={control}
                name="amount"
                render={({ field: { onBlur, onChange, value } }) => (
                  <TextInput
                    keyboardType="numeric"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    style={styles.input}
                    value={value}
                  />
                )}
              />
              {errors.amount ? (
                <AppText color={colors.red} variant="small">
                  {localizeFormError(errors.amount.message, t)}
                </AppText>
              ) : null}
            </View>
            <AppButton loading={withdraw.isPending} onPress={onWithdraw}>
              {t('wallet.requestWithdrawal')}
            </AppButton>
            {withdraw.data ? <Badge label={withdraw.data.message} tone={withdraw.data.status === 'failed' ? 'danger' : 'info'} /> : null}
          </Card>

          <SectionHeader title={t('wallet.ledger')} />
          {wallet.ledger.map((entry) => (
            <Card key={entry.id} style={styles.ledgerRow}>
              <View style={styles.ledgerText}>
                <AppText variant="label">{entry.label}</AppText>
                <AppText muted variant="small">
                  {formatShortDate(entry.createdAt)}
                </AppText>
              </View>
              <View style={styles.ledgerRight}>
                <AppText variant="subheading">{formatCurrency(entry.amount, wallet.currency)}</AppText>
                <Badge label={entry.status} tone={entry.status === 'settled' ? 'success' : 'warning'} />
              </View>
            </Card>
          ))}

          <SectionHeader title={t('wallet.withdrawalActivity')} />
          {wallet.withdrawals.map((entry) => (
            <Card key={entry.id} style={styles.ledgerRow}>
              <View style={styles.ledgerText}>
                <AppText variant="label">{entry.id}</AppText>
                <AppText muted variant="small">
                  {formatShortDate(entry.createdAt)}
                </AppText>
              </View>
              <View style={styles.ledgerRight}>
                <AppText variant="subheading">{formatCurrency(entry.amount, wallet.currency)}</AppText>
                <Badge label={entry.status} tone={entry.status === 'settled' ? 'success' : entry.status === 'failed' ? 'danger' : 'warning'} />
              </View>
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}

function WalletStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.walletStat}>
      <AppText color={colors.slate200} variant="caption">
        {label}
      </AppText>
      <AppText color={colors.white} variant="subheading">
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    gap: spacing.lg,
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  balance: {
    fontSize: 34,
  },
  walletStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  walletStat: {
    flex: 1,
    minWidth: '30%',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  ledgerText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  ledgerRight: {
    alignItems: 'flex-end',
    maxWidth: '100%',
    gap: spacing.sm,
  },
  jobTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  jobType: {
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 132,
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  withdrawCard: {
    gap: spacing.md,
  },
  field: {
    gap: spacing.sm,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    color: colors.ink,
    backgroundColor: colors.white,
    fontSize: 16,
  },
});
