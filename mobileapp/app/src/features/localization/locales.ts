import type { UserLanguagePreferences } from '@/types/domain';

export type LanguageOption = {
  englishName?: string;
  isRtl?: boolean;
  languageCode: string;
  nativeName: string;
};

export type RegionOption = {
  regionCode: string;
  regionName: string;
};

export const languageOptions: LanguageOption[] = [
  { languageCode: 'en', nativeName: 'English' },
  { englishName: 'Hindi', languageCode: 'hi', nativeName: 'हिन्दी' },
  { englishName: 'Telugu', languageCode: 'te', nativeName: 'తెలుగు' },
  { englishName: 'Tamil', languageCode: 'ta', nativeName: 'தமிழ்' },
  { englishName: 'Kannada', languageCode: 'kn', nativeName: 'ಕನ್ನಡ' },
  { englishName: 'Marathi', languageCode: 'mr', nativeName: 'मराठी' },
  { englishName: 'Bengali', languageCode: 'bn', nativeName: 'বাংলা' },
  { englishName: 'Urdu', isRtl: true, languageCode: 'ur', nativeName: 'اردو' },
  { englishName: 'Arabic', isRtl: true, languageCode: 'ar', nativeName: 'العربية' },
  { englishName: 'Spanish', languageCode: 'es', nativeName: 'Español' },
  { englishName: 'Portuguese', languageCode: 'pt', nativeName: 'Português' },
  { englishName: 'French', languageCode: 'fr', nativeName: 'Français' },
  { englishName: 'German', languageCode: 'de', nativeName: 'Deutsch' },
  { englishName: 'Japanese', languageCode: 'ja', nativeName: '日本語' },
  { englishName: 'Korean', languageCode: 'ko', nativeName: '한국어' },
  { englishName: 'Chinese', languageCode: 'zh', nativeName: '中文' },
];

export const regionOptions: RegionOption[] = [
  { regionCode: 'IN', regionName: 'India' },
  { regionCode: 'US', regionName: 'United States' },
  { regionCode: 'MX', regionName: 'Mexico' },
  { regionCode: 'BR', regionName: 'Brazil' },
  { regionCode: 'GB', regionName: 'United Kingdom' },
  { regionCode: 'SA', regionName: 'Saudi Arabia' },
  { regionCode: 'AE', regionName: 'UAE' },
  { regionCode: 'JP', regionName: 'Japan' },
  { regionCode: 'KR', regionName: 'South Korea' },
  { regionCode: 'CN', regionName: 'China' },
  { regionCode: 'DE', regionName: 'Germany' },
  { regionCode: 'FR', regionName: 'France' },
  { regionCode: 'ES', regionName: 'Spain' },
  { regionCode: 'PT', regionName: 'Portugal' },
];

const rtlLanguages = new Set(languageOptions.filter((language) => language.isRtl).map((language) => language.languageCode));

export function buildUserLanguagePreferences(languageCode: string, regionCode: string): UserLanguagePreferences {
  const normalizedLanguage = languageCode.toLowerCase();
  const normalizedRegion = regionCode.toUpperCase();
  return {
    languageCode: normalizedLanguage,
    locale: `${normalizedLanguage}-${normalizedRegion}`,
    regionCode: normalizedRegion,
  };
}

export function isRtlLanguage(languageCode?: string) {
  return languageCode ? rtlLanguages.has(languageCode.toLowerCase()) : false;
}

export function getLanguageOption(languageCode?: string) {
  return languageOptions.find((language) => language.languageCode === languageCode);
}

export function getRegionOption(regionCode?: string) {
  return regionOptions.find((region) => region.regionCode === regionCode);
}

export function searchLanguages(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return languageOptions;
  }
  return languageOptions.filter((language) =>
    [language.languageCode, language.nativeName, language.englishName ?? ''].some((value) => value.toLowerCase().includes(normalized)),
  );
}

export function searchRegions(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return regionOptions;
  }
  return regionOptions.filter((region) =>
    [region.regionCode, region.regionName].some((value) => value.toLowerCase().includes(normalized)),
  );
}

export function getDeviceLocaleSuggestion() {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  const [languageCode, regionCode] = locale.split('-');
  if (!languageCode || !regionCode) {
    return null;
  }
  const language = getLanguageOption(languageCode.toLowerCase());
  const region = getRegionOption(regionCode.toUpperCase());
  if (!language || !region) {
    return null;
  }
  return `${language.nativeName}${language.englishName ? ` (${language.englishName})` : ''} · ${region.regionName}`;
}
