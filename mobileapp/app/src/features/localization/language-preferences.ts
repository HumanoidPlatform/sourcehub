import * as SecureStore from 'expo-secure-store';

import type { UserLanguagePreferences } from '@/types/domain';

const LANGUAGE_PREFERENCE_KEY_PREFIX = 'odp.mobile.language.preference.v1';

export function getLanguagePreferenceStorageKey(userEmail: string) {
  const normalizedEmail = userEmail.trim().toLowerCase() || 'anonymous';
  const safeUserSegment = Array.from(normalizedEmail)
    .map((character) => (character.codePointAt(0) ?? 0).toString(36).padStart(2, '0'))
    .join('');
  return `${LANGUAGE_PREFERENCE_KEY_PREFIX}.${safeUserSegment}`;
}

function isStoredLanguagePreference(value: unknown): value is UserLanguagePreferences {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const preference = value as Partial<UserLanguagePreferences>;
  return (
    typeof preference.languageCode === 'string' &&
    typeof preference.regionCode === 'string' &&
    typeof preference.locale === 'string' &&
    preference.locale.includes('-')
  );
}

export async function getStoredLanguagePreference(userEmail: string) {
  const raw = await SecureStore.getItemAsync(getLanguagePreferenceStorageKey(userEmail));
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (isStoredLanguagePreference(parsed)) {
      return parsed;
    }
  } catch {
    // Invalid preference data should send the user through setup again.
  }

  await clearStoredLanguagePreference(userEmail);
  return null;
}

export async function saveStoredLanguagePreference(userEmail: string, preference: UserLanguagePreferences) {
  await SecureStore.setItemAsync(getLanguagePreferenceStorageKey(userEmail), JSON.stringify(preference));
}

export async function clearStoredLanguagePreference(userEmail: string) {
  await SecureStore.deleteItemAsync(getLanguagePreferenceStorageKey(userEmail));
}
