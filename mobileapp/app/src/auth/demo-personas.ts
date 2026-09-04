import type { DemoPersona, Persona } from '@/types/domain';

export type DemoPersonaOption = {
  code: string;
  email: string;
  label: string;
  password: string;
  persona: DemoPersona;
  roleGroup?: string;
  subtitle: string;
};

export type LoginAccountOption = DemoPersonaOption & {
  id: string;
};

export const DEMO_PASSWORD = 'Cosaarthi#2026';

export const demoPersonaOptions: DemoPersonaOption[] = [
  {
    code: 'COSAARTHI-PLATFORM',
    email: 'platform@cosaarthi.local',
    label: 'Platform',
    password: DEMO_PASSWORD,
    persona: 'platform',
    subtitle: 'Platform governance, taxonomy, revenue, trust and settlements',
  },
  {
    code: 'COSAARTHI-CLIENT',
    email: 'client@cosaarthi.local',
    label: 'Client',
    password: DEMO_PASSWORD,
    persona: 'client',
    subtitle: 'RFPs, initiatives, delivery acceptance and payments',
  },
  {
    code: 'COSAARTHI-ADC',
    email: 'tenant@cosaarthi.local',
    label: 'Tenant',
    password: DEMO_PASSWORD,
    persona: 'tenant',
    roleGroup: 'Meridian roles',
    subtitle: 'RFP marketplace, projects, QA, supply network and deliveries',
  },
  {
    code: 'COSAARTHI-ADC',
    email: 'aggregator@cosaarthi.local',
    label: 'Aggregator',
    password: DEMO_PASSWORD,
    persona: 'aggregator',
    roleGroup: 'Meridian roles',
    subtitle: 'Partner network, communications, WBR calls and escalations',
  },
  {
    code: 'COSAARTHI-QA',
    email: 'qa@cosaarthi.local',
    label: 'QA',
    password: DEMO_PASSWORD,
    persona: 'qa',
    roleGroup: 'Meridian roles',
    subtitle: 'Review queue, quality decisions and escalations',
  },
  {
    code: 'COSAARTHI-PARTNER',
    email: 'partner@cosaarthi.local',
    label: 'Partner',
    password: DEMO_PASSWORD,
    persona: 'partner',
    subtitle: 'Project inbox, crowd roster, certifications, kits and payouts',
  },
  {
    code: 'COSAARTHI-SPONSOR',
    email: 'device@cosaarthi.local',
    label: 'Device Sponsor',
    password: DEMO_PASSWORD,
    persona: 'sponsor',
    subtitle: 'Inventory, kit builder, custody, device health and sponsor earnings',
  },
  {
    code: 'COSAARTHI-CROWD',
    email: 'crowd@cosaarthi.local',
    label: 'Crowd Mobile',
    password: DEMO_PASSWORD,
    persona: 'crowd',
    roleGroup: 'Crowd roles',
    subtitle: 'Mobile Home, Work, Devices, Learn, Wallet and upload queue',
  },
  {
    code: 'COSAARTHI-CROWD',
    email: 'ide@cosaarthi.local',
    label: 'Crowd Visual IDE',
    password: DEMO_PASSWORD,
    persona: 'ide',
    roleGroup: 'Crowd roles',
    subtitle: 'Workbench, annotation, transcription, model eval and appeals',
  },
  {
    code: 'COSAARTHI-BUILDER',
    email: 'builder@cosaarthi.local',
    label: 'AI Builder',
    password: DEMO_PASSWORD,
    persona: 'builder',
    subtitle: 'Data marketplace, Data Hub, GenAI, RL, registry, API and billing',
  },
];

export const loginAccountOptions: LoginAccountOption[] = [
  {
    code: 'COSAARTHI-PLATFORM',
    email: 'platform@cosaarthi.local',
    id: 'platform',
    label: 'Platform',
    password: DEMO_PASSWORD,
    persona: 'platform',
    subtitle: 'platform@cosaarthi.local',
  },
  {
    code: 'COSAARTHI-CLIENT',
    email: 'client@cosaarthi.local',
    id: 'client',
    label: 'Client',
    password: DEMO_PASSWORD,
    persona: 'client',
    subtitle: 'client@cosaarthi.local',
  },
  {
    code: 'COSAARTHI-TENANT',
    email: 'tenant@cosaarthi.local',
    id: 'tenant',
    label: 'Tenant',
    password: DEMO_PASSWORD,
    persona: 'tenant',
    subtitle: 'tenant@cosaarthi.local',
  },
  {
    code: 'COSAARTHI-AGGREGATOR',
    email: 'aggregator@cosaarthi.local',
    id: 'aggregator',
    label: 'Aggregator',
    password: DEMO_PASSWORD,
    persona: 'aggregator',
    subtitle: 'aggregator@cosaarthi.local',
  },
  {
    code: 'COSAARTHI-QA',
    email: 'qa@cosaarthi.local',
    id: 'qa',
    label: 'QA',
    password: DEMO_PASSWORD,
    persona: 'qa',
    subtitle: 'qa@cosaarthi.local',
  },
  {
    code: 'COSAARTHI-PARTNER',
    email: 'partner@cosaarthi.local',
    id: 'partner',
    label: 'Partner',
    password: DEMO_PASSWORD,
    persona: 'partner',
    subtitle: 'partner@cosaarthi.local',
  },
  {
    code: 'COSAARTHI-SPONSOR',
    email: 'device@cosaarthi.local',
    id: 'device',
    label: 'Device Sponsor',
    password: DEMO_PASSWORD,
    persona: 'sponsor',
    subtitle: 'device@cosaarthi.local',
  },
  {
    code: 'COSAARTHI-CROWD',
    email: 'crowd@cosaarthi.local',
    id: 'crowd',
    label: 'Crowd',
    password: DEMO_PASSWORD,
    persona: 'crowd',
    subtitle: 'crowd@cosaarthi.local',
  },
  {
    code: 'COSAARTHI-IDE',
    email: 'ide@cosaarthi.local',
    id: 'ide',
    label: 'Visual IDE',
    password: DEMO_PASSWORD,
    persona: 'ide',
    subtitle: 'ide@cosaarthi.local',
  },
  {
    code: 'COSAARTHI-BUILDER',
    email: 'builder@cosaarthi.local',
    id: 'builder',
    label: 'AI Builder',
    password: DEMO_PASSWORD,
    persona: 'builder',
    subtitle: 'builder@cosaarthi.local',
  },
  {
    code: 'COSAARTHI-MULTI',
    email: 'multi@cosaarthi.local',
    id: 'multi',
    label: 'Multi-role',
    password: DEMO_PASSWORD,
    persona: 'tenant',
    subtitle: 'Tenant, Aggregator, QA, Crowd',
  },
  {
    code: 'COSAARTHI-CROWD',
    email: 'anita@crowd.in',
    id: 'anita',
    label: 'Anita',
    password: DEMO_PASSWORD,
    persona: 'crowd',
    subtitle: 'anita@crowd.in',
  },
];

export function getDemoPersonaOption(persona: DemoPersona) {
  return demoPersonaOptions.find((option) => option.persona === persona) ?? demoPersonaOptions[0];
}

export function getLoginAccountOption(email: string) {
  return loginAccountOptions.find((option) => option.email === email) ?? loginAccountOptions[0];
}

export function getAvailablePersonasForDemoLogin(email: string, selectedPersona: DemoPersona): Persona[] {
  if (email === 'multi@cosaarthi.local') {
    return ['tenant', 'aggregator', 'qa', 'crowd'];
  }
  return [selectedPersona];
}
