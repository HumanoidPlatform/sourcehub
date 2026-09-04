import { describe, expect, it } from '@jest/globals';

import { demoPersonaOptions } from '@/auth/demo-personas';
import { dashboardPersonas, personaConfigs } from '@/features/personas/persona-config';
import { useWorkflowStore } from '@/store/workflow-store';

describe('persona dashboard config', () => {
  it('defines a landing config for every demo persona', () => {
    for (const option of demoPersonaOptions) {
      expect(personaConfigs[option.persona].persona).toBe(option.persona);
      expect(personaConfigs[option.persona].navigation.length).toBeGreaterThan(0);
    }
  });

  it('keeps Crowd Mobile on native tabs and all other personas on dashboard shells', () => {
    expect(personaConfigs.crowd.landingRoute).toBe('/home');
    expect(personaConfigs.crowd.usesNativeCrowdTabs).toBe(true);

    for (const persona of dashboardPersonas) {
      expect(personaConfigs[persona].landingRoute).not.toBe('/home');
      expect(personaConfigs[persona].usesNativeCrowdTabs).toBeUndefined();
    }
  });

  it('shares golden-path state across role metrics and worklists', () => {
    const workflow = useWorkflowStore.getState();
    workflow.resetWorkflow();

    expect(personaConfigs.tenant.metrics(useWorkflowStore.getState())[0].value).toBe('0');

    const requirement = workflow.createRequirement({
      budget: 'INR 90,000 demo budget',
      businessUseCase: 'Industrial inspection model evaluation',
      category: 'Industry / Manufacturing',
      clientId: 'client-autodrive',
      dataType: 'Video',
      deadline: '2026-09-30',
      description: 'Record normal operating industrial equipment.',
      instructions: 'Keep machinery in frame and do not enter restricted areas.',
      languageRequirements: 'English metadata',
      locationRequirements: 'India factory floor',
      qualityRequirements: 'Stable, well-lit equipment footage.',
      quantity: 10,
      requiredDurationSeconds: 600,
      title: 'Industrial Equipment Video Dataset',
    });
    workflow.acceptRequirement(requirement.requirementId, 'tenant-meridian');
    workflow.createInitiativeFromRequirement(requirement.requirementId, 'tenant-meridian');
    const project = workflow.createProjectFromRequirement(requirement.requirementId, 'tenant-meridian');
    workflow.publishProject(project.projectId);
    workflow.aggregatorAcceptProject(project.projectId, 'user-meridian-ops');
    workflow.assignProjectToPartner(project.projectId, 'user-meridian-ops', 'user-partner-kova');
    workflow.partnerCommitCapacity(project.projectId, 'user-partner-kova', 8);

    const state = useWorkflowStore.getState();
    expect(personaConfigs.client.metrics(state)[0].value).toBe('1');
    expect(personaConfigs.tenant.metrics(state)[0].value).toBe('1');
    expect(personaConfigs.aggregator.worklist(state)[1].status).toBe('ready');
    expect(personaConfigs.partner.metrics(state)[1].value).toBe('1');
  });
});
