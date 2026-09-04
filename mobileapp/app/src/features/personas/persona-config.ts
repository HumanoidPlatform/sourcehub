import {
  ActivitySquare,
  Bell,
  Bot,
  Boxes,
  Building2,
  ClipboardCheck,
  FileCheck2,
  Landmark,
  Megaphone,
  PackageCheck,
  RadioTower,
  Store,
  Target,
  Truck,
  UsersRound,
  WandSparkles,
} from 'lucide-react-native';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react-native';

import type { WorkflowState } from '@/store/workflow-store';
import type { DemoPersona, Permission } from '@/types/domain';

export type PersonaNavigationItem = {
  key: string;
  label: string;
};

export type PersonaPrimaryAction = {
  actionId?: string;
  detail: string;
  icon: ComponentType<LucideProps>;
  label: string;
  mocked: boolean;
  permission?: Permission;
};

export type PersonaConfig = {
  copilotSuggestions: string[];
  emptyState: string;
  features: string[];
  label: string;
  landingLabel: string;
  landingRoute: string;
  metrics: (state: WorkflowState) => { label: string; value: string }[];
  navigation: PersonaNavigationItem[];
  persona: DemoPersona;
  primaryActions: PersonaPrimaryAction[];
  subtitle: string;
  usesNativeCrowdTabs?: boolean;
  worklist: (state: WorkflowState) => { detail: string; label: string; status: 'mock' | 'attention' | 'ready' }[];
};

export const personaConfigs: Record<DemoPersona, PersonaConfig> = {
  aggregator: {
    copilotSuggestions: [
      'ESC-114 SLA is open; acknowledge it or escalate to tenant.',
      'SouthField velocity is below plan after partner commitments.',
    ],
    emptyState: 'No partner escalations are currently assigned to this aggregator.',
    features: ['portfolio status', 'partner network', 'broadcasts', 'WBR calls', 'SLA escalations', 'earnings'],
    label: 'Aggregator',
    landingLabel: 'Portfolio',
    landingRoute: '/aggregator',
    metrics: (state) => [
      { label: 'Active projects', value: `${state.projects.filter((item) => item.status === 'PROJECT_ACTIVE').length}` },
      { label: 'Allocations', value: `${state.partnerAllocations.length}` },
      { label: 'Committed', value: `${state.partnerAllocations.filter((item) => item.status === 'PARTNER_COMMITTED' || item.status === 'WORKERS_ENABLED').length}` },
    ],
    navigation: [
      { key: 'dash', label: 'Portfolio' },
      { key: 'network', label: 'My Partner Network' },
      { key: 'comms', label: 'Communications' },
      { key: 'calls', label: 'Calls & Cadence' },
      { key: 'escs', label: 'Alerts & Escalations' },
      { key: 'earnings', label: 'Earnings' },
    ],
    persona: 'aggregator',
    primaryActions: [
      {
        actionId: 'ack_escalation',
        detail: 'Acknowledge ESC-114 so the tenant sees the SLA owner has responded.',
        icon: Bell,
        label: 'Acknowledge escalation',
        mocked: true,
        permission: 'escalation:update',
      },
      {
        actionId: 'escalate_issue',
        detail: 'Escalate ESC-114 to the tenant when partner recovery is not enough.',
        icon: RadioTower,
        label: 'Escalate to tenant',
        mocked: true,
        permission: 'escalation:update',
      },
      {
        detail: 'Broadcasts and delivery receipts need the backend communications adapter.',
        icon: Megaphone,
        label: 'Send broadcast',
        mocked: true,
      },
    ],
    subtitle: 'Partner network, communications, WBR calls, SLA escalation state and earnings.',
    worklist: (state) => [
      {
        detail: state.projects.some((project) => project.status === 'PROJECT_ACTIVE')
          ? 'Published Tenant project is ready for Aggregator coordination.'
          : 'Waiting for Tenant to publish a shared project.',
        label: 'Project coordination',
        status: state.projects.some((project) => project.status === 'PROJECT_ACTIVE') ? 'attention' : 'mock',
      },
      {
        detail: state.partnerAllocations.some((item) => item.partnerId)
          ? 'Partner assignment is visible to the Partner dashboard.'
          : 'Accept and assign a Partner from the Interlinked Workflow section.',
        label: 'Partner allocation',
        status: state.partnerAllocations.some((item) => item.partnerId) ? 'ready' : 'attention',
      },
    ],
  },
  builder: {
    copilotSuggestions: [
      'Three marketplace datasets match the current model-eval need.',
      'FinSim RL run performance is available as a mobile summary only.',
    ],
    emptyState: 'No AI runs are currently assigned to this builder account.',
    features: ['data marketplace', 'data hub', 'ingest and enhance', 'GenAI Studio', 'RL environments', 'registry', 'API', 'billing'],
    label: 'AI Builder',
    landingLabel: 'Builder Overview',
    landingRoute: '/builder',
    metrics: (state) => [
      { label: 'Marketplace sets', value: `${state.builderDatasets.length}` },
      { label: 'Licensed sets', value: `${state.builderDatasets.filter((item) => item.status === 'LICENSED').length}` },
      { label: 'Deliveries', value: `${state.deliveries.filter((item) => item.status === 'CLIENT_ACCEPTED').length}` },
    ],
    navigation: [
      { key: 'home', label: 'Overview' },
      { key: 'marketplace', label: 'Data Marketplace' },
      { key: 'hub', label: 'Data Hub' },
      { key: 'ingest', label: 'Ingest & Enhance' },
      { key: 'genai', label: 'GenAI Studio' },
      { key: 'rlenv', label: 'RL Environments' },
      { key: 'workbench', label: 'AI Workbench' },
      { key: 'agents', label: 'Agent Workbench' },
      { key: 'pipelines', label: 'Pipelines & Runs' },
      { key: 'registry', label: 'Model Registry' },
      { key: 'devapi', label: 'Developer & API' },
      { key: 'billing', label: 'Billing & Credits' },
    ],
    persona: 'builder',
    primaryActions: [
      {
        actionId: 'license_dataset',
        detail: 'License a curated marketplace dataset into the Builder Data Hub.',
        icon: Store,
        label: 'License dataset',
        mocked: true,
        permission: 'builder:read',
      },
      {
        detail: 'GenAI and RL job execution requires the backend run service.',
        icon: Bot,
        label: 'Start AI run',
        mocked: true,
      },
    ],
    subtitle: 'AI/data consumer workflows without Crowd field-work screens.',
    worklist: (state) => [
      {
        detail: state.builderDatasets.length
          ? 'Client-accepted governed dataset is visible from the shared delivery lifecycle.'
          : 'No Client-accepted delivery has reached the Builder marketplace yet.',
        label: 'Dataset acquisition',
        status: state.builderDatasets.length ? 'attention' : 'mock',
      },
      {
        detail: state.builderDatasets.some((item) => item.status === 'LICENSED')
          ? 'Licensed dataset is available in the mocked Data Hub.'
          : 'License a visible dataset from the Interlinked Workflow section.',
        label: 'Data Hub',
        status: state.builderDatasets.some((item) => item.status === 'LICENSED') ? 'ready' : 'mock',
      },
    ],
  },
  client: {
    copilotSuggestions: [
      'RFP-2031 has proposals; awarding creates the tenant initiative.',
      'DLV-0092 is awaiting acceptance and will raise an invoice.',
    ],
    emptyState: 'No client approvals are pending.',
    features: ['RFP review', 'proposal award', 'initiative tracking', 'delivery acceptance', 'invoice payment'],
    label: 'Client Console',
    landingLabel: 'Client Overview',
    landingRoute: '/client',
    metrics: (state) => [
      { label: 'Requirements', value: `${state.requirements.length}` },
      { label: 'Deliveries', value: `${state.deliveries.length}` },
      { label: 'Accepted', value: `${state.deliveries.filter((item) => item.status === 'CLIENT_ACCEPTED').length}` },
    ],
    navigation: [
      { key: 'dash', label: 'Overview' },
      { key: 'rfps', label: 'RFPs & Requirements' },
      { key: 'initiatives', label: 'My Initiatives' },
      { key: 'deliveries', label: 'Deliveries & Acceptance' },
      { key: 'invoices', label: 'Invoices & Payments' },
    ],
    persona: 'client',
    primaryActions: [
      {
        actionId: 'award_rfp',
        detail: 'Award RFP-2031; Tenant sees INIT-118 in the same shared mock state.',
        icon: FileCheck2,
        label: 'Award RFP-2031',
        mocked: true,
        permission: 'rfp:award',
      },
      {
        actionId: 'accept_delivery',
        detail: 'Accept delivery DLV-0092 and move the milestone invoice to due.',
        icon: PackageCheck,
        label: 'Accept delivery',
        mocked: true,
        permission: 'delivery:accept',
      },
    ],
    subtitle: 'Approvals, status review, delivery acceptance and payment milestones.',
    worklist: (state) => [
      {
        detail: state.requirements.length
          ? 'Submitted requirement is visible to Tenant with the same requirement ID.'
          : 'Create a Requirement / RFP in the Interlinked Workflow section.',
        label: 'Requirement / RFP',
        status: state.requirements.length ? 'ready' : 'attention',
      },
      {
        detail: state.deliveries.length
          ? 'Tenant-created delivery is ready for Client acceptance.'
          : 'No accepted Tenant delivery has arrived yet.',
        label: 'Delivery review',
        status: state.deliveries.some((item) => item.status === 'CLIENT_ACCEPTED') ? 'ready' : state.deliveries.length ? 'attention' : 'mock',
      },
    ],
  },
  crowd: {
    copilotSuggestions: ['Annotation is the best value task today.', 'Recertification is due soon; finish Learn before it blocks capture.'],
    emptyState: 'No Crowd Mobile work is currently assigned.',
    features: ['Home', 'Work', 'Devices', 'Learn', 'Wallet', 'offline queue', 'capture', 'annotation', 'transcription', 'survey', 'rating'],
    label: 'Crowd Mobile',
    landingLabel: 'Crowd Home',
    landingRoute: '/home',
    metrics: () => [
      { label: 'Tabs', value: '5' },
      { label: 'Work modes', value: '5' },
      { label: 'Queue', value: 'SQLite' },
    ],
    navigation: [{ key: 'app', label: 'Mobile App' }],
    persona: 'crowd',
    primaryActions: [],
    subtitle: 'Existing mobile-native Crowd worker experience.',
    usesNativeCrowdTabs: true,
    worklist: () => [{ detail: 'Use Home -> Work for Capture, Annotate, Transcribe, Survey and Rate.', label: 'Mobile workflow', status: 'ready' }],
  },
  ide: {
    copilotSuggestions: [
      'Pre-label confidence is high; verify-and-correct is faster than redraw.',
      'Appeals and capture review are separate from Crowd Mobile capture.',
    ],
    emptyState: 'No advanced studio batch is selected.',
    features: ['workbench', 'annotation studio', 'transcription studio', 'model eval', 'red-team', 'capture review', 'appeals', 'disputes'],
    label: 'Crowd Visual IDE',
    landingLabel: 'My Workbench',
    landingRoute: '/ide',
    metrics: (state) => [
      { label: 'Linked items', value: `${state.ideWorkItems.length}` },
      { label: 'Open', value: `${state.ideWorkItems.filter((item) => item.status === 'OPEN').length}` },
      { label: 'Completed', value: `${state.ideWorkItems.filter((item) => item.status === 'COMPLETED').length}` },
    ],
    navigation: [
      { key: 'dash', label: 'My Workbench' },
      { key: 'annotate', label: 'Annotation Studio' },
      { key: 'transcribe', label: 'Transcription Studio' },
      { key: 'eval', label: 'Model Eval Studio' },
      { key: 'redteam', label: 'Red-Team Studio' },
      { key: 'review', label: 'Capture Review' },
      { key: 'appeals', label: 'Appeals & QC' },
      { key: 'earnings', label: 'Earnings' },
      { key: 'disputes', label: 'Disputes' },
    ],
    persona: 'ide',
    primaryActions: [
      {
        detail: 'Detailed desktop-style studio tools are summarized as mobile entry points.',
        icon: WandSparkles,
        label: 'Open annotation batch',
        mocked: true,
      },
      {
        detail: 'Red-team authoring requires the full IDE service and wellness controls.',
        icon: Target,
        label: 'Open red-team studio',
        mocked: true,
      },
    ],
    subtitle: 'Advanced work studios, review, appeals and disputes; distinct from Crowd Mobile.',
    worklist: (state) => [
      {
        detail: state.ideWorkItems.length
          ? 'QA-routed submission is linked into the same IDE review workbench.'
          : 'No QA-routed submission has created an IDE work item yet.',
        label: 'Capture Review',
        status: state.ideWorkItems.some((item) => item.status === 'OPEN') ? 'attention' : state.ideWorkItems.length ? 'ready' : 'mock',
      },
      { detail: 'Annotation/transcription/rating work will use these same task IDs when assigned.', label: 'Studio work types', status: 'mock' },
    ],
  },
  partner: {
    copilotSuggestions: [
      'Commit supply to the published project so tenant and aggregator see capacity.',
      'Three workers need certification renewal before capture is blocked.',
    ],
    emptyState: 'No project requests are currently open.',
    features: ['project inbox', 'crowd roster', 'certifications', 'kits and devices', 'progress', 'payouts', 'disputes'],
    label: 'Partner',
    landingLabel: 'Project Inbox',
    landingRoute: '/partner',
    metrics: (state) => [
      { label: 'Allocations', value: `${state.partnerAllocations.filter((item) => item.partnerId).length}` },
      { label: 'Committed', value: `${state.partnerAllocations.filter((item) => item.status === 'PARTNER_COMMITTED' || item.status === 'WORKERS_ENABLED').length}` },
      { label: 'Devices', value: `${state.deviceAllocations.length}` },
    ],
    navigation: [
      { key: 'inbox', label: 'Project Inbox' },
      { key: 'workers', label: 'Crowd Roster' },
      { key: 'certs', label: 'Certifications' },
      { key: 'kits', label: 'Kits & Devices' },
      { key: 'progress', label: 'Progress' },
      { key: 'payouts', label: 'Payouts' },
      { key: 'disputes', label: 'Disputes' },
    ],
    persona: 'partner',
    primaryActions: [
      {
        actionId: 'commit_supply',
        detail: 'Commit certified workers; tenant and aggregator dashboards update.',
        icon: UsersRound,
        label: 'Commit supply',
        mocked: true,
        permission: 'supply:commit',
      },
      {
        actionId: 'request_kits',
        detail: 'Request kits for committed workers; sponsor sees demand.',
        icon: PackageCheck,
        label: 'Request kits',
        mocked: true,
        permission: 'partner:read',
      },
    ],
    subtitle: 'Project requests, worker certification, kit demand, progress and payouts.',
    worklist: (state) => [
      {
        detail: state.partnerAllocations.some((item) => item.partnerId)
          ? 'Aggregator-assigned project is visible in Partner inbox.'
          : 'Waiting for Aggregator to assign a shared project.',
        label: 'Project request',
        status: state.partnerAllocations.some((item) => item.partnerId) ? 'attention' : 'mock',
      },
      {
        detail: state.partnerAllocations.some((item) => item.status === 'WORKERS_ENABLED')
          ? 'Worker is enabled and Crowd Mobile can accept the same task.'
          : 'Commit capacity, enable worker, then request device kit.',
        label: 'Worker commitment',
        status: state.partnerAllocations.some((item) => item.status === 'WORKERS_ENABLED') ? 'ready' : 'attention',
      },
    ],
  },
  platform: {
    copilotSuggestions: [
      'Bayside Media Co is awaiting KYB approval.',
      'Platform charge remains locked here, not in operational persona preferences.',
    ],
    emptyState: 'No platform-wide governance issues are currently queued.',
    features: ['ecosystem governance', 'entities and roles', 'taxonomy', 'device catalog', 'revenue policy', 'trust', 'accounts', 'settlements', 'audit', 'disputes'],
    label: 'Command Centre',
    landingLabel: 'Platform Overview',
    landingRoute: '/platform',
    metrics: (state) => [
      { label: 'Lifecycle events', value: `${state.auditEvents.length}` },
      { label: 'Deliveries', value: `${state.deliveries.length}` },
      { label: 'Datasets', value: `${state.builderDatasets.length}` },
    ],
    navigation: [
      { key: 'overview', label: 'Global Overview' },
      { key: 'entities', label: 'Entities & Roles' },
      { key: 'taxonomy', label: 'Service Taxonomy' },
      { key: 'catalog', label: 'Device Catalog' },
      { key: 'revenue', label: 'Revenue Policy' },
      { key: 'datahub', label: 'Data Hub Governance' },
      { key: 'dmp', label: 'Marketplace Supply' },
      { key: 'trust', label: 'Responsible AI / Trust' },
      { key: 'accounts', label: 'Country Accounts' },
      { key: 'invoices', label: 'Invoices & Settlements' },
      { key: 'audit', label: 'Audit & Compliance' },
      { key: 'disputes', label: 'Disputes' },
    ],
    persona: 'platform',
    primaryActions: [
      {
        detail: 'Platform revenue policy is visible here only; mobile demo does not mutate production policy.',
        icon: Landmark,
        label: 'Review revenue policy',
        mocked: true,
        permission: 'platform:read',
      },
      {
        detail: 'Entity approvals require backend KYB/RBAC services.',
        icon: Building2,
        label: 'Review entity KYB',
        mocked: true,
      },
    ],
    subtitle: 'Ecosystem administrator for governance, revenue policy, compliance, accounts and disputes.',
    worklist: (state) => [
      {
        detail: state.auditEvents.length
          ? 'Command Centre observes every shared lifecycle audit event.'
          : 'No shared lifecycle events have been created yet.',
        label: 'Lifecycle audit',
        status: state.auditEvents.length ? 'ready' : 'mock',
      },
      {
        detail: state.deliveries.some((item) => item.status === 'CLIENT_ACCEPTED')
          ? 'Completed delivery is visible for governance and settlement review.'
          : 'Waiting for Client delivery acceptance.',
        label: 'Trust operations',
        status: state.deliveries.some((item) => item.status === 'CLIENT_ACCEPTED') ? 'ready' : 'mock',
      },
    ],
  },
  qa: {
    copilotSuggestions: [
      'Review submissions routed by Tenant before final acceptance.',
      'Escalate only when semantic, duplicate or duration evidence is unclear.',
    ],
    emptyState: 'No QA reviews are currently assigned.',
    features: ['review queue', 'semantic evidence', 'duration checks', 'duplicate status', 'approve', 'reject', 'escalate'],
    label: 'QA',
    landingLabel: 'Review Queue',
    landingRoute: '/qa',
    metrics: (state) => [
      { label: 'Queue', value: `${state.submissions.filter((item) => item.status === 'QA_REVIEW').length}` },
      { label: 'Approved', value: `${state.submissions.filter((item) => item.qaDecision === 'APPROVED').length}` },
      { label: 'Escalated', value: `${state.submissions.filter((item) => item.qaDecision === 'ESCALATED').length}` },
    ],
    navigation: [
      { key: 'queue', label: 'Review Queue' },
      { key: 'evidence', label: 'Evidence' },
      { key: 'decisions', label: 'Decisions' },
      { key: 'escalations', label: 'Escalations' },
    ],
    persona: 'qa',
    primaryActions: [],
    subtitle: 'Shared submission review queue for routed Tenant submissions.',
    worklist: (state) =>
      state.submissions
        .filter((item) => item.status === 'QA_REVIEW')
        .map((item) => ({
          detail: `${item.submissionId} · semantic ${item.semanticStatus ?? 'UNCERTAIN'} · duplicate ${item.duplicateStatus}`,
          label: 'Submission review',
          status: 'attention',
        })),
  },
  sponsor: {
    copilotSuggestions: [
      'REQ-3340 needs kits after partner request.',
      'Advance custody only after inventory allocation is complete.',
    ],
    emptyState: 'No device demand is currently assigned to this sponsor.',
    features: ['overview', 'device inventory', 'kit builder', 'partner connections', 'custody and health', 'earnings'],
    label: 'Device Sponsor',
    landingLabel: 'Sponsor Overview',
    landingRoute: '/sponsor',
    metrics: (state) => [
      { label: 'Demand', value: `${state.deviceAllocations.filter((item) => item.status === 'REQUESTED').length}` },
      { label: 'Allocated', value: `${state.deviceAllocations.filter((item) => item.status === 'ALLOCATED' || item.status === 'ACTIVE').length}` },
      { label: 'Active', value: `${state.deviceAllocations.filter((item) => item.status === 'ACTIVE').length}` },
    ],
    navigation: [
      { key: 'dash', label: 'Overview' },
      { key: 'inventory', label: 'Device Inventory' },
      { key: 'kits', label: 'Kit Builder' },
      { key: 'connect', label: 'Partner Connections' },
      { key: 'custody', label: 'Custody & Health' },
      { key: 'earnings', label: 'Earnings' },
    ],
    persona: 'sponsor',
    primaryActions: [
      {
        actionId: 'allocate_kits',
        detail: 'Allocate inventory against partner demand; partner and crowd device availability update.',
        icon: Boxes,
        label: 'Allocate kits',
        mocked: true,
        permission: 'kit:allocate',
      },
      {
        actionId: 'advance_custody',
        detail: 'Advance shipment to custody-signed workflow state.',
        icon: Truck,
        label: 'Advance custody',
        mocked: true,
        permission: 'kit:allocate',
      },
    ],
    subtitle: 'Device inventory, kit demand, partner connections, custody history and sponsor share.',
    worklist: (state) => [
      {
        detail: state.deviceAllocations.length ? 'Partner kit request is visible to Device Sponsor.' : 'Waiting for Partner device request.',
        label: 'Kit demand',
        status: state.deviceAllocations.some((item) => item.status === 'REQUESTED') ? 'attention' : state.deviceAllocations.length ? 'ready' : 'mock',
      },
      {
        detail: state.deviceAllocations.some((item) => item.status === 'ACTIVE')
          ? 'Device custody is active for the shared worker task.'
          : 'Allocate the requested kit, then mark it active.',
        label: 'Custody history',
        status: state.deviceAllocations.some((item) => item.status === 'ACTIVE') ? 'ready' : 'attention',
      },
    ],
  },
  tenant: {
    copilotSuggestions: [
      'RFP-2031 becomes INIT-118 after client award.',
      'Publish the geo-scoped project so aggregator and partner networks see work.',
    ],
    emptyState: 'No tenant initiatives are currently active.',
    features: ['RFP marketplace', 'initiatives', 'projects', 'project creation', 'certifications', 'QA', 'safety evals', 'supply network', 'deliveries', 'payments', 'Data Hub publish', 'disputes'],
    label: 'Tenant · ADC',
    landingLabel: 'Tenant Overview',
    landingRoute: '/tenant',
    metrics: (state) => [
      { label: 'Initiatives', value: `${state.initiatives.length}` },
      { label: 'Active projects', value: `${state.projects.filter((item) => item.status === 'PROJECT_ACTIVE').length}` },
      { label: 'Submissions', value: `${state.submissions.length}` },
    ],
    navigation: [
      { key: 'dash', label: 'Overview' },
      { key: 'market', label: 'RFP Marketplace' },
      { key: 'initiatives', label: 'Initiatives' },
      { key: 'projects', label: 'Projects' },
      { key: 'wizard', label: 'Create Project' },
      { key: 'certs', label: 'Certifications' },
      { key: 'qa', label: 'QA & Audit' },
      { key: 'campaigns', label: 'Safety Eval Campaigns' },
      { key: 'network', label: 'Supply Network' },
      { key: 'deliveries', label: 'Deliveries' },
      { key: 'invoices', label: 'Payments' },
      { key: 'publish', label: 'Publish to Data Hub' },
      { key: 'disputes', label: 'Disputes' },
    ],
    persona: 'tenant',
    primaryActions: [
      {
        actionId: 'publish_project',
        detail: 'Publish geo-scoped project with certification, QA, delivery and revenue split semantics.',
        icon: ActivitySquare,
        label: 'Publish project',
        mocked: true,
        permission: 'project:publish',
      },
      {
        detail: 'The full project wizard remains a mobile shell until tenant APIs are available.',
        icon: ClipboardCheck,
        label: 'Open project wizard',
        mocked: true,
      },
    ],
    subtitle: 'Authorized Data Collector managing initiatives, projects, QA, supply network and deliveries.',
    worklist: (state) => [
      {
        detail: state.requirements.length
          ? 'Client requirement is visible in the Tenant review queue.'
          : 'Awaiting Client Requirement / RFP submission.',
        label: 'Initiative',
        status: state.initiatives.length ? 'ready' : state.requirements.length ? 'attention' : 'mock',
      },
      {
        detail: state.partnerAllocations.some((item) => item.status === 'PARTNER_COMMITTED' || item.status === 'WORKERS_ENABLED')
          ? 'Partner commitment is reflected in the shared supply network.'
          : 'Publish project so Aggregator can assign a Partner.',
        label: 'Supply network',
        status: state.partnerAllocations.some((item) => item.status === 'PARTNER_COMMITTED' || item.status === 'WORKERS_ENABLED') ? 'ready' : 'attention',
      },
      {
        detail: state.submissions.length ? 'Worker submission is visible for QA routing and final acceptance.' : 'Waiting for Crowd Mobile submission.',
        label: 'QA & Audit',
        status: state.submissions.length ? 'attention' : 'mock',
      },
    ],
  },
};

export const dashboardPersonas = ['platform', 'client', 'tenant', 'aggregator', 'qa', 'partner', 'sponsor', 'ide', 'builder'] as const;

export type DashboardPersona = (typeof dashboardPersonas)[number];
