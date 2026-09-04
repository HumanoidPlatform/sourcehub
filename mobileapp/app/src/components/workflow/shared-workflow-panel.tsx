import {
  Boxes,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Eye,
  FileCheck2,
  RadioTower,
  RefreshCcw,
  Send,
  ShieldCheck,
  UploadCloud,
  UsersRound,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Badge } from '@/components/common/badge';
import { Card } from '@/components/common/card';
import { SectionHeader } from '@/components/common/section-header';
import { getSafeFeedbackMessage } from '@/features/feedback/error-messages';
import { useFeedback } from '@/features/feedback/feedback-provider';
import {
  type RequirementInput,
  type ProjectProgress,
  type SharedBuilderDataset,
  type SharedDelivery,
  type SharedDeviceAllocation,
  type SharedIdeWorkItem,
  type SharedPartnerAllocation,
  type SharedProject,
  type SharedRequirement,
  type SharedSubmission,
  useWorkflowStore,
} from '@/store/workflow-store';
import { colors, radii, spacing } from '@/theme/tokens';
import type { DemoPersona } from '@/types/domain';

type SharedWorkflowPanelProps = {
  accountId?: string;
  persona: DemoPersona;
  userId?: string;
};

const tenantId = 'tenant-meridian';
const defaultAggregatorId = 'user-meridian-ops';
const defaultPartnerId = 'user-partner-kova';
const defaultSponsorId = 'user-sponsor-fleet';
const defaultWorkerId = 'user-crowd-anita';
const defaultBuilderId = 'user-builder-001';
const durationPresets = [300, 600, 900, 1200, 1500, 1800];
const dataTypes: RequirementInput['dataType'][] = ['Video', 'Image', 'Audio', 'Text', 'Other'];

const defaultRequirementDraft: RequirementInput = {
  budget: 'INR 90,000 demo budget',
  businessUseCase: 'Train and evaluate industrial equipment inspection models with operating-condition video.',
  category: 'Industry / Manufacturing',
  clientId: 'client-autodrive',
  dataType: 'Video',
  deadline: '2026-09-30',
  description: 'Record industrial machinery or equipment during normal operation while keeping the equipment clearly visible.',
  instructions: 'Keep machinery in frame, capture normal operating conditions, avoid unrelated areas and do not enter restricted zones.',
  languageRequirements: 'English metadata, local spoken context accepted',
  locationRequirements: 'Factory or industrial workshop, India',
  qualityRequirements: 'Stable video, adequate lighting, equipment visible throughout, no unsafe approach to machinery.',
  quantity: 10,
  requiredDurationSeconds: 600,
  title: 'Industrial Equipment Video Dataset',
};

export function SharedWorkflowPanel({ accountId, persona, userId }: SharedWorkflowPanelProps) {
  if (persona === 'crowd') {
    return null;
  }

  return (
    <View style={styles.panel}>
      <SectionHeader detail="One shared local mock domain state powers these persona views." title="Interlinked Workflow" />
      <Badge label="Mock shared service" tone="info" />
      {persona === 'client' ? <ClientWorkflow accountId={accountId} userId={userId} /> : null}
      {persona === 'tenant' ? <TenantWorkflow userId={userId} /> : null}
      {persona === 'aggregator' ? <AggregatorWorkflow /> : null}
      {persona === 'partner' ? <PartnerWorkflow userId={userId} /> : null}
      {persona === 'sponsor' ? <SponsorWorkflow userId={userId} /> : null}
      {persona === 'qa' ? <QaWorkflow userId={userId} /> : null}
      {persona === 'platform' ? <AdminWorkflow userId={userId} /> : null}
      {persona === 'ide' ? <IdeWorkflow userId={userId} /> : null}
      {persona === 'builder' ? <BuilderWorkflow userId={userId} /> : null}
    </View>
  );
}

function ClientWorkflow({ accountId, userId }: { accountId?: string; userId?: string }) {
  const workflow = useWorkflowStore();
  const feedback = useFeedback();
  const latestRequirement = last(workflow.requirements);
  const latestProject = last(workflow.projects);
  const clientId = accountId ?? userId ?? defaultRequirementDraft.clientId;
  const deliveries = workflow.deliveries.filter((delivery) => delivery.clientId === clientId);
  const deliverables = workflow.submissions.filter((submission) => submission.status === 'WATERMARK_READY' || submission.status === 'DELIVERED');
  const progress = latestProject ? workflow.getProjectProgress(latestProject.projectId) : null;
  const [draft, setDraft] = useState<RequirementInput>({
    ...defaultRequirementDraft,
    clientId: accountId ?? userId ?? defaultRequirementDraft.clientId,
  });
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateDraft<K extends keyof RequirementInput>(key: K, value: RequirementInput[K]) {
    setDraft((current) => {
      const next = {
        ...current,
        [key]: value,
      };
      if (key === 'dataType') {
        next.requiredDurationSeconds = value !== 'Video' ? undefined : current.requiredDurationSeconds ?? 300;
      }
      return next;
    });
  }

  function submitRequirement() {
    setError(null);
    if (hasMatchingSubmittedRequirement(draft, clientId)) {
      feedback.showWarning('Requirement already submitted');
      return;
    }
    try {
      workflow.createRequirement({
        ...draft,
        clientId,
        quantity: Number(draft.quantity) || 1,
        requiredDurationSeconds: draft.dataType === 'Video' ? draft.requiredDurationSeconds : undefined,
      });
      feedback.showSuccess('Requirement submitted successfully');
      setReviewing(false);
    } catch (caught) {
      const message = getSafeFeedbackMessage(caught, 'Could not submit requirement. Please try again.');
      setError(message);
      feedback.showError(message);
    }
  }

  function resubmitWithChanges(requirement: SharedRequirement) {
    setError(null);
    try {
      workflow.resubmitRequirement(requirement.requirementId, accountId ?? userId ?? requirement.clientId, {
        requiredDurationSeconds: Math.max(requirement.requiredDurationSeconds ?? 300, 900),
        qualityRequirements: `${requirement.qualityRequirements} Minimum video duration increased per Tenant feedback.`,
      });
      feedback.showSuccess('Requirement updated successfully');
    } catch (caught) {
      const message = getSafeFeedbackMessage(caught, 'Could not submit requirement. Please try again.');
      setError(message);
      feedback.showError(message);
    }
  }

  function acceptDelivery(delivery: SharedDelivery) {
    setError(null);
    try {
      workflow.acceptDelivery(delivery.deliveryId, clientId);
      feedback.showSuccess('Delivery accepted');
    } catch (caught) {
      const message = getSafeFeedbackMessage(caught, 'Could not accept delivery. Please try again.');
      setError(message);
      feedback.showError(message);
    }
  }

  return (
    <View style={styles.stack}>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconWrap}>
            <ClipboardCheck color={colors.accentDark} size={20} />
          </View>
          <View style={styles.flex}>
            <AppText variant="subheading">New Data Requirement</AppText>
            <AppText muted variant="small">
              Fill once, review, then submit into the shared mock requirement inbox.
            </AppText>
          </View>
        </View>

        <Field label="Requirement title" value={draft.title} onChangeText={(value) => updateDraft('title', value)} />
        <Field label="Data category" value={draft.category} onChangeText={(value) => updateDraft('category', value)} />
        <Field label="Description" multiline value={draft.description} onChangeText={(value) => updateDraft('description', value)} />
        <Field label="Business use case" multiline value={draft.businessUseCase} onChangeText={(value) => updateDraft('businessUseCase', value)} />

        <View style={styles.field}>
          <AppText variant="label">Data type</AppText>
          <View style={styles.chipRow}>
            {dataTypes.map((type) => (
              <Pressable
                key={type}
                accessibilityRole="button"
                onPress={() => updateDraft('dataType', type)}
                style={({ pressed }) => [styles.choiceChip, draft.dataType === type && styles.choiceChipActive, pressed && styles.pressed]}>
                <AppText color={draft.dataType === type ? colors.white : colors.ink} variant="caption">
                  {type}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>

        <Field
          keyboardType="number-pad"
          label="Quantity required"
          value={String(draft.quantity)}
          onChangeText={(value) => updateDraft('quantity', Number(value.replace(/[^0-9]/g, '')) || 0)}
        />

        {draft.dataType === 'Video' ? (
          <View style={styles.field}>
            <AppText variant="label">Required video duration</AppText>
            <View style={styles.chipRow}>
              {durationPresets.map((seconds) => (
                <Pressable
                  key={seconds}
                  accessibilityRole="button"
                  onPress={() => updateDraft('requiredDurationSeconds', seconds)}
                  style={({ pressed }) => [
                    styles.choiceChip,
                    draft.requiredDurationSeconds === seconds && styles.choiceChipActive,
                    pressed && styles.pressed,
                  ]}>
                  <AppText color={draft.requiredDurationSeconds === seconds ? colors.white : colors.ink} variant="caption">
                    {formatMinutes(seconds)}
                  </AppText>
                </Pressable>
              ))}
            </View>
            <Field
              keyboardType="number-pad"
              label="Custom minutes"
              testID="client-required-duration-minutes"
              value={String(Math.round((draft.requiredDurationSeconds ?? 300) / 60))}
              onChangeText={(value) => {
                const minutes = Number(value.replace(/[^0-9]/g, '')) || 0;
                updateDraft('requiredDurationSeconds', minutes * 60);
              }}
            />
          </View>
        ) : null}

        <Field label="Geographic requirements" value={draft.locationRequirements} onChangeText={(value) => updateDraft('locationRequirements', value)} />
        <Field label="Language requirements" value={draft.languageRequirements} onChangeText={(value) => updateDraft('languageRequirements', value)} />
        <Field label="Deadline" value={draft.deadline} onChangeText={(value) => updateDraft('deadline', value)} />
        <Field label="Budget / reward" value={draft.budget} onChangeText={(value) => updateDraft('budget', value)} />
        <Field label="Quality requirements" multiline value={draft.qualityRequirements} onChangeText={(value) => updateDraft('qualityRequirements', value)} />
        <Field label="Additional instructions" multiline value={draft.instructions} onChangeText={(value) => updateDraft('instructions', value)} />

        {error ? (
          <AppText color={colors.red} variant="small">
            {error}
          </AppText>
        ) : null}

        <View style={styles.buttonRow}>
          <AppButton icon={Eye} onPress={() => setReviewing(true)} style={styles.flexButton} variant="secondary">
            Review
          </AppButton>
          <AppButton icon={Send} onPress={submitRequirement} style={styles.flexButton} testID="client-requirement-submit">
            Submit
          </AppButton>
        </View>
      </Card>

      {reviewing ? (
        <Card style={styles.card}>
          <AppText variant="subheading">Review Requirement</AppText>
          <SummaryRow label="Title" value={draft.title} />
          <SummaryRow label="Type" value={draft.dataType} />
          <SummaryRow label="Quantity" value={String(draft.quantity)} />
          {draft.dataType === 'Video' ? <SummaryRow label="Required duration" value={formatDuration(draft.requiredDurationSeconds)} /> : null}
          <SummaryRow label="Quality" value={draft.qualityRequirements} />
          <AppButton icon={Send} onPress={submitRequirement}>
            Submit Requirement
          </AppButton>
        </Card>
      ) : null}

      {latestRequirement ? (
        <RequirementStatusCard
          requirement={latestRequirement}
          action={
            latestRequirement.status === 'CHANGES_REQUESTED' ? (
              <AppButton icon={RefreshCcw} onPress={() => resubmitWithChanges(latestRequirement)} variant="secondary">
                Resubmit with 15 min
              </AppButton>
            ) : undefined
          }
        />
      ) : null}

      {progress && latestProject ? <ProjectProgressCard progress={progress} project={latestProject} /> : null}

      {deliveries.length ? (
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <FileCheck2 color={colors.green} size={22} />
            <View style={styles.flex}>
              <AppText variant="subheading">Delivery Review</AppText>
              <AppText muted variant="small">
                Client reviews the same Tenant-created delivery before it enters the Builder marketplace.
              </AppText>
            </View>
          </View>
          {deliveries.map((delivery) => (
            <View key={delivery.deliveryId} style={styles.embeddedBlock}>
              <DeliveryStatusCard embedded delivery={delivery} />
              <AppButton disabled={delivery.status !== 'CLIENT_REVIEW'} icon={CheckCircle2} onPress={() => acceptDelivery(delivery)}>
                Accept Delivery
              </AppButton>
            </View>
          ))}
        </Card>
      ) : null}

      {deliverables.length ? (
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <FileCheck2 color={colors.green} size={22} />
            <View style={styles.flex}>
              <AppText variant="subheading">Deliverables</AppText>
              <AppText muted variant="small">
                Client receives watermarked derivatives only in this prototype.
              </AppText>
            </View>
          </View>
          {deliverables.map((submission) => (
            <SubmissionMini key={submission.submissionId} submission={submission} />
          ))}
        </Card>
      ) : null}
    </View>
  );
}

function TenantWorkflow({ userId }: { userId?: string }) {
  const workflow = useWorkflowStore();
  const feedback = useFeedback();
  const [error, setError] = useState<string | null>(null);
  const latestProject = last(workflow.projects);
  const tenantSubmissions = workflow.submissions.filter((submission) => submission.tenantId === tenantId);
  const progress = latestProject ? workflow.getProjectProgress(latestProject.projectId) : null;

  function run(action: () => void, successMessage: string, failureMessage = 'Demo workflow action failed.') {
    setError(null);
    try {
      action();
      feedback.showSuccess(successMessage);
    } catch (caught) {
      const message = getSafeFeedbackMessage(caught, failureMessage);
      setError(message);
      feedback.showError(message);
    }
  }

  return (
    <View style={styles.stack}>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <UploadCloud color={colors.accentDark} size={22} />
          <View style={styles.flex}>
            <AppText variant="subheading">Incoming Requirements</AppText>
            <AppText muted variant="small">
              Tenant reviews the same Client-created records.
            </AppText>
          </View>
          <Badge label={`${workflow.requirements.length}`} tone="info" />
        </View>
        {workflow.requirements.length ? (
          workflow.requirements.map((requirement) => {
            const project = workflow.projects.find((item) => item.requirementId === requirement.requirementId);
            const initiative = workflow.initiatives.find((item) => item.requirementId === requirement.requirementId);
            return (
              <View key={requirement.requirementId} style={styles.embeddedBlock}>
                <RequirementStatusCard embedded requirement={requirement} />
                <View style={styles.buttonRow}>
                  <AppButton
                    disabled={!canTenantReview(requirement)}
                    icon={CheckCircle2}
                    onPress={() => run(() => workflow.acceptRequirement(requirement.requirementId, userId ?? tenantId), 'Requirement accepted')}
                    style={styles.flexButton}
                    variant="secondary">
                    Accept
                  </AppButton>
                  <AppButton
                    disabled={!canTenantReview(requirement)}
                    icon={RefreshCcw}
                    onPress={() =>
                      run(
                        () =>
                          workflow.requestRequirementChanges(
                            requirement.requirementId,
                            userId ?? tenantId,
                            'Please increase minimum video duration to 15 minutes.',
                          ),
                        'Change request sent to Client',
                      )
                    }
                    style={styles.flexButton}
                    variant="secondary">
                    Changes
                  </AppButton>
                </View>
                <AppButton
                  disabled={!canTenantReview(requirement)}
                  icon={AlertTriangle}
                  onPress={() =>
                    run(
                      () =>
                        workflow.rejectRequirement(
                          requirement.requirementId,
                          userId ?? tenantId,
                          'Rejected in the demo because the operational safety scope needs revision.',
                        ),
                      'Requirement rejected',
                    )
                  }
                  variant="danger">
                  Reject with reason
                </AppButton>
                {requirement.status === 'ACCEPTED' && !initiative ? (
                  <AppButton
                    icon={ClipboardCheck}
                    onPress={() =>
                      run(
                        () => workflow.createInitiativeFromRequirement(requirement.requirementId, tenantId),
                        'Initiative created',
                      )
                    }
                    variant="secondary">
                    Create Initiative
                  </AppButton>
                ) : null}
                {requirement.status === 'ACCEPTED' && initiative && !project ? (
                  <AppButton
                    icon={ClipboardCheck}
                    onPress={() =>
                      run(
                        () =>
                          workflow.createProjectFromRequirement(requirement.requirementId, tenantId, {
                            acceptanceCriteria: requirement.qualityRequirements,
                            allocation: 'Demo allocation to eligible Crowd workers through the existing Work tab.',
                            certifications: 'Field Privacy and Industrial Safety basics',
                            instructions: requirement.instructions,
                            qaRequirements: 'QA approval required before Tenant final acceptance.',
                            workerEligibility: 'Crowd workers who pass readiness and safe capture guidance.',
                            workerReward: 950,
                          }),
                        'Project created successfully',
                      )
                    }>
                    Create Project from Requirement
                  </AppButton>
                ) : null}
              </View>
            );
          })
        ) : (
          <AppText muted>No Client requirements have been submitted yet.</AppText>
        )}
      </Card>

      {latestProject ? (
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <ClipboardCheck color={colors.accentDark} size={22} />
            <View style={styles.flex}>
              <AppText variant="subheading">Project / Task Creation</AppText>
              <AppText muted variant="small">
                Project is prepopulated from the accepted requirement.
              </AppText>
            </View>
            <Badge label={latestProject.status} tone={statusTone(latestProject.status)} />
          </View>
          <SummaryRow label="Project" value={latestProject.title} />
          <SummaryRow label="Required duration" value={formatDuration(latestProject.requiredDurationSeconds)} />
          <SummaryRow label="Worker reward" value={`INR ${latestProject.workerReward}`} />
          <SummaryRow label="QA requirements" value={latestProject.qaRequirements} />
          {latestProject.status === 'PROJECT_CREATED' ? (
            <AppButton
              icon={Send}
              onPress={() => run(() => workflow.publishProject(latestProject.projectId), 'Project published. Eligible workers can now see the task.', 'Unable to publish project.')}>
              Publish Task
            </AppButton>
          ) : null}
          {progress ? <ProjectProgressCard progress={progress} project={latestProject} /> : null}
        </Card>
      ) : null}

      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <ShieldCheck color={colors.cobalt} size={22} />
          <View style={styles.flex}>
            <AppText variant="subheading">Submissions</AppText>
            <AppText muted variant="small">
              Tenant can route to QA, then perform final review.
            </AppText>
          </View>
        </View>
        {tenantSubmissions.length ? (
          tenantSubmissions.map((submission) => (
            <View key={submission.submissionId} style={styles.embeddedBlock}>
              <SubmissionStatusCard embedded submission={submission} />
              <View style={styles.buttonRow}>
                <AppButton
                  disabled={submission.status !== 'TENANT_REVIEW' || submission.qaDecision === 'APPROVED'}
                  icon={RadioTower}
                  onPress={() => run(() => workflow.routeSubmissionToQa(submission.submissionId, userId ?? tenantId), 'Submission sent to QA')}
                  style={styles.flexButton}
                  variant="secondary">
                  Send to QA
                </AppButton>
                <AppButton
                  disabled={submission.status !== 'TENANT_REVIEW' || submission.qaDecision !== 'APPROVED'}
                  icon={CheckCircle2}
                  onPress={() =>
                    run(
                      () => {
                        workflow.tenantFinalizeSubmission(submission.submissionId, tenantId, 'ACCEPT');
                        feedback.showInfo('Preparing protected video');
                      },
                      'Submission accepted',
                    )
                  }
                  style={styles.flexButton}>
                  Accept Final
                </AppButton>
              </View>
              {submission.status === 'WATERMARK_PROCESSING' ? (
                <AppButton
                  icon={ShieldCheck}
                  onPress={() =>
                    run(
                      () => {
                        workflow.completeWatermark(submission.submissionId);
                        feedback.showSuccess('Reward credited to wallet');
                      },
                      'Watermarked video is ready',
                      'Unable to prepare watermarked video',
                    )
                  }
                  variant="secondary">
                  Complete Mock Watermark
                </AppButton>
              ) : null}
            </View>
          ))
        ) : (
          <AppText muted>No worker submissions are visible yet.</AppText>
        )}
      </Card>

      {error ? (
        <AppText color={colors.red} variant="small">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

function AggregatorWorkflow() {
  const workflow = useWorkflowStore();
  const feedback = useFeedback();
  const [error, setError] = useState<string | null>(null);
  const activeProjects = workflow.projects.filter((project) => project.status === 'PROJECT_ACTIVE');

  function run(action: () => void, successMessage: string) {
    setError(null);
    try {
      action();
      feedback.showSuccess(successMessage);
    } catch (caught) {
      const message = getSafeFeedbackMessage(caught, 'Aggregator action failed.');
      setError(message);
      feedback.showError(message);
    }
  }

  return (
    <View style={styles.stack}>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <UsersRound color={colors.accentDark} size={22} />
          <View style={styles.flex}>
            <AppText variant="subheading">Operations Monitor</AppText>
            <AppText muted variant="small">
              Aggregator reads the same projects, tasks and submissions. Tenant-owned QA routing stays mocked unless permitted.
            </AppText>
          </View>
        </View>
        {activeProjects.length ? (
          activeProjects.map((project) => {
            const progress = workflow.getProjectProgress(project.projectId);
            const allocation = workflow.partnerAllocations.find((item) => item.projectId === project.projectId);
            return (
              <View key={project.projectId} style={styles.embeddedBlock}>
                <ProjectProgressCard progress={progress} project={project} />
                {allocation ? <PartnerAllocationCard allocation={allocation} /> : null}
                <View style={styles.buttonRow}>
                  <AppButton
                    disabled={Boolean(allocation)}
                    icon={CheckCircle2}
                    onPress={() =>
                      run(() => workflow.aggregatorAcceptProject(project.projectId, defaultAggregatorId), 'Project coordination accepted')
                    }
                    style={styles.flexButton}
                    variant="secondary">
                    Accept / Coordinate
                  </AppButton>
                  <AppButton
                    disabled={!allocation || allocation.status !== 'AGGREGATOR_ACCEPTED'}
                    icon={UsersRound}
                    onPress={() =>
                      run(() => workflow.assignProjectToPartner(project.projectId, defaultAggregatorId, defaultPartnerId), 'Partner assigned')
                    }
                    style={styles.flexButton}>
                    Assign Partner
                  </AppButton>
                </View>
              </View>
            );
          })
        ) : (
          <AppText muted>No active shared projects yet.</AppText>
        )}
        {workflow.tasks.map((task) => (
          <SummaryRow key={task.taskId} label={task.title} value={`${task.status} · reward INR ${task.workerReward}`} />
        ))}
      </Card>
      {error ? (
        <AppText color={colors.red} variant="small">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

function PartnerWorkflow({ userId }: { userId?: string }) {
  const workflow = useWorkflowStore();
  const feedback = useFeedback();
  const [error, setError] = useState<string | null>(null);
  const partnerId = userId ?? defaultPartnerId;
  const allocations = workflow.partnerAllocations.filter((allocation) => allocation.partnerId === partnerId);

  function run(action: () => void, successMessage: string) {
    setError(null);
    try {
      action();
      feedback.showSuccess(successMessage);
    } catch (caught) {
      const message = getSafeFeedbackMessage(caught, 'Partner action failed.');
      setError(message);
      feedback.showError(message);
    }
  }

  return (
    <View style={styles.stack}>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <UsersRound color={colors.accentDark} size={22} />
          <View style={styles.flex}>
            <AppText variant="subheading">Project Inbox</AppText>
            <AppText muted variant="small">
              Partner receives Aggregator-assigned allocations and enables Crowd workers against the same task.
            </AppText>
          </View>
          <Badge label={`${allocations.length}`} tone={allocations.length ? 'warning' : 'info'} />
        </View>
        {allocations.length ? (
          allocations.map((allocation) => {
            const project = workflow.projects.find((item) => item.projectId === allocation.projectId);
            const task = workflow.tasks.find((item) => item.taskId === allocation.taskId || item.projectId === allocation.projectId);
            const device = workflow.deviceAllocations.find((item) => item.projectId === allocation.projectId && item.partnerId === partnerId);
            return (
              <View key={allocation.allocationId} style={styles.embeddedBlock}>
                <PartnerAllocationCard allocation={allocation} />
                {project ? <ProjectProgressCard progress={workflow.getProjectProgress(project.projectId)} project={project} /> : null}
                {device ? <DeviceAllocationCard allocation={device} /> : null}
                <View style={styles.buttonRow}>
                  <AppButton
                    disabled={allocation.status !== 'PARTNER_ASSIGNED'}
                    icon={CheckCircle2}
                    onPress={() => run(() => workflow.partnerCommitCapacity(allocation.projectId, partnerId, 8), 'Capacity committed')}
                    style={styles.flexButton}
                    variant="secondary">
                    Commit Capacity
                  </AppButton>
                  <AppButton
                    disabled={!task || allocation.status !== 'PARTNER_COMMITTED'}
                    icon={UsersRound}
                    onPress={() => task && run(() => workflow.partnerEnableWorker(task.taskId, partnerId, defaultWorkerId), 'Worker enabled')}
                    style={styles.flexButton}>
                    Enable Worker
                  </AppButton>
                </View>
                <AppButton
                  disabled={!task || (allocation.status !== 'PARTNER_COMMITTED' && allocation.status !== 'WORKERS_ENABLED')}
                  icon={Boxes}
                  onPress={() => task && run(() => workflow.requestDeviceForTask(task.taskId, partnerId, defaultWorkerId), 'Device request sent')}
                  variant="secondary">
                  Request Device Kit
                </AppButton>
              </View>
            );
          })
        ) : (
          <AppText muted>No Aggregator-assigned project is visible yet.</AppText>
        )}
      </Card>
      {error ? (
        <AppText color={colors.red} variant="small">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

function SponsorWorkflow({ userId }: { userId?: string }) {
  const workflow = useWorkflowStore();
  const feedback = useFeedback();
  const [error, setError] = useState<string | null>(null);
  const sponsorId = userId ?? defaultSponsorId;

  function run(action: () => void, successMessage: string) {
    setError(null);
    try {
      action();
      feedback.showSuccess(successMessage);
    } catch (caught) {
      const message = getSafeFeedbackMessage(caught, 'Device Sponsor action failed.');
      setError(message);
      feedback.showError(message);
    }
  }

  return (
    <View style={styles.stack}>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Boxes color={colors.accentDark} size={22} />
          <View style={styles.flex}>
            <AppText variant="subheading">Device Demand</AppText>
            <AppText muted variant="small">
              Sponsor sees Partner kit requests and advances the same device allocation record.
            </AppText>
          </View>
          <Badge label={`${workflow.deviceAllocations.length}`} tone={workflow.deviceAllocations.length ? 'warning' : 'info'} />
        </View>
        {workflow.deviceAllocations.length ? (
          workflow.deviceAllocations.map((allocation) => (
            <View key={allocation.deviceAllocationId} style={styles.embeddedBlock}>
              <DeviceAllocationCard allocation={allocation} />
              <View style={styles.buttonRow}>
                <AppButton
                  disabled={allocation.status !== 'REQUESTED'}
                  icon={CheckCircle2}
                  onPress={() => run(() => workflow.allocateDevice(allocation.deviceAllocationId, sponsorId), 'Device kit allocated')}
                  style={styles.flexButton}
                  variant="secondary">
                  Allocate Kit
                </AppButton>
                <AppButton
                  disabled={allocation.status !== 'ALLOCATED' || allocation.sponsorId !== sponsorId}
                  icon={RadioTower}
                  onPress={() => run(() => workflow.activateDevice(allocation.deviceAllocationId, sponsorId), 'Device kit active')}
                  style={styles.flexButton}>
                  Mark Active
                </AppButton>
              </View>
            </View>
          ))
        ) : (
          <AppText muted>No Partner device request has been created yet.</AppText>
        )}
      </Card>
      {error ? (
        <AppText color={colors.red} variant="small">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

function QaWorkflow({ userId }: { userId?: string }) {
  const workflow = useWorkflowStore();
  const feedback = useFeedback();
  const [error, setError] = useState<string | null>(null);
  const queue = workflow.submissions.filter((submission) => submission.status === 'QA_REVIEW');

  function review(submissionId: string, decision: 'APPROVED' | 'REJECTED' | 'ESCALATED') {
    setError(null);
    try {
      workflow.qaReviewSubmission(submissionId, userId ?? 'user-meridian-qa', decision, `Demo QA ${decision.toLowerCase()} decision.`);
      feedback.showSuccess(getQaFeedbackMessage(decision));
    } catch (caught) {
      const message = getSafeFeedbackMessage(caught, 'QA action failed.');
      setError(message);
      feedback.showError(message);
    }
  }

  return (
    <View style={styles.stack}>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <ShieldCheck color={colors.cobalt} size={22} />
          <View style={styles.flex}>
            <AppText variant="subheading">Review Queue</AppText>
            <AppText muted variant="small">
              QA opens the shared submission with Client and Tenant context.
            </AppText>
          </View>
          <Badge label={`${queue.length}`} tone={queue.length ? 'warning' : 'success'} />
        </View>
        {queue.length ? (
          queue.map((submission) => (
            <View key={submission.submissionId} style={styles.embeddedBlock}>
              <SubmissionStatusCard embedded submission={submission} />
              <SummaryRow label="Prototype video" value={`Playable local demo asset: ${submission.mediaAssetId}`} />
              <View style={styles.buttonRow}>
                <AppButton icon={CheckCircle2} onPress={() => review(submission.submissionId, 'APPROVED')} style={styles.flexButton}>
                  Approve
                </AppButton>
                <AppButton icon={AlertTriangle} onPress={() => review(submission.submissionId, 'REJECTED')} style={styles.flexButton} variant="danger">
                  Reject
                </AppButton>
              </View>
              <AppButton icon={RadioTower} onPress={() => review(submission.submissionId, 'ESCALATED')} variant="secondary">
                Escalate
              </AppButton>
            </View>
          ))
        ) : (
          <AppText muted>No submissions have been routed to QA.</AppText>
        )}
      </Card>
      {error ? (
        <AppText color={colors.red} variant="small">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

function IdeWorkflow({ userId }: { userId?: string }) {
  const workflow = useWorkflowStore();
  const feedback = useFeedback();
  const [error, setError] = useState<string | null>(null);

  function complete(item: SharedIdeWorkItem) {
    setError(null);
    try {
      workflow.completeIdeWork(item.ideWorkItemId, userId ?? defaultWorkerId);
      feedback.showSuccess('IDE review work completed');
    } catch (caught) {
      const message = getSafeFeedbackMessage(caught, 'IDE action failed.');
      setError(message);
      feedback.showError(message);
    }
  }

  return (
    <View style={styles.stack}>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <ClipboardCheck color={colors.accentDark} size={22} />
          <View style={styles.flex}>
            <AppText variant="subheading">Shared Workbench</AppText>
            <AppText muted variant="small">
              IDE review items reference the same Worker submission, task, project and requirement IDs.
            </AppText>
          </View>
          <Badge label={`${workflow.ideWorkItems.length}`} tone={workflow.ideWorkItems.length ? 'warning' : 'info'} />
        </View>
        {workflow.ideWorkItems.length ? (
          workflow.ideWorkItems.map((item) => (
            <View key={item.ideWorkItemId} style={styles.embeddedBlock}>
              <IdeWorkItemCard item={item} />
              <AppButton disabled={item.status !== 'OPEN'} icon={CheckCircle2} onPress={() => complete(item)} variant="secondary">
                Complete IDE Review
              </AppButton>
            </View>
          ))
        ) : (
          <AppText muted>No shared review, annotation, transcription or evaluation work is open yet.</AppText>
        )}
      </Card>
      {error ? (
        <AppText color={colors.red} variant="small">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

function BuilderWorkflow({ userId }: { userId?: string }) {
  const workflow = useWorkflowStore();
  const feedback = useFeedback();
  const [error, setError] = useState<string | null>(null);
  const builderId = userId ?? defaultBuilderId;

  function license(dataset: SharedBuilderDataset) {
    setError(null);
    try {
      workflow.licenseDataset(dataset.datasetId, builderId);
      feedback.showSuccess('Dataset licensed into Data Hub');
    } catch (caught) {
      const message = getSafeFeedbackMessage(caught, 'Builder action failed.');
      setError(message);
      feedback.showError(message);
    }
  }

  return (
    <View style={styles.stack}>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <FileCheck2 color={colors.green} size={22} />
          <View style={styles.flex}>
            <AppText variant="subheading">Governed Data Hub</AppText>
            <AppText muted variant="small">
              Builder sees datasets only after Client accepts a delivery from the shared lifecycle.
            </AppText>
          </View>
          <Badge label={`${workflow.builderDatasets.length}`} tone={workflow.builderDatasets.length ? 'success' : 'info'} />
        </View>
        {workflow.builderDatasets.length ? (
          workflow.builderDatasets.map((dataset) => (
            <View key={dataset.datasetId} style={styles.embeddedBlock}>
              <BuilderDatasetCard dataset={dataset} />
              <AppButton disabled={dataset.status === 'LICENSED'} icon={Download} onPress={() => license(dataset)} variant="secondary">
                License Dataset
              </AppButton>
            </View>
          ))
        ) : (
          <AppText muted>No Client-accepted governed dataset is visible yet.</AppText>
        )}
      </Card>
      {error ? (
        <AppText color={colors.red} variant="small">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

function AdminWorkflow({ userId }: { userId?: string }) {
  const workflow = useWorkflowStore();
  const feedback = useFeedback();
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const exportable = workflow.submissions.find((submission) => submission.status === 'WATERMARK_READY' || submission.status === 'DELIVERED');

  function exportOriginal() {
    setMessage(null);
    if (!reason.trim()) {
      const prompt = 'Please provide a reason for accessing the original video';
      setMessage(prompt);
      feedback.showWarning(prompt);
      return;
    }
    try {
      const event = workflow.exportOriginal(exportable?.submissionId ?? '', userId ?? 'user-platform-admin', reason);
      setMessage(`Audit event created: ${event.id}`);
      setReason('');
      feedback.showSuccess('Original export authorized');
    } catch (caught) {
      const message = getSafeFeedbackMessage(caught, 'Admin action failed. Please try again.');
      setMessage(message);
      feedback.showError(message);
    }
  }

  return (
    <View style={styles.stack}>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Eye color={colors.accentDark} size={22} />
          <View style={styles.flex}>
            <AppText variant="subheading">Admin Audit</AppText>
            <AppText muted variant="small">
              Complete Client to delivery lifecycle audit in shared mock state.
            </AppText>
          </View>
          <Badge label={`${workflow.auditEvents.length} events`} tone="info" />
        </View>
        <SummaryRow label="Requirements" value={`${workflow.requirements.length}`} />
        <SummaryRow label="Initiatives" value={`${workflow.initiatives.length}`} />
        <SummaryRow label="Projects" value={`${workflow.projects.length}`} />
        <SummaryRow label="Allocations" value={`${workflow.partnerAllocations.length}`} />
        <SummaryRow label="Devices" value={`${workflow.deviceAllocations.length}`} />
        <SummaryRow label="Submissions" value={`${workflow.submissions.length}`} />
        <SummaryRow label="Deliveries" value={`${workflow.deliveries.length}`} />
        <SummaryRow label="Datasets" value={`${workflow.builderDatasets.length}`} />
        {workflow.auditEvents.slice(-8).reverse().map((event) => (
          <SummaryRow key={event.id} label={event.action} value={`${event.actorId} · ${event.detail}`} />
        ))}
        {workflow.auditEvents.length === 0 ? <AppText muted>No lifecycle events yet.</AppText> : null}
      </Card>

      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Download color={colors.red} size={22} />
          <View style={styles.flex}>
            <AppText variant="subheading">Export Original</AppText>
            <AppText muted variant="small">
              Admin-only mock action. A reason is required and an audit event is created.
            </AppText>
          </View>
        </View>
        <Field multiline label="Reason" value={reason} onChangeText={setReason} placeholder="Legal review, DSAR, or incident investigation" />
        <AppButton disabled={!exportable} icon={Download} onPress={exportOriginal} variant="danger">
          Export Original
        </AppButton>
        {exportable ? <SubmissionMini submission={exportable} /> : <AppText muted>No watermarked submission is exportable yet.</AppText>}
        {message ? (
          <AppText color={message.includes('created') ? colors.green : colors.red} variant="small">
            {message}
          </AppText>
        ) : null}
      </Card>
    </View>
  );
}

function RequirementStatusCard({
  action,
  embedded,
  requirement,
}: {
  action?: ReactNode;
  embedded?: boolean;
  requirement: SharedRequirement;
}) {
  const content = (
    <>
      <View style={styles.cardHeader}>
        <FileCheck2 color={colors.accentDark} size={22} />
        <View style={styles.flex}>
          <AppText variant="subheading">{requirement.title}</AppText>
          <AppText muted variant="small">
            {requirement.category} · {requirement.dataType}
          </AppText>
        </View>
        <Badge label={requirement.status} tone={statusTone(requirement.status)} />
      </View>
      <SummaryRow label="Requirement ID" value={requirement.requirementId} />
      <SummaryRow label="Quantity" value={String(requirement.quantity)} />
      {requirement.dataType === 'Video' ? <SummaryRow label="Required duration" value={formatDuration(requirement.requiredDurationSeconds)} /> : null}
      <SummaryRow label="Quality" value={requirement.qualityRequirements} />
      {requirement.rejectionReason ? <SummaryRow label="Rejection reason" value={requirement.rejectionReason} /> : null}
      {last(requirement.history)?.comment ? <SummaryRow label="Latest history" value={last(requirement.history)?.comment ?? ''} /> : null}
      {action}
    </>
  );
  return embedded ? <View style={styles.embeddedCard}>{content}</View> : <Card style={styles.card}>{content}</Card>;
}

function SubmissionStatusCard({ embedded, submission }: { embedded?: boolean; submission: SharedSubmission }) {
  const content = (
    <>
      <View style={styles.cardHeader}>
        <ShieldCheck color={colors.cobalt} size={22} />
        <View style={styles.flex}>
          <AppText variant="subheading">{submission.submissionId}</AppText>
          <AppText muted variant="small">
            Worker {submission.workerId}
          </AppText>
        </View>
        <Badge label={submission.status} tone={statusTone(submission.status)} />
      </View>
      <SummaryRow label="Requirement" value={submission.requirementId} />
      <SummaryRow label="Required duration" value={formatDuration(submission.requiredDurationSeconds)} />
      <SummaryRow label="Submitted duration" value={formatDuration(submission.actualDurationSeconds)} />
      <SummaryRow label="Semantic" value={submission.semanticStatus ?? 'UNCERTAIN'} />
      <SummaryRow label="QC" value={submission.qcStatus} />
      <SummaryRow label="Duplicate" value={submission.duplicateStatus} />
      <SummaryRow label="QA result" value={submission.qaDecision ?? submission.reviewStatus} />
      {submission.watermarkedAssetId ? <SummaryRow label="Watermarked asset" value={submission.watermarkedAssetId} /> : null}
    </>
  );
  return embedded ? <View style={styles.embeddedCard}>{content}</View> : <Card style={styles.card}>{content}</Card>;
}

function SubmissionMini({ submission }: { submission: SharedSubmission }) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.flex}>
        <AppText variant="label">{submission.submissionId}</AppText>
        <AppText muted variant="small">
          {submission.watermarkedAssetId ?? 'Mock watermark not ready'}
        </AppText>
      </View>
      <Badge label={submission.status} tone={statusTone(submission.status)} />
    </View>
  );
}

function ProjectProgressCard({ progress, project }: { progress: ProjectProgress; project: SharedProject }) {
  return (
    <View style={styles.progressBlock}>
      <View style={styles.cardHeader}>
        <AppText variant="label">{project.title}</AppText>
        <Badge label={project.status} tone={statusTone(project.status)} />
      </View>
      <View style={styles.metricGrid}>
        <Metric label="Required" value={progress.required} />
        <Metric label="Assigned" value={progress.assigned} />
        <Metric label="Submitted" value={progress.submitted} />
        <Metric label="QA Passed" value={progress.qaPassed} />
        <Metric label="Accepted" value={progress.accepted} />
        <Metric label="Rejected" value={progress.rejected} />
        <Metric label="Remaining" value={progress.remaining} />
      </View>
    </View>
  );
}

function PartnerAllocationCard({ allocation }: { allocation: SharedPartnerAllocation }) {
  return (
    <View style={styles.embeddedCard}>
      <View style={styles.cardHeader}>
        <UsersRound color={colors.accentDark} size={22} />
        <View style={styles.flex}>
          <AppText variant="subheading">{allocation.allocationId}</AppText>
          <AppText muted variant="small">
            Project {allocation.projectId}
          </AppText>
        </View>
        <Badge label={allocation.status} tone={statusTone(allocation.status)} />
      </View>
      <SummaryRow label="Requirement" value={allocation.requirementId} />
      <SummaryRow label="Aggregator" value={allocation.aggregatorId} />
      <SummaryRow label="Partner" value={allocation.partnerId ?? 'Not assigned'} />
      <SummaryRow label="Task" value={allocation.taskId ?? 'Pending publish'} />
      <SummaryRow label="Capacity" value={allocation.capacity ? `${allocation.capacity} workers` : 'Not committed'} />
    </View>
  );
}

function DeviceAllocationCard({ allocation }: { allocation: SharedDeviceAllocation }) {
  return (
    <View style={styles.embeddedCard}>
      <View style={styles.cardHeader}>
        <Boxes color={colors.accentDark} size={22} />
        <View style={styles.flex}>
          <AppText variant="subheading">{allocation.deviceAllocationId}</AppText>
          <AppText muted variant="small">
            {allocation.kitLabel}
          </AppText>
        </View>
        <Badge label={allocation.status} tone={statusTone(allocation.status)} />
      </View>
      <SummaryRow label="Project" value={allocation.projectId} />
      <SummaryRow label="Task" value={allocation.taskId} />
      <SummaryRow label="Partner" value={allocation.partnerId} />
      <SummaryRow label="Worker" value={allocation.workerId ?? 'Pending'} />
      <SummaryRow label="Sponsor" value={allocation.sponsorId ?? 'Pending'} />
    </View>
  );
}

function DeliveryStatusCard({ delivery, embedded }: { delivery: SharedDelivery; embedded?: boolean }) {
  const content = (
    <>
      <View style={styles.cardHeader}>
        <FileCheck2 color={colors.green} size={22} />
        <View style={styles.flex}>
          <AppText variant="subheading">{delivery.deliveryId}</AppText>
          <AppText muted variant="small">
            {delivery.title}
          </AppText>
        </View>
        <Badge label={delivery.status} tone={statusTone(delivery.status)} />
      </View>
      <SummaryRow label="Requirement" value={delivery.requirementId} />
      <SummaryRow label="Project" value={delivery.projectId} />
      <SummaryRow label="Initiative" value={delivery.initiativeId ?? 'Not linked'} />
      <SummaryRow label="Submissions" value={delivery.submissionIds.join(', ')} />
      <SummaryRow label="Dataset" value={delivery.datasetId ?? 'Not published'} />
    </>
  );
  return embedded ? <View style={styles.embeddedCard}>{content}</View> : <Card style={styles.card}>{content}</Card>;
}

function IdeWorkItemCard({ item }: { item: SharedIdeWorkItem }) {
  return (
    <View style={styles.embeddedCard}>
      <View style={styles.cardHeader}>
        <ClipboardCheck color={colors.accentDark} size={22} />
        <View style={styles.flex}>
          <AppText variant="subheading">{item.ideWorkItemId}</AppText>
          <AppText muted variant="small">
            {item.title}
          </AppText>
        </View>
        <Badge label={item.status} tone={statusTone(item.status)} />
      </View>
      <SummaryRow label="Work type" value={item.workType} />
      <SummaryRow label="Submission" value={item.submissionId} />
      <SummaryRow label="Task" value={item.taskId} />
      <SummaryRow label="Project" value={item.projectId} />
      <SummaryRow label="Requirement" value={item.requirementId} />
    </View>
  );
}

function BuilderDatasetCard({ dataset }: { dataset: SharedBuilderDataset }) {
  return (
    <View style={styles.embeddedCard}>
      <View style={styles.cardHeader}>
        <FileCheck2 color={colors.green} size={22} />
        <View style={styles.flex}>
          <AppText variant="subheading">{dataset.datasetId}</AppText>
          <AppText muted variant="small">
            {dataset.title}
          </AppText>
        </View>
        <Badge label={dataset.status} tone={statusTone(dataset.status)} />
      </View>
      <SummaryRow label="Delivery" value={dataset.deliveryId} />
      <SummaryRow label="Project" value={dataset.projectId} />
      <SummaryRow label="Requirement" value={dataset.requirementId} />
      <SummaryRow label="Licensed by" value={dataset.licensedBy ?? 'Not licensed'} />
    </View>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metric}>
      <AppText variant="heading">{value}</AppText>
      <AppText muted variant="caption">
        {label}
      </AppText>
    </View>
  );
}

function Field({
  keyboardType,
  label,
  multiline,
  onChangeText,
  placeholder,
  testID,
  value,
}: {
  keyboardType?: 'default' | 'number-pad';
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  placeholder?: string;
  testID?: string;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.slate500}
        style={[styles.input, multiline && styles.multilineInput]}
        testID={testID}
        value={value}
      />
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <AppText muted style={styles.summaryLabel} variant="caption">
        {label}
      </AppText>
      <AppText style={styles.summaryValue} variant="small">
        {value}
      </AppText>
    </View>
  );
}

function canTenantReview(requirement: SharedRequirement) {
  return requirement.status === 'SUBMITTED' || requirement.status === 'RESUBMITTED' || requirement.status === 'UNDER_TENANT_REVIEW';
}

function hasMatchingSubmittedRequirement(draft: RequirementInput, clientId: string) {
  return useWorkflowStore
    .getState()
    .requirements.some(
      (requirement) =>
        requirement.clientId === clientId &&
        requirement.title.trim().toLowerCase() === draft.title.trim().toLowerCase() &&
        requirement.description.trim().toLowerCase() === draft.description.trim().toLowerCase() &&
        requirement.status !== 'REJECTED',
    );
}

function getQaFeedbackMessage(decision: 'APPROVED' | 'REJECTED' | 'ESCALATED') {
  if (decision === 'APPROVED') {
    return 'Submission approved';
  }
  if (decision === 'REJECTED') {
    return 'Submission rejected';
  }
  return 'Submission sent for further review';
}

function statusTone(status: string) {
  if (status.includes('REJECT') || status.includes('FAILED') || status.includes('RETRY')) {
    return 'danger' as const;
  }
  if (status.includes('CHANGES') || status.includes('QA_REVIEW') || status.includes('PROCESSING') || status.includes('SUBMITTED')) {
    return 'warning' as const;
  }
  if (status.includes('ACCEPT') || status.includes('READY') || status.includes('ACTIVE') || status.includes('COMPLETED')) {
    return 'success' as const;
  }
  return 'info' as const;
}

function formatDuration(seconds?: number) {
  if (!seconds) {
    return 'Not required';
  }
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes}:${String(remainder).padStart(2, '0')}` : `${minutes}:00`;
}

function formatMinutes(seconds: number) {
  return `${Math.round(seconds / 60)} min`;
}

function last<T>(items: T[]) {
  return items.length ? items[items.length - 1] : undefined;
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing.md,
  },
  stack: {
    gap: spacing.md,
  },
  card: {
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.greenSoft,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  field: {
    gap: spacing.xs,
  },
  input: {
    minHeight: 46,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    color: colors.ink,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 82,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  choiceChip: {
    minHeight: 36,
    maxWidth: '100%',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  choiceChipActive: {
    borderColor: colors.ink,
    backgroundColor: colors.ink,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  flexButton: {
    flexBasis: '46%',
    flexGrow: 1,
    minWidth: 136,
  },
  embeddedBlock: {
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  embeddedCard: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  summaryLabel: {
    flexBasis: 108,
    maxWidth: '42%',
  },
  summaryValue: {
    flex: 1,
    minWidth: 0,
  },
  progressBlock: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metric: {
    flexBasis: '30%',
    flex: 1,
    minWidth: 96,
    padding: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.white,
  },
  pressed: {
    opacity: 0.78,
  },
});
