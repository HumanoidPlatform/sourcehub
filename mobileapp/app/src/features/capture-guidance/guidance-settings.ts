import * as SecureStore from 'expo-secure-store';

export const VOICE_GUIDANCE_KEY = 'odp.mobile.guidance.voice.v1';

export async function getVoiceGuidancePreference() {
  const raw = await SecureStore.getItemAsync(VOICE_GUIDANCE_KEY);
  return raw === null ? true : raw === 'true';
}

export async function saveVoiceGuidancePreference(enabled: boolean) {
  await SecureStore.setItemAsync(VOICE_GUIDANCE_KEY, enabled ? 'true' : 'false');
}
