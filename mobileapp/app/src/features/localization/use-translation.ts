import { useCallback } from 'react';

import { translate, type StringKey } from '@/features/localization/strings';
import { useLocalizationStore } from '@/store/localization-store';

export function useTranslation() {
  const languageCode = useLocalizationStore((state) => state.preference?.languageCode);

  return useCallback((key: StringKey) => translate(key, languageCode), [languageCode]);
}
