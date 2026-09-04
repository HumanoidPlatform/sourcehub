import { create } from 'zustand';

import { getVoiceGuidancePreference, saveVoiceGuidancePreference } from '@/features/capture-guidance/guidance-settings';

type GuidanceSettingsState = {
  bootstrapped: boolean;
  voiceGuidanceEnabled: boolean;
  bootstrap: () => Promise<void>;
  setVoiceGuidanceEnabled: (enabled: boolean) => Promise<void>;
};

export const useGuidanceSettingsStore = create<GuidanceSettingsState>((set) => ({
  bootstrapped: false,
  voiceGuidanceEnabled: true,
  async bootstrap() {
    const voiceGuidanceEnabled = await getVoiceGuidancePreference();
    set({ bootstrapped: true, voiceGuidanceEnabled });
  },
  async setVoiceGuidanceEnabled(enabled) {
    await saveVoiceGuidancePreference(enabled);
    set({ voiceGuidanceEnabled: enabled });
  },
}));
