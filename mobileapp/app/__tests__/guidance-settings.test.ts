import { beforeEach, describe, expect, it } from '@jest/globals';

import { getVoiceGuidancePreference, saveVoiceGuidancePreference } from '@/features/capture-guidance/guidance-settings';
import { useGuidanceSettingsStore } from '@/store/guidance-settings-store';

describe('voice guidance settings', () => {
  beforeEach(() => {
    useGuidanceSettingsStore.setState({
      bootstrapped: false,
      voiceGuidanceEnabled: true,
    });
  });

  it('persists voice-guidance preference', async () => {
    await saveVoiceGuidancePreference(false);
    expect(await getVoiceGuidancePreference()).toBe(false);

    await saveVoiceGuidancePreference(true);
    expect(await getVoiceGuidancePreference()).toBe(true);
  });

  it('bootstraps the persisted preference into the store', async () => {
    await saveVoiceGuidancePreference(false);
    await useGuidanceSettingsStore.getState().bootstrap();

    expect(useGuidanceSettingsStore.getState().voiceGuidanceEnabled).toBe(false);
  });

  it('updates SecureStore when toggled through the store', async () => {
    await useGuidanceSettingsStore.getState().setVoiceGuidanceEnabled(false);
    expect(await getVoiceGuidancePreference()).toBe(false);
  });
});
