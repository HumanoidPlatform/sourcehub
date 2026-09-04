import { router, type Href } from 'expo-router';
import { Bot, LogOut, RefreshCcw, Settings, ShieldCheck, UserRound } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { getLandingRouteForPersona } from '@/auth/persona-routing';
import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Badge } from '@/components/common/badge';
import { Card } from '@/components/common/card';
import { PersonaHeader } from '@/components/navigation/persona-header';
import { Screen } from '@/components/common/screen';
import { SectionHeader } from '@/components/common/section-header';
import { SharedWorkflowPanel } from '@/components/workflow/shared-workflow-panel';
import { getSafeFeedbackMessage } from '@/features/feedback/error-messages';
import { useFeedback } from '@/features/feedback/feedback-provider';
import { useTranslation } from '@/features/localization/use-translation';
import { personaConfigs, type PersonaConfig } from '@/features/personas/persona-config';
import { useAuthStore } from '@/store/auth-store';
import { useWorkflowStore } from '@/store/workflow-store';
import { colors, radii, spacing } from '@/theme/tokens';
import type { Persona } from '@/types/domain';

export function RoleDashboard({ config }: { config: PersonaConfig }) {
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);
  const switchPersona = useAuthStore((state) => state.switchPersona);
  const workflow = useWorkflowStore();
  const feedback = useFeedback();
  const t = useTranslation();
  const metrics = config.metrics(workflow);
  const worklist = config.worklist(workflow);
  const availablePersonas = session?.user.availablePersonas ?? [config.persona];
  const permissions = session?.user.permissions ?? [];
  const canSwitchPersona = availablePersonas.length > 1;

  async function switchAccount() {
    try {
      await logout();
      feedback.showSuccess('Signed out successfully');
      router.replace('/login');
    } catch (error) {
      feedback.showError(getSafeFeedbackMessage(error, 'Unable to sign out. Please try again.'));
    }
  }

  async function selectPersona(persona: Persona) {
    try {
      await switchPersona(persona);
      feedback.showSuccess(`Switched to ${personaConfigs[persona].label}`);
      router.replace(getLandingRouteForPersona(persona) as Href);
    } catch (error) {
      feedback.showError(getSafeFeedbackMessage(error, 'Unable to switch account.'));
    }
  }

  function runAction(actionId: NonNullable<PersonaConfig['primaryActions'][number]['actionId']>) {
    const actorId = session?.user.id ?? config.persona;
    const accountId = session?.user.tenant.id ?? actorId;

    try {
      switch (actionId) {
        case 'accept_delivery': {
          const delivery = workflow.deliveries.find((item) => item.clientId === accountId && item.status === 'CLIENT_REVIEW');
          if (!delivery) {
            throw new Error('No Client delivery is ready to accept yet.');
          }
          workflow.acceptDelivery(delivery.deliveryId, accountId);
          feedback.showSuccess('Delivery accepted');
          return;
        }
        case 'advance_custody': {
          const allocation = workflow.deviceAllocations.find((item) => item.sponsorId === actorId && item.status === 'ALLOCATED');
          if (!allocation) {
            throw new Error('No allocated device kit is ready to activate.');
          }
          workflow.activateDevice(allocation.deviceAllocationId, actorId);
          feedback.showSuccess('Device kit active');
          return;
        }
        case 'allocate_kits': {
          const allocation = workflow.deviceAllocations.find((item) => item.status === 'REQUESTED');
          if (!allocation) {
            throw new Error('No Partner device request is ready for allocation.');
          }
          workflow.allocateDevice(allocation.deviceAllocationId, actorId);
          feedback.showSuccess('Device kit allocated');
          return;
        }
        case 'commit_supply': {
          const allocation = workflow.partnerAllocations.find((item) => item.partnerId === actorId && item.status === 'PARTNER_ASSIGNED');
          if (!allocation) {
            throw new Error('No Aggregator-assigned project is ready for capacity commitment.');
          }
          workflow.partnerCommitCapacity(allocation.projectId, actorId, 8);
          feedback.showSuccess('Capacity committed');
          return;
        }
        case 'license_dataset': {
          const dataset = workflow.builderDatasets.find((item) => item.status === 'MARKETPLACE_VISIBLE');
          if (!dataset) {
            throw new Error('No governed dataset is visible in the Builder marketplace yet.');
          }
          workflow.licenseDataset(dataset.datasetId, actorId);
          feedback.showSuccess('Dataset licensed into Data Hub');
          return;
        }
        case 'publish_project': {
          const project = workflow.projects.find((item) => item.tenantId === accountId && item.status === 'PROJECT_CREATED');
          if (!project) {
            throw new Error('No Tenant project is ready to publish yet.');
          }
          workflow.publishProject(project.projectId);
          feedback.showSuccess('Project published. Eligible workers can now see the task.');
          return;
        }
        case 'request_kits': {
          const allocation = workflow.partnerAllocations.find(
            (item) => item.partnerId === actorId && (item.status === 'PARTNER_COMMITTED' || item.status === 'WORKERS_ENABLED'),
          );
          if (!allocation) {
            throw new Error('Commit capacity before requesting a device kit.');
          }
          const task = workflow.tasks.find((item) => item.taskId === allocation.taskId || item.projectId === allocation.projectId);
          if (!task) {
            throw new Error('No published task is linked to this Partner allocation.');
          }
          if (allocation.status === 'PARTNER_COMMITTED' && !task.enabledWorkerId) {
            workflow.partnerEnableWorker(task.taskId, actorId, 'user-crowd-anita');
          }
          workflow.requestDeviceForTask(task.taskId, actorId, 'user-crowd-anita');
          feedback.showSuccess('Device request sent');
          return;
        }
        default:
          feedback.showInfo('Use the Interlinked Workflow section above for shared demo state actions.');
      }
    } catch (error) {
      feedback.showError(getSafeFeedbackMessage(error, 'Demo workflow action failed.'));
    }
  }

  return (
    <Screen>
      <PersonaHeader
        eyebrow={config.label}
        meta={<Badge label={t('role.demoShell')} tone="info" />}
        subtitle={config.subtitle}
        title={config.landingLabel}
      />

      <Card style={styles.identity}>
        <View style={styles.avatar}>
          <UserRound color={colors.white} size={24} />
        </View>
        <View style={styles.identityText}>
          <AppText variant="subheading">{session?.user.name ?? t('role.demoUser')}</AppText>
          <AppText muted variant="small">
            {session?.user.email ?? t('role.notSignedIn')} · {session?.user.entity.name ?? config.label}
          </AppText>
        </View>
        <Badge label={config.persona} tone="purple" />
      </Card>

      {canSwitchPersona ? (
        <Card style={styles.switcher}>
          <View style={styles.switcherHeader}>
            <View>
              <AppText variant="label">{t('role.roleSwitcher')}</AppText>
              <AppText muted variant="small">
                {t('role.switcherDetail')}
              </AppText>
            </View>
            <Badge label={t('role.session')} tone="success" />
          </View>
          <View style={styles.chipRow}>
            {availablePersonas.map((persona) => {
              const personaConfig = personaConfigs[persona];
              const selected = persona === session?.user.persona;
              return (
                <Pressable
                  key={persona}
                  accessibilityRole="button"
                  disabled={selected}
                  onPress={() => selectPersona(persona)}
                  style={({ pressed }) => [styles.switchChip, selected && styles.switchChipSelected, pressed && styles.pressed]}>
                  <AppText color={selected ? colors.white : colors.ink} variant="caption">
                    {personaConfig.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </Card>
      ) : null}

      <View style={styles.metricGrid}>
        {metrics.map((metric) => (
          <View key={metric.label} style={styles.metric}>
            <AppText variant="heading">{metric.value}</AppText>
            <AppText muted variant="caption">
              {metric.label}
            </AppText>
          </View>
        ))}
      </View>

      <SharedWorkflowPanel accountId={session?.user.tenant.id} persona={config.persona} userId={session?.user.id} />

      <SectionHeader detail={t('role.navigationDetail')} title={t('role.navigation')} />
      <View style={styles.chipRow}>
        {config.navigation.map((item) => (
          <View key={item.key} style={styles.navChip}>
            <AppText variant="caption">{item.label}</AppText>
          </View>
        ))}
      </View>

      <SectionHeader detail={t('role.roleScopeDetail')} title={t('role.roleScope')} />
      <View style={styles.featureGrid}>
        {config.features.map((feature) => (
          <View key={feature} style={styles.featureChip}>
            <ShieldCheck color={colors.accentDark} size={14} />
            <AppText variant="caption">{feature}</AppText>
          </View>
        ))}
      </View>

      <SectionHeader detail={t('role.actionsDetail')} title={t('role.actions')} />
      <View style={styles.actionList}>
        {config.primaryActions.map((action) => {
          const Icon = action.icon;
          const hasPermission = action.permission ? permissions.includes(action.permission) : true;
          const enabled = Boolean(action.actionId) && hasPermission;
          return (
            <Card key={action.label} style={styles.actionCard}>
              <View style={styles.actionTop}>
                <View style={styles.actionIcon}>
                  <Icon color={colors.accentDark} size={20} />
                </View>
                <View style={styles.actionText}>
                  <AppText variant="label">{action.label}</AppText>
                  <AppText muted variant="small">
                    {action.detail}
                  </AppText>
                </View>
                <Badge
                  label={!hasPermission ? t('role.hiddenByRbac') : action.actionId ? t('role.demoState') : t('role.backendUnavailable')}
                  tone={!hasPermission ? 'danger' : action.actionId ? 'success' : 'warning'}
                />
              </View>
              <AppButton disabled={!enabled} onPress={action.actionId ? () => runAction(action.actionId!) : undefined} variant="secondary">
                {enabled ? t('role.runDemoAction') : t('role.mockedOnly')}
              </AppButton>
            </Card>
          );
        })}
      </View>

      <SectionHeader title={t('role.worklist')} />
      {worklist.length > 0 ? (
        worklist.map((item) => (
          <Card key={`${item.label}-${item.detail}`} style={styles.workItem}>
            <View style={styles.workTop}>
              <View style={styles.workText}>
                <AppText variant="label">{item.label}</AppText>
                <AppText muted variant="small">
                  {item.detail}
                </AppText>
              </View>
              <Badge label={item.status} tone={item.status === 'attention' ? 'warning' : item.status === 'ready' ? 'success' : 'info'} />
            </View>
          </Card>
        ))
      ) : (
        <Card>
          <AppText muted>{config.emptyState}</AppText>
        </Card>
      )}

      <SectionHeader detail={t('role.copilotDetail')} title={t('role.copilot')} />
      <Card style={styles.copilot}>
        <View style={styles.copilotHeader}>
          <Bot color={colors.accentDark} size={20} />
          <AppText variant="label">
            {config.label} {t('role.copilot')}
          </AppText>
        </View>
        {config.copilotSuggestions.map((suggestion) => (
          <AppText key={suggestion} muted variant="small">
            {suggestion}
          </AppText>
        ))}
      </Card>

      <View style={styles.accountActions}>
        <AppButton icon={Settings} onPress={() => router.push('/settings')} testID="role-dashboard-settings-entry" variant="secondary">
          {t('app.settings')}
        </AppButton>
        <AppButton icon={RefreshCcw} onPress={switchAccount} variant="secondary">
          {t('role.switchAccount')}
        </AppButton>
        <AppButton icon={LogOut} onPress={switchAccount} variant="danger">
          {t('profile.logoutAction')}
        </AppButton>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  identityText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  switcher: {
    gap: spacing.md,
  },
  switcherHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  switchChip: {
    minHeight: 38,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  switchChipSelected: {
    borderColor: colors.ink,
    backgroundColor: colors.ink,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metric: {
    flex: 1,
    minWidth: '30%',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  navChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    maxWidth: '100%',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.greenSoft,
  },
  actionList: {
    gap: spacing.md,
  },
  actionCard: {
    gap: spacing.md,
  },
  actionTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cyanSoft,
  },
  actionText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  workItem: {
    gap: spacing.sm,
  },
  workTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  workText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  copilot: {
    gap: spacing.sm,
  },
  copilotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  accountActions: {
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.78,
  },
});
