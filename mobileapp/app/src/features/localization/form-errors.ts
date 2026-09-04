import type { StringKey } from '@/features/localization/strings';

const errorMessageKeys = {
  'Add a clear justification': 'validation.addJustification',
  'Add a label before submitting': 'validation.addLabel',
  'Add a short observation': 'validation.addObservation',
  'Amount is above the V1 limit': 'validation.amountAboveLimit',
  'Enter a rack or asset identifier': 'validation.enterAssetId',
  'Enter a submission ID': 'validation.enterSubmissionId',
  'Enter a valid email': 'validation.validEmail',
  'Enter a whole amount': 'validation.wholeAmount',
  'Explain why QA should review this submission': 'validation.explainAppeal',
  'Keep context short': 'validation.contextShort',
  'Keep notes under 280 characters': 'validation.notesUnderLimit',
  'Minimum withdrawal is 100': 'validation.minWithdrawal',
  'Password must be at least 4 characters': 'validation.passwordMin',
  'Transcript is too short': 'validation.transcriptShort',
} satisfies Record<string, StringKey>;

export function localizeFormError(message: string | undefined, t: (key: StringKey) => string) {
  if (!message) {
    return undefined;
  }
  const key = errorMessageKeys[message as keyof typeof errorMessageKeys];
  return key ? t(key) : message;
}
