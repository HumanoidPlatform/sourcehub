import { create } from 'zustand';

import { getStoredLanguagePreference, saveStoredLanguagePreference } from '@/features/localization/language-preferences';
import { translate, type StringKey } from '@/features/localization/strings';
import type { UserLanguagePreferences } from '@/types/domain';

type LocalizationState = {
  bootstrapped: boolean;
  currentUserEmail: string | null;
  preference: UserLanguagePreferences | null;
  loadForUser: (userEmail: string) => Promise<UserLanguagePreferences | null>;
  saveForUser: (userEmail: string, preference: UserLanguagePreferences) => Promise<void>;
  t: (key: StringKey) => string;
};

export const useLocalizationStore = create<LocalizationState>((set, get) => ({
  bootstrapped: false,
  currentUserEmail: null,
  preference: null,
  async loadForUser(userEmail) {
    const preference = await getStoredLanguagePreference(userEmail);
    set({ bootstrapped: true, currentUserEmail: userEmail, preference });
    return preference;
  },
  async saveForUser(userEmail, preference) {
    await saveStoredLanguagePreference(userEmail, preference);
    set({ bootstrapped: true, currentUserEmail: userEmail, preference });
  },
  t(key) {
    return translate(key, get().preference?.languageCode);
  },
}));
