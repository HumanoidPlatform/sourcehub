import * as SecureStore from 'expo-secure-store';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { getPostAuthRouteForSession } from '@/auth/post-auth-routing';
import {
  buildUserLanguagePreferences,
  isRtlLanguage,
} from '@/features/localization/locales';
import {
  clearStoredLanguagePreference,
  getLanguagePreferenceStorageKey,
  getStoredLanguagePreference,
  saveStoredLanguagePreference,
} from '@/features/localization/language-preferences';
import { localizeFormError } from '@/features/localization/form-errors';
import { translate } from '@/features/localization/strings';
import { getLocalizedUploadQueueStatusLabel, getLocalizedUploadResultLabel } from '@/features/localization/upload-status';
import { mockApiAdapter } from '@/api/mock-adapter';
import { useAuthStore } from '@/store/auth-store';
import { useLocalizationStore } from '@/store/localization-store';

describe('language and region preferences', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await clearStoredLanguagePreference('anita@crowd.in');
    await clearStoredLanguagePreference('multi@cosaarthi.local');
    await clearStoredLanguagePreference('client@cosaarthi.local');
    useLocalizationStore.setState({
      bootstrapped: false,
      currentUserEmail: null,
      preference: null,
    });
  });

  it.each([
    ['te', 'IN', 'te-IN'],
    ['hi', 'IN', 'hi-IN'],
    ['es', 'MX', 'es-MX'],
    ['en', 'US', 'en-US'],
  ])('builds %s + %s as %s', (languageCode, regionCode, locale) => {
    expect(buildUserLanguagePreferences(languageCode, regionCode).locale).toBe(locale);
  });

  it('detects RTL languages', () => {
    expect(isRtlLanguage('ar')).toBe(true);
    expect(isRtlLanguage('ur')).toBe(true);
    expect(isRtlLanguage('te')).toBe(false);
  });

  it('persists and reloads cached preferences for offline startup', async () => {
    const preference = buildUserLanguagePreferences('te', 'IN');
    await saveStoredLanguagePreference('anita@crowd.in', preference);

    expect(await getStoredLanguagePreference('anita@crowd.in')).toEqual(preference);
    expect(await useLocalizationStore.getState().loadForUser('anita@crowd.in')).toEqual(preference);
  });

  it('uses SecureStore-safe keys for email-based language preferences', async () => {
    const userEmail = 'Anita+Worker@crowd.in';
    const key = getLanguagePreferenceStorageKey(userEmail);

    await saveStoredLanguagePreference(userEmail, buildUserLanguagePreferences('hi', 'IN'));

    expect(key).toMatch(/^[A-Za-z0-9._-]+$/);
    expect(key).not.toContain('@');
    expect(key).not.toContain('%');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(key, expect.any(String));
  });

  it('routes single-persona login directly to the assigned app', async () => {
    const session = await mockApiAdapter.login({
      email: 'client@cosaarthi.local',
      password: 'Cosaarthi#2026',
      persona: 'client',
      workerCode: 'COSAARTHI-CLIENT',
    });

    expect(await getPostAuthRouteForSession(session)).toBe('/client');
  });

  it('routes future single-persona login directly to persona app when preference exists', async () => {
    await saveStoredLanguagePreference('client@cosaarthi.local', buildUserLanguagePreferences('en', 'US'));
    const session = await mockApiAdapter.login({
      email: 'client@cosaarthi.local',
      password: 'Cosaarthi#2026',
      persona: 'client',
      workerCode: 'COSAARTHI-CLIENT',
    });

    expect(await getPostAuthRouteForSession(session)).toBe('/client');
  });

  it('routes multi-persona login to the persona switcher', async () => {
    const session = await mockApiAdapter.login({
      email: 'multi@cosaarthi.local',
      password: 'Cosaarthi#2026',
      persona: 'tenant',
      workerCode: 'COSAARTHI-MULTI',
    });

    expect(await getPostAuthRouteForSession(session)).toBe('/persona-switch');
  });

  it('logout and login retain the cached user preference', async () => {
    await saveStoredLanguagePreference('anita@crowd.in', buildUserLanguagePreferences('te', 'IN'));
    await useAuthStore.getState().login({
      email: 'anita@crowd.in',
      password: 'Cosaarthi#2026',
      persona: 'crowd',
      workerCode: 'COSAARTHI-CROWD',
    });
    await useAuthStore.getState().logout();
    await useAuthStore.getState().login({
      email: 'anita@crowd.in',
      password: 'Cosaarthi#2026',
      persona: 'crowd',
      workerCode: 'COSAARTHI-CROWD',
    });

    expect(await getPostAuthRouteForSession(useAuthStore.getState().session)).toBe('/home');
  });

  it('persona switching preserves the same user language preference', async () => {
    const preference = buildUserLanguagePreferences('hi', 'IN');
    await saveStoredLanguagePreference('multi@cosaarthi.local', preference);
    await useAuthStore.getState().login({
      email: 'multi@cosaarthi.local',
      password: 'Cosaarthi#2026',
      persona: 'tenant',
      workerCode: 'COSAARTHI-MULTI',
    });
    await useLocalizationStore.getState().loadForUser('multi@cosaarthi.local');
    await useAuthStore.getState().switchPersona('aggregator');

    expect(useAuthStore.getState().session?.user.persona).toBe('aggregator');
    expect(useLocalizationStore.getState().preference).toEqual(preference);
  });

  it('changing language updates localized UI strings immediately', async () => {
    await useLocalizationStore.getState().saveForUser('anita@crowd.in', buildUserLanguagePreferences('te', 'IN'));
    expect(useLocalizationStore.getState().t('tabs.work')).toBe('పని');

    await useLocalizationStore.getState().saveForUser('anita@crowd.in', buildUserLanguagePreferences('es', 'MX'));
    expect(useLocalizationStore.getState().t('tabs.work')).toBe('Trabajo');
    expect(translate('settings.languageRegion', 'es')).toBe('Idioma y región');
  });

  it('localizes known form validation messages with safe fallback', () => {
    const t = (key: Parameters<typeof translate>[0]) => translate(key, 'te-IN');

    expect(localizeFormError('Enter a valid email', t)).toBe('చెల్లుబాటు అయ్యే ఇమెయిల్ నమోదు చేయండి');
    expect(localizeFormError('Password must be at least 4 characters', t)).toBe('పాస్‌వర్డ్ కనీసం 4 అక్షరాలు ఉండాలి');
    expect(localizeFormError('Unexpected backend validation', t)).toBe('Unexpected backend validation');
  });

  it('localizes upload queue and result status labels', () => {
    const t = (key: Parameters<typeof translate>[0]) => translate(key, 'te-IN');

    expect(getLocalizedUploadQueueStatusLabel('uploading', t)).toBe('అప్‌లోడ్ అవుతోంది');
    expect(getLocalizedUploadResultLabel('possible_duplicate', t)).toBe('సాధ్యమైన డూప్లికేట్');
    expect(getLocalizedUploadResultLabel(undefined, t)).toBe('పెండింగ్');
  });
});
